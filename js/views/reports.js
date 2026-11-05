(function () {
  const MF = window.MF, U = MF.U, I = MF.icon, UI = MF.ui, calc = MF.calc;
  const st = (UI.st.reports = { range: '90', sort: 'revenue', dir: -1, page: 1 });
  const RANGES = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last 12 months'], ['all', 'All time']];
  MF.handlers.repRange = (el) => { st.range = el.value; MF.rerender(); };
  function win() { const t = U.today(); if (st.range === 'all') return [MF.state().campaigns.reduce((a, c) => (c.start < a ? c.start : a), t), t]; return [U.addDays(t, -(+st.range - 1)), t]; }
  const rowsOf = () => { const [f, t] = win(); return MF.state().campaigns.map((c) => Object.assign({ c }, calc.campaign(c, f, t))).filter((r) => r.spend || r.leads || r.revenue); };

  MF.actions.repExport = function () {
    const m = UI.modal({
      title: 'Export report', size: 'sm', body: `<div class="form one"><label class="f">Format<select id="ex-f"><option value="csv">CSV (spreadsheet)</option><option value="json">JSON</option><option value="pdf">PDF (print dialog)</option></select></label>
        <label class="f">Includes<select id="ex-s"><option value="camp">Campaign performance</option><option value="chan">Channel performance</option><option value="content">Content performance</option></select></label>
        <div class="prog" id="ex-p" hidden><div class="bar tall"><i id="ex-b" style="width:0"></i></div><small class="muted" id="ex-t">Preparing…</small></div></div>`,
      buttons: [{ label: 'Cancel', cls: 'ghost' }, { label: I('download', 14) + ' Generate', cls: 'primary', onClick(md) { run(md); return false; } }],
    });
    function run(md) {
      const q = (s) => md.el.querySelector(s), fmt = q('#ex-f').value, sec = q('#ex-s').value, btn = md.el.querySelector('[data-b="1"]'); btn.disabled = true; q('#ex-p').hidden = false;
      const msgs = ['Collecting data…', 'Calculating metrics…', 'Formatting report…', 'Done!']; let p = 0;
      const iv = setInterval(() => {
        p += 7 + Math.random() * 14; q('#ex-b').style.width = Math.min(100, p) + '%'; q('#ex-t').textContent = msgs[Math.min(3, Math.floor(p / 28))];
        if (p >= 100) { clearInterval(iv); md.close(); finish(fmt, sec); }
      }, 160);
    }
    function finish(fmt, sec) {
      const [f, t] = win(); let head, data;
      if (sec === 'camp') { head = ['Campaign', 'Status', 'Spend', 'Revenue', 'ROI %', 'Leads', 'Impressions', 'Clicks', 'Customers']; data = rowsOf().map((r) => [r.c.name, r.c.status, r.spend.toFixed(0), r.revenue.toFixed(0), r.roi.toFixed(1), r.leads, Math.round(r.impressions), Math.round(r.clicks), r.customers.toFixed(0)]); }
      else if (sec === 'chan') { const ch = calc.byChannel(f, t); head = ['Channel', 'Spend', 'Revenue', 'Leads', 'Impressions', 'Clicks']; data = MF.CHANNELS.map((c) => [c, ch[c].spend.toFixed(0), ch[c].revenue.toFixed(0), ch[c].leads, Math.round(ch[c].impressions), Math.round(ch[c].clicks)]); }
      else { head = ['Headline', 'Channel', 'Campaign', 'Published', 'Reach', 'Engagements', 'Clicks', 'Leads']; data = MF.state().content.filter((x) => x.perf).map((x) => [x.headline, x.channel, (MF.get.campaign(x.campaignId) || {}).name || '', x.scheduledAt, x.perf.reach, x.perf.engagements, x.perf.clicks, x.perf.leads]); }
      if (fmt === 'csv') U.download(`marketflow-${sec}-${t}.csv`, U.csv([head, ...data]), 'text/csv');
      else if (fmt === 'json') U.download(`marketflow-${sec}-${t}.json`, JSON.stringify(data.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]]))), null, 2), 'application/json');
      else window.print();
      UI.toast(`Report ready — ${data.length} rows exported as ${fmt.toUpperCase()}`);
    }
  };

  const GET = { name: (r) => r.c.name.toLowerCase(), spend: (r) => r.spend, revenue: (r) => r.revenue, roi: (r) => r.roi, leads: (r) => r.leads, cvr: (r) => r.cvr };
  function table() { const w = document.getElementById('tbl-reports'); if (w) w.innerHTML = tableHtml(); }
  function tableHtml() {
    const all = UI.sortBy(rowsOf(), st, GET), pg = UI.page(all, st, 6);
    return `<div class="tbl-w"><table class="tbl"><thead><tr>${UI.th('reports', 'name', 'Campaign', st)}${UI.th('reports', 'spend', 'Spend', st)}${UI.th('reports', 'revenue', 'Revenue', st)}${UI.th('reports', 'roi', 'ROI', st)}${UI.th('reports', 'leads', 'Leads', st)}${UI.th('reports', 'cvr', 'Conv. rate', st)}</tr></thead><tbody>${pg.map((r) => `<tr><td><b>${U.esc(r.c.name)}</b> ${UI.badge(r.c.status)}</td><td>${U.moneyK(r.spend)}</td><td>${U.moneyK(r.revenue)}</td><td><span class="${r.roi >= 0 ? 'pos' : 'neg'}">${U.pct(r.roi, 0)}</span></td><td>${r.leads}</td><td>${U.pct(r.cvr, 2)}</td></tr>`).join('')}</tbody></table></div>${UI.pager('reports', all.length, st.page, 6)}`;
  }

  MF.views.reports = {
    table,
    render() {
      const [f, t] = win(), tot = calc.total(f, t), rows = rowsOf(), ch = calc.byChannel(f, t), days = U.diff(f, t) + 1, bucket = days <= 31 ? 1 : days <= 120 ? 3 : 7, ser = calc.series(f, t, bucket);
      const top = [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 7);
      const content = MF.state().content.filter((x) => x.perf && x.scheduledAt.slice(0, 10) >= f && x.scheduledAt.slice(0, 10) <= t).sort((a, b) => b.perf.engagements - a.perf.engagements).slice(0, 6);
      const stat = (l, v, s) => `<div class="card kpi sm"><span class="muted">${l}</span><div class="kpi-v">${v}</div><small class="muted">${s}</small></div>`;
      return `<div class="page-h"><div><h1>Reports & Analytics</h1><p class="muted">Revenue, funnel and content performance — built from live campaign and lead data.</p></div>
        <div class="row"><label class="sel"><span class="sr">Date range</span><select data-bind="repRange:change">${RANGES.map((r) => `<option value="${r[0]}" ${r[0] === st.range ? 'selected' : ''}>${r[1]}</option>`).join('')}</select></label><button class="btn primary" data-action="repExport">${I('download', 15)} Export report</button></div></div>
      <div class="grid kpis5">${stat('Revenue', U.moneyK(tot.revenue), `${U.fmtDate(f)} – ${U.fmtDate(t)}`)}${stat('Spend', U.moneyK(tot.spend), U.money(tot.leads ? tot.spend / tot.leads : 0) + ' per lead')}${stat('ROI', U.pct(tot.roi, 0), 'return on spend')}${stat('Leads', U.num(tot.leads), U.num(tot.qualified) + ' qualified')}${stat('Customers', U.num(tot.customers), U.pct(tot.cvr, 1) + ' of leads')}</div>
      <div class="grid two"><section class="card"><div class="card-h"><h3>Marketing spend vs. revenue</h3></div>${MF.charts.line({ labels: ser.map((x) => U.fmtDate(x.date)), series: [{ name: 'Revenue', color: '#10b981', data: ser.map((x) => x.revenue) }, { name: 'Spend', color: '#f59e0b', data: ser.map((x) => x.spend) }] })}</section>
        <section class="card"><div class="card-h"><h3>Revenue by campaign</h3></div>${top.length ? MF.charts.hbars(top.map((r, i) => ({ label: r.c.name, value: r.revenue, color: ['#5b5bd6', '#7c7cf0', '#8b5cf6', '#a78bfa', '#6366f1', '#818cf8', '#a5b4fc'][i] }))) : UI.empty('chart', 'No data in range', '')}</section></div>
      <div class="grid three"><section class="card"><div class="card-h"><h3>Leads by channel</h3></div>${MF.charts.donut({ items: MF.CHANNELS.map((c) => ({ label: c, value: ch[c].leads, color: MF.CH_COLOR[c] })).filter((x) => x.value), center: { big: U.num(tot.leads), small: 'leads' } })}</section>
        <section class="card span2"><div class="card-h"><h3>Campaign conversion funnel</h3></div>${MF.charts.funnel([{ label: 'Impressions', value: tot.impressions }, { label: 'Clicks', value: tot.clicks }, { label: 'Leads', value: tot.leads }, { label: 'Qualified', value: tot.qualified }, { label: 'Customers', value: tot.customers }])}</section></div>
      <div class="grid two"><section class="card"><div class="card-h"><h3>Best-performing content</h3></div>${content.length ? `<ul class="top-c">${content.map((x, i) => `<li><span class="rk">${i + 1}</span><div class="grow"><a href="#/studio?open=${x.id}"><b>${U.esc(x.headline)}</b></a><small class="muted block">${UI.chBadge(x.channel)} ${U.esc((MF.get.campaign(x.campaignId) || {}).name || '')}</small></div><div class="r"><b>${U.numK(x.perf.engagements)}</b><small class="muted block">engagements · ${x.perf.leads} leads</small></div></li>`).join('')}</ul>` : UI.empty('file', 'No published content in range', 'Try a wider date range.')}</section>
        <section class="card"><div class="card-h"><h3>Campaign performance</h3></div><div id="tbl-reports">${tableHtml()}</div></section></div>`;
    },
  };
})();
