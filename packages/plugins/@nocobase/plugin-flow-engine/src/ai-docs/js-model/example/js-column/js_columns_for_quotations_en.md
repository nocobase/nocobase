# Js Columns For Quotations En

## Setup

Shared helpers used by the following snippets.

```ts
owner?: { name?: string };
  amount?: number;
  discount_rate?: number;
  valid_until?: string;
  status?: 'Draft' | 'Pending approval' | 'Approved' | 'Rejected' | 'Expired';
  gross_margin?: number;
  line_items?: Array<{ name?: string; quantity?: number; price?: number }>;
};
```

## Get Record

Use this snippet to get record.

```ts
return (ctx.record || {});
```

## Format Currency

Use this snippet to format currency.

```ts
const amount = Number(value || 0);
if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
return `$${amount.toFixed(0)}`;
```

## Time Hint

Use this snippet to time hint.

```ts
if (!value) return 'No expiry';
const diff = new Date(value).getTime() - Date.now();
const days = Math.round(diff / (1000 * 60 * 60 * 24));
if (days > 0) return `${days}d left`;
return `Expired ${Math.abs(days)}d ago`;
```

## Render Quote Summary Column

Compact quote summary combining quote number, owner, and total.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

container.innerHTML = `
  <div class="quote-summary">
    <div class="header">
      <strong>${record.quote_number || 'Draft quote'}</strong>
      <span>${record.customer?.name || 'No customer'}</span>
    </div>
    <div class="meta">
      Owner: ${record.owner?.name || 'Unassigned'} • ${timeHint(record.valid_until)}
    </div>
    <div class="amount">${formatCurrency(record.amount || 0)}</div>
  </div>
  <style>
    .quote-summary{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#8c8c8c;}
    .quote-summary .header{display:flex;justify-content:space-between;color:#1f1f1f;}
    .quote-summary .header strong{font-size:13px;}
    .amount{font-weight:600;color:#52c41a;}
  </style>
`;
```

## Render Quote Financials Column

Show discount, gross margin, and a quick list of top line items.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const items = (record.line_items || []).slice(0, 3);

container.innerHTML = `
  <div class="quote-financials">
    <div class="row">
      <span>Discount</span>
      <strong>${record.discount_rate ? `${record.discount_rate}%` : '0%'}</strong>
    </div>
    <div class="row">
      <span>Gross margin</span>
      <strong>${record.gross_margin ? `${record.gross_margin}%` : 'Not provided'}</strong>
    </div>
    <ul class="line-items">
      ${items
        .map(
          (item) => `
            <li>
              <span>${item.name || 'Unnamed item'}</span>
              <span>${item.quantity || 0} × ${formatCurrency(item.price || 0)}</span>
            </li>
          `,
        )
        .join('')}
    </ul>
  </div>
  <style>
    .quote-financials{display:flex;flex-direction:column;gap:4px;font-size:12px;}
    .quote-financials .row{display:flex;justify-content:space-between;color:#8c8c8c;}
    .line-items{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:4px;}
    .line-items li{display:flex;justify-content:space-between;background:#f5f5f5;border-radius:4px;padding:4px 6px;}
  </style>
`;
```

## Render Quote Status Column

Visualize the approval status using a badge and progress ring.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const statusColors: Record<string, string> = {
  Draft: '#8c8c8c',
  'Pending approval': '#faad14',
  Approved: '#52c41a',
  Rejected: '#ff4d4f',
  Expired: '#bfbfbf',
};
const status = record.status || 'Draft';

container.innerHTML = `
  <div class="status-card">
    <span class="status-pill" style="background:${statusColors[status] || '#8c8c8c'}15;color:${
      statusColors[status] || '#8c8c8c'
    };">${status}</span>
    <div class="hint">${timeHint(record.valid_until)}</div>
  </div>
  <style>
    .status-card{display:flex;flex-direction:column;gap:6px;align-items:flex-start;}
    .status-pill{padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;}
    .hint{font-size:12px;color:#8c8c8c;}
  </style>
`;
```
