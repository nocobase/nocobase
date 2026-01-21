# Js Columns For Accounts En

## Setup

Shared helpers used by the following snippets.

```ts
/**
 * JSColumnModel helpers for CRM account tables.
 * Copy the function you need into a JS column and adjust the field names or view IDs.
 */

const industryPalette = {
  Technology: { color: '#1677ff', label: 'Tech' },
  Healthcare: { color: '#52c41a', label: 'Health' },
  Finance: { color: '#faad14', label: 'Finance' },
  Retail: { color: '#fa8c16', label: 'Retail' },
  Education: { color: '#2563eb', label: 'Edu' },
  Manufacturing: { color: '#eb2f96', label: 'MFG' },
};
```

## Get Record

Use this snippet to get record.

```ts
return ctx.record || {};
```

## Format Currency

Use this snippet to format currency.

```ts
const amount = Number(value || 0);
if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
return amount ? `$${amount.toFixed(0)}` : '$0';
```

## Render Account Identity Column

Render the account identity (name, number, type, industry badge) with a clickable title.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const industryInfo = record.industry && industryPalette[record.industry];
const industryBadge = record.industry
  ? `<span class="industry-badge" data-industry="${record.industry}">${industryInfo?.label || record.industry}</span>`
  : '';
const typeBadge = record.type ? `<span class="type-badge">${record.type}</span>` : '';

container.innerHTML = `
  <div class="account-identity">
    <button type="button" class="account-name" data-account-id="${record.id ?? ''}">
      ${record.name || 'Unnamed account'}
    </button>
    ${typeBadge}
    ${industryBadge}
    <div class="account-number">${record.account_number || 'No number'}</div>
  </div>
  <style>
    .account-identity{display:flex;flex-direction:column;gap:4px;font-size:13px;color:#1f1f1f;}
    .account-name{padding:0;background:none;border:none;color:#1677ff;font-weight:600;cursor:pointer;text-align:left;}
    .account-name:focus{outline:1px solid #1677ff;}
    .type-badge{background:#f0f5ff;color:#1677ff;border-radius:4px;padding:0 6px;font-size:11px;display:inline-flex;align-items:center;height:18px;}
    .industry-badge{background:#f6ffed;color:#237804;border-radius:4px;padding:0 6px;font-size:11px;margin-top:2px;display:inline-flex;height:18px;align-items:center;}
    .account-number{font-size:12px;color:#8c8c8c;}
  </style>
`;

