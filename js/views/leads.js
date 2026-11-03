(function () {
  const MF = window.MF, U = MF.U, I = MF.icon, UI = MF.ui;
  const st = (UI.st.leads = { q: '', seg: 'All', status: 'All', source: 'All', rep: 'All', sort: 'ts', dir: -1, page: 1 });
  const SIZE = 10, SEGR = { Hot: 3, Warm: 2, Cold: 1 };
  const GET = { name: (l) => l.name.toLowerCase(), score: (l) => l.score, status: (l) => MF.LEAD_STATUSES.indexOf(l.status), ts: (l) => l.ts, source: (l) => l.source, value: (l) => l.value, rep: (l) => (l.rep ? MF.get.rep(l.rep).name : 'zzz') };
  function rows() {
    return UI.sortBy(MF.state().leads.filter((l) => (st.seg === 'All' || MF.segment(l.score) === st.seg) && (st.status === 'All' || l.status === st.status) && (st.source === 'All' || l.source === st.source) && (st.rep === 'All' || (st.rep === 'none' ? !l.rep : l.rep === st.rep)) && (!st.q || (l.name + l.email + l.company).toLowerCase().includes(st.q))), st, GET);
  }
  function tableHtml() {
    const all = rows(), pg = UI.page(all, st, SIZE);
    if (!all.length) return UI.empty('users', 'No leads match your filters', 'Clear a filter or capture a new lead.');
    return `<div class="tbl-w"><table class="tbl hover"><thead><tr>${UI.th('leads', 'name', 'Lead', st)}${UI.th('leads', 'score', 'Score', st)}${UI.th('leads', 'source', 'Source & campaign', st)}${UI.th('leads', 'status', 'Status', st)}${UI.th('leads', 'rep', 'Owner', st)}${UI.th('leads', 'value', 'Deal value', st)}${UI.th('leads', 'ts', 'Captured', st)}</tr></thead><tbody>
      ${pg.map((l) => { const c = MF.get.campaign(l.campaignId), r = l.rep && MF.get.rep(l.rep); return `<tr data-action="openLead" data-id="${l.id}" tabindex="0"><td><div class="who">${UI.avatar(l.name)}<div><b>${U.esc(l.name)}</b><small class="block muted">${U.esc(l.title)}, ${U.esc(l.company)}</small></div></div></td><td>${UI.score(l.score)}</td><td>${UI.chBadge(l.source)}<small class="block muted">${c ? U.esc(c.name) : '—'}</small></td><td>${UI.badge(l.status)}</td><td>${r ? U.esc(r.name) : '<span class="muted">Unassigned</span>'}</td><td>${U.money(l.value)}</td><td class="nw">${U.ago(l.ts)}</td></tr>`; }).join('')}</tbody></table></div>${UI.pager('leads', all.length, st.page, SIZE)}`;
  }
  MF.handlers.leadQ = U.debounce((el) => { st.q = el.value.toLowerCase(); st.page = 1; MF.views.leads.table(); }, 120);
  MF.handlers.leadF = (el) => { st[el.name] = el.value; st.page = 1; MF.rerender(); };
  MF.actions.leadSeg = (el) => { st.seg = st.seg === el.dataset.s ? 'All' : el.dataset.s; st.page = 1; MF.rerender(); };
  MF.actions.leadCapture = (el) => {
    el.disabled = true; const done = UI.loadingBar();
    setTimeout(() => { const { lead, res } = MF.api.captureLead({ source: el.dataset.src }); done(); UI.toast(`${UI.badge(MF.segment(lead.score))} lead <b>${U.esc(lead.name)}</b> captured from ${lead.source}${res.length ? ` — ${res.length} workflow${res.length > 1 ? 's' : ''} ran` : ''}`, 'info', 4200); }, 600);
  };
  MF.actions.leadExport = () => { const r = rows(); U.download('marketflow-leads.csv', U.csv([['Name', 'Email', 'Company', 'Title', 'Source', 'Campaign', 'Score', 'Segment', 'Status', 'Owner', 'Value'], ...r.map((l) => [l.name, l.email, l.company, l.title, l.source, (MF.get.campaign(l.campaignId) || {}).name || '', l.score, MF.segment(l.score), l.status, l.rep ? MF.get.rep(l.rep).name : '', l.value])]), 'text/csv'); UI.toast(`Exported ${r.length} leads`); };

  const ICO = { capture: 'userPlus', email: 'mail', status: 'flag', assign: 'users', workflow: 'zap', note: 'message', call: 'activity', visit: 'eye' };
  function open(id) {
    const body = () => {
      const l = MF.get.lead(id), c = MF.get.campaign(l.campaignId), seg = MF.segment(l.score);
      return `<div class="lead-h">${UI.avatar(l.name)}<div><h3>${U.esc(l.name)}</h3><p class="muted">${U.esc(l.title)} · ${U.esc(l.company)}</p><p class="sm"><a href="mailto:${U.esc(l.email)}">${U.esc(l.email)}</a> · ${U.esc(l.phone)}</p></div>${UI.score(l.score)}</div>
      <div class="kv"><div><small>Source</small><b>${UI.chBadge(l.source)}</b></div><div><small>Campaign</small><b>${c ? `<button class="lnk" id="lc">${U.esc(c.name)}</button>` : '—'}</b></div><div><small>Company size</small><b>${U.num(l.size)} employees</b></div><div><small>Deal value</small><b>${U.money(l.value)}</b></div></div>
      <div class="scorebar"><div class="between"><small>Lead score (engagement ${l.engagement}/40)</small><b>${l.score}/100 · ${seg}</b></div><div class="bar tall"><i class="${seg.toLowerCase()}" style="width:${l.score}%"></i></div></div>
      <div class="form"><label class="f">Status<select id="ls">${MF.LEAD_STATUSES.map((s) => `<option ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <label class="f">Assigned to<select id="lr"><option value="">Unassigned</option>${MF.REPS.map((r) => `<option value="${r.id}" ${r.id === l.rep ? 'selected' : ''}>${r.name} · ${r.region}</option>`).join('')}</select></label></div>
      <div class="row wrap mt"><button class="btn sm" id="le">${I('mail', 14)} Send email</button><button class="btn sm ghost" id="lcall">${I('activity', 14)} Log call</button></div>
      <h4 class="sec">Add note</h4><div class="row"><input id="ln" class="grow" placeholder="Write a note…" aria-label="Note"><button class="btn primary sm" id="lna">Add</button></div>
      <h4 class="sec">Interaction history</h4><ul class="tl">${[...l.interactions].sort((a, b) => b.at - a.at).map((x) => `<li><span class="ti">${I(ICO[x.type] || 'bell', 13)}</span><div>${U.esc(x.text)}<small>${U.fmtTs(x.at)}</small></div></li>`).join('')}</ul>`;
    };
    let d; d = UI.drawer({ title: 'Lead profile', body: body(), onMount(dr) { d = dr; bind(); } });
    function bind() {
      const q = (s) => d.el.querySelector(s), re = () => { d.body.innerHTML = body(); bind(); };
      q('#ls').onchange = (e) => { MF.api.updateLead(id, { status: e.target.value }); UI.toast(`Status updated to ${e.target.value}` + (e.target.value === 'Won' ? ' — revenue attributed to campaign' : '')); re(); };
      q('#lr').onchange = (e) => { MF.api.assignLead(id, e.target.value); UI.toast(e.target.value ? 'Assigned to ' + MF.get.rep(e.target.value).name : 'Unassigned', 'info'); re(); };
      q('#le').onclick = () => { MF.api.addInteraction(id, 'email', 'Email sent: "Following up on your interest"'); UI.toast('Email sent'); re(); };
      q('#lcall').onclick = () => { MF.api.addInteraction(id, 'call', 'Discovery call logged (12 min)'); UI.toast('Call logged'); re(); };
      q('#lna').onclick = () => { const v = q('#ln').value.trim(); if (!v) return; MF.api.addInteraction(id, 'note', v); UI.toast('Note added'); re(); };
      q('#ln').onkeydown = (e) => { if (e.key === 'Enter') q('#lna').click(); };
      const lc = q('#lc'); if (lc) lc.onclick = () => { d.close(); MF.views.campaigns.open(MF.get.lead(id).campaignId); };
    }
  }

  MF.views.leads = {
    open, table() { const w = document.getElementById('tbl-leads'); if (w) w.innerHTML = tableHtml(); },
    render() {
      const s = MF.state().leads, n = (k) => s.filter((l) => MF.segment(l.score) === k).length, sel = (name, opts, v) => `<label class="sel"><span class="sr">${name}</span><select name="${name}" data-bind="leadF:change">${opts.map((o) => `<option value="${o[0]}" ${o[0] === v ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>`;
      return `<div class="page-h"><div><h1>Leads & CRM</h1><p class="muted">Every lead is attributed to its campaign and scored automatically.</p></div>
        <div class="row"><button class="btn ghost" data-action="leadExport">${I('download', 15)} Export</button><div class="split"><button class="btn primary" data-action="leadCapture">${I('userPlus', 15)} Capture lead</button></div></div></div>
      <div class="grid seg3">${['Hot', 'Warm', 'Cold'].map((k) => `<button class="card seg-c ${k.toLowerCase()} ${st.seg === k ? 'on' : ''}" data-action="leadSeg" data-s="${k}"><span>${k} leads</span><b>${n(k)}</b><small>${k === 'Hot' ? `Score ≥ ${MF.THRESH.hot}` : k === 'Warm' ? `${MF.THRESH.warm}–${MF.THRESH.hot - 1}` : `< ${MF.THRESH.warm}`} · ${U.pct((n(k) / (s.length || 1)) * 100, 0)}</small></button>`).join('')}
        <div class="card seg-c plain"><span>Total pipeline</span><b>${U.moneyK(s.filter((l) => !['Won', 'Lost'].includes(l.status)).reduce((a, l) => a + l.value, 0))}</b><small>${s.filter((l) => l.status === 'Won').length} won · ${s.filter((l) => l.status === 'New').length} new</small></div></div>
      <section class="card"><div class="toolbar"><div class="search">${I('search', 16)}<input data-bind="leadQ" value="${U.esc(st.q)}" placeholder="Search name, company or email…" aria-label="Search leads"></div>
        ${sel('status', [['All', 'All statuses'], ...MF.LEAD_STATUSES.map((x) => [x, x])], st.status)}${sel('source', [['All', 'All sources'], ...MF.CHANNELS.map((x) => [x, x])], st.source)}${sel('rep', [['All', 'All owners'], ['none', 'Unassigned'], ...MF.REPS.map((r) => [r.id, r.name])], st.rep)}</div><div id="tbl-leads">${tableHtml()}</div></section>`;
    },
    mount(root, p) { if (p.open && MF.get.lead(p.open)) open(p.open); root.querySelectorAll('tr[data-action]').forEach((r) => r.addEventListener('keydown', (e) => { if (e.key === 'Enter') r.click(); })); },
  };
})();
