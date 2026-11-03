/* MarketFlow — lightweight SVG/HTML charts */
(function () {
  const MF = window.MF, U = MF.U;
  const C = (MF.charts = {});
  const niceMax = (v) => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };

  C.line = function ({ labels, series, h = 260, fmt = U.moneyK, area = true }) {
    const W = 640, H = h, pl = 46, pr = 10, pt = 12, pb = 26;
    const max = niceMax(Math.max(1, ...series.flatMap((s) => s.data)));
    const x = (i) => pl + (labels.length < 2 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (labels.length - 1));
    const y = (v) => pt + (H - pt - pb) * (1 - v / max);
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = (max * i) / 4; g += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; }
    const step = Math.ceil(labels.length / 7);
    labels.forEach((l, i) => { if (i % step === 0) g += `<text class="axis" x="${x(i)}" y="${H - 7}" text-anchor="middle">${U.esc(l)}</text>`; });
    let paths = '';
    series.forEach((s, si) => {
      const pts = s.data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
      if (area && si === 0) paths += `<path d="M${x(0)},${y(0)} L${pts.join(' L')} L${x(labels.length - 1)},${y(0)}Z" fill="${s.color}" opacity=".10"/>`;
      paths += `<polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
    const cw = (W - pl - pr) / Math.max(1, labels.length - 1);
    const hits = labels.map((l, i) => {
      const tip = `<b>${U.esc(l)}</b>` + series.map((s) => `<br><span class="dot" style="background:${s.color}"></span>${U.esc(s.name)}: <b>${fmt(s.data[i])}</b>`).join('');
      return `<rect class="hit" x="${x(i) - cw / 2}" y="${pt}" width="${cw}" height="${H - pt - pb}" data-tip='${tip.replace(/'/g, '&#39;')}'/>`;
    }).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart">${g}${paths}${hits}</svg>${C.legend(series)}`;
  };

  C.bars = function ({ labels, series, h = 260, fmt = U.moneyK }) {
    const W = 640, H = h, pl = 46, pr = 10, pt = 12, pb = 28;
    const max = niceMax(Math.max(1, ...series.flatMap((s) => s.data)));
    const y = (v) => pt + (H - pt - pb) * (1 - v / max);
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = (max * i) / 4; g += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; }
    const gw = (W - pl - pr) / labels.length, bw = Math.min(34, (gw * 0.7) / series.length);
    let bars = '';
    labels.forEach((l, i) => {
      const cx = pl + gw * i + gw / 2;
      series.forEach((s, si) => {
        const bx = cx - (bw * series.length) / 2 + si * bw, by = y(s.data[i]);
        bars += `<rect class="cbar" x="${bx + 1}" y="${by}" width="${bw - 2}" height="${Math.max(0, H - pb - by)}" rx="3" fill="${s.color}" data-tip="<b>${U.esc(l)}</b><br>${U.esc(s.name)}: <b>${fmt(s.data[i])}</b>"/>`;
      });
      bars += `<text class="axis" x="${cx}" y="${H - 9}" text-anchor="middle">${U.esc(l.length > 10 ? l.slice(0, 9) + '…' : l)}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart">${g}${bars}</svg>${C.legend(series)}`;
  };

  C.legend = (series) => `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${U.esc(s.name)}</span>`).join('')}</div>`;

  C.donut = function ({ items, center }) {
    const total = items.reduce((a, b) => a + b.value, 0) || 1, R = 70, r = 46; let a0 = -Math.PI / 2, arcs = '';
    items.forEach((it) => {
      if (!it.value) return;
      const frac = it.value / total, a1 = a0 + frac * Math.PI * 2 - (frac === 1 ? 0.0001 : 0), lg = a1 - a0 > Math.PI ? 1 : 0;
      const p = (rad, a) => [(100 + rad * Math.cos(a)).toFixed(2), (100 + rad * Math.sin(a)).toFixed(2)];
      const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0);
      arcs += `<path class="dseg" d="M${x0},${y0} A${R},${R} 0 ${lg} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${lg} 0 ${x3},${y3}Z" fill="${it.color}" data-tip="<b>${U.esc(it.label)}</b><br>${U.num(it.value)} (${U.pct((frac) * 100, 0)})"/>`;
      a0 += frac * Math.PI * 2;
    });
    return `<div class="donut"><svg viewBox="0 0 200 200" role="img" aria-label="Donut chart">${arcs}<text x="100" y="98" text-anchor="middle" class="d-big">${center.big}</text><text x="100" y="116" text-anchor="middle" class="d-small">${center.small}</text></svg>
      <ul class="d-leg">${items.map((it) => `<li><i style="background:${it.color}"></i><span>${U.esc(it.label)}</span><b>${U.num(it.value)}</b></li>`).join('')}</ul></div>`;
  };

  C.hbars = function (items, fmt = U.moneyK) {
    const max = Math.max(1, ...items.map((i) => i.value));
    return `<div class="hbars">${items.map((i) => `<div class="hb"><div class="hb-l" title="${U.esc(i.label)}">${U.esc(i.label)}</div><div class="hb-t"><div class="hb-f" style="width:${Math.max(2, (i.value / max) * 100)}%;background:${i.color || 'var(--primary)'}"></div></div><div class="hb-v">${fmt(i.value)}</div></div>`).join('')}</div>`;
  };

  C.funnel = function (stages) {
    const max = Math.max(1, stages[0].value);
    return `<div class="funnel">${stages.map((s, i) => {
      const w = Math.max(8, (s.value / max) * 100), rate = i ? (s.value / Math.max(1, stages[i - 1].value)) * 100 : 100;
      return `<div class="fn"><div class="fn-bar" style="width:${w}%;opacity:${1 - i * 0.14}"><span>${U.esc(s.label)}</span></div><div class="fn-v"><b>${U.numK(s.value)}</b>${i ? `<small>${U.pct(rate, rate < 10 ? 1 : 0)} of prev</small>` : '<small>top of funnel</small>'}</div></div>`;
    }).join('')}</div>`;
  };

  C.spark = function (data, color = 'var(--primary)') {
    if (data.length < 2) return '';
    const W = 100, H = 30, max = Math.max(...data), min = Math.min(...data), rg = max - min || 1;
    const pts = data.map((v, i) => `${((i * W) / (data.length - 1)).toFixed(1)},${(H - 3 - ((v - min) / rg) * (H - 6)).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
  };

  // tooltip
  document.addEventListener('mousemove', (e) => {
    const el = e.target.closest && e.target.closest('[data-tip]'); let tip = document.getElementById('tip');
    if (!el) { if (tip) tip.style.display = 'none'; return; }
    if (!tip) { tip = document.createElement('div'); tip.id = 'tip'; tip.className = 'tip'; document.body.appendChild(tip); }
    tip.innerHTML = el.getAttribute('data-tip'); tip.style.display = 'block';
    const w = tip.offsetWidth; tip.style.left = Math.min(window.innerWidth - w - 8, e.clientX + 14) + 'px'; tip.style.top = e.clientY + 14 + 'px';
  });
})();
