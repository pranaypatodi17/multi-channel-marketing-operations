/* CallLens — engine: call generation, scoring (LLM result + deterministic rules), metrics, alerts, persistence */
(function () {
  'use strict';
  const CL = window.CL;
  const DAY = 86400000;
  const KEY = 'calllens.v1';

  /* ---------- utils ---------- */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const norm = s => s.toLowerCase().replace(/[-–—]/g, ' ').replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
  const sod = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const clone = o => JSON.parse(JSON.stringify(o));
  CL.util = { mulberry, hash, norm, sod, clone, DAY };

  /* ---------- persistence ---------- */
  function defaults() {
    const now = Date.now();
    return {
      v: 1, rubric: clone(CL.RUBRIC_DEFAULT), rubricVer: 3,
      rubricHistory: [
        { v: '1.0', at: now - 41 * DAY, by: 'Anjali Verma', note: 'Initial rubric imported from the existing QA scorecard' },
        { v: '1.1', at: now - 24 * DAY, by: 'Anjali Verma', note: 'Added “No false claims” as a critical criterion' },
        { v: '1.2', at: now - 9 * DAY, by: 'Rahul Bhandari', note: 'Raised weight of mandatory disclosure from 10 to 15' }
      ],
      overrides: {}, reviewed: {}, comments: {}, alertStatus: {}, ingested: [], lineEdits: {}, audit: [], autoArrivals: 0,
      settings: {
        alertMin: 'High', slack: true, slackChannel: '#qa-escalations', email: true,
        emails: ['anjali.verma@anvayafinancial.example', 'compliance@anvayafinancial.example'], digest: 'Monday 09:00',
        audioDays: 90, transcriptDays: 365, redact: true, consentText: 'This call is recorded for quality and training purposes.', theme: null
      }
    };
  }
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { S = null; }
  if (!S || S.v !== 1) S = defaults();
  CL.state = S;
  CL.rev = 0;
  let cache = new Map();
  CL.save = function () {
    CL.rev++; cache = new Map();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
  };
  CL.clearCache = function () { cache = new Map(); };
  /* run fn with a temporary rubric (used for the rubric editor's impact preview) */
  CL.withRubric = function (rubric, fn) {
    const keep = S.rubric; S.rubric = rubric; cache = new Map();
    try { return fn(); } finally { S.rubric = keep; cache = new Map(); }
  };
  CL.reset = function () { try { localStorage.removeItem(KEY); } catch (e) {} location.hash = '#/dashboard'; location.reload(); };
  CL.log = function (what) { S.audit.unshift({ at: Date.now(), who: CL.USER.name, what }); S.audit = S.audit.slice(0, 80); };

  /* ---------- call construction ---------- */
  const agentById = id => CL.AGENTS.find(a => a.id === id);
  CL.agent = agentById;

  function pick(rnd, weights) {
    const ent = Object.entries(weights), tot = ent.reduce((s, e) => s + e[1], 0);
    let x = rnd() * tot;
    for (const [k, w] of ent) { if ((x -= w) <= 0) return k; }
    return ent[0][0];
  }

  function buildCall(spec) {
    const arch = CL.ARCH[spec.arch], agent = agentById(spec.agentId);
    const aFirst = agent.name.split(' ')[0], cFirst = spec.cust.split(' ')[0];
    const sub = s => s.replace(/\{A\}/g, aFirst).replace(/\{C\}/g, cFirst);
    const lines = []; let prevEnd = 0;
    arch.lines.forEach((raw, i) => {
      const p = raw.indexOf('|'), spk = raw.slice(0, p), text = sub(raw.slice(p + 1));
      const int = spk.endsWith('!'), words = text.split(/\s+/).length;
      const rnd = mulberry(hash(spec.id + ':' + i));
      const d = spk[0] === 'A' ? Math.max(2, words * 0.38) : Math.max(1.6, words * 0.56);
      let gap = 0.4 + rnd() * 1.5; if (rnd() < 0.07) gap += 3.2 + rnd() * 3;
      const t = i === 0 ? 1.4 : int ? prevEnd - 0.9 - rnd() * 0.3 : prevEnd + gap;
      const conf = Math.min(0.995, Math.max(0.74, arch.asr + (rnd() - 0.5) * 0.08));
      let lc = -1;
      if (rnd() < 0.2) { const ws = text.split(' '); const cands = ws.map((w, k) => [w, k]).filter(x => x[0].replace(/\W/g, '').length >= 5); if (cands.length) lc = cands[Math.floor(rnd() * cands.length)][1]; }
      lines.push({ i, sp: spk[0], int, text, t, d, e: t + d, conf: lc >= 0 ? Math.min(conf, 0.7 + rnd() * 0.08) : conf, lc });
      prevEnd = t + d;
    });
    const duration = Math.ceil(prevEnd + 1.6);
    const ev = {};
    Object.entries(arch.res).forEach(([k, v]) => {
      if (!v.ev) { ev[k] = null; return; }
      const needle = norm(sub(v.ev));
      const idx = lines.findIndex(l => l.sp === 'A' && norm(l.text).includes(needle));
      ev[k] = idx >= 0 ? idx : null;
    });
    const phone = '+91 9' + (hash(spec.id) % 9 + 1) + '••• •' + String(hash(spec.id + 'p') % 10000).padStart(4, '0');
    const asr = Math.round(lines.reduce((s, l) => s + l.conf, 0) / lines.length * 1000) / 10;
    return Object.assign({}, spec, { agent, arch, aFirst, cFirst, lines, duration, ev, phone, asr, lang: arch.lang, product: arch.product, ptype: arch.ptype, outcome: arch.outcome });
  }

  function generate() {
    const rnd = mulberry(20261104), now = Date.now(), day0 = sod(now), specs = [];
    const counts = [7, 7, 6, 6, 6, 6, 6, 6];
    const custOrder = CL.CUSTOMERS.slice().sort(() => rnd() - 0.5);
    let ci = 0;
    CL.AGENTS.forEach((ag, k) => {
      for (let j = 0; j < counts[k]; j++) {
        const off = Math.floor(28 * Math.pow(rnd(), 1.1)), tf = off / 28;
        const w = ag.wOld && rnd() < tf ? ag.wOld : ag.w;
        let ts = day0 - off * DAY + (10 + rnd() * 8) * 3600000;
        if (new Date(ts).getDay() === 0) ts -= DAY;
        if (ts > now - 12 * 60000) ts = now - (25 + rnd() * 190) * 60000;
        specs.push({ agentId: ag.id, arch: pick(rnd, w), startedAt: Math.round(ts), cust: custOrder[ci++ % custOrder.length] + (ci > 29 ? '' : ''), source: pick(rnd, Object.fromEntries(CL.SOURCES)), direction: rnd() < 0.86 ? 'Outbound' : 'Inbound' });
      }
    });
    const newest = id => specs.filter(x => x.agentId === id).sort((a, b) => b.startedAt - a.startedAt)[0];
    const f1 = newest('a7'); f1.arch = 'T5'; f1.startedAt = Math.round(now - 95 * 60000);
    const f2 = newest('a5'); f2.arch = 'T6'; f2.startedAt = Math.round(now - 27 * 3600000);
    specs.sort((a, b) => a.startedAt - b.startedAt);
    specs.forEach((s, i) => { s.id = 'CL-' + (24590 + i); });
    return specs.map(buildCall);
  }

  let base = null;
  CL.calls = function () {
    if (!base) { base = generate(); const old = base.filter(c => c.startedAt < Date.now() - 5 * DAY); [3, 8, 14].forEach(i => { if (old[i]) old[i].preReviewed = true; }); }
    const extra = S.ingested.map(s => { const k = 'ing:' + s.id; if (!cache.has(k)) cache.set(k, buildCall(Object.assign({}, s, { agent: undefined }))); return cache.get(k); });
    return base.concat(extra).sort((a, b) => b.startedAt - a.startedAt);
  };
  CL.call = id => CL.calls().find(c => c.id === id);
  CL.nextId = () => 'CL-' + (Math.max(...CL.calls().map(c => +c.id.slice(3))) + 1);

  CL.ingest = function (o) {
    const id = CL.nextId();
    const spec = { id, agentId: o.agentId, arch: o.arch, startedAt: Date.now() - 20000, cust: o.cust || CL.CUSTOMERS[Math.floor(Math.random() * CL.CUSTOMERS.length)], source: o.source || 'Manual upload', direction: o.direction || 'Outbound', fileName: o.fileName };
    S.ingested.push(spec); CL.log('Ingested ' + id + (o.fileName ? ' (' + o.fileName + ')' : '') + ' via ' + spec.source); CL.save();
    return id;
  };

  /* ---------- effective transcript (reviewer edits) ---------- */
  CL.lines = function (call) {
    const ed = S.lineEdits[call.id]; if (!ed) return call.lines;
    return call.lines.map(l => ed[l.i] != null ? Object.assign({}, l, { text: ed[l.i], edited: true, lc: -1, conf: 0.99 }) : l);
  };

  /* ---------- rules layer ---------- */
  const NEG = /\b(nahi|nahin|not|never|mat)\b|n't\b/;
  const phraseRe = p => new RegExp('(^|[^a-z0-9])' + norm(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');

  function ruleMatches(lines, phrases, mode) {
    const hits = [], res = phrases.map(p => [p, phraseRe(p)]);
    lines.forEach(l => {
      if (l.sp !== 'A') return;
      const sentences = l.text.split(/[.!?।,;]+\s*/).filter(Boolean);
      for (const sent of sentences) {
        const n = norm(sent);
        for (const [p, re] of res) {
          if (!re.test(n)) continue;
          if (mode === 'prohibited') { const rest = n.replace(re, ' '); if (NEG.test(rest)) continue; }
          hits.push({ i: l.i, phrase: p, t: l.t }); break;
        }
      }
    });
    return hits;
  }
  CL.ruleMatches = ruleMatches;

  function evalRule(c, lines, call) {
    const agentTurns = lines.filter(l => l.sp === 'A').length;
    const hits = ruleMatches(lines, c.rule.phrases, c.rule.mode);
    if (c.rule.mode === 'required') {
      if (hits.length) {
        const h = hits[0], late = h.t / call.duration > 0.8;
        return { score: 1, ev: h.i, evType: 'quote', matched: h.phrase, note: 'Approved phrase “' + h.phrase + '” found at ' + CL.fmt(h.t) + (late ? ' — late in the call, close to the end.' : '.') };
      }
      return { score: 0, ev: null, evType: 'absence', note: 'None of the ' + c.rule.phrases.length + ' approved disclosure phrases appear in the ' + agentTurns + ' agent turns.' };
    }
    if (c.rule.mode === 'prohibited') {
      if (hits.length) {
        const uniq = [...new Set(hits.map(h => h.phrase))];
        return { score: 0, ev: hits[0].i, evType: 'quote', hits, note: hits.length + ' prohibited ' + (hits.length > 1 ? 'statements' : 'statement') + ' (' + uniq.map(u => '“' + u + '”').join(', ') + '). Negated mentions are ignored.' };
      }
      return { score: 1, ev: null, evType: 'absence', note: 'No prohibited phrases in ' + agentTurns + ' agent turns (negation-aware check).' };
    }
    // custom: "required" or "prohibited" both handled above
    return { score: 1, ev: null, evType: 'absence', note: '' };
  }

  CL.metrics = function (call) {
    const lines = CL.lines(call), A = lines.filter(l => l.sp === 'A'), C = lines.filter(l => l.sp === 'C');
    const ta = A.reduce((s, l) => s + l.d, 0), tc = C.reduce((s, l) => s + l.d, 0);
    const share = Math.round(ta / (ta + tc) * 100);
    const words = A.reduce((s, l) => s + l.text.split(/\s+/).length, 0);
    let dead = 0; for (let k = 1; k < lines.length; k++) if (lines[k].t - lines[k - 1].e > 4) dead++;
    const rec = A.slice(0, 5).find(l => CL.RECORDING_PHRASES.some(p => norm(l.text).includes(p)));
    return {
      share, agentSec: ta, custSec: tc, interruptions: lines.filter(l => l.int).length,
      longest: Math.max(...A.map(l => l.d)), dead, wpm: Math.round(words / (ta / 60)),
      questions: A.reduce((s, l) => s + (l.text.match(/\?/g) || []).length, 0), recording: rec ? { i: rec.i, t: rec.t } : null,
      turns: lines.length
    };
  };

  /* ---------- scoring ---------- */
  const FLAG_PRI = ['comp_claims', 'tone_conduct', 'comp_disclosure', 'prod_accuracy', 'comp_consent'];
  const SEV = { critical: 'High', major: 'Medium', minor: 'Low' };
  CL.SEVRANK = { High: 3, Medium: 2, Low: 1, Clear: 0 };

  function synthetic(c, call, lines) {
    const r = mulberry(hash(call.id + c.id)), ag = lines.filter(l => l.sp === 'A');
    const ev = ag[Math.floor(r() * ag.length)].i;
    const good = r() < 0.82;
    return { score: c.type === 'passfail' ? (good ? 1 : 0) : (good ? 3 + Math.floor(r() * 3) : 1 + Math.floor(r() * 2)), ev, evType: 'quote', note: 'Judged by the AI reviewer against your criterion description.' };
  }

  CL.analyze = function (call) {
    const ck = 'an:' + call.id;
    if (cache.has(ck)) return cache.get(ck);
    const lines = CL.lines(call), ov = S.overrides[call.id] || {};
    const crit = S.rubric.filter(c => c.enabled);
    const results = crit.map(c => {
      let r;
      const a = call.arch.res[c.id];
      if (c.rule) r = evalRule(c, lines, call);
      else if (a) r = { score: a.s, ev: call.ev[c.id], evType: a.ev ? 'quote' : 'absence', note: a.note.replace(/\{C\}/g, call.cFirst).replace(/\{A\}/g, call.aFirst), sev: a.sev };
      else r = synthetic(c, call, lines);
      const o = ov[c.id];
      const score = o ? o.score : r.score;
      const pct = c.type === 'passfail' ? (score ? 100 : 0) : score / 5 * 100;
      const failed = c.type === 'passfail' ? !score : score <= 2;
      const sev = r.sev ? SEV[r.sev] || r.sev : SEV[c.severity];
      return Object.assign({}, r, { c, id: c.id, name: c.name, category: c.category, type: c.type, weight: c.weight, engine: c.engine, rawScore: r.score, score, pct, failed, sev, override: o || null, flagLines: r.hits ? r.hits.map(h => h.i) : (failed && r.ev != null ? [r.ev] : []) });
    });
    const tw = results.reduce((s, r) => s + r.weight, 0) || 1;
    const overall = Math.round(results.reduce((s, r) => s + r.weight * r.pct, 0) / tw);
    const cats = {};
    results.forEach(r => { const o = cats[r.category] || (cats[r.category] = { w: 0, s: 0 }); o.w += r.weight; o.s += r.weight * r.pct; });
    Object.keys(cats).forEach(k => { cats[k] = Math.round(cats[k].s / cats[k].w); });
    const flags = results.filter(r => r.failed).map(r => ({ id: r.id, title: r.c.flag || r.name, sev: r.sev, ev: r.ev, evType: r.evType, note: r.note, category: r.category, lines: r.flagLines }))
      .sort((a, b) => CL.SEVRANK[b.sev] - CL.SEVRANK[a.sev] || FLAG_PRI.indexOf(a.id) - FLAG_PRI.indexOf(b.id));
    const risk = flags.length ? flags[0].sev : 'Clear';
    const out = { overall, cats, results, flags, risk, high: flags.filter(f => f.sev === 'High'), metrics: CL.metrics(call) };
    cache.set(ck, out);
    return out;
  };

  /* ---------- alerts ---------- */
  CL.alerts = function () {
    const min = CL.SEVRANK[S.settings.alertMin] || 3, now = Date.now(), out = [];
    CL.calls().forEach(c => {
      const a = CL.analyze(c);
      const fl = a.flags.filter(f => CL.SEVRANK[f.sev] >= min);
      if (!fl.length) return;
      const primary = fl.find(f => f.ev != null) || fl[0];
      const at = c.startedAt + c.duration * 1000 + 38000;
      const age = (now - at) / DAY;
      const st = S.alertStatus[c.id];
      const status = st ? st.status : (age < 2 ? 'Open' : age < 6 ? 'Acknowledged' : 'Resolved');
      out.push({ id: c.id, call: c, analysis: a, flags: fl, primary, sev: fl[0].sev, at, status, meta: st || null, routed: (S.settings.slack ? S.settings.slackChannel : '') });
    });
    return out.sort((x, y) => y.at - x.at);
  };

  /* ---------- aggregation helpers ---------- */
  CL.within = (calls, days, from) => { const end = (from || Date.now()), s = end - days * DAY; return calls.filter(c => c.startedAt >= s && c.startedAt <= end); };
  CL.avg = arr => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0;
  CL.stats = function (calls) {
    const an = calls.map(c => CL.analyze(c));
    const comp = an.map(a => a.cats['Compliance']).filter(x => x != null);
    return { n: calls.length, avg: CL.avg(an.map(a => a.overall)), high: an.filter(a => a.risk === 'High').length, compliance: CL.avg(comp), flags: an.reduce((s, a) => s + a.flags.length, 0), an };
  };
  CL.violations = function (calls) {
    const m = {};
    calls.forEach(c => CL.analyze(c).flags.forEach(f => { const o = m[f.id] || (m[f.id] = { id: f.id, title: f.title, sev: f.sev, n: 0, category: f.category, agents: new Set() }); o.n++; o.agents.add(c.agent.id); if (CL.SEVRANK[f.sev] > CL.SEVRANK[o.sev]) o.sev = f.sev; }));
    return Object.values(m).sort((a, b) => CL.SEVRANK[b.sev] - CL.SEVRANK[a.sev] || b.n - a.n);
  };
  CL.agentStats = function (days) {
    const all = CL.calls();
    return CL.AGENTS.map(ag => {
      const cs = all.filter(c => c.agent.id === ag.id), cur = days ? CL.within(cs, days) : cs;
      const prev = days ? CL.within(cs, days, Date.now() - days * DAY) : [];
      const st = CL.stats(cur), pst = CL.stats(prev);
      const cats = {}; st.an.forEach(a => Object.entries(a.cats).forEach(([k, v]) => { (cats[k] = cats[k] || []).push(v); }));
      Object.keys(cats).forEach(k => { cats[k] = CL.avg(cats[k]); });
      return { agent: ag, calls: cur, stats: st, prevAvg: prev.length ? pst.avg : null, delta: prev.length ? st.avg - pst.avg : null, cats };
    }).sort((a, b) => b.stats.avg - a.stats.avg);
  };

  /* ---------- formatting ---------- */
  CL.fmt = s => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  CL.dur = s => Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's';
  CL.rel = ts => {
    const d = Date.now() - ts, m = Math.round(d / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60); if (h < 24) return h + ' h ago';
    const dd = Math.round(h / 24); return dd === 1 ? 'yesterday' : dd + ' days ago';
  };
  CL.date = (ts, withTime) => new Date(ts).toLocaleString('en-IN', Object.assign({ day: 'numeric', month: 'short' }, withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}));
  CL.scoreBand = s => s >= 85 ? 'good' : s >= 70 ? 'ok' : s >= 55 ? 'warn' : 'bad';
  CL.redact = t => S.settings.redact ? t.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '•••••••••').replace(/\b\d{10,12}\b/g, '••••••••••') : t;
})();
