/* CallLens — UI toolkit: icons, charts, toasts, modals, action dispatcher */
(function () {
  'use strict';
  const CL = window.CL;

  const P = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    hash: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    right: '<polyline points="9 18 15 12 9 6"/>',
    down: '<polyline points="6 9 12 15 18 9"/>',
    left: '<polyline points="15 18 9 12 15 6"/>',
    arrowUp: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    arrowDown: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    back10: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    fwd10: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    logo: '<path d="M3 12h3l2-6 4 12 3-9 2 3h4"/>'
  };
  const icon = (n, s) => '<svg class="ic" width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('');
  const avatar = (a, s) => '<span class="av" style="--c:' + a.color + ';width:' + (s || 30) + 'px;height:' + (s || 30) + 'px;font-size:' + Math.round((s || 30) * 0.38) + 'px">' + initials(a.name) + '</span>';
  const bandColor = s => ({ good: 'var(--good)', ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)' }[CL.scoreBand(s)]);
  const scorePill = s => '<span class="score ' + CL.scoreBand(s) + '">' + s + '</span>';
  const sevChip = s => '<span class="chip sev-' + s.toLowerCase() + '">' + s + '</span>';
  const riskBadge = r => r === 'Clear' ? '<span class="chip sev-clear">Clear</span>' : sevChip(r);
  const delta = (d, suffix) => d == null ? '<span class="muted">—</span>' : '<span class="delta ' + (d > 0 ? 'up' : d < 0 ? 'down' : '') + '">' + (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + Math.abs(d) + (suffix || '') + '</span>';

  /* ----- charts ----- */
  function ring(score, size, stroke, label) {
    size = size || 96; stroke = stroke || 9;
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - score / 100);
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="' + stroke + '"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + bandColor(score) + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" class="ring-arc"/></svg><div class="ring-n"><b style="font-size:' + Math.round(size * 0.3) + 'px">' + score + '</b>' + (label ? '<small>' + label + '</small>' : '') + '</div></div>';
  }
  function spark(vals, w, h, color) {
    w = w || 90; h = h || 28;
    if (vals.length < 2) return '<svg width="' + w + '" height="' + h + '"></svg>';
    const mn = Math.min(...vals) - 4, mx = Math.max(...vals) + 4, pts = vals.map((v, i) => [i / (vals.length - 1) * (w - 4) + 2, h - 3 - (v - mn) / (mx - mn || 1) * (h - 6)]);
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><polyline points="' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="none" stroke="' + (color || 'var(--brand)') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="2.6" fill="' + (color || 'var(--brand)') + '"/></svg>';
  }
  /* series: [{name,color,points:[{x:label,y:number|null}],dash?}] */
  function lineChart(series, o) {
    o = o || {}; const W = 640, H = o.h || 230, pl = 34, pr = 14, pt = 14, pb = 28;
    const n = series[0].points.length, ymin = o.min != null ? o.min : 40, ymax = o.max != null ? o.max : 100;
    const X = i => pl + (n === 1 ? (W - pl - pr) / 2 : i / (n - 1) * (W - pl - pr)), Y = v => pt + (1 - (v - ymin) / (ymax - ymin)) * (H - pt - pb);
    let g = '';
    for (let v = ymin; v <= ymax; v += (ymax - ymin) / 4) g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)" stroke-dasharray="3 4"/><text x="' + (pl - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" class="axl">' + Math.round(v) + '</text>';
    const step = Math.ceil(n / 7);
    series[0].points.forEach((p, i) => { if (i % step === 0 || i === n - 1) g += '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle" class="axl">' + esc(p.x) + '</text>'; });
    series.forEach((s, si) => {
      const pts = s.points.map((p, i) => p.y == null ? null : [X(i), Y(p.y), p]).filter(Boolean);
      if (!pts.length) return;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      if (si === 0 && o.area !== false) g += '<path d="' + d + ' L' + pts[pts.length - 1][0] + ' ' + (H - pb) + ' L' + pts[0][0] + ' ' + (H - pb) + 'Z" fill="' + s.color + '" opacity=".10"/>';
      g += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"' + (s.dash ? ' stroke-dasharray="5 5"' : '') + '/>';
      pts.forEach(p => { g += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.6" fill="var(--card)" stroke="' + s.color + '" stroke-width="2"><title>' + esc(s.name + ' · ' + p[2].x + ': ' + p[2].y + (o.unit || '')) + '</title></circle>'; });
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="' + esc(o.label || 'Trend chart') + '">' + g + '</svg>';
  }
  function radar(labels, vals, vals2) {
    const SHORT = { 'Tone and conduct': 'Tone', 'Product accuracy': 'Product', 'Objection handling': 'Objections' }; labels = labels.map(l => SHORT[l] || l);
    const S = 260, c = S / 2, R = 88, n = labels.length, ang = i => -Math.PI / 2 + i / n * 2 * Math.PI;
    const pt = (i, v) => [c + Math.cos(ang(i)) * R * v / 100, c + Math.sin(ang(i)) * R * v / 100];
    let g = '';
    [25, 50, 75, 100].forEach(l => { g += '<polygon points="' + labels.map((_, i) => pt(i, l).map(x => x.toFixed(1)).join(',')).join(' ') + '" fill="none" stroke="var(--line)"/>'; });
    labels.forEach((l, i) => { const e = pt(i, 100), t = pt(i, 122); g += '<line x1="' + c + '" y1="' + c + '" x2="' + e[0] + '" y2="' + e[1] + '" stroke="var(--line)"/><text x="' + t[0].toFixed(1) + '" y="' + (t[1] + 3).toFixed(1) + '" text-anchor="' + (t[0] < c - 5 ? 'end' : t[0] > c + 5 ? 'start' : 'middle') + '" class="axl">' + esc(l) + '</text>'; });
    const poly = (v, col, fill) => '<polygon points="' + v.map((x, i) => pt(i, x).map(y => y.toFixed(1)).join(',')).join(' ') + '" fill="' + fill + '" stroke="' + col + '" stroke-width="2" stroke-linejoin="round"/>';
    if (vals2) g += poly(vals2, 'var(--muted)', 'none').replace('stroke-width="2"', 'stroke-width="1.6" stroke-dasharray="4 4"');
    g += poly(vals, 'var(--brand)', 'color-mix(in srgb, var(--brand) 22%, transparent)');
    vals.forEach((x, i) => { const p = pt(i, x); g += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="var(--brand)"><title>' + esc(labels[i] + ': ' + x) + '</title></circle>'; });
    return '<svg viewBox="-40 -4 340 270" class="radar" role="img" aria-label="Category scores">' + g + '</svg>';
  }
  const bar = (pct, color) => '<div class="bar"><i style="width:' + Math.max(2, pct) + '%;background:' + (color || bandColor(pct)) + '"></i></div>';

  /* ----- toast / modal / drawer ----- */
  function toast(msg, kind) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + (kind || 'ok');
    t.innerHTML = '<span class="toast-ic">' + icon(kind === 'err' ? 'alert' : kind === 'alert' ? 'bell' : 'check', 16) + '</span><span>' + msg + '</span>';
    box.appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, kind === 'alert' ? 6500 : 3400);
  }
  function modal(o) {
    closeModal();
    const el = document.createElement('div'); el.className = 'modal-wrap' + (o.side ? ' side' : ''); el.id = 'modal';
    el.innerHTML = '<div class="modal-bg" data-act="closeModal"></div><div class="modal ' + (o.cls || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '"><header><h3>' + esc(o.title) + '</h3><button class="icon-btn" data-act="closeModal" aria-label="Close">' + icon('x') + '</button></header><div class="modal-body">' + o.body + '</div>' + (o.foot ? '<footer>' + o.foot + '</footer>' : '') + '</div>';
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
    document.body.classList.add('noscroll');
    const f = el.querySelector('input,select,textarea'); if (f && !o.nofocus) setTimeout(() => f.focus(), 60);
    return el;
  }
  function closeModal() { const m = document.getElementById('modal'); if (m) { m.remove(); document.body.classList.remove('noscroll'); } }

  /* ----- action dispatcher ----- */
  CL.acts = {};
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = CL.acts[el.dataset.act]; if (fn) { if (el.tagName === 'A' && !el.dataset.href) e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  CL.acts.closeModal = closeModal;

  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  Object.assign(CL, { icon, esc, avatar, initials, scorePill, sevChip, riskBadge, delta, ring, spark, lineChart, radar, bar, bandColor, toast, modal, closeModal, download });
})();
