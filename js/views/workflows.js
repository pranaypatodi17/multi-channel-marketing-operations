(function () {
  const MF = window.MF, U = MF.U, I = MF.icon, UI = MF.ui;
  const st = (UI.st.workflows = { sel: null, running: false });
  const cur = () => { const w = MF.state().workflows; return w.find((x) => x.id === st.sel) || w[0]; };
  const AI = { assign: 'users', email: 'mail', nurture: 'layers', slack: 'message', task: 'flag' };

  function config(w) {
    const T = MF.THRESH;
    UI.modal({
      title: 'Configure workflow', size: 'lg',
      body: `<div class="form"><label class="f full">Workflow name<input id="w-name" value="${U.esc(w.name)}"></label>
        <fieldset class="f full"><legend>1 · Trigger — new lead captured from</legend><div class="chips">${MF.CHANNELS.map((c) => `<label class="chip-c" style="--c:${MF.CH_COLOR[c]}"><input type="checkbox" name="src" value="${c}" ${w.sources.includes(c) ? 'checked' : ''}><span>${c}</span></label>`).join('')}</div></fieldset>
        <label class="f full">2 · AI lead scoring model<select id="w-model">${['Engagement + firmographic fit', 'Engagement only', 'Intent signals (beta)'].map((m) => `<option ${m === w.model ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        <label class="f">3 · Hot if score ≥<input type="number" id="w-hot" min="2" max="99" value="${T.hot}"></label><label class="f">Warm if score ≥<input type="number" id="w-warm" min="1" max="98" value="${T.warm}"></label>
        <p class="muted sm full">Segment thresholds apply to all workflows and the CRM.</p>
        ${['Hot', 'Warm', 'Cold'].map((s) => `<label class="f">4 · ${s} lead → action<select data-act="${s}">${Object.entries(MF.ACTIONS).map(([k, v]) => `<option value="${k}" ${w.actions[s] === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`).join('')}
        <p class="err full" id="w-err" role="alert"></p></div>`,
      buttons: [{ label: 'Cancel', cls: 'ghost' }, {
        label: 'Save workflow', cls: 'primary', onClick(m) {
          const q = (s) => m.el.querySelector(s), src = [...m.el.querySelectorAll('[name=src]:checked')].map((x) => x.value), hot = +q('#w-hot').value, warm = +q('#w-warm').value;
          if (!q('#w-name').value.trim()) { q('#w-err').textContent = 'Give the workflow a name.'; return false; }
          if (!src.length) { q('#w-err').textContent = 'Choose at least one trigger source.'; return false; }
          if (!(hot > warm && warm >= 1)) { q('#w-err').textContent = 'Hot threshold must be higher than the warm threshold.'; return false; }
          const actions = {}; m.el.querySelectorAll('[data-act]').forEach((s) => (actions[s.dataset.act] = s.value));
          MF.api.setThresh(hot, warm); MF.api.saveWorkflow(w.id, { name: q('#w-name').value.trim(), sources: src, model: q('#w-model').value, actions }); UI.toast('Workflow saved');
        },
      }],
    });
  }
  function create() {
    UI.modal({
      title: 'New workflow', size: 'sm', body: `<label class="f">Name<input id="nw" placeholder="e.g. Webinar follow-up"></label><p class="err" id="nwe"></p>`,
      buttons: [{ label: 'Cancel', cls: 'ghost' }, { label: 'Create', cls: 'primary', onClick(m) { const v = m.el.querySelector('#nw').value.trim(); if (!v) { m.el.querySelector('#nwe').textContent = 'Please enter a name.'; return false; } const w = MF.api.createWorkflow(v, ['Website', 'Instagram']); st.sel = w.id; UI.toast('Workflow created — configure the steps'); } }],
    });
  }
  Object.assign(MF.actions, {
    wfSel(el) { st.sel = el.dataset.id; MF.rerender(); },
    wfToggle(el, e) { e.stopPropagation(); const w = MF.get.workflow(el.dataset.id); MF.api.saveWorkflow(w.id, { active: !w.active }); UI.toast(`"${U.esc(w.name)}" ${w.active ? 'activated' : 'paused'}`, 'info'); },
    wfEdit() { config(cur()); }, wfNew: create,
    async wfDel() { const w = cur(); if (await UI.confirm({ title: 'Delete workflow?', message: `"${U.esc(w.name)}" and its run history will be removed.`, confirm: 'Delete', danger: true })) { MF.api.deleteWorkflow(w.id); st.sel = null; UI.toast('Workflow deleted'); } },
    wfRun(el) {
      if (st.running) return; st.running = true; const w = cur(), root = document.getElementById('view'), steps = ['n-trig', 'n-score', 'n-seg'];
      const score = Math.round(15 + Math.random() * 82), seg = MF.segment(score), src = w.sources[Math.floor(Math.random() * w.sources.length)], act = w.actions[seg];
      root.querySelectorAll('.node').forEach((n) => n.classList.remove('run', 'done')); const out = document.getElementById('wf-out'); out.innerHTML = '<span class="spin"></span> Running test with a sample lead…'; el.disabled = true;
      const seq = [...steps, 'n-' + seg]; seq.forEach((id, i) => setTimeout(() => { const n = document.getElementById(id); if (!n) return; root.querySelectorAll('.node.run').forEach((x) => { x.classList.remove('run'); x.classList.add('done'); }); n.classList.add('run'); }, i * 750));
      setTimeout(() => { root.querySelectorAll('.node.run').forEach((x) => { x.classList.remove('run'); x.classList.add('done'); }); out.innerHTML = `${I('checkCircle', 16)} Sample lead from <b>${src}</b> scored <b>${score}</b> → ${UI.badge(seg)} → <b>${MF.ACTIONS[act]}</b>`; el.disabled = false; st.running = false; }, seq.length * 750);
    },
  });

  MF.views.workflows = {
    render() {
      const ws = MF.state().workflows, w = cur(), T = MF.THRESH; st.sel = w ? w.id : null;
      if (!w) return `<div class="page-h"><h1>Automation Workflows</h1></div><div class="card">${UI.empty('zap', 'No workflows', 'Create one to start automating.')}<div class="center"><button class="btn primary" data-action="wfNew">New workflow</button></div></div>`;
      const branch = (s, cls) => `<div class="branch"><span class="blabel ${cls}">${s}</span><div class="conn v short"></div><button class="node act ${cls}" id="n-${s}" data-action="wfEdit"><span class="ni">${I(AI[w.actions[s]], 18)}</span><div><small>Action</small><b>${MF.ACTIONS[w.actions[s]]}</b></div></button></div>`;
      return `<div class="page-h"><div><h1>Automation Workflows</h1><p class="muted">Visual lead-handling pipelines that run automatically on every new lead.</p></div><button class="btn primary" data-action="wfNew">${I('plus', 16)} New workflow</button></div>
      <div class="wf-layout"><aside class="wf-list">${ws.map((x) => `<div class="wf-i ${x.id === w.id ? 'on' : ''}" data-action="wfSel" data-id="${x.id}" tabindex="0" role="button"><div><b>${U.esc(x.name)}</b><small>${x.runs} runs · ${x.sources.length} source${x.sources.length > 1 ? 's' : ''}</small></div><button class="switch ${x.active ? 'on' : ''}" role="switch" aria-checked="${x.active}" aria-label="Toggle ${U.esc(x.name)}" data-action="wfToggle" data-id="${x.id}"><i></i></button></div>`).join('')}</aside>
      <section class="card wf-main"><div class="card-h"><div><h3>${U.esc(w.name)}</h3><span class="muted sm">${w.active ? UI.badge('Active') : UI.badge('Draft', 'Paused')} · ${w.runs} total runs</span></div><div class="row"><button class="btn ghost sm" data-action="wfEdit">${I('edit', 14)} Configure</button><button class="btn sm primary" data-action="wfRun">${I('play', 14)} Run test</button><button class="btn ghost danger sm" data-action="wfDel" aria-label="Delete">${I('trash', 14)}</button></div></div>
        <div class="canvas">
          <button class="node trig" id="n-trig" data-action="wfEdit"><span class="ni">${I('userPlus', 18)}</span><div><small>Trigger</small><b>New lead captured</b><div class="dots lab">${w.sources.map((s) => `<span class="ch" style="--c:${MF.CH_COLOR[s]}"><i></i>${s}</span>`).join('')}</div></div></button>
          <div class="conn v"></div>
          <button class="node nscore" id="n-score" data-action="wfEdit"><span class="ni">${I('sparkles', 18)}</span><div><small>AI lead scoring</small><b>Evaluate engagement & interest</b><em>${U.esc(w.model)}</em></div></button>
          <div class="conn v"></div>
          <button class="node nseg" id="n-seg" data-action="wfEdit"><span class="ni">${I('layers', 18)}</span><div><small>Segment the lead</small><b>Hot · Warm · Cold</b><em>Hot ≥ ${T.hot} · Warm ≥ ${T.warm}</em></div></button>
          <div class="conn v"></div><div class="fan"></div><div class="branches">${branch('Hot', 'hot')}${branch('Warm', 'warm')}${branch('Cold', 'cold')}</div>
        </div><div class="wf-out" id="wf-out" aria-live="polite">${I('play', 14)} Press <b>Run test</b> to watch a sample lead move through this workflow.</div></section></div>
      <section class="card"><div class="card-h"><h3>Recent runs</h3><span class="muted sm">Capture leads from the Leads page or "Simulate live traffic" to see new runs</span></div>
        ${w.log.length ? `<div class="tbl-w"><table class="tbl"><thead><tr><th>When</th><th>Lead</th><th>Score</th><th>Segment</th><th>Action taken</th></tr></thead><tbody>${w.log.map((r) => `<tr><td>${U.ago(r.at)}</td><td>${U.esc(r.lead)}</td><td>${r.score}</td><td>${UI.badge(r.segment)}</td><td>${MF.ACTIONS[r.action]}</td></tr>`).join('')}</tbody></table></div>` : UI.empty('activity', 'No runs yet', 'This workflow has not processed a lead in this session.')}</section>`;
    },
    mount(root) { root.querySelectorAll('.wf-i').forEach((r) => r.addEventListener('keydown', (e) => { if (e.key === 'Enter') r.click(); })); },
  };
})();
