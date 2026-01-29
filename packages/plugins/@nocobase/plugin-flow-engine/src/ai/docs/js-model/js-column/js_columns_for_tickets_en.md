---
title: "Js Columns For Tickets En"
description: "Shared helpers used by the following snippets."
---

# Js Columns For Tickets En

## Setup

Shared helpers used by the following snippets.

```ts
assignee?: { name?: string };
  createdAt?: string;
  updatedAt?: string;
  sla_hours?: number;
  last_public_reply?: string;
};

const priorityColors: Record<string, string> = {
  Low: '#1677ff',
  Medium: '#faad14',
  High: '#ff4d4f',
  Urgent: '#a8071a',
};
```

## Get Record

Use this snippet to get record.

```ts
return (ctx.record || {});
```

## Relative Hours

Use this snippet to relative hours.

```ts
if (!from) return 0;
const diff = Date.now() - new Date(from).getTime();
return Math.floor(diff / (1000 * 60 * 60));
```

## Render Ticket Status Column

Render ticket status with colored pill and requester context.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const status = record.status || 'New';
const priority = record.priority || 'Low';
const color = priorityColors[priority] || '#8c8c8c';

container.innerHTML = `
  <div class="ticket-status">
    <div class="pill" style="border-color:${color};color:${color};">${status}</div>
    <div class="title">${record.title || 'Untitled ticket'}</div>
    <div class="requester">Requester: ${record.requester?.name || 'Unknown'}</div>
  </div>
  <style>
    .ticket-status{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#8c8c8c;}
    .ticket-status .pill{display:inline-flex;align-items:center;justify-content:center;border:1px solid;border-radius:999px;padding:0 10px;height:22px;font-size:11px;font-weight:600;}
    .ticket-status .title{color:#1f1f1f;font-weight:600;}
  </style>
`;
```

## Render Ticket Aging Column

Highlight SLA usage and the last public reply to catch aging issues.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const ageHours = relativeHours(record.createdAt);
const slaHours = record.sla_hours || 48;
const usage = Math.min((ageHours / slaHours) * 100, 100);
const lastReply = relativeHours(record.last_public_reply);
const color = usage >= 100 ? '#ff4d4f' : usage >= 70 ? '#faad14' : '#52c41a';

container.innerHTML = `
  <div class="aging-card">
    <div class="row">
      <span>Age</span>
      <strong>${ageHours}h</strong>
    </div>
    <div class="progress"><div style="width:${usage}%;background:${color};"></div></div>
    <div class="row">
      <span>SLA (${slaHours}h)</span>
      <span class="reply">Last reply ${lastReply ? `${lastReply}h ago` : 'never'}</span>
    </div>
  </div>
  <style>
    .aging-card{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#8c8c8c;}
    .aging-card .row{display:flex;justify-content:space-between;align-items:center;}
    .aging-card strong{color:#1f1f1f;}
    .progress{height:4px;background:#f0f0f0;border-radius:4px;overflow:hidden;}
    .progress>div{height:100%;border-radius:4px;}
    .reply{font-size:11px;color:#8c8c8c;}
  </style>
`;
```

## Render Ticket Assignment Column

Display assignee with action buttons to reassign or escalate.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const assigneeLabel = record.assignee?.name || 'Unassigned';

container.innerHTML = `
  <div class="assignment-card">
    <div>
      <div class="label">Assignee</div>
      <div class="assignee">${assigneeLabel}</div>
    </div>
    <div class="actions">
      <button type="button" data-action="reassign">Reassign</button>
      <button type="button" data-action="escalate">Escalate</button>
    </div>
  </div>
  <style>
    .assignment-card{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;}
    .assignment-card .label{color:#8c8c8c;}
    .assignment-card .assignee{color:#1f1f1f;font-weight:600;}
    .assignment-card .actions{display:flex;gap:6px;}
    .assignment-card .actions button{border:1px solid #d9d9d9;border-radius:6px;padding:4px 10px;background:#fff;cursor:pointer;}
  </style>
`;

container.querySelectorAll('button[data-action]').forEach((button) => {
  button.onclick = () => {
    const action = button.dataset.action;
    ctx.message?.info?.(`${action === 'reassign' ? 'Reassigning' : 'Escalating'} ticket ${record.id || ''}`);
  };
});
```
