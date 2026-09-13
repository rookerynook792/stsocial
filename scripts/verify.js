const B = 'http://localhost:3000';
const j = (r) => r.json();
(async () => {
  const stu = await fetch(B + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'rileyf@st-andrews.ac.uk', password: 'stsocial123' }) }).then(j);
  const adm = await fetch(B + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@stsocial.app', password: 'stsocial-admin' }) }).then(j);
  const ce = await fetch(B + '/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + stu.token }, body: JSON.stringify({ title: 'Verify Create Event', description: 'test', date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), start_time: '18:00', location: 'Test Hall', category: 'other' }) }).then(async (r) => ({ s: r.status, d: await j(r) }));
  console.log(ce.s === 201 ? 'PASS create community event -> #' + ce.d.event.id + ' (pending)' : 'FAIL create event ' + ce.s + ' ' + JSON.stringify(ce.d));
  const aev = await fetch(B + '/api/admin/events', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adm.token }, body: JSON.stringify({ title: 'Verify Admin Add', date: new Date().toISOString().slice(0, 10), start_time: '20:00', location: 'Tay Park', category: 'outdoor' }) }).then(async (r) => ({ s: r.status, d: await j(r) }));
  console.log(aev.s === 201 ? 'PASS admin add-event -> #' + aev.d.id : 'FAIL admin add-event ' + aev.s + ' ' + JSON.stringify(aev.d));
  const home = await fetch(B + '/api/home').then(j);
  console.log('PASS home API: today=' + home.happeningToday.length + ' upcoming=' + home.comingUp.length + ' forum=' + home.forumActivity.length + ' town=' + home.townUpdates.length);
  const index = await fetch(B + '/').then((r) => r.text());
  console.log(index.includes('ST SOCIAL') ? 'PASS index.html served' : 'FAIL index.html');
  const evs = await fetch(B + '/api/events?filter=week').then(j);
  console.log('PASS events week=' + evs.events.length + ' categories=' + evs.categories.length);
  console.log('roles: student.verified=' + stu.user.verified + ' admin.role=' + adm.user.role);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
