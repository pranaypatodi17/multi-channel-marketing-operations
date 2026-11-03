# MarketFlow — Marketing Campaign & Automation Platform

A static, backend-free **Marketing Operations dashboard** built with plain HTML, CSS and JavaScript. It behaves like a live SaaS product: every screen reads from and writes to one shared data store, persisted in `localStorage`.

## Run it

No build step. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Screens

| Screen | Highlights |
| --- | --- |
| **Dashboard** | Running campaigns, spend, revenue, leads, conversion & ROI with period-over-period deltas, revenue-vs-spend chart, channel charts, activity feed |
| **Campaigns** | Create via brief/audience/channels/budget/dates modal, search · filter · sort · paginate, detail drawer, Draft → In Review → Scheduled → Active → Completed |
| **AI Content Studio** | Simulated generation per channel, headline/description ideas, editable copy, platform-specific previews (Instagram, Facebook, LinkedIn, Email, Google Ads, Website), send for approval |
| **Approval Center** | Approve & schedule, reject, request revision, comment threads, full approval history |
| **Calendar** | Month/week views, channel filters, post details, drag-and-drop rescheduling (also from the "ready to schedule" tray) |
| **Leads & CRM** | Scoring (Hot/Warm/Cold), source & campaign attribution, profile drawer with interaction timeline, rep assignment, status updates, CSV export |
| **Automations** | Visual trigger → AI scoring → segment → action builder, animated test run, enable/pause, configurable thresholds & actions, run log |
| **Reports** | Date-range filters, revenue by campaign, leads by channel, funnel, spend vs. revenue, best content, simulated export (CSV / JSON / print-to-PDF) |

## Everything is connected

- Creating a campaign generates content drafts and updates the dashboard, calendar and reports.
- Sending content for approval fills the Approval Center; approving it **schedules it on the calendar**, and once all content is approved the campaign advances automatically.
- Capturing a lead (Leads page or "Simulate live traffic") runs active **automation workflows** (score → segment → assign/email), updates the CRM, campaign lead counts and analytics.
- Marking a lead **Won** attributes its deal value to the campaign's revenue, ROI and conversion metrics.

## Project structure

```
index.html
css/styles.css         # design tokens, light/dark themes, responsive layout
js/util.js icons.js    # helpers, SVG icon set
js/contentgen.js       # simulated AI copy generator
js/store.js            # seed data, state, metrics maths, domain actions, persistence
js/charts.js           # SVG/HTML charts (line, bars, donut, funnel, sparkline)
js/ui.js               # toasts, modals, drawers, pagination, platform previews
js/views/*.js          # one module per screen
js/app.js              # shell, hash router, global search, notifications, theme
```

Use **Reset demo data** (sidebar) to restore the original sample data.
