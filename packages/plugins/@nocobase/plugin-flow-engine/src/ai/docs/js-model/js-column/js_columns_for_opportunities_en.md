---
title: "Js Columns For Opportunities En"
description: "Shared helpers used by the following snippets."
---

# Js Columns For Opportunities En

## Setup

Shared helpers used by the following snippets.

```ts
account?: { name?: string };
  closeDate?: string;
  stakeholders?: Array<{ name?: string; role?: string }>;
  next_steps?: string;
  updatedAt?: string;
};

const stageOrder = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
```

## Get Record

Use this snippet to get record.

```ts
return (ctx.record || {});
```

## Format Currency

Use this snippet to format currency.

```ts
const num = Number(value || 0);
if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
return `$${num.toFixed(0)}`;
```

## Relative Date

Use this snippet to relative date.

```ts
if (!value) return 'No close date';
const date = new Date(value);
const diff = date.getTime() - Date.now();
const days = Math.round(diff / (1000 * 60 * 60 * 24));
if (days === 0) return 'Closes today';
return days > 0 ? `Closes in ${days}d` : `Closed ${Math.abs(days)}d ago`;
```

## Render Opportunity Stage Tracker

Display a stage tracker that highlights the current stage and probability.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const activeStage = record.stage || 'Prospecting';
const activeIndex = Math.max(stageOrder.indexOf(activeStage), 0);

container.innerHTML = `
  <div class="stage-tracker">
    ${stageOrder
      .map(
        (stage, index) => `
        <div class="stage ${index <= activeIndex ? 'active' : ''}">
          <span>${stage}</span>
        </div>
      `,
      )
      .join('')}
  </div>
  <div class="stage-meta">
    <span>${relativeDate(record.closeDate)}</span>
    <strong>${record.probability ? `${record.probability}% win chance` : 'Probability unknown'}</strong>
  </div>
  <style>
    .stage-tracker{display:flex;gap:6px;}
    .stage{flex:1;padding:4px 6px;border-radius:4px;background:#f5f5f5;font-size:11px;text-align:center;color:#8c8c8c;}
    .stage.active{background:#1677ff;color:#fff;font-weight:600;}
    .stage-meta{display:flex;justify-content:space-between;font-size:12px;color:#8c8c8c;margin-top:4px;}
  </style>
`;
```

## Render Opportunity Summary

Compare owner/account info with amount.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

container.innerHTML = `
  <div class="opportunity-summary">
    <div>
      <div class="title">${record.name || 'Untitled opportunity'}</div>
      <div class="meta">${record.account?.name || 'No account'} • ${record.owner?.name || 'No owner'}</div>
      <div class="meta">${relativeDate(record.closeDate)}</div>
    </div>
    <div class="amount">${formatCurrency(record.amount || 0)}</div>
  </div>
  <style>
    .opportunity-summary{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
    .title{font-weight:600;color:#1f1f1f;font-size:13px;}
    .meta{font-size:12px;color:#8c8c8c;}
    .amount{font-weight:600;color:#52c41a;}
  </style>
`;
```

## Render Opportunity Stakeholder Column

List stakeholders inside the column, with a detail drawer showing the full list.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const stakeholders = record.stakeholders || [];
const preview = stakeholders
  .slice(0, 3)
  .map((person) => `<span class="pill">${person.name || 'Unknown'} (${person.role || 'Role TBD'})</span>`)
  .join('');

container.innerHTML = `
  <div class="stakeholder-card">
    ${preview || '<span class="muted">No stakeholders</span>'}
    ${stakeholders.length > 3 ? `<button type="button" class="view-more">+${stakeholders.length - 3}</button>` : ''}
  </div>
  <style>
    .stakeholder-card{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
    .pill{background:#f0f5ff;color:#1677ff;border-radius:12px;padding:2px 8px;font-size:11px;}
    .view-more{border:none;background:#fff;color:#1677ff;cursor:pointer;font-size:11px;}
    .muted{font-size:12px;color:#bfbfbf;}
  </style>
`;

const moreButton = container.querySelector('button.view-more');
if (moreButton) {
  moreButton.onclick = () => {
    const list = stakeholders
      .map(
        (person) => `
        <li>
          <strong>${person.name || 'Unknown stakeholder'}</strong>
          <span>${person.role || 'Role TBD'}</span>
        </li>
      `,
      )
      .join('');

    ctx.viewer?.drawer?.({
      width: 420,
      title: 'Stakeholders',
      content: `
        <div style="padding:12px;">
          <ul class="stakeholder-list">${list}</ul>
        </div>
        <style>
          .stakeholder-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
          .stakeholder-list li{background:#fafafa;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:2px;}
          .stakeholder-list span{font-size:12px;color:#8c8c8c;}
        </style>
      `,
    });
  };
}
```
