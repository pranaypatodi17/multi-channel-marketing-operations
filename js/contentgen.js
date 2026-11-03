/* MarketFlow — simulated AI content generator */
(function () {
  const MF = window.MF, U = MF.U;
  MF.TONES = {
    Professional: { e: '', cta: ['Learn more', 'Request a demo', 'Get started'], adj: ['trusted', 'proven', 'scalable'] },
    Friendly: { e: '😊', cta: ['Check it out', 'Join us today', 'Say hello'], adj: ['simple', 'delightful', 'easy'] },
    Bold: { e: '🔥', cta: ['Go big', 'Start now', 'Take the leap'], adj: ['game-changing', 'fearless', 'unmissable'] },
    Playful: { e: '🎉', cta: ["Let's play", 'Peek inside', 'Treat yourself'], adj: ['fun', 'fresh', 'sparkly'] },
    Urgent: { e: '⏰', cta: ['Shop now', 'Claim your spot', "Don't miss out"], adj: ['limited-time', 'exclusive', 'last-chance'] },
  };
  MF.OBJECTIVES = { Awareness: 'discover', 'Lead generation': 'get started', Sales: 'save big', Engagement: 'join in', Retention: 'stay rewarded' };
  const pick = (a, r) => a[Math.floor(r() * a.length)];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const camel = (s) => s.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean).map(cap).join('');
  const HT = { Instagram: ['#Marketing', '#Brand', '#Trending', '#InstaGood'], Facebook: ['#Community', '#Offers'], LinkedIn: ['#B2B', '#Growth', '#Leadership', '#MarketingStrategy'], Email: [], 'Google Ads': [], Website: [] };

  function ctx(b, r) {
    const t = MF.TONES[b.tone] || MF.TONES.Professional;
    const topic = (b.topic || b.name || 'our offer').trim();
    return { b, t, r, name: b.name || topic, topic, aud: (b.audience || 'modern teams').toLowerCase(), verb: MF.OBJECTIVES[b.objective] || 'get started', adj: pick(t.adj, r), cta: pick(t.cta, r), e: t.e ? t.e + ' ' : '' };
  }
  MF.headlines = function (b, n = 6, seed) {
    const r = U.rng(seed || Math.floor(Math.random() * 1e9)); const c = ctx(b, r);
    const pool = [
      `Meet ${c.name} — built for ${c.aud}`,
      `${cap(c.adj)} ${c.topic.toLowerCase()}, made simple`,
      `Ready for ${c.topic.toLowerCase()}? Start here`,
      `${c.name} is here. Are you ready?`,
      `The smarter way to ${c.verb}`,
      `Why ${c.aud} are choosing ${c.name}`,
      `Don't just ${c.verb}. ${c.name}.`,
      `${Math.floor(2 + r() * 8)}x better ${c.topic.toLowerCase()} — see how`,
      `${c.name}: ${c.adj} results, delivered`,
    ];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool.slice(0, n);
  };
  MF.descriptions = function (b, n = 3, seed) {
    const r = U.rng(seed || Math.floor(Math.random() * 1e9)); const c = ctx(b, r);
    const pool = [
      `${c.name} gives ${c.aud} a ${c.adj} way to ${c.verb} — without the usual complexity.`,
      `Built around what ${c.aud} actually need, ${c.name} turns ${c.topic.toLowerCase()} into measurable results.`,
      `Join thousands who already ${c.verb} with ${c.name}. ${c.cta}.`,
      `From first click to final result, ${c.name} keeps ${c.aud} moving forward.`,
    ];
    return pool.sort(() => r() - 0.5).slice(0, n);
  };
  MF.gen = function (channel, b, seed) {
    const r = U.rng(seed == null ? Math.floor(Math.random() * 1e9) : seed);
    const c = ctx(b, r);
    const head = pick(MF.headlines(b, 9, Math.floor(r() * 1e9)), r);
    const desc = pick(MF.descriptions(b, 4, Math.floor(r() * 1e9)), r);
    const tags = ['#' + camel(c.name), ...HT[channel].sort(() => r() - 0.5).slice(0, 3), '#MarketFlow'].join(' ');
    let body, headline = head, hashtags = '';
    switch (channel) {
      case 'Instagram':
        body = `${c.e}${head}\n\n${desc}\n\n👉 ${c.cta} — link in bio.`; hashtags = tags; break;
      case 'Facebook':
        body = `${c.e}${head}\n\n${desc}\n\nWe built this for ${c.aud}, and we'd love to hear what you think. Tell us in the comments!\n\n${c.cta} →`; hashtags = tags.split(' ').slice(0, 2).join(' '); break;
      case 'LinkedIn':
        body = `${head}\n\n${desc}\n\nWhat ${c.aud} told us they need most:\n• Clear, measurable outcomes\n• Less manual work\n• A partner that moves fast\n\nHow is your team approaching ${c.topic.toLowerCase()} this quarter?\n\n${c.cta} → link in comments`; hashtags = tags; break;
      case 'Email':
        body = `Hi {{first_name}},\n\n${desc}\n\nHere's what you can expect:\n  – ${cap(c.adj)} results from day one\n  – Tailored for ${c.aud}\n  – Support whenever you need it\n\n${c.cta}: https://marketflow.example/${camel(c.name).toLowerCase()}\n\nWarmly,\nThe MarketFlow Team`; break;
      case 'Google Ads':
        headline = head.length > 30 ? head.slice(0, 29).trim() + '…' : head;
        body = desc.length > 90 ? desc.slice(0, 89).trim() + '…' : desc; break;
      default:
        body = `${desc}\n\nTrusted by ${c.aud} everywhere.`;
    }
    return { headline, body, cta: c.cta, hashtags };
  };
})();
