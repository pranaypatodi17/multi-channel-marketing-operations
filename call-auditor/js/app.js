/* CallLens — app shell, router, global search, notifications, live feed */
(function () {
  'use strict';
  const CL = window.CL, I = CL.icon, E = CL.esc;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  let current = { name: 'dashboard', arg: null, params: {} };

  const NAV = [
    ['dashboard', 'dashboard', 'Team overview'], ['calls', 'phone', 'Calls'], ['agents', 'users', 'Agents'], ['alerts', 'bell', 'Alerts'],
    ['ingest', 'upload', 'Upload and sources'], ['rubric', 'sliders', 'Rubric editor'], ['settings', 'settings', 'Settings']
  ];

  function applyTheme() {
    const t = CL.state.settings.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  }

  function shell() {
    const open = CL.alerts().filter(a => a.status === 'Open').length;
    $('#app').innerHTML =
      '<aside class="side" id="side"><a class="brand" href="index.html" style="text-decoration:none"><span class="brand-mark">' + I('logo', 20) + '</span>CallLens</a>' +
      '<nav class="nav" aria-label="Main"><div class="nav-label">Quality</div>' + NAV.slice(0, 4).map(n => navLink(n, open)).join('') + '<div class="nav-label">Workspace</div>' + NAV.slice(4).map(n => navLink(n, open)).join('') + '</nav>' +
      '<div class="side-foot"><div class="org-card"><b>' + E(CL.ORG.name) + '</b><span style="opacity:.7">Sales QA · ' + CL.ORG.plan + ' plan</span><div class="live"><span class="dot live"></span>Monitoring 3 sources</div></div>' +
      '<a class="side-link" href="index.html">' + I('left', 14) + ' Back to website</a><button class="side-link" data-act="resetDemo">' + I('undo', 14) + ' Reset demo data</button></div></aside>' +
      '<div class="main"><header class="top"><button class="icon-btn menu-btn" data-act="menu" aria-label="Open menu">' + I('menu', 20) + '</button>' +
      '<div class="gsearch">' + I('search', 16) + '<input type="search" id="gs" placeholder="Search calls, customers, agents" autocomplete="off" aria-label="Global search"><kbd>/</kbd><div class="gres" id="gres" hidden></div></div>' +
      '<div class="top-r"><span class="chip sev-clear" style="margin-right:6px" title="Calls are processed as they end"><span class="dot live"></span>&nbsp;Live</span>' +
      '<button class="icon-btn" data-act="theme" aria-label="Toggle theme" id="themeBtn"></button>' +
      '<div class="bell" style="position:relative"><button class="icon-btn" data-act="bell" aria-label="Notifications" id="bellBtn">' + I('bell', 19) + '<span class="n" id="bellN"></span></button><div class="pop" id="pop" hidden></div></div>' +
      '<div class="me">' + CL.avatar({ name: CL.USER.name, color: '#0d9488' }, 32) + '<div><b>' + E(CL.USER.name) + '</b><small>' + CL.USER.role + '</small></div></div></div></header><main id="view" tabindex="-1"></main></div><div class="scrim" data-act="menu"></div>';
    themeIcon(); CL.updateBell();
  }
  const navLink = (n, open) => '<a href="#/' + n[0] + '" data-nav="' + n[0] + '">' + I(n[1], 18) + n[2] + (n[0] === 'alerts' ? '<span class="badge" id="navBadge"' + (open ? '' : ' hidden') + '>' + open + '</span>' : '') + '</a>';
  function themeIcon() { const b = $('#themeBtn'); if (b) b.innerHTML = I(document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon', 19); }

  CL.updateBell = function () {
    const open = CL.alerts().filter(a => a.status === 'Open').length, n = $('#bellN'), nb = $('#navBadge');
    if (n) { n.textContent = open; n.hidden = !open; } if (nb) { nb.textContent = open; nb.hidden = !open; }
  };

  function parse() {
    const h = location.hash.replace(/^#\/?/, '') || 'dashboard', [path, qs] = h.split('?'), p = path.split('/');
    const params = Object.fromEntries(new URLSearchParams(qs || ''));
    if (p[0] === 'calls' && p[1]) return { name: 'callDetail', nav: 'calls', arg: p[1], params };
    if (p[0] === 'agents' && p[1]) return { name: 'agentProfile', nav: 'agents', arg: p[1], params };
    const ok = NAV.find(n => n[0] === p[0]);
    return ok ? { name: p[0], nav: p[0], arg: null, params } : { name: 'dashboard', nav: 'dashboard', arg: null, params };
  }

  CL.render = function () {
    if (CL.unmount) CL.unmount();
    const r = current = parse(), view = $('#view'); if (!view) return;
    const scroll = window.scrollY;
    view.innerHTML = CL.views[r.name](r.arg, r.params);
    $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === r.nav));
    document.title = { dashboard: 'Team overview', calls: 'Calls', callDetail: 'Call ' + (r.arg || ''), agents: 'Agents', agentProfile: 'Agent profile', alerts: 'Alerts', ingest: 'Upload and sources', rubric: 'Rubric editor', settings: 'Settings' }[r.name] + ' · CallLens';
    if (CL.mounts[r.name]) CL.mounts[r.name](r.arg, r.params);
    CL.updateBell();
    if (r._keepScroll) window.scrollTo(0, scroll);
  };
  window.addEventListener('hashchange', () => { $('#app').classList.remove('menu-open'); CL.closeModal(); CL.render(); window.scrollTo(0, 0); const p = $('#pop'); if (p) p.hidden = true; });

  /* ---- input delegation ---- */
  ['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
    const el = e.target.closest && e.target.closest('[data-in]'); if (!el) return;
    const type = el.type, isText = el.tagName === 'TEXTAREA' || /^(text|search|number|tel|email)$/.test(type);
    if ((ev === 'input') !== isText) return;
    const fn = CL.ins[el.dataset.in]; if (fn) fn(el, e);
  }));

  /* ---- actions ---- */
  Object.assign(CL.acts, {
    menu: () => $('#app').classList.toggle('menu-open'),
    theme: () => { const cur = document.documentElement.getAttribute('data-theme'); CL.state.settings.theme = cur === 'dark' ? 'light' : 'dark'; CL.save(); applyTheme(); themeIcon(); },
    resetDemo: () => CL.modal({ title: 'Reset demo data?', body: '<p>This clears every override, review, rubric change and uploaded call stored in this browser, and restores the original 50 sample calls.</p>', foot: '<button class="btn" data-act="closeModal">Cancel</button><button class="btn danger" data-act="resetOk">Reset</button>' }),
    resetOk: () => CL.reset(),
    bell: () => {
      const p = $('#pop'); if (!p.hidden) { p.hidden = true; return; }
      const al = CL.alerts().filter(a => a.status === 'Open').slice(0, 5);
      p.innerHTML = '<h4>Open alerts <a href="#/alerts">View all</a></h4>' + (al.length ? al.map(a => '<a class="it" href="#/alerts"><span class="dot" style="background:var(--bad);margin-top:7px"></span><div><b style="font-weight:600">' + E(a.primary.title) + '</b><div class="muted" style="font-size:12.5px">' + E(a.call.agent.name) + ' · ' + a.call.id + ' · ' + CL.rel(a.at) + '</div></div></a>').join('') : '<div class="empty" style="padding:28px"><b>All caught up</b>No open alerts.</div>');
      p.hidden = false;
    }
  });
  document.addEventListener('click', e => {
    const p = $('#pop'); if (p && !p.hidden && !e.target.closest('.bell')) p.hidden = true;
    const g = $('#gres'); if (g && !g.hidden && !e.target.closest('.gsearch')) g.hidden = true;
  });

  /* ---- global search ---- */
  document.addEventListener('input', e => {
    if (e.target.id !== 'gs') return;
    const q = e.target.value.trim().toLowerCase(), box = $('#gres'); if (q.length < 2) { box.hidden = true; return; }
    const calls = CL.calls().filter(c => (c.id + ' ' + c.cust + ' ' + c.agent.name + ' ' + c.product).toLowerCase().includes(q)).slice(0, 5);
    const ags = CL.AGENTS.filter(a => a.name.toLowerCase().includes(q)).slice(0, 3);
    box.innerHTML = ags.map(a => '<a href="#/agents/' + a.id + '" data-clear>' + CL.avatar(a, 26) + '<div><b>' + E(a.name) + '</b><br><small>Agent · ' + a.team + '</small></div></a>').join('') +
      calls.map(c => '<a href="#/calls/' + c.id + '" data-clear>' + CL.scorePill(CL.analyze(c).overall) + '<div><b>' + E(c.cust) + '</b> <span class="mono muted">' + c.id + '</span><br><small>' + E(c.agent.name) + ' · ' + E(c.product) + '</small></div></a>').join('') || '<div class="empty" style="padding:18px">No results</div>';
    box.hidden = false;
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-clear]')) { const g = $('#gs'); g.value = ''; $('#gres').hidden = true; } });
  document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); const g = $('#gs'); if (g) g.focus(); } });

  /* ---- simulated live arrivals ---- */
  const ARRIVALS = [['T5', 'a7'], ['T6', 'a7'], ['T7', 'a5'], ['T5', 'a8']];
  CL.arrive = function (force) {
    const n = CL.state.autoArrivals, a = ARRIVALS[(force ? Math.floor(Math.random() * 2) : n) % ARRIVALS.length];
    if (!force) CL.state.autoArrivals++;
    const id = CL.ingest({ arch: a[0], agentId: a[1], source: ['Exotel', 'Knowlarity', 'Ozonetel'][Math.floor(Math.random() * 3)] });
    CL.updateBell();
    if (!document.querySelector('.modal-wrap') && ['dashboard', 'calls', 'alerts', 'agents'].includes(current.name) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) CL.render();
    return id;
  };
  function scheduleArrival() {
    if (CL.state.autoArrivals >= 2) return;
    setTimeout(() => {
      if (document.hidden) return scheduleArrival();
      const id = CL.arrive(false), c = CL.call(id), an = CL.analyze(c);
      CL.toast('<b>New ' + an.risk + '-severity call</b> from ' + E(c.agent.name) + ' (score ' + an.overall + '). Routed to ' + E(CL.state.settings.slackChannel) + '. <a href="#/calls/' + id + '">Open call</a>', 'alert');
      scheduleArrival();
    }, 45000 + Math.random() * 20000);
  }

  /* ---- boot ---- */
  applyTheme(); shell(); CL.render(); scheduleArrival();
  if (!location.hash) history.replaceState(null, '', '#/dashboard');
})();
