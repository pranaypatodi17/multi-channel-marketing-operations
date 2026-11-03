(function () {
  const MF = window.MF, U = MF.U, I = MF.icon, UI = MF.ui, calc = MF.calc;
  UI.st.dashboard = { range: 30 };
  const ICONS = { campaign: 'campaign', approval: 'checkCircle', lead: 'users', workflow: 'zap', calendar: 'calendar', content: 'sparkles' };

  MF.handlers.dashRange = (el) => { UI.st.dashboard.range = +el.value; MF.rerender(); };

  function delta(cur, prev, invert) {
    if (!prev) return '<span class="delta flat">—</span>';
    const d = ((cur - prev) / prev) * 100, good = invert ? d <= 0 : d >= 0;
    return `<span class="delta ${good ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}%</span>`;
  }
  MF.views.dashboard = {
    render() {
      const s = MF.state(), R = UI.st.dashboard.range, t = U.today();
      const from = U.addDays(t, -(R - 1)), pf = U.addDays(t, -(2 * R - 1)), pt = U.addDays(t, -R);
      const cur = calc.total(from, t), prev = calc.total(pf, pt);
      const active = s.campaigns.filter((c) => c.status === 'Active').length;
      const bucket = R <= 30 ? 1 : R <= 90 ? 3 : 7, ser = calc.series(from, t, bucket);
      const ch = calc.byChannel(from, t), chs = MF.CHANNELS.filter((c) => ch[c].spend || ch[c].leads);
      const kpi = (icon, label, val, dl, sp, color) => `<div class="card kpi"><div class="kpi-h"><span class="kpi-i" style="--c:${color}">${I(icon, 18)}</span><span class="muted">${label}</span></div><div class="kpi-v">${val}</div><div class="kpi-f">${dl}<span class="muted sm">vs prev ${R}d</span></div>${sp ? `<div class="kpi-s">${sp}</div>` : ''}</div>`;
      const sp = (k) => MF.charts.spark(calc.series(from, t, Math.max(1, Math.round(R / 14))).map((x) => x[k]), 'currentColor');
      const pending = s.content.filter((c) => c.status === 'Pending'), upcoming = s.content.filter((c) => c.status === 'Scheduled' && c.scheduledAt >= U.nowLocal()).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)).slice(0, 4);
      const run = s.campaigns.filter((c) => c.status === 'Active').slice(0, 5);
      return `
      <div class="page-h"><div><h1>Dashboard</h1><p class="muted">Performance across all channels — updated live as you work.</p></div>
        <div class="row"><label class="sel"><span class="sr">Date range</span><select data-bind="dashRange:change">${[7, 30, 90].map((r) => `<option value="${r}" ${r === R ? 'selected' : ''}>Last ${r} days</option>`).join('')}</select></label>
        <button class="btn primary" data-action="newCampaign">${I('plus', 16)} New campaign</button></div></div>
      <div class="grid kpis">
        ${kpi('campaign', 'Campaigns running', active, `<span class="muted sm">${s.campaigns.length} total</span>`, '', '#5b5bd6')}
        ${kpi('dollar', 'Marketing spend', U.moneyK(cur.spend), delta(cur.spend, prev.spend, true), sp('spend'), '#f59e0b')}
        ${kpi('trend', 'Revenue generated', U.moneyK(cur.revenue), delta(cur.revenue, prev.revenue), sp('revenue'), '#10b981')}
        ${kpi('users', 'Leads captured', U.num(cur.leads), delta(cur.leads, prev.leads), sp('leads'), '#3b82f6')}
        ${kpi('target', 'Lead → customer rate', U.pct(cur.cvr, 1), delta(cur.cvr, prev.cvr), '', '#8b5cf6')}
        ${kpi('chart', 'Marketing ROI', U.pct(cur.roi, 0), delta(cur.roi, prev.roi), '', '#e1306c')}
      </div>
      <div class="grid two-1">
        <section class="card"><div class="card-h"><h3>Revenue vs. spend</h3><span class="muted sm">Last ${R} days</span></div>${MF.charts.line({ labels: ser.map((x) => U.fmtDate(x.date)), series: [{ name: 'Revenue', color: '#10b981', data: ser.map((x) => x.revenue) }, { name: 'Spend', color: '#f59e0b', data: ser.map((x) => x.spend) }] })}</section>
        <section class="card"><div class="card-h"><h3>Recent activity</h3></div><ul class="feed">${s.activity.slice(0, 7).map((a) => `<li><span class="ai ${a.type}">${I(ICONS[a.type] || 'bell', 14)}</span><div>${U.esc(a.text)}<small>${U.ago(a.at)}</small></div></li>`).join('')}</ul></section>
      </div>
      <div class="grid two">
        <section class="card"><div class="card-h"><h3>Channel performance</h3><span class="muted sm">Spend vs. revenue</span></div>${MF.charts.bars({ labels: chs, series: [{ name: 'Spend', color: '#f59e0b', data: chs.map((c) => ch[c].spend) }, { name: 'Revenue', color: '#10b981', data: chs.map((c) => ch[c].revenue) }], h: 240 })}</section>
        <section class="card"><div class="card-h"><h3>Channel breakdown</h3></div><div class="tbl-w"><table class="tbl"><thead><tr><th>Channel</th><th class="r">Leads</th><th class="r">Spend</th><th class="r">Revenue</th><th class="r">ROI</th></tr></thead><tbody>
          ${chs.map((c) => { const x = ch[c], roi = x.spend ? ((x.revenue - x.spend) / x.spend) * 100 : 0; return `<tr><td>${UI.chBadge(c)}</td><td class="r">${U.num(x.leads)}</td><td class="r">${U.moneyK(x.spend)}</td><td class="r">${U.moneyK(x.revenue)}</td><td class="r"><span class="${roi >= 0 ? 'pos' : 'neg'}">${U.pct(roi, 0)}</span></td></tr>`; }).join('')}</tbody></table></div></section>
      </div>
      <div class="grid three">
        <section class="card"><div class="card-h"><h3>Active campaigns</h3><a class="link" href="#/campaigns">View all</a></div>${run.length ? run.map((c) => { const m = calc.campaign(c), pc = U.clamp((m.spend / c.budget) * 100, 0, 100); return `<button class="mini-row" data-action="openCampaign" data-id="${c.id}"><div><b>${U.esc(c.name)}</b><small>${U.money(m.spend)} of ${U.money(c.budget)} · ${m.leads} leads</small><div class="bar"><i style="width:${pc}%"></i></div></div></button>`; }).join('') : UI.empty('campaign', 'No active campaigns', 'Create one to get started.')}</section>
        <section class="card"><div class="card-h"><h3>Awaiting approval</h3><a class="link" href="#/approvals">Open center</a></div>${pending.length ? pending.slice(0, 4).map((p) => `<a class="mini-row" href="#/approvals"><div><b>${U.esc(p.headline)}</b><small>${UI.chBadge(p.channel)} · ${U.esc((MF.get.campaign(p.campaignId) || {}).name || 'Standalone')}</small></div></a>`).join('') : UI.empty('checkCircle', 'All caught up', 'No content is waiting for review.')}</section>
        <section class="card"><div class="card-h"><h3>Upcoming posts</h3><a class="link" href="#/calendar">Calendar</a></div>${upcoming.length ? upcoming.map((p) => `<a class="mini-row" href="#/calendar"><div><b>${U.esc(p.headline)}</b><small>${UI.chBadge(p.channel)} · ${U.fmtDT(p.scheduledAt)}</small></div></a>`).join('') : UI.empty('calendar', 'Nothing scheduled', 'Approve content to schedule it.')}</section>
      </div>`;
    },
  };
  MF.actions.newCampaign = () => MF.views.campaigns.form();
})();
