/* MarketFlow — data store, seed data & domain logic */
(function () {
  const MF = window.MF, U = MF.U;
  const KEY = 'marketflow.v1';
  MF.CHANNELS = ['Instagram', 'Facebook', 'LinkedIn', 'Email', 'Google Ads', 'Website'];
  MF.CH_COLOR = { Instagram: '#e1306c', Facebook: '#3b82f6', LinkedIn: '#0ea5e9', Email: '#f59e0b', 'Google Ads': '#10b981', Website: '#8b5cf6' };
  MF.STATUSES = ['Draft', 'In Review', 'Scheduled', 'Active', 'Completed'];
  MF.LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
  MF.ME = { name: 'Jordan Lee', role: 'Marketing Manager' };
  MF.REVIEWERS = ['Alex Morgan', 'Priya Nair', 'Sam Okafor'];
  MF.REPS = [
    { id: 'r1', name: 'Maya Patel', region: 'North America' },
    { id: 'r2', name: 'Daniel Brooks', region: 'EMEA' },
    { id: 'r3', name: 'Sofia Rossi', region: 'North America' },
    { id: 'r4', name: 'Kenji Tanaka', region: 'APAC' },
    { id: 'r5', name: 'Amara Okoye', region: 'EMEA' },
  ];
  MF.ACTIONS = {
    assign: 'Assign to sales rep', email: 'Send follow-up email', nurture: 'Add to nurture sequence', slack: 'Notify sales on Slack', task: 'Create follow-up task',
  };
  MF.THRESH = { hot: 70, warm: 40 };

  let S = null; const subs = [];
  MF.on = (fn) => subs.push(fn);
  MF.save = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } };
  MF.commit = function () { MF.save(); subs.forEach((f) => f()); };
  MF.state = () => S;

  /* ---------- seed ---------- */
  const FN = ['Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas', 'Mia', 'Logan', 'Amelia', 'Elijah', 'Harper', 'James', 'Evelyn', 'Benjamin', 'Chloe', 'Henry', 'Priya', 'Arjun', 'Yuki', 'Mateo', 'Fatima', 'Omar', 'Hannah', 'Leo', 'Zara', 'Ivan'];
  const LN = ['Nguyen', 'Garcia', 'Smith', 'Khan', 'Johnson', 'Martinez', 'Brown', 'Lee', 'Davis', 'Wilson', 'Anderson', 'Thomas', 'Moore', 'Clark', 'Lopez', 'Hill', 'Young', 'Patel', 'Cohen', 'Silva', 'Novak', 'Schmidt', 'Kim', 'Dubois', 'Ali', 'Fischer', 'Reyes', 'Murphy'];
  const CO = ['Northwind', 'Brightline', 'Acme Retail', 'Lumen Labs', 'Harbor & Co', 'Pixelcraft', 'Summit Foods', 'Orbit Systems', 'Bluepeak', 'GreenLeaf', 'Vantage Group', 'Kite Studio', 'Atlas Logistics', 'Nimbus Cloud', 'Foxglove', 'Redwood Bank', 'Zenith Health', 'Copperfield', 'Mosaic Media', 'Tidewater'];
  const TITLES = ['CEO', 'Founder', 'VP Marketing', 'Marketing Director', 'Head of Growth', 'Marketing Manager', 'Product Manager', 'Operations Lead', 'Brand Manager', 'Analyst', 'Coordinator', 'Owner'];
  const SRC_W = { Website: 12, 'Google Ads': 10, Email: 14, LinkedIn: 16, Instagram: 6, Facebook: 7 };
  MF.segment = (score) => (score >= MF.THRESH.hot ? 'Hot' : score >= MF.THRESH.warm ? 'Warm' : 'Cold');

  function scoreLead(l, r) {
    const t = /(CEO|Founder|Owner|VP|Director|Head)/.test(l.title) ? 22 : /(Manager|Lead)/.test(l.title) ? 14 : 6;
    const s = l.size > 500 ? 14 : l.size > 50 ? 9 : 4;
    return Math.min(99, Math.round((SRC_W[l.source] || 8) + t + s + l.engagement + r() * 8));
  }
  function newPerson(r, campaign, source, ts) {
    const fn = FN[Math.floor(r() * FN.length)], ln = LN[Math.floor(r() * LN.length)], co = CO[Math.floor(r() * CO.length)];
    const l = {
      id: U.uid('L'), name: fn + ' ' + ln, email: (fn + '.' + ln).toLowerCase() + '@' + co.toLowerCase().replace(/[^a-z]/g, '') + '.com',
      phone: '+1 (555) ' + String(100 + Math.floor(r() * 899)) + '-' + String(1000 + Math.floor(r() * 8999)),
      company: co, title: TITLES[Math.floor(r() * TITLES.length)], size: [12, 40, 85, 220, 640, 1500][Math.floor(r() * 6)],
      source, campaignId: campaign ? campaign.id : null, engagement: Math.round(40 * Math.pow(r(), 1.7)), status: 'New', rep: null,
      ts, date: U.iso(new Date(ts)), value: Math.round((800 + r() * 11000) / 50) * 50, interactions: [],
    };
    l.score = scoreLead(l, r);
    l.interactions.push({ type: 'capture', text: `Captured via ${source}${campaign ? ' · ' + campaign.name : ''}`, at: ts });
    return l;
  }

  function seed() {
    const r = U.rng(20261103), today = U.today(), now = Date.now();
    const spec = [
      ['Black Friday Mega Sale', 'Sales', "Deal-seeking shoppers, 25–44", ['Instagram', 'Facebook', 'Email', 'Google Ads'], 48000, -12, 30, 'Active', 'Bold', 'Black Friday deals'],
      ['Q4 B2B Webinar Series', 'Lead generation', 'Marketing leaders at mid-size companies', ['LinkedIn', 'Email', 'Website'], 36000, -30, 75, 'Active', 'Professional', 'Q4 webinar series'],
      ['Spring Product Launch', 'Awareness', 'Design-minded early adopters', ['Instagram', 'Facebook', 'Google Ads', 'Email'], 52000, -200, 45, 'Completed', 'Playful', 'spring launch'],
      ['Holiday Gift Guide', 'Sales', 'Gift buyers and families', ['Instagram', 'Facebook', 'Email', 'Website'], 30000, 10, 40, 'Scheduled', 'Friendly', 'holiday gifts'],
      ['Customer Loyalty Rewards', 'Retention', 'Existing customers', ['Email', 'Website', 'Instagram'], 18000, -45, 90, 'Active', 'Friendly', 'loyalty rewards'],
      ['Summer Brand Awareness', 'Awareness', 'Young professionals, 22–35', ['Instagram', 'Facebook', 'Google Ads'], 41000, -130, 60, 'Completed', 'Playful', 'summer brand story'],
      ['New Year Resolutions Push', 'Engagement', 'Goal-oriented self-improvers', ['Instagram', 'Email', 'LinkedIn'], 22000, 45, 30, 'In Review', 'Bold', 'new year goals'],
      ['Referral Program Boost', 'Lead generation', 'Happy customers and partners', ['Email', 'Website', 'Facebook'], 15000, 60, 45, 'Draft', 'Friendly', 'referral rewards'],
      ['LinkedIn Thought Leadership', 'Awareness', 'B2B decision makers', ['LinkedIn', 'Email'], 24000, -60, 100, 'Active', 'Professional', 'industry insights'],
      ['Back to School Savings', 'Sales', 'Parents and students', ['Facebook', 'Instagram', 'Email', 'Google Ads'], 27000, -90, 30, 'Completed', 'Urgent', 'back to school deals'],
    ];
    const campaigns = [], leads = [], content = [], activity = [];
    spec.forEach((s, i) => {
      const start = U.addDays(today, s[5]), end = U.addDays(start, s[6] - 1), budget = s[4];
      const split = {}; let tot = 0; s[3].forEach((ch) => { split[ch] = 0.5 + r(); tot += split[ch]; }); s[3].forEach((ch) => (split[ch] = split[ch] / tot));
      const dailySpend = (budget * (0.82 + r() * 0.14)) / s[6], roas = 1.6 + r() * 2.6;
      const imps = dailySpend * (12 + r() * 12);
      campaigns.push({
        id: 'C' + (i + 1), name: s[0], objective: s[1], audience: s[2], channels: s[3], budget, start, end, status: s[7], tone: s[8], topic: s[9],
        owner: ['Jordan Lee', 'Priya Nair', 'Alex Morgan'][i % 3], created: now - (i + 3) * 864e5 * 4, split,
        brief: `Drive ${s[1].toLowerCase()} for ${s[2].toLowerCase()} across ${s[3].join(', ')} with a ${s[8].toLowerCase()} voice.`,
        m: { spend: dailySpend, impressions: imps, clicks: imps * (0.012 + r() * 0.02), customers: 0, revenue: dailySpend * roas * 0.55 },
      });
    });
    campaigns.forEach((c) => {
      const started = c.start <= today; if (!started) { c.m = { spend: 0, impressions: 0, clicks: 0, customers: 0, revenue: 0 }; c.pre = true; }
      if (started) {
        const e = c.end < today ? c.end : today, days = U.diff(c.start, e) + 1;
        const n = Math.round((20 + r() * 40) * Math.min(1, Math.pow(days / 40, 0.6) + 0.2));
        for (let k = 0; k < n; k++) {
          const src = c.channels[Math.floor(r() * c.channels.length)];
          const d = U.addDays(c.start, Math.floor(Math.pow(r(), 0.8) * days));
          const ts = U.parse(d).getTime() + Math.floor(8 + r() * 10) * 36e5;
          const l = newPerson(r, c, src, Math.min(ts, now - 36e5));
          const age = U.diff(d, today), q = r();
          l.status = age < 3 ? 'New' : q < 0.2 ? 'New' : q < 0.45 ? 'Contacted' : q < 0.62 ? 'Qualified' : q < 0.74 ? 'Proposal' : q < 0.87 ? 'Won' : 'Lost';
          if (l.score >= 70 && (l.status === 'New' || l.status === 'Lost') && r() < 0.5) l.status = 'Qualified';
          if (l.status !== 'New') {
            l.rep = MF.REPS[Math.floor(r() * MF.REPS.length)].id;
            l.interactions.push({ type: 'assign', text: 'Assigned to ' + MF.REPS.find((x) => x.id === l.rep).name, at: l.ts + 36e5 });
            l.interactions.push({ type: 'email', text: 'Welcome email opened', at: l.ts + 72e5 });
          }
          if (l.status !== 'New') l.interactions.push({ type: 'status', text: 'Status → ' + l.status, at: l.ts + 864e5 });
          leads.push(l);
        }
      }
    });

    // content
    const times = ['09:00', '11:30', '13:00', '15:30', '18:00'];
    const hist = (kind, base, note) => {
      const h = [{ action: 'created', by: MF.ME.name, at: base }];
      if (kind === 'Draft') return h;
      h.push({ action: 'submitted', by: MF.ME.name, at: base + 36e5 });
      const rev = MF.REVIEWERS[Math.floor(r() * 3)];
      if (kind === 'Pending') return h;
      if (kind === 'Revision') { h.push({ action: 'revision', by: rev, at: base + 72e5, note: note || 'Tone feels too formal — can we make the opening punchier?' }); return h; }
      if (kind === 'Rejected') { h.push({ action: 'rejected', by: rev, at: base + 72e5, note: note || 'Offer terms do not match legal-approved wording.' }); return h; }
      h.push({ action: 'approved', by: rev, at: base + 72e5, note: 'Looks great, approved.' });
      h.push({ action: 'scheduled', by: MF.ME.name, at: base + 80e5 });
      if (kind === 'Published') h.push({ action: 'published', by: 'MarketFlow', at: base + 90e5 });
      return h;
    };
    campaigns.forEach((c, ci) => {
      const brief = { name: c.name, audience: c.audience, objective: c.objective, tone: c.tone, topic: c.topic };
      const span = U.diff(c.start, c.end);
      const make = (ch, status, date, k) => {
        const g = MF.gen(ch, brief, U.hash('seed-' + ci + ch + k + status));
        const base = now - (3 + ((ci + k) % 9)) * 864e5;
        const it = Object.assign({ id: U.uid('P'), campaignId: c.id, channel: ch, status, scheduledAt: date ? date + 'T' + times[(ci + k + ch.length) % 5] : null, author: MF.ME.name, history: hist(status, base), createdAt: base }, g);
        if (status === 'Published') it.perf = perfFor(it);
        content.push(it);
      };
      c.channels.forEach((ch, chi) => {
        if (c.status === 'Draft') make(ch, 'Draft', null, 0);
        else if (c.status === 'In Review') { make(ch, chi === 0 ? 'Revision' : 'Pending', U.addDays(c.start, chi), 0); if (chi === 1) make(ch, 'Draft', null, 1); }
        else if (c.status === 'Scheduled') { make(ch, 'Scheduled', U.addDays(c.start, chi), 0); make(ch, 'Scheduled', U.addDays(c.start, 3 + chi * 2), 1); }
        else {
          const posts = c.status === 'Completed' ? 2 : 3;
          for (let k = 0; k < posts; k++) {
            const d = U.addDays(c.start, Math.floor(((k + 0.5 + chi * 0.17) * span) / posts));
            const st = d < today ? 'Published' : 'Scheduled';
            make(ch, st, d, k);
          }
        }
      });
      if (ci === 0) make('Facebook', 'Rejected', null, 7), make('Instagram', 'Pending', U.addDays(today, 4), 8), make('Email', 'Pending', U.addDays(today, 6), 9);
      if (ci === 1) make('LinkedIn', 'Pending', U.addDays(today, 3), 8), make('Website', 'Draft', null, 9);
      if (ci === 8) make('LinkedIn', 'Approved', null, 7);
    });
    content.forEach((it) => { if (it.status === 'Approved') it.history = hist('Approved', it.createdAt).slice(0, 3); });

    const wf = (id, name, sources, acts, runs) => ({ id, name, active: true, sources, model: 'Engagement + firmographic fit', actions: acts, runs, log: [] });
    const workflows = [
      wf('W1', 'Lead Nurture — Core Pipeline', ['Instagram', 'Website', 'Email', 'Facebook'], { Hot: 'assign', Warm: 'email', Cold: 'nurture' }, 182),
      wf('W2', 'B2B Fast-Track (LinkedIn & Ads)', ['LinkedIn', 'Google Ads'], { Hot: 'slack', Warm: 'assign', Cold: 'email' }, 64),
    ];
    workflows.push(Object.assign(wf('W3', 'Win-back Sequence (paused)', ['Email'], { Hot: 'task', Warm: 'email', Cold: 'nurture' }, 12), { active: false }));

    [
      ['campaign', 'Black Friday Mega Sale went live', 'C1', 3.2], ['approval', 'Priya Nair approved "Spring Teaser" for Instagram', 'C3', 7],
      ['lead', 'New hot lead captured from LinkedIn', 'C9', 12], ['workflow', 'Workflow "Lead Nurture" processed 14 leads', 'W1', 26], ['campaign', 'Customer Loyalty Rewards reached 60% of budget', 'C5', 40],
    ].forEach((a, i) => activity.push({ id: U.uid('A'), type: a[0], text: a[1], ref: a[2], at: now - a[3] * 36e5 * (i + 1) }));
    activity.sort((a, b) => b.at - a.at);
    return { v: 1, settings: { theme: 'light' }, campaigns, content, leads, workflows, activity, seq: 0 };
  }

  const CH_REACH = { Instagram: 22000, Facebook: 14000, LinkedIn: 9000, Email: 6000, 'Google Ads': 30000, Website: 8000 };
  function perfFor(it) {
    const rr = U.rng(U.hash(it.id + it.channel));
    const reach = Math.round(CH_REACH[it.channel] * (0.4 + rr() * 1.4));
    const eng = reach * (it.channel === 'Email' ? 0.18 + rr() * 0.2 : 0.02 + rr() * 0.07);
    return { reach, engagements: Math.round(eng), clicks: Math.round(eng * (0.2 + rr() * 0.3)), leads: Math.round(eng * (0.01 + rr() * 0.04)) };
  }

  /* ---------- calculations ---------- */
  const calc = (MF.calc = {});
  function overlap(c, from, to) {
    const t = U.today(), e = c.end < t ? c.end : t;
    if (e < c.start) return 0;
    const lo = from && from > c.start ? from : c.start, hi = to && to < e ? to : e;
    return hi < lo ? 0 : U.diff(lo, hi) + 1;
  }
  calc.campaign = function (c, from, to) {
    const d = overlap(c, from, to);
    const L = S.leads.filter((l) => l.campaignId === c.id && (!from || l.date >= from) && (!to || l.date <= to));
    const won = L.filter((l) => l.status === 'Won');
    const qual = L.filter((l) => ['Qualified', 'Proposal', 'Won'].includes(l.status)).length;
    const o = { spend: c.m.spend * d, impressions: c.m.impressions * d, clicks: c.m.clicks * d, leads: L.length, qualified: qual, customers: c.m.customers * d + won.length, revenue: c.m.revenue * d + won.reduce((a, l) => a + l.value, 0) };
    o.qualified = Math.min(o.qualified, o.leads); o.roi = o.spend ? ((o.revenue - o.spend) / o.spend) * 100 : 0;
    o.cvr = o.leads ? (o.customers / o.leads) * 100 : 0; o.ctr = o.impressions ? (o.clicks / o.impressions) * 100 : 0; o.cpl = o.leads ? o.spend / o.leads : 0;
    return o;
  };
  calc.total = function (from, to) {
    const t = { spend: 0, impressions: 0, clicks: 0, leads: 0, qualified: 0, customers: 0, revenue: 0 };
    S.campaigns.forEach((c) => { const m = calc.campaign(c, from, to); Object.keys(t).forEach((k) => (t[k] += m[k])); });
    t.roi = t.spend ? ((t.revenue - t.spend) / t.spend) * 100 : 0; t.cvr = t.leads ? (t.customers / t.leads) * 100 : 0;
    return t;
  };
  calc.byChannel = function (from, to) {
    const out = {}; MF.CHANNELS.forEach((ch) => (out[ch] = { spend: 0, revenue: 0, leads: 0, clicks: 0, impressions: 0 }));
    S.campaigns.forEach((c) => {
      const m = calc.campaign(c, from, to);
      c.channels.forEach((ch) => { const sp = c.split[ch] || 0; ['spend', 'impressions', 'clicks'].forEach((k) => (out[ch][k] += m[k] * sp)); out[ch].revenue += (m.revenue - 0) * sp; });
    });
    S.leads.forEach((l) => { if ((!from || l.date >= from) && (!to || l.date <= to)) out[l.source].leads++; });
    return out;
  };
  calc.series = function (from, to, bucket) {
    const days = U.diff(from, to) + 1, arr = [];
    for (let i = 0; i < days; i++) arr.push({ date: U.addDays(from, i), spend: 0, revenue: 0, leads: 0 });
    const idx = {}; arr.forEach((a, i) => (idx[a.date] = i));
    const t = U.today();
    S.campaigns.forEach((c) => {
      const e = c.end < t ? c.end : t;
      arr.forEach((a) => { if (a.date >= c.start && a.date <= e) { a.spend += c.m.spend; a.revenue += c.m.revenue; } });
    });
    S.leads.forEach((l) => { const i = idx[l.date]; if (i != null) { arr[i].leads++; if (l.status === 'Won') arr[i].revenue += l.value; } });
    if (!bucket || bucket === 1) return arr;
    const out = [];
    for (let i = 0; i < arr.length; i += bucket) { const ch = arr.slice(i, i + bucket); out.push({ date: ch[0].date, spend: ch.reduce((a, b) => a + b.spend, 0), revenue: ch.reduce((a, b) => a + b.revenue, 0), leads: ch.reduce((a, b) => a + b.leads, 0) }); }
    return out;
  };
  calc.leadsOf = (id) => S.leads.filter((l) => l.campaignId === id);

  /* ---------- API ---------- */
  const api = (MF.api = {});
  const log = (type, text, ref) => { S.activity.unshift({ id: U.uid('A'), type, text, ref, at: Date.now() }); S.activity = S.activity.slice(0, 60); };
  const camp = (id) => S.campaigns.find((c) => c.id === id);
  const item = (id) => S.content.find((c) => c.id === id);
  const lead = (id) => S.leads.find((l) => l.id === id);
  MF.get = { campaign: camp, content: item, lead, workflow: (id) => S.workflows.find((w) => w.id === id), rep: (id) => MF.REPS.find((r) => r.id === id) };
  const hist = (it, action, note, by) => it.history.push({ action, by: by || MF.ME.name, at: Date.now(), note: note || '' });

  api.log = (...a) => { log(...a); MF.commit(); };

  api.createCampaign = function (d, generate) {
    const id = 'C' + (S.campaigns.length + 1 + Math.floor(Math.random() * 1000));
    const split = {}; d.channels.forEach((ch) => (split[ch] = 1 / d.channels.length));
    const c = Object.assign({ id, status: 'Draft', owner: MF.ME.name, created: Date.now(), split, m: { spend: 0, impressions: 0, clicks: 0, customers: 0, revenue: 0 } }, d);
    const dailyBudget = d.budget / Math.max(1, U.diff(d.start, d.end) + 1);
    c.m = { spend: dailyBudget * 0.9, impressions: dailyBudget * 18, clicks: dailyBudget * 0.4, customers: 0, revenue: dailyBudget * 2.2 };
    S.campaigns.unshift(c);
    log('campaign', `Campaign "${c.name}" created`, c.id);
    if (generate) api.generateForCampaign(c.id, true);
    MF.commit(); return c;
  };
  api.updateCampaign = function (id, patch) {
    const c = camp(id); Object.assign(c, patch);
    if (patch.channels) { const split = {}; patch.channels.forEach((ch) => (split[ch] = c.split[ch] || 1 / patch.channels.length)); const t = Object.values(split).reduce((a, b) => a + b, 0); Object.keys(split).forEach((k) => (split[k] /= t)); c.split = split; }
    log('campaign', `Campaign "${c.name}" updated`, id); MF.commit();
  };
  api.deleteCampaign = function (id) {
    const c = camp(id); S.campaigns = S.campaigns.filter((x) => x.id !== id); S.content = S.content.filter((x) => x.campaignId !== id);
    S.leads.forEach((l) => { if (l.campaignId === id) l.campaignId = null; });
    log('campaign', `Campaign "${c.name}" deleted`, null); MF.commit();
  };
  api.generateForCampaign = function (id, silent) {
    const c = camp(id), brief = { name: c.name, audience: c.audience, objective: c.objective, tone: c.tone || 'Professional', topic: c.topic || c.name };
    let n = 0;
    c.channels.forEach((ch, i) => {
      if (S.content.some((x) => x.campaignId === id && x.channel === ch && x.status !== 'Rejected')) return;
      const g = MF.gen(ch, brief);
      S.content.unshift(Object.assign({ id: U.uid('P'), campaignId: id, channel: ch, status: 'Draft', scheduledAt: U.addDays(c.start, i) + 'T' + ['09:00', '11:30', '15:30'][i % 3], author: MF.ME.name, history: [{ action: 'created', by: 'AI Content Studio', at: Date.now() }], createdAt: Date.now() }, g)); n++;
    });
    if (!silent) { log('content', `Generated ${n} content draft(s) for "${c.name}"`, id); MF.commit(); }
    return n;
  };
  api.saveContent = function (id, patch) { Object.assign(item(id), patch); MF.commit(); };
  api.addContent = function (it) {
    const x = Object.assign({ id: U.uid('P'), status: 'Draft', scheduledAt: null, author: MF.ME.name, history: [{ action: 'created', by: MF.ME.name, at: Date.now() }], createdAt: Date.now() }, it);
    S.content.unshift(x); MF.commit(); return x;
  };
  api.deleteContent = function (id) { S.content = S.content.filter((x) => x.id !== id); MF.commit(); };
  api.submit = function (ids) {
    let n = 0;
    ids.forEach((id) => { const it = item(id); if (it && (it.status === 'Draft' || it.status === 'Revision' || it.status === 'Rejected')) { it.status = 'Pending'; hist(it, 'submitted'); n++; } });
    if (n) { log('approval', `${n} item(s) sent for approval`, null); syncCampaigns(); }
    MF.commit(); return n;
  };
  api.approve = function (id, at, note, by) {
    const it = item(id); it.status = at ? 'Scheduled' : 'Approved'; it.scheduledAt = at || null;
    hist(it, 'approved', note, by || MF.REVIEWERS[0]); if (at) hist(it, 'scheduled', U.fmtDT(at));
    log('approval', `${it.channel} content "${it.headline.slice(0, 40)}" approved${at ? ' & scheduled for ' + U.fmtDT(at) : ''}`, it.campaignId);
    syncCampaigns(); MF.commit();
  };
  api.reject = function (id, note) { const it = item(id); it.status = 'Rejected'; hist(it, 'rejected', note, MF.REVIEWERS[0]); log('approval', `${it.channel} content rejected`, it.campaignId); syncCampaigns(); MF.commit(); };
  api.revise = function (id, note) { const it = item(id); it.status = 'Revision'; hist(it, 'revision', note, MF.REVIEWERS[0]); log('approval', `Revision requested on ${it.channel} content`, it.campaignId); MF.commit(); };
  api.comment = function (id, note) { const it = item(id); hist(it, 'comment', note, MF.REVIEWERS[0]); MF.commit(); };
  api.schedule = function (id, at) {
    const it = item(id); const was = it.scheduledAt; it.scheduledAt = at;
    if (it.status === 'Approved') { it.status = 'Scheduled'; hist(it, 'scheduled', U.fmtDT(at)); log('calendar', `${it.channel} post scheduled for ${U.fmtDT(at)}`, it.campaignId); }
    else if (it.status === 'Scheduled' || it.status === 'Pending') hist(it, 'rescheduled', `${was ? U.fmtDT(was) + ' → ' : ''}${U.fmtDT(at)}`);
    syncCampaigns(); MF.commit();
  };
  api.unschedule = function (id) { const it = item(id); it.scheduledAt = null; if (it.status === 'Scheduled') it.status = 'Approved'; hist(it, 'unscheduled'); MF.commit(); };
  api.setStatus = function (id, status) {
    const c = camp(id);
    if (status === 'In Review') {
      api.generateForCampaign(id, true);
      const ids = S.content.filter((x) => x.campaignId === id && ['Draft', 'Revision'].includes(x.status)).map((x) => x.id);
      c.status = status; api.submit(ids);
    } else c.status = status;
    log('campaign', `"${c.name}" moved to ${status}`, id); MF.commit();
  };
  function syncCampaigns() {
    const t = U.today();
    S.campaigns.forEach((c) => {
      const cs = S.content.filter((x) => x.campaignId === c.id);
      if (c.status === 'In Review' && cs.length && !cs.some((x) => ['Pending', 'Draft', 'Revision'].includes(x.status)) && cs.some((x) => ['Scheduled', 'Approved', 'Published'].includes(x.status))) {
        c.status = c.start <= t ? 'Active' : 'Scheduled'; log('campaign', `All content approved — "${c.name}" is now ${c.status}`, c.id);
      }
    });
  }
  api.tick = function () {
    const t = U.today(), now = U.nowLocal(); let ch = false;
    S.campaigns.forEach((c) => {
      if (c.status === 'Scheduled' && c.start <= t) { c.status = 'Active'; log('campaign', `"${c.name}" is now live`, c.id); ch = true; }
      if (c.status === 'Active' && c.end < t) { c.status = 'Completed'; log('campaign', `"${c.name}" completed`, c.id); ch = true; }
    });
    S.content.forEach((it) => { if (it.status === 'Scheduled' && it.scheduledAt && it.scheduledAt <= now) { it.status = 'Published'; it.perf = perfFor(it); hist(it, 'published', '', 'MarketFlow'); ch = true; } });
    if (ch) MF.commit();
  };

  /* ---- leads & workflows ---- */
  api.runWorkflows = function (l) {
    const results = [];
    S.workflows.filter((w) => w.active && w.sources.includes(l.source)).forEach((w) => {
      const seg = MF.segment(l.score), act = w.actions[seg];
      l.interactions.push({ type: 'workflow', text: `Workflow "${w.name}": scored ${l.score} → ${seg}`, at: Date.now() });
      if (act === 'assign') { if (!l.rep) { l.rep = MF.REPS[Math.floor(Math.random() * MF.REPS.length)].id; l.interactions.push({ type: 'assign', text: 'Auto-assigned to ' + MF.get.rep(l.rep).name, at: Date.now() }); } }
      else if (act === 'email') l.interactions.push({ type: 'email', text: 'Follow-up email sent automatically', at: Date.now() });
      else if (act === 'nurture') l.interactions.push({ type: 'email', text: 'Added to 5-step nurture sequence', at: Date.now() });
      else if (act === 'slack') l.interactions.push({ type: 'note', text: 'Sales team notified on Slack (#hot-leads)', at: Date.now() });
      else if (act === 'task') l.interactions.push({ type: 'note', text: 'Follow-up task created for sales', at: Date.now() });
      w.runs++; w.log.unshift({ at: Date.now(), lead: l.name, segment: seg, action: act, score: l.score }); w.log = w.log.slice(0, 15);
      if (l.status === 'New' && act === 'assign') l.status = 'Contacted';
      results.push({ w, seg, act });
    });
    return results;
  };
  api.captureLead = function (opts = {}) {
    const active = S.campaigns.filter((c) => c.status === 'Active');
    let pool = active.length ? active : S.campaigns;
    if (opts.campaignId) pool = [camp(opts.campaignId)];
    const c = pool[Math.floor(Math.random() * pool.length)];
    const src = opts.source && c.channels.includes(opts.source) ? opts.source : c.channels[Math.floor(Math.random() * c.channels.length)];
    const l = newPerson(Math.random, c, src, Date.now());
    S.leads.unshift(l);
    const res = api.runWorkflows(l);
    log('lead', `New ${MF.segment(l.score).toLowerCase()} lead ${l.name} captured from ${src}`, l.id);
    MF.commit(); return { lead: l, res };
  };
  api.updateLead = function (id, patch) {
    const l = lead(id);
    if (patch.status && patch.status !== l.status) {
      l.interactions.push({ type: 'status', text: `Status ${l.status} → ${patch.status}`, at: Date.now() });
      if (patch.status === 'Won') { log('lead', `${l.name} converted — ${U.money(l.value)} revenue attributed`, l.id); }
    }
    Object.assign(l, patch); MF.commit();
  };
  api.assignLead = function (id, repId) {
    const l = lead(id); l.rep = repId || null;
    l.interactions.push({ type: 'assign', text: repId ? 'Assigned to ' + MF.get.rep(repId).name : 'Unassigned', at: Date.now() });
    if (repId && l.status === 'New') l.status = 'Contacted';
    MF.commit();
  };
  api.addInteraction = function (id, type, text) { lead(id).interactions.push({ type, text, at: Date.now() }); MF.commit(); };

  /* workflows */
  api.saveWorkflow = function (id, patch) { Object.assign(MF.get.workflow(id), patch); MF.commit(); };
  api.createWorkflow = function (name, sources) {
    const w = { id: U.uid('W'), name, active: true, sources, model: 'Engagement + firmographic fit', actions: { Hot: 'assign', Warm: 'email', Cold: 'nurture' }, runs: 0, log: [] };
    S.workflows.push(w); log('workflow', `Workflow "${name}" created`, w.id); MF.commit(); return w;
  };
  api.deleteWorkflow = function (id) { S.workflows = S.workflows.filter((w) => w.id !== id); MF.commit(); };
  api.setTheme = function (t) { S.settings.theme = t; MF.save(); };
  api.setThresh = function (hot, warm) { MF.THRESH = { hot, warm }; S.settings.thresh = { hot, warm }; MF.commit(); };
  api.simulate = function () {
    const n = 1 + Math.floor(Math.random() * 3), out = [];
    for (let i = 0; i < n; i++) out.push(api.captureLead().lead);
    return out;
  };
  api.reset = function () { S = seed(); MF.THRESH = { hot: 70, warm: 40 }; api.tick(); MF.commit(); };

  MF.init = function () {
    try { const raw = localStorage.getItem(KEY); if (raw) { const p = JSON.parse(raw); if (p && p.v === 1 && p.campaigns) S = p; } } catch (e) { S = null; }
    if (!S) { S = seed(); MF.save(); }
    if (S.settings.thresh) MF.THRESH = S.settings.thresh;
    api.tick();
  };
})();
