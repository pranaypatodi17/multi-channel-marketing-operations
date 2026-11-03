/* MarketFlow — utilities */
(function () {
  const MF = (window.MF = window.MF || {});
  MF.views = {}; MF.actions = {}; MF.handlers = {};
  const pad = (n) => String(n).padStart(2, '0');
  const U = (MF.U = {
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
    parse(s) { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); },
    today() { return U.iso(new Date()); },
    addDays(s, n) { const d = U.parse(s); d.setDate(d.getDate() + n); return U.iso(d); },
    diff(a, b) { return Math.round((U.parse(b) - U.parse(a)) / 864e5); },
    nowLocal() { const d = new Date(); return U.iso(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); },
    dt(s) { const d = U.parse(s); const t = (s.split('T')[1] || '09:00').split(':'); d.setHours(+t[0], +t[1]); return d; },
    fmtDate(s) { return U.parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); },
    fmtDateY(s) { return U.parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); },
    fmtTime(s) { return U.dt(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); },
    fmtDT(s) { return U.fmtDate(s) + ', ' + U.fmtTime(s); },
    fmtTs(ts) { return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); },
    ago(ts) {
      const m = Math.floor((Date.now() - ts) / 60000);
      if (m < 1) return 'just now';
      if (m < 60) return m + 'm ago';
      const h = Math.floor(m / 60);
      if (h < 24) return h + 'h ago';
      const d = Math.floor(h / 24);
      return d < 30 ? d + 'd ago' : U.fmtDate(U.iso(new Date(ts)));
    },
    money(n) { return '$' + Math.round(n).toLocaleString('en-US'); },
    moneyK(n) {
      const a = Math.abs(n), s = n < 0 ? '-' : '';
      if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(2) + 'M';
      if (a >= 1e4) return s + '$' + (a / 1e3).toFixed(0) + 'K';
      if (a >= 1e3) return s + '$' + (a / 1e3).toFixed(1) + 'K';
      return s + '$' + Math.round(a);
    },
    num(n) { return Math.round(n).toLocaleString('en-US'); },
    numK(n) { const a = Math.abs(n); return a >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(Math.round(n)); },
    pct(n, d = 1) { return (isFinite(n) ? n : 0).toFixed(d) + '%'; },
    uid(p) { return p + Math.random().toString(36).slice(2, 9); },
    rng(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    debounce(fn, ms = 180) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
    initials(n) { return n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase(); },
    download(name, text, mime = 'text/plain') {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const a = document.createElement('a'); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500);
    },
    csv(rows) { return rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n'); },
    hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
  });
})();
