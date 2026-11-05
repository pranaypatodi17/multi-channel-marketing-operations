/* CallLens — Agents, Alerts, Ingest, Rubric editor, Settings */
(function () {
  'use strict';
  const CL = window.CL, I = CL.icon, E = CL.esc, DAY = CL.util.DAY, S = () => CL.state;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const U = CL.ui;
  U.agents = { view: 'cards' }; U.alerts = { status: 'All' }; U.set = 'alerts';

  /* ================= AGENTS ================= */
  CL.views.agents = function () {
    const st = CL.agentStats(30), v = U.agents.view;
    const spark = s => CL.spark(s.calls.slice().sort((a, b) => a.startedAt - b.startedAt).slice(-8).map(c => CL.analyze(c).overall), 84, 28, CL.bandColor(s.stats.avg));
    return '<div class="page"><div class="page-h"><div><h1>Agents</h1><p>Score trends, strengths and coaching priorities for every agent, based on the last 30 days of calls.</p></div>' +
      '<div class="seg"><button class="' + (v === 'cards' ? 'on' : '') + '" data-act="agView" data-v="cards">Cards</button><button class="' + (v === 'board' ? 'on' : '') + '" data-act="agView" data-v="board">Leaderboard</button></div></div>' +
      (v === 'cards' ? '<div class="grid g-3" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">' + st.map(s => {
        const cats = Object.entries(s.cats).sort((a, b) => a[1] - b[1]);
        return '<div class="card ag-card" data-act="open" data-href="#/agents/' + s.agent.id + '"><div class="ag-top">' + CL.avatar(s.agent, 46) + '<div style="flex:1"><b>' + E(s.agent.name) + '</b><small>' + s.agent.team + ' · ' + s.agent.tenure + '</small></div>' + CL.scorePill(s.stats.avg) + '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center"><div class="muted" style="font-size:12.5px">Last 8 calls</div>' + spark(s) + '</div>' +
          (cats.length ? '<div class="muted" style="font-size:12.5px;margin-top:10px">Strongest: <b style="color:var(--ink)">' + cats[cats.length - 1][0] + '</b> · Weakest: <b style="color:var(--ink)">' + cats[0][0] + '</b></div>' : '') +
          '<div class="ag-meta"><div><b>' + s.stats.n + '</b><small>Calls</small></div><div><b style="color:' + (s.stats.high ? 'var(--bad)' : 'inherit') + '">' + s.stats.high + '</b><small>High-risk</small></div><div><b>' + s.stats.compliance + '</b><small>Compliance</small></div></div></div>';
      }).join('') + '</div>' :
        '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Agent</th><th>Team</th><th>Calls</th><th>Avg score</th><th>Compliance</th><th>High-risk</th><th>Trend</th></tr></thead><tbody>' +
        st.map((s, i) => '<tr data-act="open" data-href="#/agents/' + s.agent.id + '"><td><b>' + (i + 1) + '</b></td><td><div class="cell-a">' + CL.avatar(s.agent, 30) + '<b>' + E(s.agent.name) + '</b></div></td><td>' + s.agent.team + '</td><td>' + s.stats.n + '</td><td>' + CL.scorePill(s.stats.avg) + '</td><td>' + s.stats.compliance + '</td><td>' + (s.stats.high ? CL.sevChip('High').replace('High', s.stats.high) : '0') + '</td><td>' + spark(s) + '</td></tr>').join('') + '</tbody></table></div></div>') + '</div>';
  };
  CL.acts.agView = el => { U.agents.view = el.dataset.v; CL.render(); };

  CL.views.agentProfile = function (id) {
    const ag = CL.agent(id); if (!ag) return '<div class="page"><div class="empty card"><b>Agent not found</b></div></div>';
    const all = CL.agentStats(0), mine = all.find(s => s.agent.id === id), rank = all.findIndex(s => s.agent.id === id) + 1;
    const calls = mine.calls.slice().sort((a, b) => a.startedAt - b.startedAt), recent = calls.slice(-12);
    const teamAvg = CL.stats(CL.calls()).avg, cats = CL.CATEGORIES.filter(c => mine.cats[c] != null), teamCats = {};
    CL.calls().forEach(c => Object.entries(CL.analyze(c).cats).forEach(([k, v]) => (teamCats[k] = teamCats[k] || []).push(v)));
    Object.keys(teamCats).forEach(k => { teamCats[k] = CL.avg(teamCats[k]); });
    const ranked = cats.slice().sort((a, b) => mine.cats[b] - mine.cats[a]), best = ranked.slice(0, 2), worst = ranked.slice(-2).reverse();
    const crit = {}; mine.stats.an.forEach(a => a.results.forEach(r => { (crit[r.id] = crit[r.id] || { n: 0, s: 0, name: r.name }); crit[r.id].n++; crit[r.id].s += r.pct; }));
    const weak = Object.entries(crit).map(([k, v]) => [k, v.s / v.n, v.name]).sort((a, b) => a[1] - b[1]).slice(0, 3).filter(x => x[1] < 85);
    const fl = {}; mine.stats.an.forEach(a => a.flags.forEach(f => { fl[f.title] = (fl[f.title] || 0) + 1; }));
    const half = Math.floor(calls.length / 2), early = CL.avg(calls.slice(0, half).map(c => CL.analyze(c).overall)), late = CL.avg(calls.slice(half).map(c => CL.analyze(c).overall)), tr = late - early;
    return '<div class="page"><div class="crumb"><a href="#/agents">Agents</a>' + I('right', 13) + '<span>' + E(ag.name) + '</span></div>' +
      '<div class="card mb"><div class="prof-h">' + CL.avatar(ag, 68) + '<div style="flex:1;min-width:220px"><h1 style="font-size:24px">' + E(ag.name) + '</h1><div class="meta"><span>' + ag.team + '</span><span>Tenure ' + ag.tenure + '</span><span>' + mine.stats.n + ' calls analysed</span><span>Rank <b style="color:var(--ink)">#' + rank + '</b> of ' + all.length + '</span></div>' +
      '<div style="margin-top:10px">' + (tr > 3 ? '<span class="chip sev-clear">' + I('trend', 12) + ' Improving +' + tr + ' pts</span>' : tr < -3 ? '<span class="chip sev-high">Declining ' + tr + ' pts</span>' : '<span class="chip">Steady</span>') + (mine.stats.high ? ' <span class="chip sev-high">' + mine.stats.high + ' high-risk call' + (mine.stats.high > 1 ? 's' : '') + '</span>' : '') + '</div></div>' +
      CL.ring(mine.stats.avg, 92, 9, 'avg score') + '<div class="acts"><button class="btn" data-act="schedule1on1" data-id="' + id + '">' + I('clock', 16) + ' Schedule 1:1</button><button class="btn primary" data-act="sendCoachSummary" data-id="' + id + '">' + I('mail', 16) + ' Send coaching summary</button></div></div></div>' +
      '<div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Score per call</h3><div class="legend"><span><i style="background:var(--brand2)"></i>' + E(ag.name.split(' ')[0]) + '</span><span><i style="background:var(--muted)"></i>Team average (' + teamAvg + ')</span></div></div><div class="card-b">' +
      CL.lineChart([{ name: ag.name, color: 'var(--brand2)', points: recent.map(c => ({ x: new Date(c.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), y: CL.analyze(c).overall })) }, { name: 'Team average', color: 'var(--muted)', dash: true, points: recent.map(c => ({ x: '', y: teamAvg })) }], { min: 0, max: 100, area: true, label: 'Score per call' }) +
      '</div></div><div class="card"><div class="card-h"><h3>Category profile</h3><div class="legend"><span><i style="background:var(--brand2)"></i>Agent</span><span><i style="background:var(--muted)"></i>Team</span></div></div><div class="card-b">' + CL.radar(cats, cats.map(c => mine.cats[c]), cats.map(c => teamCats[c])) + '</div></div></div>' +
      '<div class="grid g-2 mb"><div class="card"><div class="card-h"><h3>Strengths and gaps</h3></div><div class="card-b">' +
      '<div class="sum-sec"><h4>Strongest categories</h4>' + best.map(c => '<div class="row-b"><span>' + c + '</span>' + CL.bar(mine.cats[c]) + '<span class="n">' + mine.cats[c] + '</span></div>').join('') + '</div>' +
      '<div class="sum-sec"><h4>Weakest categories</h4>' + worst.map(c => '<div class="row-b"><span>' + c + '</span>' + CL.bar(mine.cats[c]) + '<span class="n">' + mine.cats[c] + '</span></div>').join('') + '</div>' +
      (Object.keys(fl).length ? '<div class="sum-sec"><h4>Most frequent flags</h4><div class="flags">' + Object.entries(fl).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => '<span class="chip">' + E(k) + ' · ' + n + '</span>').join('') + '</div></div>' : '') + '</div></div>' +
      '<div class="card"><div class="card-h"><h3>' + I('sparkle', 16) + ' Suggested coaching points</h3></div><div class="card-b">' +
      (weak.length ? weak.map(w => '<div class="coach-i"><b>' + E(w[2]) + '</b> <span class="muted">· avg ' + Math.round(w[1]) + '%</span><div style="margin-top:4px">' + E(CL.COACH_TIPS[w[0]] || 'Review this criterion in the next 1:1 using flagged calls as examples.') + '</div></div>').join('') : '<div class="coach-i pos">No weak spots. Recognise this agent’s consistency in the next team meeting.</div>') +
      '</div></div></div>' +
      '<div class="card"><div class="card-h"><h3>Recent calls</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Call</th><th>Customer</th><th>Score</th><th>Flags</th><th>Outcome</th></tr></thead><tbody>' +
      calls.slice().reverse().slice(0, 8).map(c => { const a = CL.analyze(c); return '<tr data-act="open" data-href="#/calls/' + c.id + '"><td><span class="mono">' + c.id + '</span><div class="muted" style="font-size:12.5px">' + CL.date(c.startedAt, true) + '</div></td><td>' + E(c.cust) + '</td><td>' + CL.scorePill(a.overall) + '</td><td>' + CL.flagChips(a, 2) + '</td><td>' + E(c.outcome) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
  };
  CL.acts.schedule1on1 = el => {
    const ag = CL.agent(el.dataset.id), d = new Date(Date.now() + 2 * DAY).toISOString().slice(0, 10);
    CL.modal({ title: 'Schedule 1:1 with ' + ag.name, body: '<div class="field"><label class="f">Date</label><input type="text" id="s1d" value="' + d + '"></div><div class="field"><label class="f">Agenda (pre-filled from flagged calls)</label><textarea id="s1a">Review flagged calls from the last 30 days and agree one focus area for next week.</textarea></div>', foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="confirm1on1" data-id="' + ag.id + '">Send invite</button>' });
  };
  CL.acts.confirm1on1 = el => { const ag = CL.agent(el.dataset.id); CL.log('Scheduled 1:1 with ' + ag.name); CL.save(); CL.closeModal(); CL.toast('1:1 invite sent to ' + E(ag.name) + '.'); };
  CL.acts.sendCoachSummary = el => { const ag = CL.agent(el.dataset.id); CL.log('Sent coaching summary to ' + ag.name); CL.save(); CL.toast('Coaching summary emailed to ' + E(ag.name) + '.'); };

  /* ================= ALERTS ================= */
  CL.views.alerts = function () {
    const all = CL.alerts(), f = U.alerts.status, list = all.filter(a => f === 'All' || a.status === f);
    const cnt = s => all.filter(a => a.status === s).length, set = S().settings;
    return '<div class="page"><div class="page-h"><div><h1>Alerts <span class="chip" style="vertical-align:middle;font-size:12px"><span class="dot live"></span>&nbsp;Live</span></h1><p>Serious violations are pushed to ' + (set.slack ? '<b>' + E(set.slackChannel) + '</b> on Slack' : '') + (set.slack && set.email ? ' and ' : '') + (set.email ? 'email' : '') + ' within a minute of the call ending. Threshold: <b>' + set.alertMin + (set.alertMin === 'High' ? ' only' : ' and above') + '</b>.</p></div>' +
      '<div class="acts"><button class="btn" data-act="testAlert">' + I('zap', 16) + ' Simulate incoming flagged call</button><a class="btn" href="#/settings">' + I('settings', 16) + ' Routing</a></div></div>' +
      '<div class="seg mb" role="group" aria-label="Status filter" style="margin-bottom:18px">' + ['All', 'Open', 'Acknowledged', 'Escalated', 'Resolved'].map(s => '<button class="' + (f === s ? 'on' : '') + '" data-act="alStatus" data-s="' + s + '">' + s + (s === 'All' ? ' ' + all.length : ' ' + cnt(s)) + '</button>').join('') + '</div>' +
      (list.length ? list.map(alertCard).join('') : '<div class="card empty"><b>No alerts here</b>' + (f === 'All' ? 'Nothing has crossed the alert threshold.' : 'No alerts with status “' + f + '”.') + '</div>') + '</div>';
  };
  function alertCard(a) {
    const c = a.call, p = a.primary, l = p.ev != null ? CL.lines(c)[p.ev] : null, m = a.meta, set = S().settings;
    return '<div class="card alert ' + a.status + ' ' + (a.sev === 'Medium' ? 'sev-med' : '') + '" id="al-' + c.id + '"><div class="alert-h"><div style="display:flex;gap:12px;align-items:center;min-width:0">' + CL.avatar(c.agent, 40) + '<div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:15px">' + E(p.title) + '</b>' + CL.sevChip(a.sev) + '<span class="st-badge st-' + a.status + '">' + a.status + '</span></div>' +
      '<div class="muted" style="font-size:13px"><a href="#/agents/' + c.agent.id + '">' + E(c.agent.name) + '</a> · <a href="#/calls/' + c.id + '" class="mono">' + c.id + '</a> · ' + E(c.product) + ' · score ' + a.analysis.overall + ' · ' + CL.rel(a.at) + '</div></div></div><div class="acts no-print">' +
      (a.status === 'Open' ? '<button class="btn sm" data-act="alAck" data-id="' + c.id + '">Acknowledge</button>' : '') + (a.status !== 'Resolved' && a.status !== 'Escalated' ? '<button class="btn sm" data-act="alEsc" data-id="' + c.id + '">Escalate to compliance</button>' : '') + (a.status !== 'Resolved' ? '<button class="btn sm" data-act="alRes" data-id="' + c.id + '">' + I('check', 13) + ' Resolve</button>' : '') + '</div></div>' +
      '<div class="q">' + (l ? '<b>' + CL.fmt(l.t) + '</b>“' + E(CL.redact(l.text.length > 210 ? l.text.slice(0, 207) + '…' : l.text)) + '”' : E(p.note)) + '</div>' +
      (a.flags.length > 1 ? '<div class="flags" style="margin-bottom:10px">' + a.flags.slice(1, 5).map(f => '<span class="chip sev-' + f.sev.toLowerCase() + '">' + E(f.title) + '</span>').join('') + '</div>' : '') +
      '<div class="route"><span>' + I('hash', 14) + (set.slack ? 'Slack ' + E(set.slackChannel) : 'Slack off') + '</span><span>' + I('mail', 14) + (set.email ? set.emails.length + ' email recipients' : 'Email off') + '</span><span>' + I('clock', 14) + 'Delivered 38 s after call end</span>' +
      (m ? '<span>' + I('check', 14) + a.status + ' by ' + E(m.by) + ' · ' + CL.rel(m.at) + (m.note ? ' · “' + E(m.note) + '”' : '') + '</span>' : '') +
      '<span style="margin-left:auto;display:flex;gap:8px" class="no-print"><button class="btn sm ghost" data-act="alSlack" data-id="' + c.id + '">View Slack message</button><a class="btn sm primary" href="#/calls/' + c.id + (l ? '?line=' + l.i : '') + '">' + I('play', 12) + ' Open call at ' + (l ? CL.fmt(l.t) : '00:00') + '</a></span></div></div>';
  }
  CL.acts.alStatus = el => { U.alerts.status = el.dataset.s; CL.render(); };
  function setAlert(id, status, note) { S().alertStatus[id] = { status, by: CL.USER.name, at: Date.now(), note: note || '' }; CL.log(status + ' alert ' + id + (note ? ': ' + note : '')); CL.save(); CL.updateBell(); CL.render(); }
  CL.acts.alAck = el => { setAlert(el.dataset.id, 'Acknowledged'); CL.toast('Alert acknowledged.'); };
  CL.acts.alEsc = el => { setAlert(el.dataset.id, 'Escalated', 'Sent to Compliance'); CL.toast('Escalated to ' + E(S().settings.slackChannel) + ' and the compliance mailbox.'); };
  CL.acts.alRes = el => CL.modal({ title: 'Resolve alert', body: '<div class="field"><label class="f">Resolution note (required)</label><textarea id="alnote" placeholder="e.g. Agent coached; customer called back and corrected the claim."></textarea></div>', foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="alResOk" data-id="' + el.dataset.id + '">Mark resolved</button>' });
  CL.acts.alResOk = el => { const n = $('#alnote').value.trim(); if (!n) return CL.toast('Add a short resolution note.', 'err'); CL.closeModal(); setAlert(el.dataset.id, 'Resolved', n); CL.toast('Alert resolved.'); };
  CL.acts.alSlack = el => { const a = CL.alerts().find(x => x.id === el.dataset.id), l = a.primary.ev != null ? CL.lines(a.call)[a.primary.ev] : null; CL.modal({ title: 'Slack message sent to ' + S().settings.slackChannel, body: CL.slackCard(a.call, a.analysis, a.primary, l) + '<h4 style="margin:18px 0 8px;font-size:13px">Email copy</h4><div class="emailp"><b>Subject:</b> [CallLens] ' + a.sev + ' severity: ' + E(a.primary.title) + ' — ' + E(a.call.agent.name) + '<br><span class="muted">To: ' + S().settings.emails.map(E).join(', ') + '</span><p style="margin-top:8px">Call ' + a.call.id + ' scored ' + a.analysis.overall + '/100 and has ' + a.flags.length + ' flag' + (a.flags.length > 1 ? 's' : '') + '. Evidence and audio are linked in the app.</p></div>' }); };
  CL.acts.testAlert = function () {
    const id = CL.arrive(true); CL.toast('Flagged call ingested. Alert routed to ' + E(S().settings.slackChannel) + '. <a href="#/calls/' + id + '">Open call</a>', 'alert');
  };

  /* ================= INGEST ================= */
  const SAMPLES = [
    ['T1', 'good', 'Call A · strong term-insurance call', 'Hinglish · 4m 26s · disclosures read, clear next step', 'a1'],
    ['T5', 'bad', 'Call B · non-compliant ULIP pitch', 'Hinglish · 2m 06s · “guaranteed 20%”, no disclosure, interruptions', 'a7'],
    ['T3', 'avg', 'Call C · average ULIP call', 'Hinglish · 2m 23s · weak discovery, evasive on charges', 'a3'],
    ['T2', 'good', 'Call D · SIP consultation in English', 'English · 3m 11s · balanced advice, clear caveats', 'a6']
  ];
  const STEPS = [
    ['Upload and encrypt', 'AES-256 at rest · stored in ap-south-1'],
    ['Speech-to-text', 'Telephony model · Hindi + English code-mixing'],
    ['Speaker separation', 'Agent and customer channels assigned'],
    ['Transcript clean-up', 'Numbers, names and Hinglish spellings normalised'],
    ['AI rubric analysis', 'Every score must quote a transcript line'],
    ['Rules layer', 'Disclosure phrases · prohibited claims · talk ratio · dead air'],
    ['Alerts and routing', 'Slack and email if severity crosses your threshold']
  ];
  let run = null;
  CL.views.ingest = function () {
    const today = CL.calls().filter(c => CL.util.sod(c.startedAt) === CL.util.sod(Date.now())), integ = S().settings.integ = S().settings.integ || { ozonetel: false, twilio: false };
    const cards = [['Exotel', '#0ea5e9', true, 'exotel'], ['Knowlarity', '#8b5cf6', true, 'knowlarity'], ['Ozonetel', '#f59e0b', integ.ozonetel, 'ozonetel'], ['Twilio', '#ef4444', integ.twilio, 'twilio'], ['Folder sync', '#14b8a6', true, 'folder']];
    return '<div class="page"><div class="page-h"><div><h1>Upload and integrations</h1><p>Calls arrive from your dialer automatically. You can also drop a recording here or run one of the sample calls through the full pipeline.</p></div></div>' +
      '<div class="grid g-2 mb" style="align-items:start"><div><div class="drop" id="drop" tabindex="0" data-act="pickFile" role="button" aria-label="Upload a call recording"><div class="ic-big">' + I('upload', 24) + '</div><b style="font-size:16px">Drop a call recording here</b><div class="muted" style="margin:4px 0 14px">MP3, WAV, M4A or OGG · up to 200 MB · stereo recordings give the best speaker separation</div><span class="btn primary">Choose file</span><input type="file" id="file" accept="audio/*" hidden></div>' +
      '<p class="hint" style="margin:8px 4px 0">Demo workspace: audio stays in your browser. Uploaded files are analysed with the bundled sample transcripts, so scores will not reflect the file’s real content.</p>' +
      '<div class="grid" style="gap:10px;margin-top:18px"><div class="field" style="margin:0"><label class="f">Or run a sample call</label></div>' + SAMPLES.map(s => '<button class="sample ' + s[1] + '" data-act="runSample" data-a="' + s[0] + '" data-ag="' + s[4] + '"><span class="ic-w">' + I(s[1] === 'bad' ? 'alert' : s[1] === 'good' ? 'check' : 'flag', 18) + '</span><span style="flex:1"><b style="display:block">' + s[2] + '</b><span class="muted" style="font-size:12.5px">' + s[3] + '</span></span>' + I('right', 16) + '</button>').join('') + '</div></div>' +
      '<div class="card"><div class="card-h"><h3>Processing pipeline</h3><span class="muted" id="pipeStat" style="font-size:12.5px">Waiting for a call</span></div><div class="card-b"><ol class="pipe" id="pipe">' + STEPS.map((s, i) => '<li id="ps' + i + '"><span class="pn"><span>' + (i + 1) + '</span></span><div><b>' + s[0] + '</b><small>' + s[1] + '</small></div></li>').join('') + '</ol><div id="pipeOut"></div></div></div></div>' +
      '<h3 style="margin-bottom:12px">Connected sources</h3><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">' + cards.map(c => {
        const n = today.filter(x => x.source === c[0]).length;
        return '<div class="card integ"><div class="lg" style="background:' + c[1] + '">' + c[0][0] + '</div><div style="flex:1;min-width:0"><b>' + c[0] + '</b><div class="st"><span class="dot' + (c[2] ? ' live' : '') + '" style="' + (c[2] ? '' : 'background:var(--line)') + '"></span>' + (c[2] ? 'Connected · ' + n + ' calls today · synced ' + (2 + c[0].length) + ' min ago' : 'Not connected') + '</div></div><button class="btn sm ' + (c[2] ? '' : 'primary') + '" data-act="integ" data-k="' + c[3] + '" data-n="' + c[0] + '" data-on="' + (c[2] ? 1 : 0) + '">' + (c[2] ? 'Manage' : 'Connect') + '</button></div>';
      }).join('') + '</div></div>';
  };
  CL.mounts.ingest = function () {
    const d = $('#drop'), f = $('#file'); if (!d) return;
    ['dragenter', 'dragover'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove('over'); }));
    d.addEventListener('drop', e => { const fl = e.dataTransfer.files[0]; if (fl) fromFile(fl); });
    d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.click(); } });
    f.addEventListener('change', () => { if (f.files[0]) fromFile(f.files[0]); });
    d.addEventListener('click', e => { if (e.target !== f) f.click(); });
  };
  CL.acts.pickFile = () => { };
  function fromFile(file) {
    if (file.type && !/^audio\//.test(file.type) && !/\.(mp3|wav|m4a|ogg|aac)$/i.test(file.name)) return CL.toast('Please choose an audio file (MP3, WAV, M4A or OGG).', 'err');
    const rnd = Math.random(), arch = rnd < .4 ? 'T1' : rnd < .6 ? 'T3' : rnd < .8 ? 'T2' : 'T5';
    const ags = CL.AGENTS.filter(a => a.w[arch]); const ag = ags[Math.floor(Math.random() * ags.length)] || CL.AGENTS[0];
    runPipeline({ arch, agentId: ag.id, fileName: file.name, source: 'Manual upload' });
  }
  CL.acts.runSample = el => runPipeline({ arch: el.dataset.a, agentId: el.dataset.ag, fileName: el.dataset.a === 'T5' ? 'sample_call_B_ulip_pitch.wav' : 'sample_call_' + el.dataset.a + '.wav', source: 'Manual upload' });
  function runPipeline(o) {
    if (run) return CL.toast('A call is already being processed.', 'err');
    const a = CL.ARCH[o.arch], steps = $$('#pipe li'), stat = $('#pipeStat'); $('#pipeOut').innerHTML = '';
    steps.forEach(s => s.className = '');
    const lines = a.lines.length, info = [
      '“' + o.fileName + '” · encrypted', a.lang + ' detected · ' + Math.round(a.asr * 100) + '% mean confidence', lines + ' turns · 2 speakers', 'Numbers and names normalised', '10 criteria scored with evidence', 'Phrase, talk-ratio and silence checks complete', 'Routing evaluated'];
    let i = 0; run = true; stat.textContent = 'Processing…';
    const next = () => {
      if (i > 0) { steps[i - 1].className = 'done'; steps[i - 1].querySelector('small').textContent = info[i - 1]; }
      if (i >= steps.length) return finish();
      steps[i].className = 'run'; i++; setTimeout(next, 520 + Math.random() * 380);
    };
    const finish = () => {
      const id = CL.ingest(o), call = CL.call(id), an = CL.analyze(call); run = null; CL.updateBell();
      stat.textContent = 'Done in ' + (3.2 + Math.random()).toFixed(1) + ' s';
      $('#pipeOut').innerHTML = '<div class="card" style="margin-top:14px;padding:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;background:var(--soft);box-shadow:none">' + CL.ring(an.overall, 72, 8) + '<div style="flex:1;min-width:180px"><b>' + id + ' · ' + E(call.product) + '</b><div class="muted" style="margin:2px 0 8px">' + E(call.agent.name) + ' · ' + CL.dur(call.duration) + '</div>' + CL.flagChips(an, 3) + '</div><a class="btn primary" href="#/calls/' + id + '">Open call</a></div>';
      if (an.risk === 'High') CL.toast('High-severity call flagged and routed to ' + E(S().settings.slackChannel) + '. <a href="#/calls/' + id + '">Open call</a>', 'alert');
    };
    next();
  }
  CL.acts.integ = function (el) {
    const k = el.dataset.k, n = el.dataset.n, on = el.dataset.on === '1';
    const body = on ? '<div class="field"><label class="f">Webhook endpoint</label><input type="text" readonly value="https://ingest.calllens.example/v1/hooks/' + k + '/anvaya"></div><div class="field"><label class="f">API key</label><input type="text" readonly value="cl_live_••••••••••••••••8f2a"></div><div class="field"><label class="f">Sync</label><select><option>Real time (webhook on call end)</option><option>Every 15 minutes</option><option>Hourly</option></select></div><p class="hint">Only recordings longer than 30 seconds are analysed. Change this under Settings.</p>' : '<div class="field"><label class="f">' + n + ' account ID / SID</label><input type="text" id="ik1" placeholder="Paste your account identifier"></div><div class="field"><label class="f">API key</label><input type="text" id="ik2" placeholder="Paste a read-only recording API key"></div><p class="hint">CallLens only needs read access to call recordings and metadata.</p>';
    CL.modal({ title: on ? n + ' integration' : 'Connect ' + n, body, foot: '<button class="btn" data-act="closeModal">Close</button>' + (on ? '<button class="btn" data-act="testInteg" data-n="' + n + '">Test connection</button>' : '<button class="btn primary" data-act="connectInteg" data-k="' + k + '" data-n="' + n + '">Connect</button>') });
  };
  CL.acts.testInteg = el => CL.toast(el.dataset.n + ' connection healthy. Latest recording received 3 minutes ago.');
  CL.acts.connectInteg = el => { if (!$('#ik1').value.trim() || !$('#ik2').value.trim()) return CL.toast('Enter both fields to connect.', 'err'); S().settings.integ[el.dataset.k] = true; CL.log('Connected ' + el.dataset.n); CL.save(); CL.closeModal(); CL.render(); CL.toast(el.dataset.n + ' connected. New calls will appear automatically.'); };

  /* ================= RUBRIC EDITOR ================= */
  const RB = U.rb = { draft: null, form: null };
  const eq = () => JSON.stringify(RB.draft) === JSON.stringify(S().rubric);
  function ensureDraft() { if (!RB.draft) RB.draft = CL.util.clone(S().rubric); }
  function avg30(r) { return CL.withRubric(r, () => CL.stats(CL.within(CL.calls(), 30)).avg); }
  CL.views.rubric = function () {
    ensureDraft(); const d = RB.draft, tw = d.filter(c => c.enabled).reduce((s, c) => s + c.weight, 0), dirty = !eq();
    const cats = CL.CATEGORIES.filter(c => d.some(x => x.category === c) || true);
    return '<div class="page"><div class="page-h"><div><h1>Rubric editor</h1><p>Define what “a good call” means for ' + CL.ORG.name + '. Add or edit criteria without code. Changes are previewed against the last 30 days before you publish.</p></div>' +
      '<div class="acts"><span class="chip brand">Live: v1.' + S().rubricVer + '</span><button class="btn" data-act="rbHistory">' + I('clock', 16) + ' Version history</button><button class="btn primary" data-act="rbAdd" data-cat="">' + I('plus', 16) + ' Add criterion</button></div></div>' +
      '<div class="grid g-kpi mb" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="card kpi"><div class="l">Active criteria</div><div class="v">' + d.filter(c => c.enabled).length + '<small> of ' + d.length + '</small></div></div><div class="card kpi"><div class="l">Total weight</div><div class="v">' + tw + '</div><div class="s">Scores are normalised, so weights are relative</div></div><div class="card kpi"><div class="l">Rule-checked criteria</div><div class="v">' + d.filter(c => c.rule && c.enabled).length + '</div><div class="s">Deterministic, repeatable</div></div></div>' +
      cats.map(cat => {
        const rows = d.filter(c => c.category === cat), cw = rows.filter(c => c.enabled).reduce((s, c) => s + c.weight, 0);
        return '<div class="card rb-cat"><header><h3>' + cat + ' <span class="chip">' + (tw ? Math.round(cw / tw * 100) : 0) + '% of score</span></h3><button class="btn sm ghost" data-act="rbAdd" data-cat="' + cat + '">' + I('plus', 14) + ' Add</button></header>' +
          (rows.length ? rows.map(c => '<div class="rb-row ' + (c.enabled ? '' : 'off') + '"><label class="toggle" title="Enable or disable"><input type="checkbox" data-in="rbToggle" data-id="' + c.id + '"' + (c.enabled ? ' checked' : '') + ' aria-label="Enable ' + E(c.name) + '"><i></i></label>' +
            '<div><div class="nm">' + E(c.name) + '</div><div class="ds">' + E(c.desc || '') + '</div><div class="tg"><span class="chip">' + (c.type === 'passfail' ? 'Pass / fail' : '1–5 scale') + '</span><span class="chip ' + (c.engine === 'Rule' ? 'rule' : 'ai') + '">' + (c.engine === 'Rule' ? 'Rule check' : c.engine === 'Hybrid' ? 'AI + rules' : 'AI judged') + '</span><span class="chip sev-' + ({ critical: 'high', major: 'medium', minor: 'low' })[c.severity] + '">' + ({ critical: 'Critical → High alert', major: 'Major → Medium', minor: 'Minor → Low' })[c.severity] + '</span>' + (c.rule ? '<span class="chip">' + c.rule.phrases.length + ' phrases</span>' : '') + (c.custom ? '<span class="chip">Custom</span>' : '') + '</div></div>' +
            '<div class="r"><div style="text-align:center"><input type="number" class="wt" min="0" max="50" value="' + c.weight + '" data-in="rbWeight" data-id="' + c.id + '" aria-label="Weight"><div class="hint" style="margin:2px 0 0">weight</div></div><button class="icon-btn" data-act="rbEdit" data-id="' + c.id + '" aria-label="Edit">' + I('edit', 16) + '</button><button class="icon-btn" data-act="rbDel" data-id="' + c.id + '" aria-label="Delete">' + I('trash', 16) + '</button></div></div>').join('') : '<div class="empty" style="padding:22px">No criteria in this category yet.</div>') + '</div>';
      }).join('') +
      '<div class="card sticky-bar" id="rbBar" style="' + (dirty ? '' : 'display:none') + '"><div class="impact" id="rbImpact">' + impactHtml() + '</div></div></div>';
  };
  function impactHtml() {
    if (eq()) return '';
    const cur = avg30(S().rubric), nw = avg30(RB.draft.filter(c => c.enabled)), dl = nw - cur;
    return '<div><div class="muted" style="font-size:12.5px">Impact preview · average score, last 30 days</div><div class="big">' + cur + ' → ' + nw + ' <span class="delta ' + (dl > 0 ? 'up' : dl < 0 ? 'down' : '') + '" style="font-size:15px">' + (dl > 0 ? '+' : '') + dl + '</span></div></div><div class="muted" style="flex:1;min-width:200px;font-size:13px">You have unpublished changes. Past calls will be re-scored with the new rubric; overrides and reviews are kept.</div><div class="acts"><button class="btn" data-act="rbDiscard">Discard</button><button class="btn primary" data-act="rbPublish">Publish v1.' + (S().rubricVer + 1) + '</button></div>';
  }
  const refreshBar = () => { const b = $('#rbBar'); if (!b) return; b.style.display = eq() ? 'none' : ''; $('#rbImpact').innerHTML = impactHtml(); };
  CL.ins.rbToggle = el => { RB.draft.find(c => c.id === el.dataset.id).enabled = el.checked; el.closest('.rb-row').classList.toggle('off', !el.checked); refreshBar(); };
  CL.ins.rbWeight = el => { RB.draft.find(c => c.id === el.dataset.id).weight = Math.max(0, Math.min(50, +el.value || 0)); refreshBar(); };
  CL.acts.rbDiscard = () => { RB.draft = null; CL.render(); CL.toast('Draft discarded.'); };
  CL.acts.rbDel = el => { const c = RB.draft.find(x => x.id === el.dataset.id); CL.modal({ title: 'Delete criterion?', body: '<p>“' + E(c.name) + '” will be removed from the draft rubric. You can discard the draft to undo before publishing.</p>', foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn danger" data-act="rbDelOk" data-id="' + c.id + '">Delete</button>' }); };
  CL.acts.rbDelOk = el => { RB.draft = RB.draft.filter(c => c.id !== el.dataset.id); CL.closeModal(); CL.render(); };
  CL.acts.rbHistory = () => CL.modal({ title: 'Rubric version history', body: S().rubricHistory.slice().reverse().map(v => '<div class="ver"><b>v' + v.v + '</b><div style="flex:1">' + E(v.note) + '<div class="muted" style="font-size:12.5px">' + E(v.by) + ' · ' + CL.date(v.at, true) + '</div></div></div>').join('') + '<div class="ver"><b>v1.' + S().rubricVer + '</b><div style="flex:1">Current live version<div class="muted" style="font-size:12.5px">' + S().rubric.filter(c => c.enabled).length + ' active criteria</div></div></div>' });
  CL.acts.rbPublish = () => CL.modal({ title: 'Publish rubric v1.' + (S().rubricVer + 1), body: '<p class="muted" style="margin-bottom:12px">New calls will be scored with this rubric, and the last 30 days of calls will be re-scored.</p><div class="field"><label class="f">Version note</label><input type="text" id="rbnote" placeholder="e.g. Added guaranteed-return phrases for SIP campaign"></div>', foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="rbPublishOk">Publish and re-score</button>' });
  CL.acts.rbPublishOk = function () {
    const note = ($('#rbnote').value || 'Rubric updated').trim(), n = CL.within(CL.calls(), 30).length;
    CL.modal({ title: 'Re-scoring calls', body: '<div style="padding:10px 0"><div class="bar" style="height:10px"><i id="rsb" style="width:0;background:var(--brand2)"></i></div><p class="muted" id="rst" style="margin-top:10px">Re-scoring 0 of ' + n + ' calls…</p></div>', nofocus: true });
    let k = 0; const iv = setInterval(() => {
      k += Math.ceil(n / 8); if (k >= n) { k = n; clearInterval(iv); }
      $('#rsb').style.width = (k / n * 100) + '%'; $('#rst').textContent = 'Re-scoring ' + k + ' of ' + n + ' calls…';
      if (k >= n) setTimeout(() => {
        S().rubric = CL.util.clone(RB.draft); S().rubricVer++; S().rubricHistory.push({ v: '1.' + S().rubricVer, at: Date.now(), by: CL.USER.name, note }); CL.log('Published rubric v1.' + S().rubricVer + ': ' + note); CL.save(); RB.draft = null;
        CL.closeModal(); CL.render(); CL.toast('Rubric v1.' + S().rubricVer + ' published. ' + n + ' calls re-scored.');
      }, 350);
    }, 170);
  };
  /* criterion form */
  CL.acts.rbAdd = el => openForm({ id: 'c_' + Date.now().toString(36), name: '', category: el.dataset.cat || 'Discovery', type: 'scale', weight: 8, severity: 'minor', engine: 'AI', enabled: true, desc: '', flag: '', custom: true }, true);
  CL.acts.rbEdit = el => openForm(CL.util.clone(RB.draft.find(c => c.id === el.dataset.id)), false);
  function openForm(c, isNew) {
    RB.form = { c, isNew, phrases: c.rule ? c.rule.phrases.slice() : [], mode: c.rule ? c.rule.mode : 'required' };
    const sel = (id, opts, cur) => '<select id="' + id + '">' + opts.map(o => '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
    CL.modal({
      title: isNew ? 'Add criterion' : 'Edit criterion', side: true,
      body: '<div class="field"><label class="f">Criterion</label><input type="text" id="rf-name" value="' + E(c.name) + '" placeholder="e.g. Mentioned the cooling-off period"></div>' +
        '<div class="field"><label class="f">Category</label>' + sel('rf-cat', CL.CATEGORIES.map(x => [x, x]), c.category) + '</div>' +
        '<div class="grid g-2" style="gap:12px"><div class="field"><label class="f">Scoring</label>' + sel('rf-type', [['scale', '1–5 scale'], ['passfail', 'Pass / fail']], c.type) + '</div><div class="field"><label class="f">Weight</label><input type="number" id="rf-w" min="0" max="50" value="' + c.weight + '"></div></div>' +
        '<div class="grid g-2" style="gap:12px"><div class="field"><label class="f">If it fails, alert severity</label>' + sel('rf-sev', [['minor', 'Low (coaching only)'], ['major', 'Medium'], ['critical', 'High (instant alert)']], c.severity) + '</div><div class="field"><label class="f">Method</label>' + sel('rf-eng', [['AI', 'AI judged'], ['Rule', 'Rule check (phrases)'], ['Hybrid', 'AI + rules']], c.engine) + '</div></div>' +
        '<div class="field"><label class="f">What good looks like (guidance for the AI reviewer)</label><textarea id="rf-desc" placeholder="Describe the behaviour to look for. Be specific.">' + E(c.desc || '') + '</textarea></div>' +
        '<div class="field"><label class="f">Flag title (shown when it fails)</label><input type="text" id="rf-flag" value="' + E(c.flag || '') + '" placeholder="e.g. Cooling-off period not mentioned"></div>' +
        '<div id="rf-rule">' + ruleHtml() + '</div>',
      foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="rbSave">' + (isNew ? 'Add to draft' : 'Save to draft') + '</button>'
    });
    $('#rf-eng').addEventListener('change', () => { $('#rf-rule').innerHTML = ruleHtml(); });
    $('#rf-name').focus();
  }
  function ruleHtml() {
    const f = RB.form, eng = ($('#rf-eng') || { value: f.c.engine }).value; if (eng === 'AI') return '';
    return '<div class="card" style="box-shadow:none;padding:14px;background:var(--soft)"><div class="field"><label class="f">Rule type</label><select id="rf-mode" data-in="rfMode"><option value="required"' + (f.mode === 'required' ? ' selected' : '') + '>Required: at least one phrase must be said by the agent</option><option value="prohibited"' + (f.mode === 'prohibited' ? ' selected' : '') + '>Prohibited: none of these phrases may be said</option></select></div>' +
      '<div class="field"><label class="f">Phrases (press Enter to add)</label><div class="tagin" id="rf-tags">' + tagsHtml() + '<input type="text" id="rf-ph" placeholder="e.g. guaranteed returns" aria-label="Add phrase"></div><div class="hint">Case-insensitive, hyphens ignored. Prohibited phrases ignore negated mentions such as “not guaranteed”.</div></div>' +
      '<div class="field" style="margin:0"><label class="f">Test a sentence</label><input type="text" id="rf-test" placeholder="Type what an agent might say…"><div id="rf-res" class="hint"></div></div></div>';
  }
  const tagsHtml = () => RB.form.phrases.map((p, i) => '<span class="chip">' + E(p) + ' <button data-act="rfDelPh" data-i="' + i + '" aria-label="Remove ' + E(p) + '">×</button></span>').join('');
  CL.ins.rfMode = el => { RB.form.mode = el.value; testRule(); };
  CL.acts.rfDelPh = el => { RB.form.phrases.splice(+el.dataset.i, 1); $('#rf-tags').innerHTML = tagsHtml() + '<input type="text" id="rf-ph" placeholder="e.g. guaranteed returns" aria-label="Add phrase">'; testRule(); };
  document.addEventListener('keydown', e => {
    if (e.target && e.target.id === 'rf-ph' && (e.key === 'Enter' || e.key === ',')) {
      e.preventDefault(); const v = e.target.value.trim().replace(/,$/, ''); if (!v || RB.form.phrases.includes(v.toLowerCase())) return;
      RB.form.phrases.push(v.toLowerCase()); $('#rf-tags').innerHTML = tagsHtml() + '<input type="text" id="rf-ph" placeholder="Add another…" aria-label="Add phrase">'; $('#rf-ph').focus(); testRule();
    }
  });
  document.addEventListener('input', e => { if (e.target && e.target.id === 'rf-test') testRule(); });
  function testRule() {
    const t = $('#rf-test'), out = $('#rf-res'); if (!t || !out) return; if (!t.value.trim()) { out.textContent = ''; return; }
    const hits = CL.ruleMatches([{ sp: 'A', i: 0, t: 0, text: t.value }], RB.form.phrases, RB.form.mode);
    out.innerHTML = RB.form.mode === 'prohibited' ? (hits.length ? '<b style="color:var(--bad)">Flagged:</b> “' + E(hits[0].phrase) + '”' : '<b style="color:var(--good)">Clean:</b> no prohibited phrase found') : (hits.length ? '<b style="color:var(--good)">Passes:</b> “' + E(hits[0].phrase) + '” found' : '<b style="color:var(--bad)">Fails:</b> no required phrase found');
  }
  CL.acts.rbSave = function () {
    const f = RB.form, name = $('#rf-name').value.trim(); if (!name) return CL.toast('Give the criterion a name.', 'err');
    const eng = $('#rf-eng').value, c = Object.assign(f.c, { name, category: $('#rf-cat').value, type: $('#rf-type').value, weight: Math.max(0, +$('#rf-w').value || 0), severity: $('#rf-sev').value, engine: eng, desc: $('#rf-desc').value.trim(), flag: $('#rf-flag').value.trim() || name });
    if (eng !== 'AI') { if (!f.phrases.length) return CL.toast('Add at least one phrase for the rule.', 'err'); c.rule = { mode: $('#rf-mode').value, phrases: f.phrases.slice() }; if (c.rule.mode === 'prohibited' || c.rule.mode === 'required') c.type = 'passfail'; } else delete c.rule;
    const i = RB.draft.findIndex(x => x.id === c.id); if (i >= 0) RB.draft[i] = c; else RB.draft.push(c);
    CL.closeModal(); CL.render(); CL.toast('Saved to draft. Review the impact preview, then publish.');
  };

  /* ================= SETTINGS ================= */
  CL.views.settings = function () {
    const t = U.set, s = S().settings, tabs = [['alerts', 'bell', 'Alert routing'], ['privacy', 'lock', 'Privacy and retention'], ['team', 'users', 'Team and access'], ['audit', 'file', 'Audit log']];
    const row = (b, sm, ctl) => '<div class="set-row"><div><b>' + b + '</b><small>' + sm + '</small></div><div>' + ctl + '</div></div>';
    const tg = (k, on) => '<label class="toggle"><input type="checkbox" data-in="setTog" data-k="' + k + '"' + (on ? ' checked' : '') + ' aria-label="' + k + '"><i></i></label>';
    const opts = (arr, cur, k) => '<select data-in="setSel" data-k="' + k + '" style="width:auto">' + arr.map(a => '<option value="' + a[0] + '"' + (String(a[0]) === String(cur) ? ' selected' : '') + '>' + a[1] + '</option>').join('') + '</select>';
    let body = '';
    if (t === 'alerts') body = '<div class="card"><div class="card-b">' +
      row('Slack notifications', 'Post high-severity calls with the flagged quote and a deep link.', tg('slack', s.slack)) +
      row('Slack channel', 'Where alerts are posted.', '<input type="text" value="' + E(s.slackChannel) + '" data-in="setTxt" data-k="slackChannel" style="width:220px" aria-label="Slack channel">') +
      row('Email notifications', 'Sent to the recipients below.', tg('email', s.email)) +
      '<div class="set-row" style="display:block"><b style="display:block;font-weight:600">Email recipients</b><small class="muted">One per line</small><textarea data-in="setEmails" style="margin-top:8px">' + E(s.emails.join('\n')) + '</textarea></div>' +
      row('Alert threshold', 'Lowest severity that triggers an instant alert.', opts([['High', 'High only'], ['Medium', 'Medium and above']], s.alertMin, 'alertMin')) +
      row('Weekly digest', 'Summary of scores, violations and coaching priorities.', opts([['Monday 09:00', 'Monday 09:00'], ['Friday 17:00', 'Friday 17:00'], ['Off', 'Off']], s.digest, 'digest')) +
      '<div style="padding-top:16px"><button class="btn" data-act="testRoute">' + I('zap', 16) + ' Send test alert</button></div></div></div>';
    if (t === 'privacy') body = '<div class="card"><div class="card-b">' +
      '<div class="set-row" style="display:block"><b style="display:block;font-weight:600">Recording consent announcement</b><small class="muted">Read to the customer at the start of each call. The rules layer checks that agents say it.</small><textarea data-in="setTxt" data-k="consentText" style="margin-top:8px">' + E(s.consentText) + '</textarea></div>' +
      row('Mask PAN and phone numbers in transcripts', 'Replaces sensitive identifiers with dots on screen and in exports.', tg('redact', s.redact)) +
      row('Audio retention', 'Recordings are permanently deleted after this period.', opts([[30, '30 days'], [60, '60 days'], [90, '90 days'], [180, '180 days'], [365, '1 year']], s.audioDays, 'audioDays')) +
      row('Transcript and score retention', 'Transcripts, scores and audit trail.', opts([[180, '6 months'], [365, '1 year'], [730, '2 years']], s.transcriptDays, 'transcriptDays')) +
      row('Encryption', 'AES-256 at rest, TLS 1.3 in transit.', '<span class="chip sev-clear">' + I('lock', 12) + ' On</span>') +
      row('Data location', 'Audio and transcripts stay in this region.', '<span class="chip">' + CL.ORG.region + '</span>') +
      row('Human review for High flags', 'High-severity flags are treated as first-pass until a manager confirms them.', '<span class="chip sev-clear">' + I('check', 12) + ' Required</span>') +
      '<div class="set-row" style="display:block"><b style="display:block;font-weight:600">Erase a customer’s data</b><small class="muted">Deletes audio, transcripts and scores linked to a phone number.</small><div class="acts" style="margin-top:8px"><input type="tel" id="erase" placeholder="+91 98••• ••••" style="max-width:240px"><button class="btn danger" data-act="erase">Request erasure</button></div></div>' +
      '<p class="hint" style="margin-top:14px">Have your legal team confirm consent wording and retention periods against the Digital Personal Data Protection Act and sector rules that apply to you.</p></div></div>';
    if (t === 'team') body = '<div class="card"><div class="card-h"><h3>Team members</h3><button class="btn sm primary" data-act="invite">' + I('plus', 14) + ' Invite</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Access</th></tr></thead><tbody>' +
      [['Anjali Verma', 'Admin', 'Everything, including rubric and billing', '#0d9488'], ['Rahul Bhandari', 'Compliance officer', 'All calls, alerts, audit exports', '#7c3aed'], ['Meera Kapoor', 'QA analyst', 'Review, override and comment', '#2563eb']].concat(s.invited || []).map(u => '<tr style="cursor:default"><td><div class="cell-a">' + CL.avatar({ name: u[0], color: u[3] || '#64748b' }, 30) + '<b>' + E(u[0]) + '</b></div></td><td>' + E(u[1]) + '</td><td class="muted">' + E(u[2]) + '</td></tr>').join('') + CL.AGENTS.slice(0, 1).map(() => '<tr style="cursor:default"><td><div class="cell-a"><span class="av" style="--c:#64748b;width:30px;height:30px;font-size:11px">8</span><b>8 agents</b></div></td><td>Agent</td><td class="muted">Own calls and coaching notes only</td></tr>').join('') + '</tbody></table></div></div>';
    if (t === 'audit') body = '<div class="card"><div class="card-b">' + (S().audit.length ? S().audit.map(a => '<div class="audit"><time>' + CL.date(a.at, true) + '</time><div><b style="font-weight:600">' + E(a.who) + '</b> ' + E(a.what) + '</div></div>').join('') : '<div class="empty"><b>No activity yet</b>Overrides, reviews, escalations and rubric changes will appear here.</div>') +
      BASE_AUDIT.map(a => '<div class="audit"><time>' + CL.date(Date.now() - a[0] * DAY, true) + '</time><div><b style="font-weight:600">' + a[1] + '</b> ' + a[2] + '</div></div>').join('') + '</div></div>';
    return '<div class="page"><div class="page-h"><div><h1>Settings</h1><p>Alert routing, consent and retention, access, and a full audit trail of every manager action.</p></div></div><div class="grid set-grid" style="grid-template-columns:220px minmax(0,1fr);align-items:start"><div class="card" style="padding:8px"><div class="set-tabs">' + tabs.map(x => '<button class="' + (t === x[0] ? 'on' : '') + '" data-act="setTab" data-t="' + x[0] + '">' + I(x[1], 16) + x[2] + '</button>').join('') + '</div></div><div>' + body + '</div></div></div>';
  };
  const BASE_AUDIT = [[3, 'Rahul Bhandari', 'exported the compliance audit CSV (28 calls)'], [9, 'Anjali Verma', 'published rubric v1.2: raised weight of mandatory disclosure'], [12, 'Meera Kapoor', 'overrode “Tone” on a call after listening to the audio'], [24, 'Anjali Verma', 'published rubric v1.1'], [41, 'Anjali Verma', 'connected Exotel and Knowlarity']];
  CL.acts.setTab = el => { U.set = el.dataset.t; CL.render(); };
  CL.ins.setTog = el => { S().settings[el.dataset.k] = el.checked; CL.log('Changed setting ' + el.dataset.k + ' to ' + (el.checked ? 'on' : 'off')); CL.save(); CL.toast('Setting saved.'); };
  CL.ins.setSel = el => { const v = el.value; S().settings[el.dataset.k] = isNaN(+v) ? v : +v; CL.log('Changed ' + el.dataset.k + ' to ' + v); CL.save(); CL.updateBell(); CL.toast('Setting saved.'); };
  CL.ins.setTxt = el => { S().settings[el.dataset.k] = el.value; CL.save(); };
  CL.ins.setEmails = el => { S().settings.emails = el.value.split(/\n|,/).map(x => x.trim()).filter(Boolean); CL.save(); };
  CL.acts.testRoute = () => { CL.toast('Test alert sent to ' + (S().settings.slack ? E(S().settings.slackChannel) : 'email') + '.'); };
  CL.acts.erase = () => { const v = $('#erase').value.trim(); if (v.length < 8) return CL.toast('Enter the customer’s full phone number.', 'err'); CL.log('Requested erasure for ' + v.slice(0, 6) + '••••'); CL.save(); CL.toast('Erasure queued. Data will be removed within 24 hours and logged.'); $('#erase').value = ''; };
  CL.acts.invite = () => CL.modal({ title: 'Invite a team member', body: '<div class="field"><label class="f">Email</label><input type="email" id="inv-e" placeholder="name@company.com"></div><div class="field"><label class="f">Role</label><select id="inv-r"><option>QA analyst</option><option>Compliance officer</option><option>Team lead</option><option>Admin</option></select></div>', foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="inviteOk">Send invite</button>' });
  CL.acts.inviteOk = () => { const e = $('#inv-e').value.trim(); if (!/^\S+@\S+\.\S+$/.test(e)) return CL.toast('Enter a valid email address.', 'err'); (S().settings.invited = S().settings.invited || []).push([e, $('#inv-r').value, 'Invitation pending']); CL.log('Invited ' + e); CL.save(); CL.closeModal(); CL.render(); CL.toast('Invitation sent to ' + E(e) + '.'); };
})();
