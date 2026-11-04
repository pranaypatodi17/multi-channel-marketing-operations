# CallLens — Sales Call Quality and Compliance Auditor

A static, backend-free website for a call-auditing product: a marketing site plus a working-looking Sales QA workspace. Everything runs in the browser from bundled, scripted sample calls, and state is kept in `localStorage`.

## Run it

No build step.

```bash
cd call-auditor
python3 -m http.server 8000   # then open http://localhost:8000
```

- `index.html` — marketing site (hero animation, evidence demo, industry rubrics, ROI calculator, pricing, FAQ, demo form)
- `app.html` — the workspace

## Workspace screens

| Screen | What it does |
| --- | --- |
| Team overview | KPIs with period-over-period deltas, score and compliance trend, category breakdown, top violations, leaderboard, review coverage, printable weekly report |
| Calls | Search, filter, sort and paginate 50 pre-loaded calls; audit CSV export |
| Call detail | Waveform and transcript synced to a play-head, flagged lines highlighted, rubric results with quoted evidence (click to jump), manager overrides, transcript corrections that re-run the rules, summary, coaching, rules-layer metrics, escalation with Slack preview |
| Agents | Cards and leaderboard, profile with trend, category radar vs team, suggested coaching points |
| Alerts | Live feed of high-severity calls, acknowledge / escalate / resolve with notes, Slack and email previews, a simulated incoming flagged call |
| Upload and sources | Drag-and-drop or sample calls run through an animated 7-stage pipeline; Exotel, Knowlarity, Ozonetel, Twilio and folder-sync cards |
| Rubric editor | Add, edit, weight and disable criteria; edit rule phrase lists with a live tester; impact preview on the last 30 days; publish with re-scoring and version history |
| Settings | Alert routing, consent text, PII masking, retention, team access, audit log |

## How scoring works (in the browser)

- Ten default criteria across Opening, Discovery, Product accuracy, Objection handling, Compliance, Tone and conduct, and Closing.
- **AI-judged criteria** come from the scripted analysis attached to each sample call, and each carries an evidence line that is verified against the transcript.
- **Rule criteria** (mandatory disclosure, prohibited claims) are computed live from the phrase lists in the rubric, with negation handling ("guarantee nahi hoti" is not flagged).
- The rules layer also measures talk share, interruptions, dead air, pace and recording notice.
- Editing the rubric, a transcript line or an override recalculates scores everywhere.

## Demo limits

- No audio is bundled. The player and transcript sync are live, but playback is simulated.
- Uploaded files are not analysed; they are mapped to one of the bundled sample transcripts.
- "Anvaya Financial", its agents and customers are fictional.

## Structure

```
index.html  app.html
css/base.css      tokens, light/dark themes, primitives
css/app.css       workspace
css/site.css      marketing site
js/data.js        rubric, agents, scripted Hinglish/English call archetypes
js/engine.js      call generation, scoring, rules layer, alerts, persistence
js/ui.js          icons, charts, toasts, modals
js/views-calls.js dashboard, calls, call detail
js/views-ops.js   agents, alerts, ingest, rubric editor, settings
js/app.js         shell, router, search, notifications
js/landing.js     marketing-site interactions
img/              product-tour screenshots
```

Use **Reset demo data** in the sidebar to clear everything stored in the browser.
