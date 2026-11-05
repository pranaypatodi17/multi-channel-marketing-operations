/* CallLens — marketing site interactions */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.round(s % 60)).padStart(2, '0');

  /* nav */
  const nav = $('#nav'); const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8); onScroll(); addEventListener('scroll', onScroll, { passive: true });
  $('#menuT').addEventListener('click', e => { const o = $('#links').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
  $$('#links a').forEach(a => a.addEventListener('click', () => $('#links').classList.remove('open')));
  const sun = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>';
  const moon = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
  const tIcon = () => { $('#themeT').innerHTML = document.documentElement.dataset.theme === 'dark' ? sun : moon; }; tIcon();
  $('#themeT').addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; tIcon();
    try { const o = JSON.parse(localStorage.getItem('calllens.v1') || 'null'); if (o && o.settings) { o.settings.theme = t; localStorage.setItem('calllens.v1', JSON.stringify(o)); } } catch (e) { /* ignore */ }
  });

  /* reveal on scroll */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    $$('.tile, .feat article, .shot, .pl, .ev-demo, .roi, .ind, .step-panel').forEach(el => { el.classList.add('rv'); io.observe(el); });
  }

  /* hero mock animation */
  (function () {
    const tx = $('#mTx'), wave = $('#mWave'), flags = $('#mFlags'), slack = $('#mSlack'), arc = $('#mArc'), num = $('#mNum');
    const LINES = [['A', '00:01', 'Hello Shweta ji, main Vikram bol raha hoon Anvaya Financial se.'], ['C', '00:08', 'Haan, boliye.'], ['A', '00:10', 'Isme main aapko <mark>guaranteed</mark> 20 percent returns de sakta hoon har saal.', 1], ['C', '00:20', 'Bees percent guaranteed? Market risk nahi hai kya?'], ['A', '00:29', 'Arre sir, <mark>risk-vir kuch nahi hai</mark>, <mark>bilkul safe</mark> hai.', 1]];
    let bars = ''; for (let i = 0; i < 54; i++) { const h = 14 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * .6)) * 86; bars += '<i class="' + ((i % 11 > 5) ? 'c' : '') + '" style="height:' + h.toFixed(0) + '%"></i>'; } wave.innerHTML = bars;
    const FL = [['sev-high', 'Prohibited claim · 00:10'], ['sev-high', 'No disclosure read'], ['sev-medium', 'Interrupted customer']];
    const C = 213.6;
    function show(n) {
      tx.innerHTML = LINES.slice(0, n).map((l, i) => '<div class="ml ' + l[0] + (l[3] ? ' flag' : '') + ' in"><span class="t">' + l[1] + '</span><span class="s">' + l[0] + '</span><span>' + l[2] + '</span></div>').join('');
      $$('#mWave i').forEach((b, i) => b.classList.toggle('on', i < n * 11));
      flags.innerHTML = FL.map((f, i) => '<span class="chip ' + f[0] + (n >= 3 + i ? ' in' : '') + '">' + f[1] + '</span>').join('');
      const sc = n >= 5 ? 19 : n >= 3 ? 41 : n >= 1 ? 88 : 0;
      arc.style.strokeDashoffset = C * (1 - sc / 100); arc.style.stroke = sc >= 70 ? 'var(--good)' : sc >= 40 ? 'var(--warn)' : 'var(--bad)'; num.textContent = sc;
      slack.classList.toggle('in', n >= 5);
    }
    if (reduce) { show(5); return; }
    let n = 0; show(0);
    setInterval(() => { n = n >= 5 ? (n === 5 ? 6 : 0) : n + 1; if (n === 6) { n = 5; return setTimeout(() => { n = 0; show(0); }, 3200); } show(n); }, 1500);
  })();

  /* pipeline stepper */
  const STEPS = [
    ['Ingest', 'Folder, dialer or upload', 'Calls arrive from a recording folder, Exotel, Knowlarity, Ozonetel, Twilio or manual upload, and are queued as they end.', '<span class="m">// call.ended webhook</span>\n{ <span class="k">"call_id"</span>: <span class="g">"CL-24640"</span>,\n  <span class="k">"source"</span>: <span class="g">"knowlarity"</span>,\n  <span class="k">"agent"</span>: <span class="g">"a7"</span>,\n  <span class="k">"duration_s"</span>: 122,\n  <span class="k">"audio"</span>: <span class="g">"s3://…/enc/aes256"</span> }'],
    ['Transcribe', 'Speakers separated', 'Speech-to-text tuned for telephony audio in Hindi, English and Hinglish, with speaker labels and a confidence value for every line.', '<span class="m">00:10  AGENT   conf 0.93</span>\nIsme main aapko guaranteed\n20 percent returns de sakta\nhoon har saal.\n<span class="m">00:20  CUSTOMER conf 0.88</span>\nBees percent guaranteed?'],
    ['Clean up', 'Numbers, names, Hinglish', 'Spoken numbers and code-mixed spellings are normalised so rules and the AI see the same text a person would read.', '<span class="m">// before → after</span>\n<span class="r">“ek crore ka cover”</span>   → <span class="g">₹1 Cr cover</span>\n<span class="r">“bees percent”</span>      → <span class="g">20%</span>\n<span class="r">“pan: abcde 1234 f”</span> → <span class="g">masked</span>'],
    ['AI analysis', 'Rubric with evidence', 'The LLM scores every criterion against your rubric and must return a quoted line and timestamp. Scores without evidence are rejected.', '{ <span class="k">"criterion"</span>: <span class="g">"obj_handling"</span>,\n  <span class="k">"score"</span>: 1,\n  <span class="k">"evidence"</span>: { <span class="k">"t"</span>: <span class="g">"01:19"</span>,\n    <span class="k">"quote"</span>: <span class="g">"Documents baad mein dekh lena…"</span> },\n  <span class="k">"note"</span>: <span class="g">"Dismissed request for T&amp;Cs"</span> }'],
    ['Rules layer', 'Deterministic checks', 'Simple rules reliably check what must be said and what must never be said, and measure talk ratio, interruptions and dead air.', '<span class="g">✓</span> recording notice   <span class="r">✗ missing</span>\n<span class="g">✓</span> disclosure phrase  <span class="r">✗ 0 of 7 found</span>\n<span class="g">✓</span> prohibited phrases <span class="r">✗ 5 hits</span>\n<span class="g">✓</span> interruptions     <span class="r">✗ 2 (limit 1)</span>\n<span class="g">✓</span> agent talk share  <span class="g">58%</span>'],
    ['Alert and report', 'Slack, email, dashboard', 'High-severity calls go to the manager on Slack or email with a deep link to the audio. Everything else feeds dashboards, coaching and weekly reports.', '<span class="m">#qa-escalations</span>\n🚨 High-severity call flagged\nVikram S. Rathore · CL-24640\n<span class="r">Prohibited claim</span> at 00:10\n[ Open call ] [ Acknowledge ]']
  ];
  let sIdx = 0, sTimer;
  const sBox = $('#steps'), sPanel = $('#stepPanel');
  sBox.innerHTML = STEPS.map((s, i) => '<button class="step" role="tab" data-i="' + i + '"><span class="n">' + (i + 1) + '</span><b>' + s[0] + '</b><small>' + s[1] + '</small><span class="pb"></span></button>').join('');
  function setStep(i, auto) {
    sIdx = i; $$('.step', sBox).forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i); });
    const s = STEPS[i]; sPanel.innerHTML = '<div><h3>' + s[0] + '</h3><p>' + s[2] + '</p></div><pre class="code" style="margin:0">' + s[3] + '</pre>';
    clearTimeout(sTimer); if (!reduce && auto !== false) sTimer = setTimeout(() => setStep((i + 1) % STEPS.length), 5000);
  }
  sBox.addEventListener('click', e => { const b = e.target.closest('.step'); if (b) { setStep(+b.dataset.i, false); $$('.pb', sBox).forEach(p => p.style.animation = 'none'); } });
  setStep(0);

  /* evidence demo */
  const DUR = 122;
  const TL = [['A', 1, 'Hello Shweta ji, main Vikram bol raha hoon Anvaya Financial se. Kaise hain aap?'], ['C', 8, 'Haan, boliye.'], ['A', 10, 'Sir, aapke liye ek bahut badhiya investment plan hai, SecureGrowth ULIP. Isme main aapko <mark>guaranteed</mark> 20 percent returns de sakta hoon har saal.'], ['C', 20, 'Bees percent guaranteed? Itna toh FD bhi nahi deta. Market risk nahi hai kya?'], ['A', 29, 'Arre sir, <mark>risk-vir kuch nahi hai</mark>, <mark>bilkul safe</mark> hai. Bas aap paisa daal dijiye.'], ['C', 39, 'Achha? Lekin maine suna hai ULIP mein lock-in hota hai. Mujhe apne paise...'], ['A', 45, '<mark>Haan haan lock-in hai</mark>, par uski chinta mat kijiye. Aap ye bataiye, kitna invest kar sakte hain?'], ['C', 54, 'Abhi itna nahi, mere paas ek lakh ke aas-paas hai. Lekin pehle mujhe samajhna hai ki...'], ['A', 62, '<mark>Ek lakh bhi chalega.</mark> Dekhiye, yeh offer sirf aaj ke liye hai.'], ['C', 73, 'Par documents, terms and conditions kuch bhejenge? Mujhe padhna hai.'], ['A', 79, '<mark>Documents baad mein dekh lena</mark>, pehle form bhar dijiye.']];
  const CR = [
    ['No guaranteed-return claims', 'Fail', 'sev-high', 'Rule check · 5 hits', [2, 4], 'Rule check: prohibited phrases “guaranteed”, “risk vir kuch nahi” and “bilkul safe” found in agent speech. Negated mentions such as “not guaranteed” are ignored.'],
    ['Mandatory disclosure read', 'Fail', 'sev-high', 'Rule check · absence', [], 'Absence check: none of the 7 approved disclosure phrases appear in the 9 agent turns, so there is no line to quote. The evidence is the full-transcript search.'],
    ['Let the customer finish', '2 interruptions', 'sev-medium', 'AI + rules · limit 1', [6, 8], 'The agent started speaking over the customer at 00:45 and 01:02. The rules layer counts overlaps; the AI judges how disruptive they were.'],
    ['Objection handling', '1 / 5', 'sev-low', 'AI judged', [10], 'The customer asked for the terms and conditions. The agent dismissed the request instead of answering with facts. Quote verified at 01:19.']
  ];
  let evSel = 0, evTimer, evT = 0;
  $('#evList').innerHTML = CR.map((c, i) => '<button class="evc" role="tab" data-i="' + i + '"><span class="t"><span>' + c[0] + '</span><span class="chip ' + c[2] + '">' + c[1] + '</span></span><small>' + c[3] + '</small></button>').join('');
  $('#evTx').innerHTML = TL.map((l, i) => '<div class="evl ' + l[0] + '" id="el' + i + '"><span class="t">' + fmt(l[1]) + '</span><span class="s">' + l[0] + '</span><span>' + l[2] + '</span></div>').join('');
  function evUpd() {
    $('#evFill').style.width = (evT / DUR * 100) + '%'; $('#evTime').textContent = fmt(evT) + ' / ' + fmt(DUR);
    let a = -1; TL.forEach((l, i) => { if (l[1] <= evT + .2) a = i; }); $$('.evl').forEach((e, i) => e.classList.toggle('act', i === a && CR[evSel][4].includes(i)));
  }
  function evSelect(i) {
    evSel = i; clearInterval(evTimer); $$('.evc').forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i); });
    const lines = CR[i][4]; $$('.evl').forEach((e, k) => e.classList.toggle('hl', lines.includes(k)));
    evT = lines.length ? TL[lines[0]][1] : 0; $('#evNote').textContent = CR[i][5]; evUpd();
  }
  function evPlay() {
    clearInterval(evTimer); const end = Math.min(DUR, evT + 12);
    evTimer = setInterval(() => { evT += .5; if (evT >= end) { clearInterval(evTimer); } evUpd(); }, 130);
  }
  $('#evList').addEventListener('click', e => { const b = e.target.closest('.evc'); if (b) { evSelect(+b.dataset.i); if (CR[evSel][4].length) evPlay(); } });
  $('#evPlay').addEventListener('click', () => { if (!CR[evSel][4].length) { evT = 0; } else evT = TL[CR[evSel][4][0]][1]; evPlay(); });
  evSelect(0);

  /* industry rubrics */
  const IND = {
    'Insurance': [['Free-look period and policy document disclosure read', 'Mandatory wording, checked by phrase', 'Rule · pass/fail', 'Critical'], ['No guaranteed or misleading benefit claims', 'Phrase list plus AI for implied promises', 'AI + rules', 'Critical'], ['Waiting periods and exclusions stated accurately', 'Compared with the product sheet', 'AI · pass/fail', 'Critical'], ['Needs, dependants and budget asked before the quote', 'Discovery before pitching', 'AI · 1–5', 'Minor'], ['Next step and follow-up time agreed', 'Recap and a specific slot', 'AI · 1–5', 'Minor']],
    'Loans': [['Interest rate, fees and total cost disclosed', 'Required phrases and figures', 'Rule · pass/fail', 'Critical'], ['No “guaranteed approval” or pre-approved claims', 'Prohibited phrases', 'AI + rules', 'Critical'], ['Consent captured before any credit check', 'Explicit yes from the customer', 'AI · pass/fail', 'Major'], ['No threatening or abusive language on follow-ups', 'Tone and conduct', 'AI · 1–5', 'Major'], ['Repayment capacity discussed before offering', 'Responsible-selling check', 'AI · 1–5', 'Minor']],
    'Real estate': [['Total cost including taxes and charges stated', 'No hidden-cost surprises', 'AI · pass/fail', 'Critical'], ['No assured-appreciation or rental-yield promises', 'Prohibited phrases', 'AI + rules', 'Critical'], ['Registration and approval details shared when asked', 'Accuracy against project sheet', 'AI · pass/fail', 'Major'], ['Budget, timeline and family needs confirmed', 'Discovery quality', 'AI · 1–5', 'Minor'], ['Site-visit slot agreed', 'Clear next step', 'AI · 1–5', 'Minor']],
    'Education': [['Fees, duration and refund policy stated accurately', 'Compared with the course sheet', 'AI · pass/fail', 'Critical'], ['No guaranteed placement or admission claims', 'Prohibited phrases', 'AI + rules', 'Critical'], ['Counsellor asked about goals and background', 'Counselling, not pitching', 'AI · 1–5', 'Minor'], ['Scholarship and EMI terms explained correctly', 'Accuracy', 'AI · pass/fail', 'Major'], ['Fee objections handled with options', 'Objection handling', 'AI · 1–5', 'Minor']],
    'Call centres': [['Identity verified before discussing the account', 'Script adherence', 'Rule · pass/fail', 'Critical'], ['Mandatory opening and closing lines used', 'Phrase check', 'Rule · pass/fail', 'Major'], ['Empathy shown on complaints', 'Tone and conduct', 'AI · 1–5', 'Minor'], ['No dead air longer than 8 seconds', 'Measured from the transcript', 'Rule · metric', 'Minor'], ['Correct disposition recorded', 'Summary versus outcome', 'AI · pass/fail', 'Minor']]
  };
  const tabs = $('#indTabs'); tabs.innerHTML = Object.keys(IND).map((k, i) => '<button role="tab" data-k="' + k + '" class="' + (i ? '' : 'on') + '">' + k + '</button>').join('');
  function ind(k) { $$('button', tabs).forEach(b => b.classList.toggle('on', b.dataset.k === k)); $('#indBody').innerHTML = '<div class="ind-row ind-h"><span>Criterion</span><span>Method</span><span>If it fails</span><span></span></div>' + IND[k].map(r => '<div class="ind-row"><div><b>' + esc(r[0]) + '</b><small>' + esc(r[1]) + '</small></div><span class="chip ' + (r[2].startsWith('Rule') ? 'rule' : 'ai') + '" style="justify-self:start">' + r[2] + '</span><span class="chip sev-' + ({ Critical: 'high', Major: 'medium', Minor: 'low' })[r[3]] + '" style="justify-self:start">' + r[3] + '</span><span></span></div>').join(''); }
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) ind(b.dataset.k); }); ind('Insurance');

  /* ROI calculator */
  const R = id => $('#' + id), inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const money = n => n >= 1e7 ? '₹' + (n / 1e7).toFixed(2) + ' Cr' : n >= 1e5 ? '₹' + (n / 1e5).toFixed(1) + ' lakh' : inr(n);
  function roi() {
    const ag = +R('rAg').value, cp = +R('rCp').value, len = +R('rLn').value, rv = +R('rRv').value, cost = +R('rCs').value;
    R('oAg').textContent = ag; R('oCp').textContent = cp; R('oLn').textContent = len + ' min'; R('oRv').textContent = rv + '%'; R('oCs').textContent = inr(cost);
    const calls = ag * cp * 22, per = (len + 4) / 60, full = calls * per, fte = full / 140, human = calls * .12 * per, hFte = human / 140;
    const manualCost = fte * cost, clCost = ag * 1900 + hFte * cost, save = manualCost - clCost;
    R('roiOut').innerHTML = '<div class="row"><div><div class="k">Calls per month</div><div class="v">' + calls.toLocaleString('en-IN') + '</div></div><div><div class="k">Reviewed today (' + rv + '%)</div><div class="v">' + Math.round(calls * rv / 100).toLocaleString('en-IN') + '</div></div></div><hr>' +
      '<div><div class="k">Human time to review 100% manually</div><div class="v">' + Math.round(full).toLocaleString('en-IN') + ' <small>hours / month ≈ ' + Math.round(fte) + ' full-time analysts</small></div></div>' +
      '<div class="cmpb"><div class="r"><span>Today</span><div class="b"><i style="width:' + Math.max(2, rv) + '%"></i></div><b>' + rv + '%</b></div><div class="r"><span>CallLens</span><div class="b"><i style="width:100%"></i></div><b>100%</b></div></div><hr>' +
      '<div class="row"><div><div class="k">Manual cost for full coverage</div><div class="v">' + money(manualCost) + '<small>/mo</small></div></div><div><div class="k">With CallLens (indicative)</div><div class="v">' + money(clCost) + '<small>/mo</small></div></div></div>' +
      '<div class="k">Humans then review the ~12% flagged calls (about ' + Math.round(human).toLocaleString('en-IN') + ' hours) instead of sampling at random' + (save > 0 ? '. Estimated difference: <b>' + money(save) + ' a month</b>.' : '.') + '</div>';
  }
  $$('.roi-in input').forEach(i => i.addEventListener('input', roi)); roi();

  /* demo form */
  $('#demoForm').addEventListener('submit', e => {
    e.preventDefault(); let ok = true;
    [['fn', v => v.trim().length > 1], ['fe', v => /^\S+@\S+\.\S+$/.test(v.trim())], ['fc', v => v.trim().length > 1]].forEach(([id, t]) => { const el = R(id), good = t(el.value); el.classList.toggle('invalid', !good); el.setAttribute('aria-invalid', !good); if (!good) ok = false; });
    if (!ok) { const f = $('.invalid'); if (f) f.focus(); return; }
    R('okName').textContent = R('fn').value.trim().split(' ')[0]; R('okMail').textContent = R('fe').value.trim(); R('formOk').hidden = false;
  });
})();
