(function () {
  const MF = window.MF, U = MF.U, I = MF.icon, UI = MF.ui, calc = MF.calc;
  const st = (UI.st.campaigns = { q: '', status: 'All', sort: 'start', dir: -1, page: 1 });
  const SIZE = 8;
  const GET = { name: (c) => c.name.toLowerCase(), status: (c) => MF.STATUSES.indexOf(c.status), budget: (c) => c.budget, start: (c) => c.start, leads: (c) => calc.campaign(c).leads, revenue: (c) => calc.campaign(c).revenue, roi: (c) => calc.campaign(c).roi };

  function rows() {
    let a = MF.state().campaigns.filter((c) => (st.status === 'All' || c.status === st.status) && (!st.q || (c.name + c.audience + c.owner).toLowerCase().includes(st.q)));
    return UI.sortBy(a, st, GET);
  }
  function tableHtml() {
    const all = rows(), pg = UI.page(all, st, SIZE);
    if (!all.length) return UI.empty('search', 'No campaigns match', 'Try a different filter or create a new campaign.');
    return `<div class="tbl-w"><table class="tbl hover"><thead><tr>${UI.th('campaigns', 'name', 'Campaign', st)}${UI.th('campaigns', 'status', 'Status', st)}<th>Channels</th>${UI.th('campaigns', 'budget', 'Budget', st)}${UI.th('campaigns', 'start', 'Duration', st)}${UI.th('campaigns', 'leads', 'Leads', st)}${UI.th('campaigns', 'revenue', 'Revenue', st)}${UI.th('campaigns', 'roi', 'ROI', st)}</tr></thead><tbody>
      ${pg.map((c) => { const m = calc.campaign(c); return `<tr data-action="openCampaign" data-id="${c.id}" tabindex="0"><td><b>${U.esc(c.name)}</b><small class="block muted">${U.esc(c.objective)} · ${U.esc(c.owner)}</small></td><td>${UI.badge(c.status)}</td><td><div class="dots">${c.channels.map((h) => `<i title="${h}" style="background:${MF.CH_COLOR[h]}"></i>`).join('')}</div></td><td>${U.moneyK(c.budget)}<div class="bar sm"><i style="width:${U.clamp((m.spend / c.budget) * 100, 0, 100)}%"></i></div></td><td class="nw">${U.fmtDate(c.start)} → ${U.fmtDate(c.end)}</td><td>${m.leads}</td><td>${m.revenue ? U.moneyK(m.revenue) : '—'}</td><td>${m.spend ? `<span class="${m.roi >= 0 ? 'pos' : 'neg'}">${U.pct(m.roi, 0)}</span>` : '—'}</td></tr>`; }).join('')}</tbody></table></div>${UI.pager('campaigns', all.length, st.page, SIZE)}`;
  }
  MF.handlers.campQ = U.debounce((el) => { st.q = el.value.toLowerCase(); st.page = 1; MF.views.campaigns.table(); }, 120);
  MF.actions.campStatus = (el) => { st.status = el.dataset.s; st.page = 1; MF.rerender(); };

  function form(c) {
    const edit = !!c, t = U.today(), d = c || { name: '', objective: 'Lead generation', audience: '', channels: ['Instagram', 'Email'], budget: 20000, start: U.addDays(t, 7), end: U.addDays(t, 37), tone: 'Professional', brief: '', topic: '' };
    UI.modal({
      title: edit ? 'Edit campaign' : 'Create campaign', size: 'lg', noFocus: false,
      body: `<form id="cf" class="form" novalidate>
        <label class="f full">Campaign name<input name="name" value="${U.esc(d.name)}" placeholder="e.g. Summer Launch 2026" required></label>
        <label class="f full">Campaign brief<textarea name="brief" rows="3" placeholder="What are we trying to achieve and what's the key message?">${U.esc(d.brief)}</textarea></label>
        <label class="f">Objective<select name="objective">${Object.keys(MF.OBJECTIVES).map((o) => `<option ${o === d.objective ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        <label class="f">Tone of voice<select name="tone">${Object.keys(MF.TONES).map((o) => `<option ${o === d.tone ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        <label class="f full">Target audience<input name="audience" value="${U.esc(d.audience)}" placeholder="e.g. Marketing leaders at mid-size SaaS companies" required></label>
        <fieldset class="f full"><legend>Marketing channels</legend><div class="chips">${MF.CHANNELS.map((ch) => `<label class="chip-c" style="--c:${MF.CH_COLOR[ch]}"><input type="checkbox" name="ch" value="${ch}" ${d.channels.includes(ch) ? 'checked' : ''}><span>${ch}</span></label>`).join('')}</div></fieldset>
        <label class="f">Budget (USD)<input type="number" name="budget" min="100" step="100" value="${d.budget}" required></label>
        <div class="f dur"><label>Start<input type="date" name="start" value="${d.start}" required></label><label>End<input type="date" name="end" value="${d.end}" required></label></div>
        ${edit ? '' : '<label class="f full check"><input type="checkbox" name="gen" checked> Generate simulated content for each selected channel</label>'}
        <p class="err" id="cferr" role="alert"></p></form>`,
      buttons: [{ label: 'Cancel', cls: 'ghost' }, {
        label: edit ? 'Save changes' : 'Create campaign', cls: 'primary', onClick(m) {
          const f = m.el.querySelector('#cf'), fd = new FormData(f), v = Object.fromEntries(fd), chs = fd.getAll('ch'), err = m.el.querySelector('#cferr');
          const bad = !v.name.trim() ? 'Please name your campaign.' : !v.audience.trim() ? 'Describe the target audience.' : !chs.length ? 'Select at least one channel.' : !(+v.budget > 0) ? 'Enter a budget above zero.' : !v.start || !v.end || v.end < v.start ? 'End date must be after the start date.' : '';
          if (bad) { err.textContent = bad; return false; }
          const data = { name: v.name.trim(), brief: v.brief.trim() || `Drive ${v.objective.toLowerCase()} for ${v.audience.toLowerCase()}.`, objective: v.objective, tone: v.tone, audience: v.audience.trim(), channels: chs, budget: +v.budget, start: v.start, end: v.end, topic: v.name.trim() };
          if (edit) { MF.api.updateCampaign(c.id, data); UI.toast('Campaign updated'); return; }
          const btn = m.el.querySelector('[data-b="1"]'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Generating content…';
          setTimeout(() => { const nc = MF.api.createCampaign(data, !!v.gen); m.close(); UI.toast(`Campaign "${U.esc(nc.name)}" created${v.gen ? ' with ' + chs.length + ' content drafts' : ''}`); MF.views.campaigns.open(nc.id); }, v.gen ? 1100 : 300);
          return false;
        },
      }],
    });
  }

  function detail(id) {
    const c = MF.get.campaign(id); if (!c) return;
    const m = calc.campaign(c), items = MF.state().content.filter((x) => x.campaignId === id), leads = calc.leadsOf(id).sort((a, b) => b.score - a.score);
    const idx = MF.STATUSES.indexOf(c.status), pc = U.clamp((m.spend / c.budget) * 100, 0, 100);
    const html = () => `
      <div class="stepper">${MF.STATUSES.map((s, i) => `<div class="step ${i < idx ? 'done' : i === idx ? 'now' : ''}"><i>${i < idx ? I('check', 12) : i + 1}</i><span>${s}</span></div>`).join('')}</div>
      <p class="brief">${U.esc(c.brief)}</p>
      <div class="kv"><div><small>Audience</small><b>${U.esc(c.audience)}</b></div><div><small>Objective</small><b>${U.esc(c.objective)}</b></div><div><small>Dates</small><b>${U.fmtDateY(c.start)} → ${U.fmtDateY(c.end)}</b></div><div><small>Owner</small><b>${U.esc(c.owner)}</b></div></div>
      <div class="mgrid"><div><small>Spend</small><b>${U.moneyK(m.spend)}</b></div><div><small>Revenue</small><b>${U.moneyK(m.revenue)}</b></div><div><small>Leads</small><b>${m.leads}</b></div><div><small>ROI</small><b class="${m.roi >= 0 ? 'pos' : 'neg'}">${m.spend ? U.pct(m.roi, 0) : '—'}</b></div><div><small>Impressions</small><b>${U.numK(m.impressions)}</b></div><div><small>CTR</small><b>${U.pct(m.ctr, 2)}</b></div></div>
      <div class="bud"><div class="between"><small>Budget used</small><b>${U.money(m.spend)} / ${U.money(c.budget)}</b></div><div class="bar"><i style="width:${pc}%"></i></div></div>
      <h4 class="sec">Channels</h4><div class="row wrap">${c.channels.map((h) => UI.chBadge(h)).join('')}</div>
      <h4 class="sec between">Content <span class="row"><a class="btn ghost sm" href="#/studio?campaign=${c.id}">${I('sparkles', 14)} Open in Studio</a><button class="btn ghost sm" id="gen">${I('refresh', 14)} Generate missing</button></span></h4>
      ${items.length ? `<ul class="clist">${items.map((x) => `<li><a href="#/studio?open=${x.id}">${UI.chBadge(x.channel)}<span class="t">${U.esc(x.headline)}</span></a>${UI.badge(x.status)}<small class="muted">${x.scheduledAt ? U.fmtDate(x.scheduledAt) : ''}</small></li>`).join('')}</ul>` : '<p class="muted">No content yet.</p>'}
      <h4 class="sec">Top leads (${leads.length})</h4>
      ${leads.length ? `<ul class="clist">${leads.slice(0, 5).map((l) => `<li><button class="lnk" data-lead="${l.id}">${UI.avatar(l.name)} ${U.esc(l.name)} <small class="muted">${U.esc(l.company)}</small></button>${UI.score(l.score)}${UI.badge(l.status)}</li>`).join('')}</ul>` : '<p class="muted">No leads captured yet.</p>'}`;
    const next = MF.STATUSES[idx + 1], prev = MF.STATUSES[idx - 1];
    const d = UI.drawer({
      title: U.esc(c.name) + ' ' + UI.badge(c.status), body: html(),
      buttons: [{ label: I('trash', 15) + ' Delete', cls: 'danger ghost', close: false, onClick: async () => { if (await UI.confirm({ title: 'Delete campaign?', message: `"${U.esc(c.name)}", its content and lead links will be removed.`, confirm: 'Delete', danger: true })) { d.close(); MF.api.deleteCampaign(id); UI.toast('Campaign deleted'); } return false; } },
        { label: I('edit', 15) + ' Edit', cls: 'ghost', close: false, onClick: () => { d.close(); form(c); return false; } },
        ...(prev ? [{ label: '← ' + prev, cls: 'ghost', close: false, onClick: () => { MF.api.setStatus(id, prev); d.close(); detail(id); return false; } }] : []),
        ...(next ? [{ label: next + ' →', cls: 'primary', close: false, onClick: () => { MF.api.setStatus(id, next); UI.toast(`Moved to ${next}`); d.close(); detail(id); return false; } }] : [])],
      onMount(dr) {
        dr.el.querySelector('#gen').onclick = () => { const n = MF.api.generateForCampaign(id); UI.toast(n ? `Generated ${n} draft(s)` : 'All channels already have content', n ? 'success' : 'info'); d.close(); detail(id); };
        dr.el.querySelectorAll('[data-lead]').forEach((b) => (b.onclick = () => { d.close(); MF.views.leads.open(b.dataset.lead); }));
        dr.el.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => d.close()));
      },
    });
  }

  MF.views.campaigns = {
    form, open: detail,
    table() { const w = document.getElementById('tbl-campaigns'); if (w) w.innerHTML = tableHtml(); },
    render() {
      const s = MF.state().campaigns, cnt = (x) => s.filter((c) => c.status === x).length;
      return `<div class="page-h"><div><h1>Campaign Manager</h1><p class="muted">Plan, launch and track campaigns across every channel.</p></div><button class="btn primary" data-action="newCampaign">${I('plus', 16)} New campaign</button></div>
      <div class="pipe">${['All', ...MF.STATUSES].map((x) => `<button class="pipe-i ${st.status === x ? 'on' : ''}" data-action="campStatus" data-s="${x}"><b>${x === 'All' ? s.length : cnt(x)}</b><span>${x}</span></button>`).join('')}</div>
      <section class="card"><div class="toolbar"><div class="search">${I('search', 16)}<input data-bind="campQ" value="${U.esc(st.q)}" placeholder="Search campaigns, audience or owner…" aria-label="Search campaigns"></div></div><div id="tbl-campaigns">${tableHtml()}</div></section>`;
    },
    mount(root, p) { if (p.open) detail(p.open); root.querySelectorAll('tr[data-action]').forEach((r) => r.addEventListener('keydown', (e) => { if (e.key === 'Enter') r.click(); })); },
  };
})();
