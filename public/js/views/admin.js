'use strict';
import { api } from '../api.js';
import { h, toast, sourceBadge, timeAgo, emptyState, skeletonList, sheet } from '../ui.js';

const TABS = [
  { id: 'overview', label: 'Overview' }, { id: 'reports', label: 'Reports' },
  { id: 'events', label: 'Events' }, { id: 'sources', label: 'Sources' },
  { id: 'analytics', label: 'Analytics' }, { id: 'updates', label: 'Updates' },
  { id: 'users', label: 'Users' },
];

export async function render(container, ctx) {
  container.innerHTML = '';
  let active = 'overview';
  const tabBar = h('div', { class: 'tabs' }, TABS.map((t) => h('button', { class: 'tab', text: t.label, onClick: () => { active = t.id; refresh(); } })));
  const body = h('div', { style: { marginTop: '6px' } });
  container.append(tabBar, body);
  function refresh() { [...tabBar.children].forEach((c, i) => c.classList.toggle('active', TABS[i].id === active)); body.innerHTML = ''; body.append(skeletonList(3)); load(active).then((nodes) => { body.innerHTML = ''; (Array.isArray(nodes) ? nodes : [nodes]).forEach((n) => body.append(n)); }); }
  refresh();

  async function load(tab) {
    switch (tab) {
      case 'overview': return overview();
      case 'reports': return reports();
      case 'events': return eventsTab();
      case 'sources': return sourcesTab();
      case 'analytics': return analyticsTab();
      case 'updates': return updatesTab();
      case 'users': return usersTab();
    }
  }

  /* ------------------------------ overview ------------------------------ */
  async function overview() {
    let d; try { d = await api.get('/api/admin/dashboard'); } catch (e) { return emptyState('⚠️', 'Load failed', e.message); }
    const stat = (n, l, ico) => h('div', { class: 'stat' }, h('div', { class: 'flex aic jcb' }, h('div', { style: {} }, h('div', { class: 'n', text: String(n) }), h('div', { class: 'l', text: l })), h('span', { class: 'ic', text: ico })));
    const nodes = [
      h('div', { class: 'stat-grid' },
        stat(d.users, 'Students', '👥'), stat(d.verified, 'Verified', '✓'),
        stat(d.events, 'Events', '📅'), stat(d.posts, 'Forum posts', '💬'),
        stat(d.pendingEvents, 'Pending events', '⏳'), stat(d.pendingReports, 'Open reports', '🚩'),
      ),
      d.lastIngest ? h('div', { class: 'tag-soft mt', text: '🔄 Last ingestion ' + timeAgo(d.lastIngest.at) }) : null,
    ];
    // pending events
    if (d.pending && d.pending.length) {
      const pe = h('div', { class: 'card mt', style: { padding: '14px' } },
        h('div', { class: 'section-title mb-sm', style: { fontSize: '15px' } }, h('span', { text: '⏳ Pending community events' })));
      d.pending.forEach((e) => pe.append(h('div', { class: 'row-item' },
        h('div', { class: 'ri-body' }, h('div', { class: 'ri-title', text: e.title }), h('div', { class: 'ri-sub', text: `${e.creator || ''} · ${e.date} ${e.start_time || ''}` })),
        h('button', { class: 'btn btn-success btn-sm', text: 'Approve', onClick: async () => { await api.post(`/api/admin/events/${e.id}/approve`); toast('Approved', 'success'); refresh(); } }),
        h('button', { class: 'btn btn-danger btn-sm', text: 'Reject', onClick: async () => { await api.post(`/api/admin/events/${e.id}/reject`); toast('Rejected', 'success'); refresh(); } }),
      )));
      nodes.push(pe);
    }
    // recent reports
    if (d.recentReports && d.recentReports.length) {
      const rr = h('div', { class: 'card mt', style: { padding: '14px' } },
        h('div', { class: 'section-title mb-sm', style: { fontSize: '15px' } }, h('span', { text: '🚩 Recent reports' })),
        h('a', { class: 'btn btn-outline btn-sm', style: { width: 'auto' }, text: 'Open report queue →', onClick: () => { active = 'reports'; refresh(); } }));
      d.recentReports.slice(0, 4).forEach((r) => {
        rr.append(h('div', { class: 'row-item' },
          h('div', { class: 'ri-body' },
            h('div', { class: 'ri-title', text: targetLabel(r) }),
            h('div', { class: 'ri-sub', text: (r.reason || '') + (r.details ? ' · ' + r.details : '') }),
          ),
          r.reporter ? h('span', { class: 'faint small', text: 'by ' + r.reporter }) : null,
        ));
      });
      nodes.push(rr);
    }
    return nodes;
  }

  /* ------------------------------- reports ------------------------------ */
  async function reports() {
    let d; try { d = await api.get('/api/admin/reports?status=pending'); } catch (e) { return emptyState('⚠️', 'Load failed', e.message); }
    if (!d.reports.length) return emptyState('🎉', 'No open reports', 'The moderation queue is clear.');
    return h('div', { class: 'stack-sm' }, d.reports.map((r) => h('div', { class: 'card', style: { padding: '14px' } },
      h('div', { class: 'flex aic jcb' },
        h('div', { class: 'ri-title' }, h('span', { class: 'tag-soft', text: r.target_type }), ' ', h('span', { text: targetLabel(r) })),
        h('span', { class: 'faint small', text: timeAgo(r.created_at) })),
      h('div', { class: 'muted small mt-sm', text: (r.reason ? 'Reason: ' + r.reason + ' · ' : '') + (r.details || 'No details') + (r.reporter ? ' · reported by ' + r.reporter : '') }),
      h('div', { class: 'btn-row mt-sm' },
        h('button', { class: 'btn btn-success btn-sm', text: 'Resolve', onClick: async () => { await api.post(`/api/admin/reports/${r.id}/resolve`, { action: 'resolved' }); toast('Resolved', 'success'); refresh(); } }),
        h('button', { class: 'btn btn-ghost btn-sm', text: 'Dismiss', onClick: async () => { await api.post(`/api/admin/reports/${r.id}/resolve`, { action: 'dismissed' }); toast('Dismissed', 'success'); refresh(); } }),
        h('button', { class: 'btn btn-danger btn-sm', text: 'Remove content', onClick: async () => { await api.post(`/api/admin/reports/${r.id}/resolve`, { action: 'resolved', remove: true }); toast('Content removed', 'success'); refresh(); } }),
      ),
    )));
  }
  function targetLabel(r) {
    if (r.target_type === 'event') return '“' + (r.event_title || ('Event #' + r.target_id)) + '”';
    if (r.target_type === 'post') return '“' + (r.post_title || ('Post #' + r.target_id)) + '”';
    if (r.target_type === 'user') return '@' + (r.target_user_name || ('User #' + r.target_id));
    return r.target_type + ' #' + r.target_id;
  }

  /* ------------------------------- events ------------------------------- */
  async function eventsTab() {
    let d; try { d = await api.get('/api/admin/events?status=all'); } catch (e) { return emptyState('⚠️', 'Load failed', e.message); }
    const nodes = [
      h('div', { class: 'flex aic jcb mb-sm' }, h('span', { class: 'small muted', text: d.events.length + ' events' }),
        h('button', { class: 'btn btn-ghost btn-sm', text: '＋ Add event', onClick: () => addEventSheet(refresh) })),
    ];
    const list = h('div', { class: 'stack-sm' });
    d.events.forEach((e) => list.append(h('div', { class: 'card', style: { padding: '12px 14px' } },
      h('div', { class: 'flex aic gap' },
        h('span', { style: { fontSize: '22px' }, text: e.emoji || '📅' }),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { class: 'ri-title', text: e.title }),
          h('div', { class: 'ri-sub', text: `${e.category.label} · ${e.date} ${e.start_time || ''}` }),
          h('div', { class: 'flex aic gap mt-sm', style: { gap: '6px' } }, sourceBadge(e), e.featured ? h('span', { class: 'badge demo', text: '★ Featured' }) : null, e.is_demo ? h('span', { class: 'badge community', text: 'DEMO' }) : null, h('span', { class: 'faint small', text: e.source.imported ? 'auto' : (e.source.community ? 'community' : 'manual') })),
        )),
      h('div', { class: 'flex wrap', style: { gap: '6px', marginTop: '10px' } },
        e.status === 'pending' ? h('button', { class: 'btn btn-success btn-sm', text: 'Approve', onClick: async () => { await api.post(`/api/admin/events/${e.id}/approve`); toast('Approved', 'success'); refresh(); } }) : null,
        e.status !== 'removed' ? h('button', { class: 'btn btn-ghost btn-sm', text: e.featured ? 'Unfeature' : 'Feature', onClick: async () => { await api.post(`/api/admin/events/${e.id}/feature`); refresh(); } }) : null,
        h('button', { class: 'btn btn-danger btn-sm', text: e.status === 'removed' ? 'Deleted' : 'Delete', disabled: e.status === 'removed', onClick: async () => { await api.post(`/api/admin/events/${e.id}/delete`); toast('Deleted', 'success'); refresh(); } }),
      ),
    )));
    nodes.push(list);
    return nodes;
  }
  function addEventSheet(refresh) {
    const title = h('input', { class: 'input', placeholder: 'Event name' });
    const date = h('input', { class: 'input', type: 'date', value: new Date().toISOString().slice(0, 10) });
    const time = h('input', { class: 'input', type: 'time', value: '18:00' });
    const loc = h('input', { class: 'input', placeholder: 'Location' });
    const cat = h('select', { class: 'select' }, ['other', 'nightlife', 'music', 'sport', 'food', 'university', 'societies', 'arts'].map((c) => h('option', { value: c, text: c })));
    const close = sheet({
      title: 'Add event',
      body: h('div', {},
        h('div', { class: 'field' }, h('label', { text: 'Name' }), title),
        h('div', { class: 'grid-2', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' } },
          h('div', { class: 'field' }, h('label', { text: 'Date' }), date),
          h('div', { class: 'field' }, h('label', { text: 'Time' }), time)),
        h('div', { class: 'field' }, h('label', { text: 'Location' }), loc),
        h('div', { class: 'field' }, h('label', { text: 'Category' }), cat)),
      actions: [
        h('button', { class: 'btn btn-ghost', text: 'Cancel', onClick: close }),
        h('button', { class: 'btn btn-primary', text: 'Add', onClick: async () => {
          if (!title.value) return toast('Name required', 'warn');
          await api.post('/api/admin/events', { title: title.value, date: date.value, start_time: time.value, location: loc.value, category: cat.value });
          toast('Event added', 'success'); close(); refresh();
        } }),
      ],
    });
  }

  /* ------------------------------- sources ------------------------------ */
  async function sourcesTab() {
    let d; try { d = await api.get('/api/admin/sources'); } catch (e) { return emptyState('⚠️', 'Load failed', e.message); }
    const nodes = [
      h('div', { class: 'card mb', style: { padding: '14px' } },
        h('div', { class: 'section-title mb-sm', style: { fontSize: '15px' } }, h('span', { text: '⚙️ Ingestion pipeline' })),
        h('p', { class: 'muted small', text: 'Add or remove approved public sources. New sources are fetched, categorised, de-duplicated and published automatically on a schedule.' }),
        h('div', { class: 'btn-row mt-sm' },
          h('button', { class: 'btn btn-primary btn-sm', text: '▶ Run ingestion now', onClick: async () => { toast('Running…', 'info', 1500); const s = await api.post('/api/admin/ingest/run'); toast(`Done: +${s.summary.eventsAdded} new, ${s.summary.eventsMerged} merged`, 'success'); refresh(); } }),
          h('button', { class: 'btn btn-ghost btn-sm', text: '＋ Add source', onClick: () => addSourceSheet(d, refresh) })),
      ),
    ];
    const list = h('div', { class: 'stack-sm' });
    d.sources.forEach((s) => list.append(h('div', { class: 'card', style: { padding: '12px 14px' } },
      h('div', { class: 'flex aic gap' },
        h('div', { style: { flex: 1 } },
          h('div', { class: 'ri-title' }, h('span', { text: s.name })),
          h('div', { class: 'ri-sub', text: `${s.type} · reliability ${s.reliability}/10 · ${s.last_run ? 'ran ' + timeAgo(s.last_run) + ' (' + s.last_count + ')' : 'never run'}` })),
        h('button', { class: 'pill-btn' + (s.enabled ? ' active' : ''), text: s.enabled ? '✓ On' : 'Off', onClick: async () => { await api.post(`/api/admin/sources/${s.id}/toggle`); refresh(); } }),
        h('button', { class: 'icon-btn', text: '🗑', onClick: async () => { await api.del('/api/admin/sources/' + s.id); toast('Source removed', 'success'); refresh(); } }),
      ))));
    nodes.push(list);
    return nodes;
  }
  function addSourceSheet(d, refresh) {
    const name = h('input', { class: 'input', placeholder: 'Source name' });
    const type = h('select', { class: 'select' }, d.available.map((a) => h('option', { value: a.id, text: a.label })));
    const url = h('input', { class: 'input', type: 'url', placeholder: 'Feed / API URL (optional)' });
    const rel = h('input', { class: 'input', type: 'number', min: '1', max: '10', value: '5' });
    const close = sheet({
      title: 'Add source',
      body: h('div', {},
        h('div', { class: 'field' }, h('label', { text: 'Name' }), name),
        h('div', { class: 'field' }, h('label', { text: 'Type' }), type),
        h('div', { class: 'field' }, h('label', { text: 'URL (optional)' }), url),
        h('div', { class: 'field' }, h('label', { text: 'Reliability (1–10)' }), rel)),
      actions: [
        h('button', { class: 'btn btn-ghost', text: 'Cancel', onClick: close }),
        h('button', { class: 'btn btn-primary', text: 'Add & run', onClick: async () => {
          if (!name.value) return toast('Name required', 'warn');
          await api.post('/api/admin/sources', { name: name.value, type: type.value, url: url.value, reliability: Number(rel.value) });
          toast('Source added', 'success'); close(); refresh();
        } }),
      ],
    });
  }

  /* ------------------------------ analytics ----------------------------- */
  async function analyticsTab() {
    let d; try { d = await api.get('/api/admin/analytics'); } catch (e) { return emptyState('⚠️', 'Load failed', e.message); }
    const max = Math.max(1, ...d.dau.map((x) => x.count));
    const chart = h('div', { class: 'card', style: { padding: '16px' } },
      h('div', { class: 'section-title mb-sm', style: { fontSize: '15px' } }, h('span', { text: '📊 Daily active users (7 days)' })),
      h('div', { class: 'flex aic', style: { gap: '8px', height: '120px', alignItems: 'flex-end' } },
        d.dau.map((x) => h('div', { style: { flex: '1', textAlign: 'center' } },
          h('div', { style: { height: Math.max(6, (x.count / max) * 100) + 'px', background: 'linear-gradient(180deg,var(--brand),var(--brand-2))', borderRadius: '6px 6px 0 0', margin: '0 auto', maxWidth: '34px', transition: 'height .4s' } }),
          h('div', { class: 'faint small', style: { marginTop: '4px' }, text: x.day }),
          h('div', { class: 'small', style: { fontWeight: 800 }, text: String(x.count) }),
        )),
      ),
    );
    const top = (title, emoji, items) => h('div', { class: 'card mt', style: { padding: '14px' } },
      h('div', { class: 'section-title mb-sm', style: { fontSize: '15px' } }, h('span', { text: emoji + ' ' + title })),
      items.length ? h('div', { class: 'stack-sm' }, items.map((it) => {
        return h('div', { class: 'row-item' },
          h('div', { class: 'ri-body' },
            h('div', { class: 'ri-title', text: it.label }),
            h('div', { class: 'ri-sub', text: it.sub }),
          ),
        );
      })) : h('p', { class: 'muted small', text: 'No data yet.' }),
    );
    return [
      h('div', { class: 'stat-grid' },
        h('div', { class: 'stat' }, h('div', { class: 'n', text: String(d.activeUsers) }), h('div', { class: 'l', text: 'Active users' })),
        h('div', { class: 'stat' }, h('div', { class: 'n', text: String(d.communityPosts) }), h('div', { class: 'l', text: 'Community posts' })),
      ),
      h('div', { class: 'mt-sm' }, chart),
      top('Most viewed events', '🔥', d.topEvents.map((e) => ({ label: e.title, sub: e.views + ' views · ' + (e.interested_count + e.going_count) + ' interested' }))),
      top('Popular categories', '🏷️', d.topCategories.map((c) => ({ label: c.category, sub: c.c + ' events · ' + c.engagement + ' engagement' }))),
      top('Most active discussions', '💬', d.topDiscussions.map((x) => ({ label: x.title, sub: x.comments + ' comments · score ' + x.score }))),
    ];
  }

  /* ------------------------------- updates ------------------------------ */
  async function updatesTab() {
    let d; try { d = await api.get('/api/admin/updates'); } catch (e) { return emptyState('⚠️', 'Load failed', e.message); }
    const node = (list, kind, addSheetFn) => {
      const card = h('div', { class: 'card mt', style: { padding: '14px' } },
        h('div', { class: 'flex aic jcb mb-sm' }, h('div', { class: 'section-title', style: { fontSize: '15px' }, text: kind === 'town' ? '🏘️ Town updates' : '🎓 University updates' }),
          h('button', { class: 'btn btn-ghost btn-sm', text: '＋ Add', onClick: () => addSheetFn() })));
      list.forEach((u) => card.append(h('div', { class: 'row-item' },
        h('div', { class: 'ri-body' }, h('div', { class: 'ri-title', text: u.title }), h('div', { class: 'ri-sub', text: u.category + ' · ' + timeAgo(u.created_at) })),
        h('button', { class: 'icon-btn', text: '🗑', onClick: async () => { await api.del(`/api/admin/${kind}/${u.id}`); toast('Deleted', 'success'); refresh(); } }))));
      return card;
    };
    return [
      h('p', { class: 'muted small mb-sm', text: 'Manage town and university updates. In demo mode these are sample data.' }),
      node(d.town, 'town', () => updateSheet('town')),
      node(d.university, 'university', () => updateSheet('university')),
    ];
  }
  function updateSheet(kind) {
    const title = h('input', { class: 'input', placeholder: 'Title' });
    const body = h('textarea', { class: 'textarea', placeholder: 'Details' });
    const cat = h('select', { class: 'select' }, (kind === 'town' ? ['road', 'transport', 'weather', 'business', 'council', 'community', 'news'] : ['news', 'academic', 'exams', 'accommodation', 'student_services', 'careers', 'notices']).map((c) => h('option', { value: c, text: c })));
    const close = sheet({
      title: 'Add ' + kind + ' update',
      body: h('div', {}, h('div', { class: 'field' }, h('label', { text: 'Category' }), cat), h('div', { class: 'field' }, h('label', { text: 'Title' }), title), h('div', { class: 'field' }, h('label', { text: 'Details' }), body)),
      actions: [
        h('button', { class: 'btn btn-ghost', text: 'Cancel', onClick: close }),
        h('button', { class: 'btn btn-primary', text: 'Add', onClick: async () => {
          if (!title.value) return toast('Title required', 'warn');
          await api.post('/api/admin/' + kind, { title: title.value, body: body.value, category: cat.value });
          toast('Added', 'success'); close(); refresh();
        } }),
      ],
    });
  }

  /* -------------------------------- users ------------------------------- */
  async function usersTab() {
    let d; try { d = await api.get('/api/admin/users'); } catch (e) { return emptyState('⚠️', 'Load failed', e.message); }
    const list = h('div', { class: 'stack-sm' });
    d.users.forEach((u) => list.append(h('div', { class: 'card', style: { padding: '12px 14px' } },
      h('div', { class: 'flex aic gap' },
        h('div', { class: 'avatar', text: u.avatar || '👤' }),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { class: 'ri-title' }, h('span', { text: u.name }), u.verified ? h('span', { class: 'verified-tick', style: { position: 'static', width: '14px', height: '14px', display: 'inline-grid', marginLeft: '6px' }, text: '✓' }) : null, u.role === 'admin' ? h('span', { class: 'badge university', style: { marginLeft: '6px' }, text: 'admin' }) : null),
          h('div', { class: 'ri-sub', text: '@' + u.username + ' · ' + (u.status || 'active') })),
      ),
      h('div', { class: 'flex wrap', style: { gap: '6px', marginTop: '10px' } },
        h('button', { class: 'btn btn-ghost btn-sm', text: u.status === 'active' ? 'Suspend' : 'Activate', onClick: async () => { await api.post(`/api/admin/users/${u.id}/action`, { action: u.status === 'active' ? 'suspend' : 'active' }); toast('Updated', 'success'); refresh(); } }),
        h('button', { class: 'btn btn-ghost btn-sm', text: u.verified ? 'Unverify' : 'Verify', onClick: async () => { await api.post(`/api/admin/users/${u.id}/action`, { action: u.verified ? 'unverify' : 'verify' }); toast('Updated', 'success'); refresh(); } }),
        u.role !== 'admin' ? h('button', { class: 'btn btn-ghost btn-sm', text: 'Make admin', onClick: async () => { await api.post(`/api/admin/users/${u.id}/action`, { action: 'admin' }); toast('Promoted', 'success'); refresh(); } }) : null,
      ))));
    return list;
  }
}

