/* Deploy ST SOCIAL to Render — used once the user pastes a GitHub token + Render API key.
 * Usage: GITHUB_TOKEN=ghp_... RENDER_API_KEY=rnd_... node scripts/deploy-render.js
 * Steps: 1) find/create GitHub repo  2) push code  3) create Render web service (free, london)
 *        4) poll until ready, print service URL
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const GH = "https://api.github.com";
const RENDER = "https://api.render.com/v1";
const REPO_NAME = "stsocial";
const SERVICE_NAME = "stsocial";

const log = (...a) => console.log("[deploy]", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gh(pathname, opts = {}) {
  const res = await fetch(GH + pathname, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "User-Agent": "stsocial-deploy",
      Accept: "application/vnd.github+json",
      ...(opts.headers || {}),
    },
  });
  const body = await res.text();
  let json = null;
  try { json = body ? JSON.parse(body) : null; } catch { /* not json */ }
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${body.slice(0, 300)}`);
  return json;
}

async function render(pathname, opts = {}) {
  const res = await fetch(RENDER + pathname, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const body = await res.text();
  let json = null;
  try { json = body ? JSON.parse(body) : null; } catch { /* not json */ }
  if (!res.ok) throw new Error(`Render ${res.status}: ${body.slice(0, 300)}`);
  return json;
}

function git(cmd) {
  return execSync(cmd, { cwd: path.join(__dirname, ".."), stdio: "pipe" }).toString().trim();
}

(async () => {
  if (!process.env.GITHUB_TOKEN || !process.env.RENDER_API_KEY) {
    throw new Error("Set GITHUB_TOKEN and RENDER_API_KEY");
  }

  // ---- 1. GitHub repo ----
  const me = await gh("/user");
  log("github user:", me.login);

  let repoExists = false;
  try {
    await gh(`/repos/${me.login}/${REPO_NAME}`);
    repoExists = true;
  } catch { /* 404 → create */ }

  if (repoExists) {
    log(`repo ${me.login}/${REPO_NAME} already exists — reusing`);
  } else {
    const created = await gh("/user/repos", {
      method: "POST",
      body: JSON.stringify({ name: REPO_NAME, private: false, auto_init: false }),
    });
    log("created repo:", created.full_name);
  }

  // ---- 2. push code ----
  const branch = git("git rev-parse --abbrev-ref HEAD");
  try {
    git('git add -A && git commit -m "pre-deploy snapshot" --allow-empty || true');
  } catch { /* ignore */ }
  const url = `https://x-access-token:${process.env.GITHUB_TOKEN}@github.com/${me.login}/${REPO_NAME}.git`;
  execSync(`git push "${url}" ${branch}:main --force`, {
    cwd: path.join(__dirname, ".."),
    stdio: "pipe",
  });
  log(`pushed branch "${branch}" → main`);

  // ---- 3. Render service ----
  // Resolve owner (team/workspace) id from the API key.
  const owners = await render("/owners");
  const ownerId = owners[0] && owners[0].owner && owners[0].owner.id;
  if (!ownerId) throw new Error("Could not resolve Render ownerId");
  log("render owner:", owners[0].owner.name, ownerId);

  let svc;
  try {
    svc = await render("/services", {
      method: "POST",
      body: JSON.stringify({
        name: SERVICE_NAME,
        type: "web_service",
        ownerId,
        repo: `https://github.com/${me.login}/${REPO_NAME}`,
        serviceDetails: {
          runtime: "node",
          plan: "free",
          region: "frankfurt",
          healthCheckPath: "/",
          envSpecificDetails: {
            buildCommand: "npm install",
            startCommand: "node server/index.js",
          },
        },
      }),
    });
    // Create response may be {service:{...}} or the service object itself.
    if (svc && svc.service) svc = svc.service;
    log("created service:", svc.id, svc.serviceDetails && svc.serviceDetails.url);
  } catch (e) {
    const msg = String(e.message || e);
    if (/already/i.test(msg)) {
      const list = await render("/services");
      svc = list.find((s) => s.name === SERVICE_NAME);
      if (!svc) throw new Error("Service name taken but not found in your account: " + msg);
      log("service already exists:", svc.id, "— triggering manual deploy");
      try { await render(`/services/${svc.id}/deploys`, { method: "POST", body: JSON.stringify({ repo: { branch: "main" } }) }); } catch (e2) { log("manual deploy trigger failed (may already be deploying):", String(e2.message || e2).slice(0, 200)); }
    } else {
      throw new Error("Could not create Render service: " + msg);
    }
  }

  // ---- 4. poll ----
  log("waiting for deploy… (free builds can take 2–5 min)");
  const t0 = Date.now();
  while (Date.now() - t0 < 10 * 60 * 1000) {
    await sleep(15000);
    const s = await render(`/services/${svc.id}`);
    const deploy = s.deploy && s.deploy.status;
    log(`status=${s.status} deploy=${deploy}`);
    if (s.status === "ready" && (deploy === "ready" || !deploy)) {
      console.log("\n✅ LIVE: " + s.serviceUrl);
      return;
    }
    if (deploy === "error" || deploy === "cancelled") {
      throw new Error("Deploy failed: " + (s.deploy && s.deploy.deployUrl ? s.deploy.deployUrl : "see Render dashboard"));
    }
  }
  throw new Error("Timed out after 10 min waiting for Render — check the dashboard");
})().catch((e) => {
  console.error("\n❌", e.message || e);
  process.exit(1);
});
