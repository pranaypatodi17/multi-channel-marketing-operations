/* MarketFlow — UI primitives: toast, modal, drawer, badges, pager */
(function () {
  const MF = window.MF, U = MF.U, I = MF.icon;
  const UI = (MF.ui = { st: {} });

  UI.toast = function (msg, type = 'success', ms = 3400) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + type;
    t.innerHTML = `<span class="t-ic">${I(type === 'error' ? 'alert' : type === 'info' ? 'bell' : 'checkCircle', 18)}</span><span>${msg}</span>`;
    box.appendChild(t); requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
  };

  function layer(kind, o) {
    const ov = document.createElement('div'); ov.className = kind + '-ov';
    const btns = (o.buttons || []);
    ov.innerHTML = `<div class="${kind} ${o.size || ''}" role="dialog" aria-modal="true" aria-label="${U.esc(o.title || '')}">
      <div class="${kind}-h"><h3>${o.title || ''}</h3><button class="icon-btn" data-x aria-label="Close">${I('x')}</button></div>
      <div class="${kind}-b">${o.body || ''}</div>
      ${btns.length ? `<div class="${kind}-f">${btns.map((b, i) => `<button class="btn ${b.cls || ''}" data-b="${i}">${b.label}</button>`).join('')}</div>` : ''}</div>`;
    document.body.appendChild(ov); document.body.classList.add('noscroll');
    requestAnimationFrame(() => ov.classList.add('show'));
    const api = { el: ov, body: ov.querySelector(`.${kind}-b`), close() { ov.classList.remove('show'); document.removeEventListener('keydown', esc); setTimeout(() => { ov.remove(); if (!document.querySelector('.modal-ov,.drawer-ov')) document.body.classList.remove('noscroll'); }, 200); if (o.onClose) o.onClose(); } };
    function esc(e) { if (e.key === 'Escape' && ov === [...document.querySelectorAll('.modal-ov,.drawer-ov')].pop()) api.close(); }
    document.addEventListener('keydown', esc);
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) api.close(); });
    ov.querySelector('[data-x]').onclick = api.close;
    ov.querySelectorAll('[data-b]').forEach((b) => (b.onclick = () => { const bt = btns[+b.dataset.b]; if (bt.onClick) { if (bt.onClick(api) === false) return; } if (bt.close !== false) api.close(); }));
    if (o.onMount) o.onMount(api);
    const f = ov.querySelector('input:not([type=checkbox]),textarea,select'); if (f && !o.noFocus) setTimeout(() => f.focus(), 60);
    return api;
  }
  UI.modal = (o) => layer('modal', o);
  UI.drawer = (o) => layer('drawer', o);
  UI.confirm = (o) => new Promise((res) => UI.modal({ title: o.title, size: 'sm', body: `<p class="muted">${o.message}</p>`, buttons: [{ label: 'Cancel', cls: 'ghost', onClick: () => res(false) }, { label: o.confirm || 'Confirm', cls: o.danger ? 'danger' : 'primary', onClick: () => res(true) }], onClose: () => res(false) }));

  /* helpers */
  UI.chBadge = (ch) => `<span class="ch" style="--c:${MF.CH_COLOR[ch]}"><i></i>${U.esc(ch)}</span>`;
  const SC = { Draft: 'grey', 'In Review': 'amber', Scheduled: 'blue', Active: 'green', Completed: 'purple', Pending: 'amber', Revision: 'orange', Rejected: 'red', Approved: 'teal', Published: 'green', New: 'blue', Contacted: 'amber', Qualified: 'teal', Proposal: 'purple', Won: 'green', Lost: 'grey', Hot: 'red', Warm: 'orange', Cold: 'blue' };
  UI.badge = (s, label) => `<span class="badge ${SC[s] || 'grey'}">${U.esc(label || s)}</span>`;
  UI.avatar = (n, c) => `<span class="avatar" style="--h:${U.hash(n) % 360}">${U.initials(n)}</span>`;
  UI.empty = (icon, title, msg) => `<div class="empty">${I(icon, 36)}<h4>${title}</h4><p>${msg || ''}</p></div>`;
  UI.score = (n) => { const s = MF.segment(n); return `<span class="score ${s.toLowerCase()}"><b>${n}</b>${s}</span>`; };

  UI.pager = function (view, total, page, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    if (total <= size) return `<div class="pager"><span class="muted">${total} result${total === 1 ? '' : 's'}</span></div>`;
    const from = (page - 1) * size + 1, to = Math.min(total, page * size);
    let nums = '';
    for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums += `<button class="pg ${p === page ? 'on' : ''}" data-action="pg" data-view="${view}" data-page="${p}">${p}</button>`; else if (Math.abs(p - page) === 2) nums += '<span class="muted">…</span>';
    return `<div class="pager"><span class="muted">${from}–${to} of ${total}</span><div><button class="pg" ${page === 1 ? 'disabled' : ''} data-action="pg" data-view="${view}" data-page="${page - 1}" aria-label="Previous">${I('left', 14)}</button>${nums}<button class="pg" ${page === pages ? 'disabled' : ''} data-action="pg" data-view="${view}" data-page="${page + 1}" aria-label="Next">${I('right', 14)}</button></div></div>`;
  };
  UI.th = (view, key, label, st) => `<th><button class="th-b" data-action="sort" data-view="${view}" data-key="${key}">${label}${st.sort === key ? `<span class="arr">${st.dir > 0 ? '▲' : '▼'}</span>` : ''}</button></th>`;
  UI.sortBy = (arr, st, get) => { const f = get[st.sort]; if (!f) return arr; return [...arr].sort((a, b) => { const x = f(a), y = f(b); return (x > y ? 1 : x < y ? -1 : 0) * st.dir; }); };
  UI.page = (arr, st, size) => { const pages = Math.max(1, Math.ceil(arr.length / size)); st.page = U.clamp(st.page, 1, pages); return arr.slice((st.page - 1) * size, st.page * size); };

  /* platform previews */
  UI.preview = function (it, compact) {
    const brand = 'MarketFlow Co.', ini = 'MF', body = U.esc(it.body).replace(/\n/g, '<br>'), tags = it.hashtags ? `<span class="pv-tags">${U.esc(it.hashtags)}</span>` : '';
    const top = (name, sub) => `<div class="pv-top"><span class="pv-av">${ini}</span><div><b>${name}</b><small>${sub}</small></div></div>`;
    switch (it.channel) {
      case 'Instagram':
        return `<div class="pv ig ${compact ? 'compact' : ''}">${top('marketflow.co', 'Sponsored')}<div class="pv-img" style="--h:${U.hash(it.headline) % 360}"><span>${U.esc(it.headline)}</span></div><div class="pv-acts">${I('heart', 20)}${I('message', 20)}${I('send', 20)}</div><p><b>marketflow.co</b> ${body}</p>${tags}</div>`;
      case 'Facebook':
        return `<div class="pv fb ${compact ? 'compact' : ''}">${top(brand, 'Sponsored · 🌐')}<p>${body}</p><div class="pv-img wide" style="--h:${U.hash(it.headline) % 360}"><span>${U.esc(it.headline)}</span></div><div class="pv-cta"><div><small>marketflow.example</small><b>${U.esc(it.headline)}</b></div><button>${U.esc(it.cta)}</button></div><div class="pv-acts txt"><span>${I('thumb', 16)} Like</span><span>${I('message', 16)} Comment</span><span>${I('share', 16)} Share</span></div></div>`;
      case 'LinkedIn':
        return `<div class="pv li ${compact ? 'compact' : ''}">${top(brand, '12,480 followers · Promoted')}<p>${body}</p>${tags}<div class="pv-img wide short" style="--h:${U.hash(it.headline) % 360}"><span>${U.esc(it.headline)}</span></div><div class="pv-acts txt"><span>${I('thumb', 16)} Like</span><span>${I('message', 16)} Comment</span><span>${I('share', 16)} Repost</span><span>${I('send', 16)} Send</span></div></div>`;
      case 'Email':
        return `<div class="pv em ${compact ? 'compact' : ''}"><div class="em-h"><div><small>From</small> <b>MarketFlow Team</b></div><div><small>Subject</small> <b>${U.esc(it.headline)}</b></div></div><div class="em-b"><div class="em-hero" style="--h:${U.hash(it.headline) % 360}">${U.esc(it.headline)}</div><p>${body}</p><span class="em-btn">${U.esc(it.cta)}</span></div></div>`;
      case 'Google Ads':
        return `<div class="pv ga ${compact ? 'compact' : ''}"><small><b>Ad</b> · marketflow.example</small><h4>${U.esc(it.headline)}</h4><p>${body}</p><small class="muted">${it.headline.length}/30 · ${it.body.length}/90 characters</small></div>`;
      default:
        return `<div class="pv web ${compact ? 'compact' : ''}"><div class="web-bar"><i></i><i></i><i></i><span>marketflow.example</span></div><div class="web-hero" style="--h:${U.hash(it.headline) % 360}"><h4>${U.esc(it.headline)}</h4><p>${body}</p><span class="em-btn">${U.esc(it.cta)}</span></div></div>`;
    }
  };

  UI.loadingBar = function () {
    let b = document.getElementById('topbar-load'); if (!b) { b = document.createElement('div'); b.id = 'topbar-load'; document.body.appendChild(b); }
    b.style.transition = 'none'; b.style.width = '0'; b.style.opacity = '1';
    requestAnimationFrame(() => { b.style.transition = 'width .35s ease'; b.style.width = '85%'; });
    return () => { b.style.transition = 'width .15s, opacity .3s'; b.style.width = '100%'; setTimeout(() => (b.style.opacity = '0'), 160); };
  };
  UI.skeleton = () => `<div class="skel-grid">${'<div class="skel"></div>'.repeat(4)}</div><div class="skel big"></div><div class="skel-grid two"><div class="skel big"></div><div class="skel big"></div></div>`;
})();
