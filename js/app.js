/* MarketFlow — app shell, router, global actions */
(function () {
  const MF = window.MF, U = MF.U, I = MF.icon, UI = MF.ui;
  const NAV = [
    ['dashboard', 'Dashboard', 'dashboard'], ['campaigns', 'Campaigns', 'campaign'], ['studio', 'AI Content Studio', 'sparkles'], ['approvals', 'Approval Center', 'checkCircle'],
    ['calendar', 'Calendar', 'calendar'], ['leads', 'Leads & CRM', 'users'], ['workflows', 'Automations', 'zap'], ['reports', 'Reports', 'chart'],
  ];
  let current = null, rafId = 0;

  function shell() {
    document.getElementById('app').innerHTML = `
    <aside class="sidebar" id="sidebar" aria-label="Main navigation">
      <div class="brand"><span class="logo">${I('zap', 18)}</span><div><b>MarketFlow</b><small>Campaign & Automation</small></div></div>
      <nav>${NAV.map((n) => `<a href="#/${n[0]}" class="nav-i" data-nav="${n[0]}">${I(n[2], 18)}<span>${n[1]}</span><em class="nav-c" data-count="${n[0]}"></em></a>`).join('')}</nav>
      <div class="side-f"><div class="me">${UI.avatar(MF.ME.name)}<div><b>${MF.ME.name}</b><small>${MF.ME.role}</small></div></div>
        <button class="btn ghost sm block" data-action="reset">${I('reset', 14)} Reset demo data</button></div>
    </aside><div class="scrim" data-action="menu"></div>
    <div class="main"><header class="topbar">
      <button class="icon-btn only-m" data-action="menu" aria-label="Open menu">${I('menu')}</button>
      <div class="gsearch"><span>${I('search', 16)}</span><input id="gsearch" placeholder="Search campaigns, leads, content…" autocomplete="off" aria-label="Global search"><div id="gresults" class="gresults"></div></div>
      <div class="top-r">
        <button class="btn ghost sm hide-s" data-action="simulate" title="Simulate incoming leads">${I('activity', 15)} Simulate live traffic</button>
        <button class="icon-btn" data-action="theme" aria-label="Toggle theme" id="themeBtn"></button>
        <div class="bell-w"><button class="icon-btn" data-action="bell" aria-label="Notifications">${I('bell')}<span class="dotc" id="bellc"></span></button><div class="bell-p" id="bellp"></div></div>
      </div></header>
      <main id="view" tabindex="-1"></main></div>`;
    applyTheme();
  }
  function applyTheme() {
    const t = MF.state().settings.theme; document.documentElement.setAttribute('data-theme', t);
    const b = document.getElementById('themeBtn'); if (b) b.innerHTML = I(t === 'dark' ? 'sun' : 'moon');
  }
  function counts() {
    const s = MF.state(), p = s.content.filter((c) => c.status === 'Pending').length;
    const set = (k, v) => { const e = document.querySelector(`[data-count="${k}"]`); if (e) { e.textContent = v || ''; e.style.display = v ? '' : 'none'; } };
    set('approvals', p); set('campaigns', s.campaigns.filter((c) => c.status === 'Active').length); set('leads', s.leads.filter((l) => l.status === 'New').length);
    const b = document.getElementById('bellc'); if (b) b.style.display = p ? '' : 'none';
  }
  function route() {
    const m = location.hash.replace(/^#\/?/, '').split('?'); let name = m[0] || 'dashboard'; if (!MF.views[name]) name = 'dashboard';
    const params = Object.fromEntries(new URLSearchParams(m[1] || ''));
    const done = UI.loadingBar(), root = document.getElementById('view');
    MF.api.tick(); current = name;
    document.querySelectorAll('.nav-i').forEach((a) => a.classList.toggle('on', a.dataset.nav === name));
    document.title = NAV.find((n) => n[0] === name)[1] + ' · MarketFlow';
    document.getElementById('sidebar').classList.remove('open'); document.body.classList.remove('menu-open');
    root.innerHTML = UI.skeleton(); counts();
    setTimeout(() => { render(params); done(); window.scrollTo(0, 0); root.focus({ preventScroll: true }); }, 260);
  }
  function render(params) {
    const v = MF.views[current], root = document.getElementById('view');
    root.innerHTML = `<div class="page fade">${v.render()}</div>`;
    if (v.mount) v.mount(root, params || {});
  }
  MF.rerender = function () {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      counts(); if (!current) return; const y = window.scrollY, v = MF.views[current], root = document.getElementById('view');
      if (root.querySelector('.skel')) return;
      root.innerHTML = `<div class="page">${v.render()}</div>`; if (v.mount) v.mount(root, {}); window.scrollTo(0, y);
    });
  };
  MF.nav = (hash) => { if (location.hash === '#/' + hash) route(); else location.hash = '/' + hash; };

  /* ---- delegated events ---- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!e.target.closest('.bell-w')) document.getElementById('bellp')?.classList.remove('open');
    if (!e.target.closest('.gsearch')) document.getElementById('gresults')?.classList.remove('open');
    if (!el) return;
    const fn = MF.actions[el.dataset.action]; if (fn) { if (el.tagName === 'A') e.preventDefault(); fn(el, e); }
  });
  ['input', 'change'].forEach((ev) => document.addEventListener(ev, (e) => {
    const el = e.target.closest('[data-bind]'); if (!el) return;
    const [name, type] = el.dataset.bind.split(':'); if ((type || 'input') !== ev) return;
    const fn = MF.handlers[name]; if (fn) fn(el, e);
  }));

  Object.assign(MF.actions, {
    menu() { document.getElementById('sidebar').classList.toggle('open'); document.body.classList.toggle('menu-open'); },
    theme() { MF.api.setTheme(MF.state().settings.theme === 'dark' ? 'light' : 'dark'); applyTheme(); MF.rerender(); },
    bell(el) {
      const p = document.getElementById('bellp'), s = MF.state(), pend = s.content.filter((c) => c.status === 'Pending').length;
      p.innerHTML = `<div class="bell-h"><b>Notifications</b>${pend ? `<a href="#/approvals" class="link">${pend} pending approvals</a>` : ''}</div>` + s.activity.slice(0, 7).map((a) => `<div class="bell-i"><span class="ai ${a.type}">${I({ campaign: 'campaign', approval: 'checkCircle', lead: 'users', workflow: 'zap', calendar: 'calendar', content: 'sparkles' }[a.type] || 'bell', 14)}</span><div>${U.esc(a.text)}<small>${U.ago(a.at)}</small></div></div>`).join('');
      p.classList.toggle('open');
    },
    simulate() {
      const done = UI.loadingBar(); setTimeout(() => { const ls = MF.api.simulate(); done(); UI.toast(`${ls.length} new lead${ls.length > 1 ? 's' : ''} captured: ${ls.map((l) => U.esc(l.name)).join(', ')}`, 'info'); }, 500);
    },
    async reset() { if (await UI.confirm({ title: 'Reset demo data?', message: 'All changes will be discarded and the original sample data restored.', confirm: 'Reset', danger: true })) { MF.api.reset(); UI.toast('Demo data restored'); } },
    pg(el) { const st = UI.st[el.dataset.view]; st.page = +el.dataset.page; MF.views[el.dataset.view].table(); },
    sort(el) { const st = UI.st[el.dataset.view]; const k = el.dataset.key; st.dir = st.sort === k ? -st.dir : 1; st.sort = k; st.page = 1; MF.views[el.dataset.view].table(); },
    go(el) { MF.nav(el.dataset.to); },
    openCampaign(el) { MF.views.campaigns.open(el.dataset.id); },
    openLead(el) { MF.views.leads.open(el.dataset.id); },
  });

  /* global search */
  document.addEventListener('input', (e) => {
    if (e.target.id !== 'gsearch') return;
    const q = e.target.value.trim().toLowerCase(), box = document.getElementById('gresults'), s = MF.state();
    if (q.length < 2) { box.classList.remove('open'); return; }
    const c = s.campaigns.filter((x) => x.name.toLowerCase().includes(q)).slice(0, 4), l = s.leads.filter((x) => (x.name + x.company + x.email).toLowerCase().includes(q)).slice(0, 5), p = s.content.filter((x) => x.headline.toLowerCase().includes(q)).slice(0, 3);
    box.innerHTML = (c.length ? '<h6>Campaigns</h6>' + c.map((x) => `<a href="#/campaigns?open=${x.id}" data-r>${I('campaign', 14)} ${U.esc(x.name)} ${UI.badge(x.status)}</a>`).join('') : '') +
      (l.length ? '<h6>Leads</h6>' + l.map((x) => `<a href="#/leads?open=${x.id}" data-r>${I('users', 14)} ${U.esc(x.name)} <small>${U.esc(x.company)}</small></a>`).join('') : '') +
      (p.length ? '<h6>Content</h6>' + p.map((x) => `<a href="#/studio?open=${x.id}" data-r>${I('sparkles', 14)} ${U.esc(x.headline)} <small>${x.channel}</small></a>`).join('') : '') || '<p class="muted pad">No results</p>';
    box.classList.add('open');
  });
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-r]'); if (a) { document.getElementById('gresults').classList.remove('open'); document.getElementById('gsearch').value = ''; if (location.hash === a.getAttribute('href')) route(); } });

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', () => {
    MF.init(); shell(); MF.on(MF.rerender); route();
    setInterval(() => MF.api.tick(), 60000);
  });
})();