const nameButton = container.querySelector('button.account-name');
if (nameButton) {
  nameButton.onclick = async () => {
    if (!record.id) return;
    await ctx.openView?.('ACCOUNT_DETAILS_VIEW_UID', {
      collectionName: ctx.collection?.name,
      dataSourceKey: ctx.collection?.dataSourceKey,
      filterByTk: record.id,
    });
  };
}
```

## Render Account Health Score

Calculate a health score that rewards ownership, recent activity, contacts, and revenue.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const hasOwner = record.owner_id ? 20 : 0;
const hasContacts = (record.contacts || []).length ? 20 : 0;
const hasLeads = (record.leads || []).length ? 20 : 0;
const hasRevenue = record.annual_revenue ? 20 : 0;
const updatedAt = record.updatedAt ? new Date(record.updatedAt) : null;
const isRecent = updatedAt ? Date.now() - updatedAt.getTime() < 1000 * 60 * 60 * 24 * 30 : false;
const score = hasOwner + hasContacts + hasLeads + hasRevenue + (isRecent ? 20 : 0);
const level = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';
const color = score >= 80 ? '#52c41a' : score >= 60 ? '#1677ff' : score >= 40 ? '#faad14' : '#ff4d4f';

container.innerHTML = `
  <div class="health-score">
    <div class="health-bar"><div style="width:${score}%;background:${color};"></div></div>
    <span style="color:${color};font-weight:600;">${score}% ${level}</span>
  </div>
  <style>
    .health-score{display:flex;align-items:center;gap:8px;}
    .health-bar{flex:1;height:6px;background:#f0f0f0;border-radius:3px;overflow:hidden;}
    .health-bar>div{height:100%;border-radius:3px;transition:width .2s ease;}
  </style>
`;
```

## Render Account Relationship Badges

Show related object counts (leads, contacts, opportunities) and display drawer lists on click.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const relatives = [
  { label: 'Leads', key: 'leads', items: record.leads || [] },
  { label: 'Contacts', key: 'contacts', items: record.contacts || [] },
  { label: 'Opportunities', key: 'opportunities', items: record.opportunities || [] },
];

container.innerHTML = `
  <div class="relationship-row">
    ${relatives
      .map(
        (entry) => `
          <button type="button" class="relation-pill" data-key="${entry.key}" data-count="${entry.items.length}">
            <span class="count">${entry.items.length}</span>
            <span>${entry.label}</span>
          </button>
        `,
      )
      .join('')}
  </div>
  <style>
    .relationship-row{display:flex;gap:6px;flex-wrap:wrap;}
    .relation-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #d9d9d9;border-radius:16px;padding:4px 10px;background:#fff;cursor:pointer;font-size:12px;}
    .relation-pill .count{font-weight:600;color:#1677ff;}
    .relation-pill:hover{border-color:#1677ff;color:#1677ff;}
  </style>
`;

container.querySelectorAll('.relation-pill').forEach((button) => {
  button.onclick = () => {
    const key = button.dataset.key;
    const entry = relatives.find((item) => item.key === key);
    if (!entry || !entry.items.length) {
      ctx.message?.info?.('No related data');
      return;
    }

    const list = entry.items
      .slice(0, 10)
      .map(
        (item) => `
          <li>
            <strong>${item.name || item.title || 'Untitled'}</strong>
            <span>${item.email || item.stage || ''}</span>
          </li>
        `,
      )
      .join('');

    ctx.viewer?.drawer?.({
      width: 420,
      title: `${entry.label} (${entry.items.length})`,
      content: `
        <div style="padding:12px;">
          <ul class="relation-list">${list}</ul>
        </div>
        <style>
          .relation-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
          .relation-list li{padding:8px;border-radius:6px;background:#f5f5f5;display:flex;flex-direction:column;gap:2px;}
          .relation-list strong{color:#1f1f1f;}
          .relation-list span{font-size:12px;color:#8c8c8c;}
        </style>
      `,
    });
  };
});
```

## Render Account Revenue Potential

Compare annual revenue with open opportunity value to highlight potential growth.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const annualRevenue = Number(record.annual_revenue || 0);
const pipelineTotal = (record.opportunities || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
const growth = annualRevenue ? Math.min((pipelineTotal / annualRevenue) * 100, 100) : 0;
const color = growth >= 60 ? '#52c41a' : growth >= 30 ? '#1677ff' : '#faad14';

container.innerHTML = `
  <div class="revenue-card">
    <div class="row"><span>Annual revenue</span><strong>${formatCurrency(annualRevenue)}</strong></div>
    <div class="row pipeline" data-clickable="${pipelineTotal > 0}">
      <span>Pipeline (${(record.opportunities || []).length})</span>
      <strong style="color:${color};">${formatCurrency(pipelineTotal)}</strong>
    </div>
    <div class="progress"><div style="width:${growth}%;background:${color};"></div></div>
  </div>
  <style>
    .revenue-card{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#8c8c8c;}
    .revenue-card .row{display:flex;justify-content:space-between;align-items:center;}
    .revenue-card strong{color:#1f1f1f;font-size:13px;}
    .revenue-card .pipeline{cursor:pointer;}
    .revenue-card .pipeline:hover strong{text-decoration:underline;}
    .progress{position:relative;height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden;}
    .progress>div{height:100%;border-radius:2px;}
  </style>
`;

const pipelineRow = container.querySelector('.pipeline');
if (pipelineRow && pipelineTotal > 0) {
  pipelineRow.onclick = () => {
    const list = (record.opportunities || [])
      .slice(0, 8)
      .map(
        (opportunity) => `
        <li>
          <strong>${opportunity.name || 'Untitled opportunity'}</strong>
          <span>${formatCurrency(opportunity.amount || 0)}</span>
        </li>
      `,
      )
      .join('');

    ctx.viewer?.drawer?.({
      width: 420,
      title: 'Open opportunities',
      content: `
        <div style="padding:12px;">
          <ul class="pipeline-list">${list}</ul>
        </div>
        <style>
          .pipeline-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;}
          .pipeline-list li{display:flex;justify-content:space-between;padding:8px;border-radius:6px;background:#f5f5f5;}
          .pipeline-list span{color:#52c41a;}
        </style>
      `,
    });
  };
}
```
