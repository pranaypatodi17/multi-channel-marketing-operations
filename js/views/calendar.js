(function () {
  const MF = window.MF, U = MF.U, I = MF.icon, UI = MF.ui;
  const st = (UI.st.calendar = { mode: 'month', cursor: U.today(), off: new Set() });
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const evs = () => MF.state().content.filter((x) => x.scheduledAt && ['Scheduled', 'Published', 'Pending'].includes(x.status) && !st.off.has(x.channel));
  const chip = (x) => `<div class="cal-ev ${x.status.toLowerCase()}" ${x.status !== 'Published' ? 'draggable="true"' : ''} data-id="${x.id}" data-action="calOpen" style="--c:${MF.CH_COLOR[x.channel]}" title="${U.esc(x.headline)} — ${x.status}"><i></i><span class="tm">${U.fmtTime(x.scheduledAt).replace(' ', '').toLowerCase()}</span><span class="tt">${U.esc(x.headline)}</span></div>`;

  Object.assign(MF.actions, {
    calMode(el) { st.mode = el.dataset.m; MF.rerender(); },
    calNav(el) { const d = U.parse(st.cursor); const k = +el.dataset.d; if (st.mode === 'month') { d.setDate(1); d.setMonth(d.getMonth() + k); } else d.setDate(d.getDate() + 7 * k); st.cursor = U.iso(d); MF.rerender(); },
    calToday() { st.cursor = U.today(); MF.rerender(); },
    calCh(el) { const c = el.dataset.c; st.off.has(c) ? st.off.delete(c) : st.off.add(c); MF.rerender(); },
    calOpen(el) { open(el.dataset.id); },
  });

  function open(id) {
    const it = MF.get.content(id), c = MF.get.campaign(it.campaignId), locked = it.status === 'Published';
    UI.modal({
      title: 'Scheduled post', size: 'lg',
      body: `<div class="cal-d"><div>${UI.preview(it)}</div><div class="form one">
        <div class="row wrap">${UI.badge(it.status)}${UI.chBadge(it.channel)}</div>
        <h4>${U.esc(it.headline)}</h4>
        <p class="muted sm">${c ? `Campaign: <b>${U.esc(c.name)}</b>` : 'Standalone content'}<br>Author: ${U.esc(it.author)}</p>
        ${it.status === 'Pending' ? `<div class="banner amber">${I('clock', 16)}<div>Awaiting approval — this date is only proposed. <a href="#/approvals" class="link" id="goap">Open Approval Center</a></div></div>` : ''}
        ${it.perf ? `<div class="mgrid sm"><div><small>Reach</small><b>${U.numK(it.perf.reach)}</b></div><div><small>Engagements</small><b>${U.numK(it.perf.engagements)}</b></div><div><small>Clicks</small><b>${U.numK(it.perf.clicks)}</b></div><div><small>Leads</small><b>${it.perf.leads}</b></div></div>` : ''}
        <label class="f">${locked ? 'Published at' : 'Reschedule'}<input type="datetime-local" id="cal-at" value="${it.scheduledAt}" ${locked ? 'disabled' : `min="${U.nowLocal()}"`}></label>
        <p class="err" id="cal-err" role="alert"></p></div></div>`,
      buttons: [{ label: 'Open in Studio', cls: 'ghost', onClick() { MF.nav('studio?open=' + id); } }, ...(it.status === 'Scheduled' ? [{ label: 'Unschedule', cls: 'ghost danger', onClick() { MF.api.unschedule(id); UI.toast('Removed from calendar — back in "Ready to schedule"', 'info'); } }] : []),
        ...(locked ? [{ label: 'Close', cls: 'primary' }] : [{ label: 'Save new time', cls: 'primary', onClick(m) { const v = m.el.querySelector('#cal-at').value; if (!v || v < U.nowLocal()) { m.el.querySelector('#cal-err').textContent = 'Choose a future date and time.'; return false; } MF.api.schedule(id, v); UI.toast('Rescheduled to ' + U.fmtDT(v)); } }])],
      onMount(m) { const g = m.el.querySelector('#goap'); if (g) g.onclick = () => m.close(); },
    });
  }

  function drop(id, date) {
    const it = MF.get.content(id); if (!it) return; if (date < U.today()) return UI.toast("Can't schedule in the past", 'error');
    const time = it.scheduledAt ? it.scheduledAt.split('T')[1] : '10:00', at = date + 'T' + time;
    if (at < U.nowLocal()) return UI.toast('That time has already passed today', 'error');
    MF.api.schedule(id, at); UI.toast(`Moved to ${U.fmtDate(date)} at ${U.fmtTime(at)}`);
  }

  MF.views.calendar = {
    render() {
      const cur = U.parse(st.cursor), t = U.today(), all = evs(), byDay = {};
      all.forEach((x) => { const d = x.scheduledAt.slice(0, 10); (byDay[d] = byDay[d] || []).push(x); });
      Object.values(byDay).forEach((a) => a.sort((x, y) => x.scheduledAt.localeCompare(y.scheduledAt)));
      let title, cells = '';
      if (st.mode === 'month') {
        title = MON[cur.getMonth()] + ' ' + cur.getFullYear();
        const first = new Date(cur.getFullYear(), cur.getMonth(), 1), start = new Date(first); start.setDate(1 - first.getDay());
        for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const iso = U.iso(d), a = byDay[iso] || []; cells += `<div class="cal-c ${d.getMonth() !== cur.getMonth() ? 'out' : ''} ${iso === t ? 'today' : ''} ${iso < t ? 'past' : ''}" data-date="${iso}"><span class="dn">${d.getDate()}</span>${a.slice(0, 3).map(chip).join('')}${a.length > 3 ? `<small class="more">+${a.length - 3} more</small>` : ''}</div>`; }
      } else {
        const s = new Date(cur); s.setDate(cur.getDate() - cur.getDay()); const e = new Date(s); e.setDate(s.getDate() + 6);
        title = U.fmtDate(U.iso(s)) + ' – ' + U.fmtDateY(U.iso(e));
        for (let i = 0; i < 7; i++) { const d = new Date(s); d.setDate(s.getDate() + i); const iso = U.iso(d), a = byDay[iso] || []; cells += `<div class="cal-c wk ${iso === t ? 'today' : ''} ${iso < t ? 'past' : ''}" data-date="${iso}"><span class="dn"><small>${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</small> ${d.getDate()}</span>${a.map(chip).join('') || '<small class="muted">No posts</small>'}</div>`; }
      }
      const unsched = MF.state().content.filter((x) => x.status === 'Approved' && !x.scheduledAt && !st.off.has(x.channel));
      return `<div class="page-h"><div><h1>Marketing Calendar</h1><p class="muted">Drag posts to reschedule. Approved content appears here automatically.</p></div>
        <div class="row"><div class="seg">${['month', 'week'].map((m) => `<button class="${st.mode === m ? 'on' : ''}" data-action="calMode" data-m="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div></div></div>
      <section class="card"><div class="cal-bar"><div class="row"><button class="icon-btn" data-action="calNav" data-d="-1" aria-label="Previous">${I('left')}</button><h2 class="cal-t">${title}</h2><button class="icon-btn" data-action="calNav" data-d="1" aria-label="Next">${I('right')}</button><button class="btn ghost sm" data-action="calToday">Today</button></div>
        <div class="chips">${MF.CHANNELS.map((c) => `<button class="chip-f ${st.off.has(c) ? '' : 'on'}" style="--c:${MF.CH_COLOR[c]}" data-action="calCh" data-c="${c}" aria-pressed="${!st.off.has(c)}"><i></i>${c}</button>`).join('')}</div></div>
        ${unsched.length ? `<div class="unsched"><b>${I('flag', 14)} Ready to schedule (${unsched.length}) — drag onto a day:</b>${unsched.map((x) => `<div class="cal-ev approved" draggable="true" data-id="${x.id}" data-action="calOpen2" style="--c:${MF.CH_COLOR[x.channel]}"><i></i><span class="tt">${U.esc(x.headline)}</span></div>`).join('')}</div>` : ''}
        <div class="cal ${st.mode}"><div class="cal-h">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<div>${d}</div>`).join('')}</div><div class="cal-g">${cells}</div></div>
        <div class="legend lg2"><span><i class="ev-s"></i>Scheduled</span><span><i class="ev-p"></i>Pending approval</span><span><i class="ev-d"></i>Published</span></div></section>`;
    },
    mount(root) {
      const g = root.querySelector('.cal-g'); if (!g) return;
      MF.actions.calOpen2 = (el) => { const it = MF.get.content(el.dataset.id); MF.actions.apSchedule({ dataset: { id: it.id } }); };
      root.addEventListener('dragstart', (e) => { const ev = e.target.closest('.cal-ev'); if (!ev) return; e.dataTransfer.setData('text/plain', ev.dataset.id); e.dataTransfer.effectAllowed = 'move'; ev.classList.add('drag'); });
      root.addEventListener('dragend', (e) => { e.target.classList && e.target.classList.remove('drag'); root.querySelectorAll('.over').forEach((x) => x.classList.remove('over')); });
      g.addEventListener('dragover', (e) => { const c = e.target.closest('.cal-c'); if (c) { e.preventDefault(); root.querySelectorAll('.over').forEach((x) => x !== c && x.classList.remove('over')); c.classList.add('over'); } });
      g.addEventListener('drop', (e) => { const c = e.target.closest('.cal-c'); if (!c) return; e.preventDefault(); drop(e.dataTransfer.getData('text/plain'), c.dataset.date); });
      g.querySelectorAll('.cal-c').forEach((c) => c.addEventListener('dblclick', (e) => { if (e.target.closest('.cal-ev')) return; UI.toast('Tip: drag approved content onto this day to schedule it', 'info'); }));
    },
  };
})();
