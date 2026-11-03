(function () {
  const MF = window.MF, U = MF.U, I = MF.icon, UI = MF.ui;
  const st = (UI.st.studio = { sel: null, camp: 'all', draft: null, ideas: null, brief: { campaignId: '', topic: '', tone: 'Professional', channels: [] } });
  const editable = (it) => ['Draft', 'Revision', 'Rejected'].includes(it.status);
  const briefOf = (id) => { const c = MF.get.campaign(id) || {}; return { name: c.name || st.brief.topic || 'New campaign', audience: c.audience || 'modern marketing teams', objective: c.objective || 'Awareness', tone: st.brief.tone, topic: st.brief.topic || c.topic || c.name }; };

  function select(id) { const it = MF.get.content(id); st.sel = id; st.draft = it ? { headline: it.headline, body: it.body, cta: it.cta, hashtags: it.hashtags || '', channel: it.channel, scheduledAt: it.scheduledAt } : null; st.ideas = null; }
  function dirty() { const it = MF.get.content(st.sel); return it && st.draft && ['headline', 'body', 'cta', 'hashtags', 'channel'].some((k) => (it[k] || '') !== (st.draft[k] || '')); }
  function preview() { const it = MF.get.content(st.sel); return it ? UI.preview(Object.assign({}, it, st.draft)) : ''; }
  function list() {
    const items = MF.state().content.filter((x) => st.camp === 'all' || x.campaignId === st.camp);
    if (!items.length) return UI.empty('file', 'No content yet', 'Generate your first piece above.');
    return items.slice(0, 40).map((x) => `<button class="lib ${x.id === st.sel ? 'on' : ''}" data-action="studioSel" data-id="${x.id}">${UI.chBadge(x.channel)}<span class="t">${U.esc(x.headline)}</span>${UI.badge(x.status)}</button>`).join('');
  }
  MF.actions.studioSel = (el) => { select(el.dataset.id); MF.rerender(); };
  MF.handlers.studioCamp = (el) => { st.camp = el.value; if (el.value !== 'all') { st.brief.campaignId = el.value; const c = MF.get.campaign(el.value); st.brief.channels = [...c.channels]; st.brief.topic = c.topic || c.name; st.brief.tone = c.tone || 'Professional'; } MF.rerender(); };
  MF.handlers.studioBrief = (el) => { st.brief[el.name] = el.value; };
  MF.handlers.studioChan = (el) => { const s = new Set(st.brief.channels); el.checked ? s.add(el.value) : s.delete(el.value); st.brief.channels = [...s]; };
  MF.handlers.studioField = (el) => {
    if (!st.draft) return; st.draft[el.name] = el.value; const p = document.getElementById('pv'); if (p) p.innerHTML = preview();
    const c = document.getElementById('cc-' + el.name); if (c) c.textContent = el.value.length;
    const sv = document.getElementById('st-save'); if (sv) sv.disabled = !dirty();
  };
  Object.assign(MF.actions, {
    studioGen(el) {
      const b = st.brief; if (!b.channels.length) return UI.toast('Select at least one channel', 'error');
      el.disabled = true; el.innerHTML = '<span class="spin"></span> Writing…';
      const area = document.getElementById('pv'); if (area) area.classList.add('shimmer');
      setTimeout(() => {
        let first = null;
        b.channels.forEach((ch) => { const g = MF.gen(ch, briefOf(b.campaignId)); const it = MF.api.addContent(Object.assign({ campaignId: b.campaignId || null, channel: ch }, g)); first = first || it; });
        select(first.id); UI.toast(`Generated ${b.channels.length} variation${b.channels.length > 1 ? 's' : ''} — review and edit below`); MF.rerender();
      }, 1000);
    },
    studioIdeas() { const b = briefOf(st.brief.campaignId); st.ideas = { h: MF.headlines(b, 5), d: MF.descriptions(b, 2) }; document.getElementById('ideas').innerHTML = ideas(); },
    studioApply(el) {
      if (!st.draft) return UI.toast('Select a content item to apply this to', 'info');
      st.draft[el.dataset.f] = st.ideas[el.dataset.f === 'headline' ? 'h' : 'd'][+el.dataset.i]; const it = MF.get.content(st.sel);
      if (!editable(it)) return UI.toast('Recall this item to draft before editing', 'info'); MF.rerender();
    },
    studioSave() { const it = MF.get.content(st.sel), d = st.draft; MF.api.saveContent(it.id, { headline: d.headline.trim() || it.headline, body: d.body, cta: d.cta, hashtags: d.hashtags, channel: d.channel }); select(it.id); UI.toast('Changes saved'); },
    studioRegen() {
      const it = MF.get.content(st.sel), c = MF.get.campaign(it.campaignId), b = c ? briefOf(c.id) : { name: it.headline, audience: 'modern teams', objective: 'Awareness', tone: st.brief.tone, topic: it.headline };
      const g = MF.gen(st.draft.channel, b); Object.assign(st.draft, g); MF.rerender(); UI.toast('New variation generated — save to keep it', 'info');
    },
    studioSend() {
      if (dirty()) MF.actions.studioSave();
      const it = MF.get.content(st.sel); if (MF.api.submit([it.id])) { UI.toast('Sent to the Approval Center'); select(it.id); }
    },
    studioRecall() { const it = MF.get.content(st.sel); MF.api.saveContent(it.id, { status: 'Draft' }); it.history.push({ action: 'recalled', by: MF.ME.name, at: Date.now(), note: '' }); select(it.id); UI.toast('Recalled to draft', 'info'); },
    async studioDel() { if (await UI.confirm({ title: 'Delete content?', message: 'This cannot be undone.', confirm: 'Delete', danger: true })) { MF.api.deleteContent(st.sel); st.sel = null; st.draft = null; UI.toast('Content deleted'); } },
    studioDup() { const it = MF.get.content(st.sel); const n = MF.api.addContent({ campaignId: it.campaignId, channel: it.channel, headline: it.headline + ' (B)', body: it.body, cta: it.cta, hashtags: it.hashtags }); select(n.id); UI.toast('Variation created'); MF.rerender(); },
    studioNew() { st.sel = null; st.draft = null; MF.rerender(); },
  });
  const ideas = () => st.ideas ? `<div class="ideas"><b>Headlines</b>${st.ideas.h.map((h, i) => `<button class="idea" data-action="studioApply" data-f="headline" data-i="${i}">${U.esc(h)}</button>`).join('')}<b>Descriptions</b>${st.ideas.d.map((h, i) => `<button class="idea" data-action="studioApply" data-f="body" data-i="${i}">${U.esc(h)}</button>`).join('')}</div>` : '';

  function editor() {
    const it = MF.get.content(st.sel); if (!it) return `<div class="card">${UI.empty('sparkles', 'Select or generate content', 'Pick an item from the library or generate new variations with the brief on the left.')}</div>`;
    const d = st.draft, ro = !editable(it) ? 'readonly' : '', lastFb = [...it.history].reverse().find((h) => ['revision', 'rejected'].includes(h.action));
    const c = MF.get.campaign(it.campaignId);
    return `<div class="card">
      <div class="card-h"><h3>Edit content</h3><div class="row">${UI.badge(it.status)}${it.scheduledAt ? `<span class="muted sm">${I('clock', 13)} ${U.fmtDT(it.scheduledAt)}</span>` : ''}</div></div>
      ${lastFb && ['Revision', 'Rejected'].includes(it.status) ? `<div class="banner ${it.status === 'Rejected' ? 'red' : 'orange'}">${I('message', 16)}<div><b>${lastFb.by} ${lastFb.action === 'rejected' ? 'rejected this' : 'requested changes'}:</b> ${U.esc(lastFb.note)}</div></div>` : ''}
      ${ro ? `<div class="banner blue">${I('clock', 16)}<div>This content is <b>${it.status}</b> and locked for editing. <button class="lnk" data-action="studioRecall">Recall to draft</button> to make changes.</div></div>` : ''}
      <div class="form">
        <label class="f">Platform<select name="channel" data-bind="studioField:change" ${ro ? 'disabled' : ''}>${MF.CHANNELS.map((x) => `<option ${x === d.channel ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="f">Campaign<input value="${U.esc(c ? c.name : 'Standalone content')}" disabled></label>
        <label class="f full">Headline <small class="muted"><span id="cc-headline">${d.headline.length}</span> chars</small><input name="headline" data-bind="studioField" value="${U.esc(d.headline)}" ${ro}></label>
        <label class="f full">Copy <small class="muted"><span id="cc-body">${d.body.length}</span> chars</small><textarea name="body" rows="8" data-bind="studioField" ${ro}>${U.esc(d.body)}</textarea></label>
        <label class="f">Call to action<input name="cta" data-bind="studioField" value="${U.esc(d.cta)}" ${ro}></label>
        <label class="f">Hashtags<input name="hashtags" data-bind="studioField" value="${U.esc(d.hashtags)}" ${ro}></label>
      </div>
      <div class="row wrap end mt">
        <button class="btn ghost danger sm" data-action="studioDel">${I('trash', 14)}</button>
        <button class="btn ghost sm" data-action="studioDup">${I('copy', 14)} Duplicate</button>
        <button class="btn ghost sm" data-action="studioRegen" ${ro ? 'disabled' : ''}>${I('refresh', 14)} Regenerate</button>
        <button class="btn sm" id="st-save" data-action="studioSave" ${ro || !dirty() ? 'disabled' : ''}>Save</button>
        <button class="btn primary sm" data-action="studioSend" ${ro ? 'disabled' : ''}>${I('send', 14)} Send for approval</button>
      </div></div>
      <div class="card"><div class="card-h"><h3>Live preview</h3><span class="muted sm">${d.channel} layout</span></div><div id="pv" class="pv-wrap">${preview()}</div></div>`;
  }

  MF.views.studio = {
    render() {
      const s = MF.state(), b = st.brief;
      if (st.sel && !MF.get.content(st.sel)) { st.sel = null; st.draft = null; }
      return `<div class="page-h"><div><h1>AI Content Studio</h1><p class="muted">Generate on-brand copy for every channel, polish it, then send it for approval.</p></div></div>
      <div class="studio">
        <div class="col">
          <section class="card"><div class="card-h"><h3>${I('sparkles', 16)} Generate</h3></div><div class="form one">
            <label class="f">Campaign<select name="campaignId" data-bind="studioCamp:change"><option value="all">All content</option>${s.campaigns.map((c) => `<option value="${c.id}" ${st.camp === c.id ? 'selected' : ''}>${U.esc(c.name)}</option>`).join('')}</select></label>
            <label class="f">Topic / key message<input name="topic" data-bind="studioBrief" value="${U.esc(b.topic)}" placeholder="e.g. 30% off winter collection"></label>
            <label class="f">Tone<select name="tone" data-bind="studioBrief:change">${Object.keys(MF.TONES).map((t) => `<option ${t === b.tone ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
            <fieldset class="f"><legend>Create variations for</legend><div class="chips">${MF.CHANNELS.map((ch) => `<label class="chip-c" style="--c:${MF.CH_COLOR[ch]}"><input type="checkbox" value="${ch}" data-bind="studioChan:change" ${b.channels.includes(ch) ? 'checked' : ''}><span>${ch}</span></label>`).join('')}</div></fieldset>
            <div class="row"><button class="btn primary grow" data-action="studioGen">${I('sparkles', 15)} Generate content</button><button class="btn ghost" data-action="studioIdeas" title="Headline and description ideas">Ideas</button></div>
            <div id="ideas">${ideas()}</div></div></section>
          <section class="card"><div class="card-h"><h3>Content library</h3><span class="muted sm">${s.content.filter((x) => st.camp === 'all' || x.campaignId === st.camp).length} items</span></div><div class="libs">${list()}</div></section>
        </div>
        <div class="col wide">${editor()}</div></div>`;
    },
    mount(root, p) { if (p.open && MF.get.content(p.open) && st.sel !== p.open) { select(p.open); st.camp = 'all'; MF.rerender(); } if (p.campaign && MF.get.campaign(p.campaign) && st.camp !== p.campaign) { MF.handlers.studioCamp({ value: p.campaign }); } },
  };
})();
