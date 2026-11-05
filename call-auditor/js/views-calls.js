/* CallLens — Dashboard, Call list, Call detail */
(function () {
  'use strict';
  const CL = window.CL, I = CL.icon, E = CL.esc, DAY = CL.util.DAY;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  CL.views = CL.views || {}; CL.ins = CL.ins || {};
  CL.ui = CL.ui || {};
  const U = CL.ui;
  U.dash = { days: 7, team: 'all' };
  U.calls = { q: '', agent: '', risk: '', outcome: '', lang: '', range: '30', sort: 'startedAt', dir: 'desc', page: 1 };
  const PAGE = 12;

  const flagChips = (an, max) => {
    const f = an.flags; if (!f.length) return '<span class="chip sev-clear">' + I('check', 12) + ' No flags</span>';
    return '<div class="flags">' + f.slice(0, max || 2).map(x => '<span class="chip sev-' + x.sev.toLowerCase() + '" title="' + E(x.note) + '">' + E(x.title) + '</span>').join('') + (f.length > (max || 2) ? '<span class="chip">+' + (f.length - (max || 2)) + '</span>' : '') + '</div>';
  };
  CL.flagChips = flagChips;

  /* ================= DASHBOARD ================= */
  function buckets(calls, days) {
    const now = Date.now(), daily = days <= 14, n = daily ? days : Math.ceil(days / 5), size = daily ? DAY : 5 * DAY, out = [];
    for (let i = n - 1; i >= 0; i--) {
      const end = now - i * size, start = end - size, cs = calls.filter(c => c.startedAt > start && c.startedAt <= end);
      const st = cs.length ? CL.stats(cs) : null;
      out.push({ x: new Date(end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), y: st ? st.avg : null, c: st ? st.compliance : null });
    }
    return out;
  }
  const pctDelta = (a, b) => b ? Math.round((a - b) / b * 100) : null;

  CL.views.dashboard = function () {
    const d = U.dash, teams = [...new Set(CL.AGENTS.map(a => a.team))];
    const all = CL.calls().filter(c => d.team === 'all' || c.agent.team === d.team);
    const cur = CL.within(all, d.days), prev = CL.within(all, d.days, Date.now() - d.days * DAY);
    const sc = CL.stats(cur), sp = CL.stats(prev);
    const bk = buckets(all, d.days);
    const cats = {}; sc.an.forEach(a => Object.entries(a.cats).forEach(([k, v]) => (cats[k] = cats[k] || []).push(v)));
    const catRows = CL.CATEGORIES.filter(k => cats[k]).map(k => [k, CL.avg(cats[k])]);
    const viol = CL.violations(cur).slice(0, 5);
    const ags = CL.agentStats(d.days).filter(s => s.stats.n && (d.team === 'all' || s.agent.team === d.team));
    const best = ags.slice(0, 3), worst = ags.slice().reverse().slice(0, 3);
    const alerts = CL.alerts().filter(a => d.team === 'all' || a.call.agent.team === d.team).slice(0, 4);
    const reviewed = all.filter(c => CL.state.reviewed[c.id] || c.preReviewed).length;
    const mins = Math.round(cur.reduce((s, c) => s + c.duration, 0) / 60);
    const kpi = (label, val, sub, ic, cls) => '<div class="card kpi ' + (cls || '') + '"><div class="ico">' + I(ic, 18) + '</div><div class="l">' + label + '</div><div class="v">' + val + '</div><div class="s">' + sub + '</div></div>';
    const dAvg = prev.length ? sc.avg - sp.avg : null, dHigh = prev.length ? sc.high - sp.high : null, dCmp = prev.length ? sc.compliance - sp.compliance : null;
    return '<div class="page">' +
      '<div class="page-h"><div><h1>Team overview</h1><p>Every call is transcribed, scored against your rubric and checked by the rules layer. Here is what the last ' + d.days + ' days looked like.</p></div>' +
      '<div class="acts"><select data-in="dash" data-k="team" aria-label="Team" style="width:auto"><option value="all">All teams</option>' + teams.map(t => '<option' + (d.team === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>' +
      '<div class="seg" role="group" aria-label="Period">' + [7, 14, 30].map(n => '<button class="' + (d.days === n ? 'on' : '') + '" data-act="dashDays" data-n="' + n + '">' + n + 'd</button>').join('') + '</div>' +
      '<button class="btn" data-act="weeklyReport">' + I('file', 16) + ' Weekly report</button></div></div>' +

      '<div class="grid g-kpi mb">' +
      kpi('Calls analysed', sc.n, CL.delta(pctDelta(sc.n, sp.n), '%') + ' vs previous ' + d.days + 'd', 'phone') +
      kpi('Average quality score', sc.avg + '<small> / 100</small>', CL.delta(dAvg, ' pts') + ' vs previous', 'target') +
      kpi('High-risk calls', sc.high, (dHigh == null ? '' : '<span class="delta ' + (dHigh > 0 ? 'down' : dHigh < 0 ? 'up' : '') + '">' + (dHigh > 0 ? '▲ ' : dHigh < 0 ? '▼ ' : '') + Math.abs(dHigh) + '</span> vs previous · ') + CL.alerts().filter(a => a.status === 'Open').length + ' open alerts', 'alert', 'alertk') +
      kpi('Compliance score', sc.compliance + '<small> / 100</small>', CL.delta(dCmp, ' pts') + ' vs previous', 'shield') + '</div>' +

      '<div class="grid g-21 mb"><div class="card"><div class="card-h"><h3>Score trend</h3><div class="legend"><span><i style="background:var(--brand2)"></i>Quality score</span><span><i style="background:var(--warn)"></i>Compliance</span></div></div><div class="card-b">' +
      CL.lineChart([{ name: 'Quality score', color: 'var(--brand2)', points: bk.map(b => ({ x: b.x, y: b.y })) }, { name: 'Compliance', color: 'var(--warn)', dash: true, points: bk.map(b => ({ x: b.x, y: b.c })) }], { label: 'Quality and compliance score trend', min: 0, max: 100 }) +
      '</div></div>' +
      '<div class="card cover"><h3>Review coverage</h3><div class="big">100%</div><div style="opacity:.9">of calls scored, ' + sc.n + ' calls · ' + Math.round(mins / 60 * 10) / 10 + ' hours of audio</div>' +
      '<div class="cmp"><span style="width:92px">AI + rules</span><div class="b"><i style="width:100%"></i></div></div>' +
      '<div class="cmp"><span style="width:92px">Human QA</span><div class="b"><i style="width:' + Math.max(3, Math.round(reviewed / Math.max(1, all.length) * 100)) + '%"></i></div><b>' + reviewed + '/' + all.length + '</b></div>' +
      '<div style="margin-top:14px;font-size:12.5px;opacity:.85">Managers review only the calls that need a human. Flagged calls are queued for review first.</div></div></div>' +

      '<div class="grid g-2 mb"><div class="card"><div class="card-h"><h3>Score by category</h3><span class="muted" style="font-size:12.5px">Average, last ' + d.days + ' days</span></div><div class="card-b">' +
      catRows.map(([k, v]) => '<div class="row-b"><span>' + k + '</span>' + CL.bar(v) + '<span class="n">' + v + '</span></div>').join('') + '</div></div>' +
      '<div class="card"><div class="card-h"><h3>Top violations</h3><a href="#/calls" class="muted" style="font-size:12.5px">View calls →</a></div><div class="card-b">' +
      (viol.length ? viol.map(v => '<div class="viol"><div style="flex:1;min-width:0"><b style="font-weight:600">' + E(v.title) + '</b><div class="muted" style="font-size:12.5px">' + v.category + ' · ' + v.agents.size + ' agent' + (v.agents.size > 1 ? 's' : '') + '</div></div>' + CL.sevChip(v.sev) + '<div class="cnt">' + v.n + '</div></div>').join('') : '<div class="empty"><b>No violations</b>Nothing flagged in this period.</div>') + '</div></div></div>' +

      '<div class="grid g-3">' +
      '<div class="card"><div class="card-h"><h3>' + I('award', 16) + ' Top performers</h3></div><div class="card-b">' + best.map((s, i) => lb(s, i + 1)).join('') + '</div></div>' +
      '<div class="card"><div class="card-h"><h3>' + I('flag', 16) + ' Needs coaching</h3></div><div class="card-b">' + worst.map((s, i) => lb(s, ags.length - i)).join('') + '</div></div>' +
      '<div class="card"><div class="card-h"><h3>' + I('bell', 16) + ' Latest alerts</h3><a href="#/alerts" class="muted" style="font-size:12.5px">All alerts →</a></div><div class="card-b">' +
      (alerts.length ? alerts.map(a => '<a class="lb" href="#/alerts" style="text-decoration:none;color:inherit"><span class="dot" style="background:var(--' + (a.sev === 'High' ? 'bad' : 'warn') + ')"></span><div class="nm">' + E(a.primary.title) + '<small>' + E(a.call.agent.name) + ' · ' + CL.rel(a.at) + '</small></div><span class="st-badge st-' + a.status + '">' + a.status + '</span></a>').join('') : '<div class="empty">No alerts</div>') + '</div></div></div></div>';
  };
  function lb(s, rank) {
    return '<div class="lb" data-act="open" data-href="#/agents/' + s.agent.id + '"><span class="rk">' + rank + '</span>' + CL.avatar(s.agent, 34) + '<div class="nm">' + E(s.agent.name) + '<small>' + s.stats.n + ' calls · ' + s.stats.high + ' high-risk</small></div>' + CL.scorePill(s.stats.avg) + '</div>';
  }
  CL.acts.dashDays = el => { U.dash.days = +el.dataset.n; CL.render(); };
  CL.ins.dash = el => { U.dash[el.dataset.k] = el.value; CL.render(); };

  CL.acts.weeklyReport = function () {
    const cur = CL.within(CL.calls(), 7), st = CL.stats(cur), prev = CL.stats(CL.within(CL.calls(), 7, Date.now() - 7 * DAY));
    const v = CL.violations(cur).slice(0, 5), ags = CL.agentStats(7).filter(s => s.stats.n);
    const wk = new Date(Date.now() - 7 * DAY).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' – ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    CL.modal({
      title: 'Weekly QA report', cls: 'wide', nofocus: true,
      body: '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div><h2 style="font-size:20px">' + CL.ORG.name + ' · Sales QA</h2><div class="muted">' + wk + ' · generated by CallLens, rubric v1.' + CL.state.rubricVer + '</div></div>' + CL.ring(st.avg, 76, 8, 'avg') + '</div>' +
        '<div class="grid g-3 mb"><div class="mtile"><div class="l">Calls analysed</div><div class="v">' + st.n + '</div></div><div class="mtile"><div class="l">High-risk calls</div><div class="v">' + st.high + ' <small>(prev ' + prev.high + ')</small></div></div><div class="mtile"><div class="l">Compliance score</div><div class="v">' + st.compliance + ' <small>(prev ' + prev.compliance + ')</small></div></div></div>' +
        '<h4 style="margin:14px 0 6px">Top violations</h4>' + v.map(x => '<div class="viol"><div style="flex:1">' + E(x.title) + '</div>' + CL.sevChip(x.sev) + '<b class="cnt" style="font-size:16px">' + x.n + '</b></div>').join('') +
        '<h4 style="margin:18px 0 6px">Agent scores</h4>' + ags.map(s => '<div class="lb" style="cursor:default">' + CL.avatar(s.agent, 28) + '<div class="nm">' + E(s.agent.name) + '</div><span class="muted">' + s.stats.n + ' calls</span>' + CL.scorePill(s.stats.avg) + '</div>').join('') +
        '<p class="muted" style="margin-top:16px;font-size:12.5px">Scores are a first-pass review to prioritise human attention. They are not a basis for disciplinary action without manager review.</p>',
      foot: '<button class="btn" data-act="closeModal">Close</button><button class="btn" data-act="emailReport">' + I('mail', 16) + ' Email to managers</button><button class="btn primary" data-act="printReport">' + I('download', 16) + ' Print / save PDF</button>'
    });
  };
  CL.acts.printReport = () => { document.body.classList.add('print-report'); setTimeout(() => { window.print(); document.body.classList.remove('print-report'); }, 60); };
  CL.acts.emailReport = () => { CL.log('Weekly report emailed to managers'); CL.save(); CL.toast('Weekly report sent to ' + CL.state.settings.emails.length + ' recipients.'); CL.closeModal(); };

  /* ================= CALL LIST ================= */
  function filtered() {
    const f = U.calls, q = f.q.trim().toLowerCase();
    let list = CL.calls();
    if (f.range !== 'all') list = CL.within(list, +f.range);
    list = list.filter(c => {
      const a = CL.analyze(c);
      if (f.agent && c.agent.id !== f.agent) return false;
      if (f.risk && a.risk !== f.risk) return false;
      if (f.outcome && c.outcome !== f.outcome) return false;
      if (f.lang && c.lang !== f.lang) return false;
      if (q && !(c.id + ' ' + c.cust + ' ' + c.agent.name + ' ' + c.product).toLowerCase().includes(q)) return false;
      return true;
    });
    const dir = f.dir === 'asc' ? 1 : -1;
    list.sort((a, b) => f.sort === 'score' ? (CL.analyze(a).overall - CL.analyze(b).overall) * dir : f.sort === 'duration' ? (a.duration - b.duration) * dir : (a.startedAt - b.startedAt) * dir);
    return list;
  }
  function callsTable() {
    const list = filtered(), f = U.calls, pages = Math.max(1, Math.ceil(list.length / PAGE));
    if (f.page > pages) f.page = pages;
    const rows = list.slice((f.page - 1) * PAGE, f.page * PAGE);
    const th = (k, l) => '<th class="sortable" data-act="sortCalls" data-k="' + k + '">' + l + (f.sort === k ? ' ' + (f.dir === 'asc' ? '↑' : '↓') : '') + '</th>';
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + th('startedAt', 'Call') + '<th>Agent</th><th>Customer</th>' + th('score', 'Score') + '<th>Risk flags</th>' + th('duration', 'Duration') + '<th>Outcome</th></tr></thead><tbody>' +
      (rows.length ? rows.map(c => {
        const a = CL.analyze(c), rev = CL.state.reviewed[c.id] || c.preReviewed;
        return '<tr data-act="open" data-href="#/calls/' + c.id + '"><td><span class="mono" style="font-weight:600">' + c.id + '</span><div class="muted" style="font-size:12.5px">' + CL.date(c.startedAt, true) + '</div></td>' +
          '<td><div class="cell-a">' + CL.avatar(c.agent, 30) + '<div><b>' + E(c.agent.name) + '</b><small>' + c.agent.team + '</small></div></div></td>' +
          '<td><b style="font-weight:600">' + E(c.cust) + '</b><div class="muted" style="font-size:12.5px">' + E(c.ptype) + ' · <span class="chip ' + (c.lang === 'Hinglish' ? 'hy' : '') + '" style="padding:0 6px;font-size:11px">' + c.lang + '</span></div></td>' +
          '<td>' + CL.scorePill(a.overall) + '</td><td>' + flagChips(a, 2) + '</td><td class="mono">' + CL.fmt(c.duration) + '</td>' +
          '<td>' + E(c.outcome) + (rev ? '<div class="verified">' + I('check', 12) + ' Reviewed</div>' : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="7"><div class="empty"><b>No calls match these filters</b>Try widening the date range or clearing a filter.</div></td></tr>') +
      '</tbody></table></div><div class="pager"><span>' + (list.length ? ((f.page - 1) * PAGE + 1) + '–' + Math.min(list.length, f.page * PAGE) + ' of ' + list.length + ' calls' : '0 calls') + '</span><div class="acts"><button class="btn sm" data-act="pageCalls" data-d="-1"' + (f.page <= 1 ? ' disabled' : '') + '>' + I('left', 14) + ' Prev</button><span>Page ' + f.page + ' / ' + pages + '</span><button class="btn sm" data-act="pageCalls" data-d="1"' + (f.page >= pages ? ' disabled' : '') + '>Next ' + I('right', 14) + '</button></div></div>';
  }
  CL.views.calls = function () {
    const f = U.calls, opt = (v, l, cur) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + l + '</option>';
    return '<div class="page"><div class="page-h"><div><h1>Calls</h1><p>Every analysed call with its score, risk flags and outcome. Click a call to see the evidence behind each score.</p></div>' +
      '<div class="acts"><button class="btn" data-act="exportCalls">' + I('download', 16) + ' Export audit CSV</button><a class="btn primary" href="#/ingest">' + I('upload', 16) + ' Upload call</a></div></div>' +
      '<div class="card"><div class="filters"><div class="search">' + I('search', 16) + '<input type="search" placeholder="Search by call ID, customer, agent or product" value="' + E(f.q) + '" data-in="calls" data-k="q" aria-label="Search calls"></div>' +
      '<select data-in="calls" data-k="agent" aria-label="Agent">' + opt('', 'All agents', f.agent) + CL.AGENTS.map(a => opt(a.id, a.name, f.agent)).join('') + '</select>' +
      '<select data-in="calls" data-k="risk" aria-label="Risk">' + opt('', 'Any risk', f.risk) + ['High', 'Medium', 'Low', 'Clear'].map(r => opt(r, r === 'Clear' ? 'Clear (no flags)' : r + ' risk', f.risk)).join('') + '</select>' +
      '<select data-in="calls" data-k="outcome" aria-label="Outcome">' + opt('', 'Any outcome', f.outcome) + CL.OUTCOMES.map(o => opt(o, o, f.outcome)).join('') + '</select>' +
      '<select data-in="calls" data-k="lang" aria-label="Language">' + opt('', 'Any language', f.lang) + opt('Hinglish', 'Hinglish', f.lang) + opt('English', 'English', f.lang) + '</select>' +
      '<select data-in="calls" data-k="range" aria-label="Date range">' + opt('7', 'Last 7 days', f.range) + opt('14', 'Last 14 days', f.range) + opt('30', 'Last 30 days', f.range) + opt('all', 'All time', f.range) + '</select></div>' +
      '<div id="calls-table">' + callsTable() + '</div></div></div>';
  };
  CL.ins.calls = el => { U.calls[el.dataset.k] = el.value; U.calls.page = 1; $('#calls-table').innerHTML = callsTable(); };
  CL.acts.sortCalls = el => { const k = el.dataset.k; if (U.calls.sort === k) U.calls.dir = U.calls.dir === 'asc' ? 'desc' : 'asc'; else { U.calls.sort = k; U.calls.dir = k === 'score' ? 'asc' : 'desc'; } $('#calls-table').innerHTML = callsTable(); };
  CL.acts.pageCalls = el => { U.calls.page += +el.dataset.d; $('#calls-table').innerHTML = callsTable(); };
  CL.acts.open = el => { location.hash = el.dataset.href; };
  CL.acts.exportCalls = function () {
    const rows = [['Call ID', 'Date', 'Agent', 'Customer', 'Product', 'Language', 'Duration (s)', 'Score', 'Risk', 'Flags', 'Outcome', 'Human reviewed']];
    filtered().forEach(c => { const a = CL.analyze(c); rows.push([c.id, new Date(c.startedAt).toISOString(), c.agent.name, c.cust, c.product, c.lang, c.duration, a.overall, a.risk, a.flags.map(f => f.title).join('; '), c.outcome, (CL.state.reviewed[c.id] || c.preReviewed) ? 'Yes' : 'No']); });
    CL.download('calllens-audit-' + new Date().toISOString().slice(0, 10) + '.csv', rows.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n'), 'text/csv');
    CL.log('Exported audit CSV (' + (rows.length - 1) + ' calls)'); CL.save(); CL.toast('Audit export ready: ' + (rows.length - 1) + ' calls.');
  };

  /* ================= CALL DETAIL ================= */
  let P = null; // player state

  function lineHtml(call, an, l, hitsByLine, flagsByLine, goodLines) {
    const redact = CL.redact;
    let txt = E(redact(l.text));
    if (!l.edited && l.lc >= 0) { const ws = txt.split(' '); if (ws[l.lc]) { ws[l.lc] = '<span class="lc" title="Low ASR confidence (' + Math.round(l.conf * 100) + '%). Click the pencil to correct.">' + ws[l.lc] + '</span>'; txt = ws.join(' '); } }
    (hitsByLine[l.i] || []).forEach(ph => { const re = new RegExp('(' + ph.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\-]+') + ')', 'i'); txt = txt.replace(re, '<mark class="hl">$1</mark>'); });
    const fl = flagsByLine[l.i] || [], good = goodLines[l.i] || [];
    const tags = fl.map(f => '<span class="chip sev-' + f.sev.toLowerCase() + '">' + I('flag', 11) + ' ' + E(f.title) + '</span>').join('') + good.map(g => '<span class="chip sev-clear">' + I('check', 11) + ' ' + g + '</span>').join('') + (l.int ? '<span class="chip sev-medium">Interrupted customer</span>' : '');
    return '<div class="tl ' + l.sp + (fl.length ? ' flag' : good.length && l.sp === 'A' ? ' good' : '') + '" id="ln-' + l.i + '" data-act="seekLine" data-i="' + l.i + '"><span class="ts">' + CL.fmt(l.t) + '</span><span class="sp" title="' + (l.sp === 'A' ? 'Agent' : 'Customer') + '">' + (l.sp === 'A' ? 'A' : 'C') + '</span><div><div class="txt">' + txt + '</div>' + (tags ? '<div class="tags">' + tags + '</div>' : '') + '</div>' +
      '<button class="icon-btn edit" data-act="editLine" data-i="' + l.i + '" aria-label="Correct this line" title="Correct transcript">' + I('edit', 14) + '</button></div>';
  }

  function waveSvg(call, lines) {
    const N = 150, d = call.duration, rnd = CL.util.mulberry(CL.util.hash(call.id + 'w')); let g = '';
    for (let k = 0; k < N; k++) {
      const t = (k + 0.5) / N * d, sp = lines.filter(l => t >= l.t && t <= l.e);
      const amp = sp.length ? 0.28 + rnd() * 0.72 : 0.07 + rnd() * 0.05;
      const col = sp.length ? (sp.length > 1 ? 'var(--warn)' : sp[0].sp === 'A' ? 'var(--agent)' : 'var(--cust)') : 'var(--muted)';
      const h = Math.max(3, amp * 76), x = k * (600 / N);
      g += '<rect x="' + x.toFixed(1) + '" y="' + (43 - h / 2).toFixed(1) + '" width="' + (600 / N - 1.6).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="1.6" fill="' + col + '"/>';
    }
    return '<svg viewBox="0 0 600 86" preserveAspectRatio="none" aria-hidden="true">' + g + '</svg>';
  }

  CL.views.callDetail = function (id) {
    const call = CL.call(id);
    if (!call) return '<div class="page"><div class="empty card" style="padding:60px"><b>Call not found</b><a href="#/calls">Back to calls</a></div></div>';
    const an = CL.analyze(call), lines = CL.lines(call), m = an.metrics, st = CL.state;
    const hitsByLine = {}, flagsByLine = {}, goodLines = {};
    an.results.forEach(r => {
      if (r.c.rule && r.c.rule.mode === 'prohibited' && r.hits) r.hits.forEach(h => (hitsByLine[h.i] = hitsByLine[h.i] || []).push(h.phrase));
      if (r.c.rule && r.c.rule.mode === 'required' && !r.failed && r.ev != null) (goodLines[r.ev] = goodLines[r.ev] || []).push('Disclosure read');
    });
    if (m.recording) (goodLines[m.recording.i] = goodLines[m.recording.i] || []).push('Recording notice');
    an.flags.forEach(f => f.lines.forEach(i => (flagsByLine[i] = flagsByLine[i] || []).push(f)));
    const rev = st.reviewed[call.id] || (call.preReviewed && { by: 'Anjali Verma', at: call.startedAt + 2 * DAY });
    const alertSt = st.alertStatus[call.id];
    const markers = an.flags.filter(f => f.ev != null).map(f => '<button class="mk" style="left:' + (lines[f.ev].t / call.duration * 100).toFixed(2) + '%" data-act="seekLine" data-i="' + f.ev + '" title="' + E(CL.fmt(lines[f.ev].t) + ' · ' + f.title) + '" aria-label="Jump to ' + E(f.title) + '"></button>').join('');
    P = { call, lines, dur: call.duration, t: 0, playing: false, speed: 1, active: -1, timer: null, flagIdx: an.flags.filter(f => f.ev != null).map(f => f.ev).sort((a, b) => lines[a].t - lines[b].t) };
    const tabs = U.cdTab || 'rubric';

    return '<div class="page"><div class="crumb"><a href="#/calls">Calls</a>' + I('right', 13) + '<span class="mono">' + call.id + '</span></div>' +
      '<div class="card mb"><div class="cd-head">' + CL.ring(an.overall, 104, 10, 'score') +
      '<div style="flex:1;min-width:240px"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h1>' + E(call.cust) + ' <span class="muted" style="font-weight:500">· ' + E(call.product) + '</span></h1>' + CL.riskBadge(an.risk) + (rev ? '<span class="chip sev-clear">' + I('check', 12) + ' Reviewed by ' + E(rev.by) + '</span>' : '<span class="chip">Awaiting human review</span>') + '</div>' +
      '<div class="meta"><span>' + CL.avatar(call.agent, 24) + '<a href="#/agents/' + call.agent.id + '">' + E(call.agent.name) + '</a></span><span>' + I('clock', 14) + CL.date(call.startedAt, true) + ' · ' + CL.dur(call.duration) + '</span><span>' + I('phone', 14) + call.direction + ' · ' + E(call.phone) + '</span><span>' + I('zap', 14) + call.source + '</span><span><span class="chip ' + (call.lang === 'Hinglish' ? 'hy' : '') + '">' + call.lang + '</span></span><span title="Average speech-to-text confidence across all lines">' + I('mic', 14) + 'Transcript confidence ' + call.asr + '%</span></div></div>' +
      '<div class="acts no-print"><button class="btn ' + (rev ? '' : 'primary') + '" data-act="markReviewed" data-id="' + call.id + '">' + I('check', 16) + (rev ? ' Reviewed' : ' Mark reviewed') + '</button>' +
      (an.risk === 'High' || an.risk === 'Medium' ? '<button class="btn danger" data-act="escalate" data-id="' + call.id + '">' + I('bell', 16) + (alertSt && alertSt.status === 'Escalated' ? ' Escalated' : ' Escalate') + '</button>' : '') +
      '<button class="btn" data-act="printPage">' + I('download', 16) + ' Export</button></div></div></div>' +

      '<div class="cd"><div>' +
      '<div class="card mb"><div class="player"><div class="wave" id="wave" role="slider" aria-label="Call audio position" aria-valuemin="0" aria-valuemax="' + call.duration + '" tabindex="0"><div class="w-base">' + waveSvg(call, lines) + '</div><div class="w-top" id="wtop" style="clip-path:inset(0 100% 0 0)">' + waveSvg(call, lines) + '</div><div class="ph" id="ph" style="left:0"></div>' + markers + '</div>' +
      '<div class="ctl"><button class="play" id="playbtn" data-act="togglePlay" aria-label="Play">' + I('play', 18) + '</button><button class="icon-btn" data-act="skip" data-s="-10" aria-label="Back 10 seconds">' + I('back10', 18) + '</button><button class="icon-btn" data-act="skip" data-s="10" aria-label="Forward 10 seconds">' + I('fwd10', 18) + '</button><span class="time" id="timeEl">00:00 / ' + CL.fmt(call.duration) + '</span>' +
      (P.flagIdx.length ? '<button class="btn sm" data-act="nextFlag">' + I('flag', 14) + ' Next flag</button>' : '') +
      '<div class="spd"><span class="chip" title="Demo workspace: playback position and transcript sync are live, but no audio files are bundled.">Demo audio</span><div class="seg" role="group" aria-label="Speed">' + [1, 1.5, 2].map(s => '<button class="' + (s === 1 ? 'on' : '') + '" data-act="speed" data-s="' + s + '">' + s + '×</button>').join('') + '</div></div></div>' +
      '<div class="sp-key"><span><i style="background:var(--agent)"></i>Agent</span><span><i style="background:var(--cust)"></i>Customer</span><span><i style="background:var(--warn)"></i>Overlap</span><span><i style="background:var(--bad);border-radius:50%"></i>Flagged moment</span></div></div>' +
      '<div class="tx-h"><b>Transcript</b><span class="muted" style="font-size:12.5px">' + lines.length + ' turns · speaker-separated · <span class="lc">dotted</span> = low confidence' + (CL.state.settings.redact ? ' · PAN/phone masked' : '') + '</span></div>' +
      '<div class="tx" id="tx">' + lines.map(l => lineHtml(call, an, l, hitsByLine, flagsByLine, goodLines)).join('') + '</div></div></div>' +

      '<div class="card" id="rightcard"><div class="tabs" role="tablist">' + [['rubric', 'Rubric'], ['summary', 'Summary'], ['coaching', 'Coaching'], ['rules', 'Rules layer']].map(t => '<button role="tab" class="' + (tabs === t[0] ? 'on' : '') + '" data-act="cdTab" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div><div class="card-b" id="tabbody">' + tabBody(tabs, call, an) + '</div></div></div></div>';
  };

  CL.mounts = CL.mounts || {};
  CL.mounts.callDetail = function (id, params) {
    const w = $('#wave'); if (!w) return;
    const seekEv = e => { const r = w.getBoundingClientRect(); seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * P.dur, false); };
    let drag = false;
    w.addEventListener('pointerdown', e => { if (e.target.closest('.mk')) return; drag = true; seekEv(e); });
    window.addEventListener('pointermove', P.mv = e => { if (drag) seekEv(e); });
    window.addEventListener('pointerup', P.up = () => { drag = false; });
    w.addEventListener('keydown', e => { if (e.key === 'ArrowRight') seek(P.t + 5); else if (e.key === 'ArrowLeft') seek(P.t - 5); else if (e.key === ' ') { e.preventDefault(); CL.acts.togglePlay(); } });
    if (params && params.t) seek(+params.t, true); else if (params && params.line != null) CL.acts.seekLine({ dataset: { i: params.line } });
  };
  CL.unmount = function () { if (P) { clearInterval(P.timer); window.removeEventListener('pointermove', P.mv); window.removeEventListener('pointerup', P.up); P = null; } };

  function setBtn() { const b = $('#playbtn'); if (b) b.innerHTML = I(P.playing ? 'pause' : 'play', 18); }
  function update(scroll) {
    if (!P) return;
    const pct = P.t / P.dur * 100;
    $('#ph').style.left = pct + '%'; $('#wtop').style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
    $('#timeEl').textContent = CL.fmt(P.t) + ' / ' + CL.fmt(P.dur);
    let a = -1; for (let i = 0; i < P.lines.length; i++) if (P.lines[i].t <= P.t + 0.05) a = i;
    if (a !== P.active) {
      const old = $('#ln-' + P.active); if (old) old.classList.remove('active');
      const el = $('#ln-' + a);
      if (el) { el.classList.add('active'); if (scroll !== false) { const box = $('#tx'); box.scrollTo({ top: el.offsetTop - box.offsetTop - box.clientHeight / 3, behavior: 'smooth' }); } }
      P.active = a;
    }
  }
  function seek(t, play) { if (!P) return; P.t = Math.max(0, Math.min(P.dur, t)); update(); if (play) setPlaying(true); }
  function setPlaying(on) {
    if (!P) return; P.playing = on; clearInterval(P.timer);
    if (on) { if (P.t >= P.dur - 0.2) P.t = 0; P.timer = setInterval(() => { P.t += 0.1 * P.speed; if (P.t >= P.dur) { P.t = P.dur; setPlaying(false); } update(); }, 100); }
    setBtn();
  }
  CL.acts.togglePlay = () => setPlaying(!P.playing);
  CL.acts.skip = el => seek(P.t + +el.dataset.s);
  CL.acts.speed = el => { P.speed = +el.dataset.s; $$('[data-act=speed]').forEach(b => b.classList.toggle('on', b === el)); };
  CL.acts.seekLine = el => { const i = +el.dataset.i; const l = P.lines[i]; if (!l) return; seek(Math.max(0, l.t - 0.05), true); const row = $('#ln-' + i); if (row) { row.animate([{ boxShadow: '0 0 0 3px rgba(220,38,38,.45)' }, { boxShadow: '0 0 0 0 rgba(220,38,38,0)' }], { duration: 1200 }); } };
  CL.acts.nextFlag = () => { const nxt = P.flagIdx.find(i => P.lines[i].t > P.t + 0.3); CL.acts.seekLine({ dataset: { i: nxt != null ? nxt : P.flagIdx[0] } }); $('#tx').scrollIntoView({ block: 'nearest' }); };
  CL.acts.printPage = () => window.print();
  CL.acts.cdTab = el => { U.cdTab = el.dataset.t; $$('#rightcard .tabs button').forEach(b => b.classList.toggle('on', b === el)); const c = P.call; $('#tabbody').innerHTML = tabBody(U.cdTab, c, CL.analyze(c)); };

  function rerenderKeepPlayer() {
    const t = P ? P.t : 0, id = P.call.id, sp = P.speed; CL.unmount(); CL.render(); if (P) { P.speed = sp; seek(t); }
    const el = $('[data-act=speed][data-s="' + sp + '"]'); if (el) CL.acts.speed(el);
  }

  function tabBody(tab, call, an) {
    const st = CL.state, lines = CL.lines(call);
    if (tab === 'rubric') {
      const cats = CL.CATEGORIES.filter(c => an.results.some(r => r.category === c));
      return cats.map(cat => '<div class="cat-h"><span>' + cat + '</span>' + CL.scorePill(an.cats[cat]) + '</div>' + an.results.filter(r => r.category === cat).map(r => crit(call, r, lines)).join('')).join('') +
        '<p class="muted" style="font-size:12px;margin-top:14px">Rubric v1.' + st.rubricVer + ' · weights ' + an.results.reduce((s, r) => s + r.weight, 0) + ' · every AI score must quote a transcript line or it is rejected.</p>';
    }
    if (tab === 'summary') {
      const s = call.arch.summary;
      return '<div class="sum-sec"><h4>Customer intent</h4><p>' + E(s.intent) + '</p></div>' +
        '<div class="sum-sec"><h4>Outcome</h4><span class="chip brand" style="font-size:13px;padding:4px 12px">' + E(call.outcome) + '</span> <span class="sent" style="display:inline-flex;margin-left:12px">Customer sentiment: <b>' + s.sentiment[0] + '</b> ' + I('right', 13) + ' <b>' + s.sentiment[1] + '</b></span></div>' +
        '<div class="sum-sec"><h4>Objections raised</h4><ul>' + s.objections.map(o => '<li>' + E(o) + '</li>').join('') + '</ul></div>' +
        '<div class="sum-sec"><h4>Promised follow-ups</h4>' + s.followups.map((f, i) => '<label class="fu"><input type="checkbox" data-in="fu" data-k="' + call.id + ':' + i + '"' + (st.comments['fu:' + call.id + ':' + i] ? ' checked' : '') + '><span>' + E(f[0]) + '</span><span class="who">' + f[1] + '<br>' + f[2] + '</span></label>').join('') + '</div>' +
        '<div class="sum-sec"><h4>Key facts</h4><ul>' + s.facts.map(o => '<li>' + E(o) + '</li>').join('') + '</ul></div>';
    }
    if (tab === 'coaching') {
      const c = call.arch.coach, cm = st.comments[call.id] || [];
      const idx = ev => { if (!ev) return null; const n = CL.util.norm(ev.replace(/\{C\}/g, call.cFirst).replace(/\{A\}/g, call.aFirst)); const l = lines.find(x => x.sp === 'A' && CL.util.norm(x.text).includes(n)); return l ? l.i : null; };
      return '<div class="sum-sec"><h4>What went well</h4>' + (c.strengths.length ? c.strengths.map(x => '<div class="coach-i pos">' + I('check', 14) + ' ' + E(x) + '</div>').join('') : '<p class="muted">No strengths flagged on this call.</p>') + '</div>' +
        '<div class="sum-sec"><h4>Coaching points</h4>' + c.improve.map(x => { const i = idx(x.ev); return '<div class="coach-i">' + E(x.t) + (x.say ? '<div class="say">Try: ' + E(x.say) + '</div>' : '') + (i != null ? '<div style="margin-top:6px"><button class="btn sm" data-act="seekLine" data-i="' + i + '">▶ Play at ' + CL.fmt(lines[i].t) + '</button></div>' : '') + '</div>'; }).join('') + '</div>' +
        '<div class="sum-sec"><h4>Manager notes</h4>' + cm.map(x => '<div class="coach-i"><b>' + E(x.by) + '</b> <span class="muted">· ' + CL.rel(x.at) + '</span><br>' + E(x.text) + '</div>').join('') +
        '<textarea id="cnote" placeholder="Add a coaching note for ' + E(call.agent.name.split(' ')[0]) + '…"></textarea><div class="acts" style="margin-top:8px"><button class="btn" data-act="saveNote" data-id="' + call.id + '">Save note</button><button class="btn primary" data-act="shareCoach" data-id="' + call.id + '">' + I('mail', 15) + ' Send to agent</button></div></div>';
    }
    // rules layer
    const m = an.metrics, dis = an.results.find(r => r.c.rule && r.c.rule.mode === 'required'), pro = an.results.find(r => r.c.rule && r.c.rule.mode === 'prohibited');
    const chk = (ok, title, detail, i) => '<div class="chk"><span class="st ' + (ok ? 'p' : 'f') + '">' + I(ok ? 'check' : 'x', 12) + '</span><div style="flex:1"><b style="font-weight:600">' + title + '</b><div class="muted">' + detail + '</div></div>' + (i != null ? '<button class="btn sm" data-act="seekLine" data-i="' + i + '">▶ ' + CL.fmt(lines[i].t) + '</button>' : '') + '</div>';
    return '<p class="muted" style="margin-bottom:14px">Deterministic checks run on the transcript. They do not depend on the language model, so the result is the same every time.</p>' +
      '<div class="grid g-2" style="gap:10px;margin-bottom:16px"><div class="mtile"><div class="l">Talk-to-listen (agent share)</div><div class="v">' + m.share + '% <small>agent</small></div><div class="talk"><i style="width:' + m.share + '%;background:var(--agent)"></i><i style="width:' + (100 - m.share) + '%;background:var(--cust)"></i></div></div>' +
      '<div class="mtile"><div class="l">Interruptions by agent</div><div class="v">' + m.interruptions + ' <small>target ≤ 1</small></div></div>' +
      '<div class="mtile"><div class="l">Longest agent monologue</div><div class="v">' + Math.round(m.longest) + 's</div></div>' +
      '<div class="mtile"><div class="l">Dead air &gt; 4 s</div><div class="v">' + m.dead + '</div></div>' +
      '<div class="mtile"><div class="l">Agent speaking pace</div><div class="v">' + m.wpm + ' <small>words / min</small></div></div>' +
      '<div class="mtile"><div class="l">Questions asked by agent</div><div class="v">' + m.questions + '</div></div></div>' +
      chk(!!m.recording, 'Recording notice in the opening', m.recording ? 'Notice found at ' + CL.fmt(m.recording.t) + '.' : 'No recording-notice phrase in the first five agent turns.', m.recording ? m.recording.i : null) +
      (dis ? chk(!dis.failed, 'Mandatory disclosure phrase', E(dis.note), dis.ev) : '') +
      (pro ? chk(!pro.failed, 'Prohibited-phrase scan', E(pro.note), pro.ev) : '') +
      chk(m.interruptions <= 1, 'Interruptions within limit', m.interruptions + ' agent turn' + (m.interruptions === 1 ? '' : 's') + ' started over the customer.', null) +
      chk(m.share <= 68, 'Agent talk share', 'Agent spoke ' + m.share + '% of the time (guideline: under 68%).', null);
  }

  function crit(call, r, lines) {
    const l = r.ev != null ? lines[r.ev] : null, txt = l ? l.text : '';
    const score = r.type === 'passfail' ? '<span class="chip ' + (r.score ? 'sev-clear' : 'sev-high') + '">' + (r.score ? 'Pass' : 'Fail') + '</span>' : '<span class="score ' + CL.scoreBand(r.pct) + '">' + r.score + '/5</span>';
    return '<div class="crit ' + (r.failed ? 'fail' : '') + '"><div class="crit-h"><div><b>' + E(r.name) + '</b><div style="margin-top:4px;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="chip ' + (r.engine === 'Rule' ? 'rule' : 'ai') + '">' + (r.engine === 'Rule' ? 'Rule check' : r.engine === 'Hybrid' ? 'AI + rules' : 'AI judged') + '</span><span class="muted" style="font-size:12px">weight ' + r.weight + '</span>' + (r.failed ? CL.sevChip(r.sev) : '') + '</div></div><div class="r">' + score + '</div></div>' +
      '<div class="note">' + E(CL.redact(r.note || '')) + '</div>' +
      (l ? '<div class="ev" data-act="seekLine" data-i="' + l.i + '" role="button" tabindex="0"><span class="go">' + I('play', 11) + CL.fmt(l.t) + '</span><span><q>' + E(CL.redact(txt.length > 190 ? txt.slice(0, 187) + '…' : txt)) + '</q><div class="verified" style="margin-top:3px">' + I('check', 12) + ' Quote verified in transcript · ' + (l.sp === 'A' ? 'Agent' : 'Customer') + '</div></span></div>' : '<div class="ev abs"><span class="go">' + I('search', 12) + '—</span><span class="muted">' + (r.evType === 'absence' ? 'Absence check: no matching line exists to quote. Searched every agent turn.' : 'No evidence line recorded.') + '</span></div>') +
      (r.override ? '<div class="ovr"><b>Manager override</b> by ' + E(r.override.by) + ' (AI scored ' + (r.type === 'passfail' ? (r.rawScore ? 'Pass' : 'Fail') : r.rawScore + '/5') + '): “' + E(r.override.comment) + '” <button class="btn sm ghost" data-act="revertOverride" data-id="' + call.id + '" data-c="' + r.id + '">Revert</button></div>' : '') +
      '<div class="tools no-print"><button class="btn sm ghost" data-act="override" data-id="' + call.id + '" data-c="' + r.id + '">' + I('edit', 13) + ' Override score</button></div></div>';
  }

  CL.ins.fu = el => { CL.state.comments['fu:' + el.dataset.k] = el.checked; CL.save(); };
  CL.acts.saveNote = el => {
    const v = $('#cnote').value.trim(); if (!v) return CL.toast('Write a note first.', 'err');
    const k = el.dataset.id; (CL.state.comments[k] = CL.state.comments[k] || []).push({ by: CL.USER.name, at: Date.now(), text: v });
    CL.log('Added coaching note on ' + k); CL.save(); $('#tabbody').innerHTML = tabBody('coaching', P.call, CL.analyze(P.call)); CL.toast('Note saved.');
  };
  CL.acts.shareCoach = el => {
    const c = P.call, v = $('#cnote').value.trim(); if (v) CL.acts.saveNote(el);
    CL.log('Sent coaching feedback for ' + c.id + ' to ' + c.agent.name); CL.save(); CL.toast('Coaching feedback sent to ' + E(c.agent.name) + '.');
  };
  CL.acts.markReviewed = el => {
    const id = el.dataset.id, c = CL.call(id), was = CL.state.reviewed[id] || c.preReviewed;
    if (was) { delete CL.state.reviewed[id]; c.preReviewed = false; CL.toast('Review mark removed.'); } else { CL.state.reviewed[id] = { by: CL.USER.name, at: Date.now() }; CL.toast('Marked as reviewed. Logged in the audit trail.'); CL.log('Reviewed ' + id); }
    CL.save(); rerenderKeepPlayer();
  };
  CL.acts.override = function (el) {
    const call = CL.call(el.dataset.id), r = CL.analyze(call).results.find(x => x.id === el.dataset.c);
    const opts = r.type === 'passfail' ? [[1, 'Pass'], [0, 'Fail']] : [1, 2, 3, 4, 5].map(n => [n, n + ' / 5']);
    CL.modal({
      title: 'Override score', body: '<p class="muted" style="margin-bottom:14px">' + E(r.name) + '. The original AI result is kept in the audit trail.</p><div class="field"><label class="f">New score</label><select id="ovs">' + opts.map(o => '<option value="' + o[0] + '"' + (o[0] === r.score ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div><div class="field"><label class="f">Reason (required)</label><textarea id="ovc" placeholder="e.g. Agent corrected the figure two turns later."></textarea></div>',
      foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="saveOverride" data-id="' + call.id + '" data-c="' + r.id + '">Save override</button>'
    });
  };
  CL.acts.saveOverride = el => {
    const c = $('#ovc').value.trim(); if (!c) return CL.toast('Add a reason for the override.', 'err');
    const id = el.dataset.id; (CL.state.overrides[id] = CL.state.overrides[id] || {})[el.dataset.c] = { score: +$('#ovs').value, comment: c, by: CL.USER.name, at: Date.now() };
    CL.log('Overrode ' + el.dataset.c + ' on ' + id); CL.save(); CL.closeModal(); rerenderKeepPlayer(); CL.toast('Override saved. Score recalculated.');
  };
  CL.acts.revertOverride = el => { delete CL.state.overrides[el.dataset.id][el.dataset.c]; CL.save(); rerenderKeepPlayer(); CL.toast('Override reverted.'); };

  CL.acts.editLine = function (el, e) {
    e.stopPropagation(); const i = +el.dataset.i, l = P.lines[i], row = $('#ln-' + i), body = row.children[2];
    body.innerHTML = '<textarea id="edtx" aria-label="Corrected transcript line">' + E(l.text) + '</textarea><div class="acts" style="margin-top:8px"><button class="btn sm primary" data-act="saveLine" data-i="' + i + '">Save correction</button><button class="btn sm" data-act="cancelLine">Cancel</button></div><div class="hint">Corrections re-run the rules layer immediately.</div>';
    row.removeAttribute('data-act'); $('#edtx').focus();
  };
  CL.acts.cancelLine = (el, e) => { e.stopPropagation(); rerenderKeepPlayer(); };
  CL.acts.saveLine = function (el, e) {
    e.stopPropagation(); const i = +el.dataset.i, v = $('#edtx').value.trim(); if (!v) return;
    const c = P.call, before = CL.analyze(c).overall; (CL.state.lineEdits[c.id] = CL.state.lineEdits[c.id] || {})[i] = v;
    CL.log('Corrected transcript line ' + (i + 1) + ' on ' + c.id); CL.save(); const after = CL.analyze(c).overall; rerenderKeepPlayer();
    CL.toast('Transcript corrected. Rules re-run' + (after !== before ? ': score ' + before + ' → ' + after + '.' : '.'));
  };

  CL.acts.escalate = function (el) {
    const call = CL.call(el.dataset.id), an = CL.analyze(call), f = an.flags[0], l = f.ev != null ? CL.lines(call)[f.ev] : null, s = CL.state.settings;
    CL.modal({
      title: 'Escalate to manager', cls: 'wide', body: '<div class="grid g-2"><div><div class="field"><label class="f">Send to</label><div class="acts"><label class="chip" style="padding:6px 12px"><input type="checkbox" id="esl" ' + (s.slack ? 'checked' : '') + '> Slack ' + E(s.slackChannel) + '</label><label class="chip" style="padding:6px 12px"><input type="checkbox" id="eem" ' + (s.email ? 'checked' : '') + '> Email ' + s.emails.length + ' recipients</label></div></div>' +
        '<div class="field"><label class="f">Note for the manager (optional)</label><textarea id="esn" placeholder="Context, e.g. repeat issue for this agent."></textarea></div></div>' +
        '<div><label class="f">Slack preview</label>' + slackCard(call, an, f, l) + '</div></div>',
      foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="sendEscalation" data-id="' + call.id + '">Send escalation</button>'
    });
  };
  function slackCard(call, an, f, l) {
    return '<div class="slack"><div class="hd"><div class="ap">' + I('logo', 20) + '</div><div><b>CallLens</b> <span style="color:#868686;font-size:12px">APP · now</span></div></div>' +
      '<div>🚨 <b>' + an.risk + '-severity call flagged</b> · ' + E(call.agent.name) + ' · <span class="mono">' + call.id + '</span></div><div class="bd"><div><b>' + E(f.title) + '</b> · score ' + an.overall + '/100</div>' +
      (l ? '<div style="color:#444;margin-top:4px;font-style:italic">' + CL.fmt(l.t) + ' — “' + E(CL.redact(l.text.length > 140 ? l.text.slice(0, 137) + '…' : l.text)) + '”</div>' : '<div style="color:#444;margin-top:4px">' + E(f.note) + '</div>') + '</div>' +
      '<span class="bt p">Open call at ' + (l ? CL.fmt(l.t) : '00:00') + '</span><span class="bt">Acknowledge</span><span class="bt">Escalate to Compliance</span></div>';
  }
  CL.slackCard = slackCard;
  CL.acts.sendEscalation = el => {
    const id = el.dataset.id, s = CL.state.settings, to = [$('#esl').checked && s.slackChannel, $('#eem').checked && 'email'].filter(Boolean);
    if (!to.length) return CL.toast('Choose at least one channel.', 'err');
    CL.state.alertStatus[id] = { status: 'Escalated', by: CL.USER.name, at: Date.now(), note: $('#esn').value.trim() };
    CL.log('Escalated ' + id + ' to ' + to.join(' + ')); CL.save(); CL.closeModal(); CL.toast('Escalation sent to ' + to.join(' and ') + '.'); rerenderKeepPlayer();
  };
})();
