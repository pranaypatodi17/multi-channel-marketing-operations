(function () {
  const MF = window.MF, U = MF.U, I = MF.icon, UI = MF.ui;
  const st = (UI.st.approvals = { tab: 'Pending', hf: 'all', sort: 'at', dir: -1, page: 1 });
  const ACT = { created: ['Created', 'grey'], submitted: ['Submitted', 'blue'], approved: ['Approved', 'green'], rejected: ['Rejected', 'red'], revision: ['Revision requested', 'orange'], scheduled: ['Scheduled', 'blue'], rescheduled: ['Rescheduled', 'blue'], unscheduled: ['Unscheduled', 'grey'], published: ['Published', 'green'], comment: ['Comment', 'purple'], recalled: ['Recalled', 'grey'] };
  MF.actions.apTab = (el) => { st.tab = el.dataset.t; st.page = 1; MF.rerender(); };
  MF.handlers.apHf = (el) => { st.hf = el.value; st.page = 1; MF.views.approvals.table(); };

  function ask({ title, label, req, confirm, cls, onOk, schedule, item }) {
    UI.modal({
      title, size: 'md', body: `${item ? `<div class="pv-mini">${UI.preview(item, true)}</div>` : ''}
        ${schedule ? `<label class="f">Schedule publish time<input type="datetime-local" id="m-at" min="${U.nowLocal()}" value="${(item && item.scheduledAt && item.scheduledAt > U.nowLocal()) ? item.scheduledAt : U.addDays(U.today(), 1) + 'T10:00'}"></label><label class="f check"><input type="checkbox" id="m-now"> Approve without scheduling (schedule later)</label>` : ''}
        <label class="f">${label}<textarea id="m-note" rows="3" placeholder="${req ? 'Required' : 'Optional'}"></textarea></label><p class="err" id="m-err" role="alert"></p>`,
      buttons: [{ label: 'Cancel', cls: 'ghost' }, { label: confirm, cls, onClick(m) { const note = m.el.querySelector('#m-note').value.trim(), err = m.el.querySelector('#m-err'); if (req && !note) { err.textContent = 'Please add feedback so the author knows what to change.'; return false; } const at = schedule && !m.el.querySelector('#m-now').checked ? m.el.querySelector('#m-at').value : null; if (schedule && !m.el.querySelector('#m-now').checked && (!at || at < U.nowLocal())) { err.textContent = 'Pick a future date and time.'; return false; } onOk(note, at); } }],
    });
  }
  Object.assign(MF.actions, {
    apApprove(el) { const it = MF.get.content(el.dataset.id); ask({ title: 'Approve & schedule', label: 'Note to author', confirm: 'Approve', cls: 'success', schedule: true, item: it, onOk: (n, at) => { MF.api.approve(it.id, at, n); UI.toast(at ? `Approved — scheduled for ${U.fmtDT(at)}. It now appears on the calendar.` : 'Approved — ready to schedule'); } }); },
    apReject(el) { const it = MF.get.content(el.dataset.id); ask({ title: 'Reject content', label: 'Reason for rejection', req: true, confirm: 'Reject', cls: 'danger', item: it, onOk: (n) => { MF.api.reject(it.id, n); UI.toast('Content rejected', 'info'); } }); },
    apRevise(el) { const it = MF.get.content(el.dataset.id); ask({ title: 'Request revision', label: 'What should change?', req: true, confirm: 'Send feedback', cls: 'primary', item: it, onOk: (n) => { MF.api.revise(it.id, n); UI.toast('Revision requested — author notified', 'info'); } }); },
    apComment(el) { const it = MF.get.content(el.dataset.id); ask({ title: 'Add comment', label: 'Comment', req: true, confirm: 'Post comment', cls: 'primary', onOk: (n) => { MF.api.comment(it.id, n); UI.toast('Comment added'); } }); },
    apSchedule(el) { const it = MF.get.content(el.dataset.id); ask({ title: 'Schedule post', label: 'Note (optional)', confirm: 'Schedule', cls: 'primary', schedule: true, item: it, onOk: (n, at) => { if (at) { MF.api.schedule(it.id, at); UI.toast('Scheduled on the calendar'); } } }); },
  });

  function card(it) {
    const c = MF.get.campaign(it.campaignId), fb = it.history.filter((h) => ['revision', 'rejected', 'comment', 'approved'].includes(h.action) && h.note);
    const acts = it.status === 'Pending' ? `<button class="btn success sm" data-action="apApprove" data-id="${it.id}">${I('check', 14)} Approve</button><button class="btn ghost sm" data-action="apRevise" data-id="${it.id}">Request changes</button><button class="btn ghost danger sm" data-action="apReject" data-id="${it.id}">Reject</button><button class="btn ghost sm" data-action="apComment" data-id="${it.id}">${I('message', 14)}</button>`
      : it.status === 'Approved' ? `<button class="btn primary sm" data-action="apSchedule" data-id="${it.id}">${I('calendar', 14)} Schedule</button>` : `<a class="btn ghost sm" href="#/studio?open=${it.id}">Open in Studio</a>`;
    return `<article class="ap-card"><div class="ap-pv">${UI.preview(it, true)}</div><div class="ap-info">
      <div class="row wrap">${UI.badge(it.status)}${UI.chBadge(it.channel)}${it.scheduledAt ? `<span class="muted sm">${I('clock', 13)} ${U.fmtDT(it.scheduledAt)}</span>` : ''}</div>
      <h4>${U.esc(it.headline)}</h4><p class="muted sm">${c ? `<button class="lnk" data-action="openCampaign" data-id="${c.id}">${U.esc(c.name)}</button>` : 'Standalone'} · by ${U.esc(it.author)} · submitted ${U.ago((it.history.find((h) => h.action === 'submitted') || it.history[0]).at)}</p>
      ${fb.length ? `<div class="thread">${fb.slice(-3).map((h) => `<div class="cm"><b>${U.esc(h.by)}</b> <span class="badge ${ACT[h.action][1]}">${ACT[h.action][0]}</span><p>${U.esc(h.note)}</p></div>`).join('')}</div>` : ''}
      <div class="row wrap mt">${acts}</div></div></article>`;
  }
  function histRows() {
    let rows = []; MF.state().content.forEach((it) => it.history.forEach((h) => rows.push({ h, it })));
    if (st.hf !== 'all') rows = rows.filter((r) => r.h.action === st.hf);
    return rows.sort((a, b) => (b.h.at - a.h.at) * (st.dir < 0 ? 1 : -1));
  }
  function table() { const w = document.getElementById('tbl-approvals'); if (w) w.innerHTML = histTable(); }
  function histTable() {
    const all = histRows(), pg = UI.page(all, st, 10);
    return `<div class="tbl-w"><table class="tbl"><thead><tr><th>When</th><th>Action</th><th>Content</th><th>Channel</th><th>By</th><th>Note</th></tr></thead><tbody>${pg.map(({ h, it }) => `<tr><td class="nw">${U.fmtTs(h.at)}</td><td><span class="badge ${(ACT[h.action] || ['', 'grey'])[1]}">${(ACT[h.action] || [h.action])[0]}</span></td><td><a href="#/studio?open=${it.id}">${U.esc(it.headline.slice(0, 48))}</a></td><td>${UI.chBadge(it.channel)}</td><td>${U.esc(h.by)}</td><td class="muted">${U.esc(h.note || '')}</td></tr>`).join('')}</tbody></table></div>${UI.pager('approvals', all.length, st.page, 10)}`;
  }

  MF.views.approvals = {
    table,
    render() {
      const c = MF.state().content, g = (f) => c.filter(f), tabs = { Pending: g((x) => x.status === 'Pending'), 'Needs revision': g((x) => x.status === 'Revision'), 'Ready to schedule': g((x) => x.status === 'Approved'), Scheduled: g((x) => x.status === 'Scheduled'), Rejected: g((x) => x.status === 'Rejected'), History: null };
      if (!tabs[st.tab] && st.tab !== 'History') st.tab = 'Pending';
      const list = tabs[st.tab];
      return `<div class="page-h"><div><h1>Approval Center</h1><p class="muted">Review, give feedback, and schedule content for publishing.</p></div></div>
      <div class="tabs">${Object.keys(tabs).map((t) => `<button class="tab ${st.tab === t ? 'on' : ''}" data-action="apTab" data-t="${t}">${t}${tabs[t] ? `<em>${tabs[t].length}</em>` : ''}</button>`).join('')}</div>
      ${st.tab === 'History' ? `<section class="card"><div class="toolbar"><label class="sel"><span class="sr">Filter</span><select data-bind="apHf:change"><option value="all">All actions</option>${Object.keys(ACT).map((k) => `<option value="${k}" ${st.hf === k ? 'selected' : ''}>${ACT[k][0]}</option>`).join('')}</select></label></div><div id="tbl-approvals">${histTable()}</div></section>`
        : list.length ? `<div class="ap-list">${list.sort((a, b) => (a.scheduledAt || '9').localeCompare(b.scheduledAt || '9')).map(card).join('')}</div>` : `<div class="card">${UI.empty('checkCircle', 'Nothing here', st.tab === 'Pending' ? 'Send content from the AI Content Studio to populate the queue.' : 'No items in this state.')}</div>`}`;
    },
  };
})();
