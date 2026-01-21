# Js Columns For Contacts En

## Setup

Shared helpers used by the following snippets.

```ts
email?: string;
  phone?: string;
  avatar?: string;
  timezone?: string;
  preferred_channel?: 'email' | 'phone' | 'sms' | 'chat';
  last_contacted_at?: string;
  interactions?: Array<{ channel?: string; occurredAt?: string; note?: string }>;
};

const channelLabels: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  chat: 'Chat',
};
```

## Get Record

Use this snippet to get record.

```ts
return (ctx.record || {});
```

## Format Relative Time

Use this snippet to format relative time.

```ts
if (!value) return 'Never';
const diff = Date.now() - new Date(value).getTime();
const minutes = Math.floor(diff / (1000 * 60));
if (minutes < 60) return `${minutes}m ago`;
const hours = Math.floor(minutes / 60);
if (hours < 24) return `${hours}h ago`;
const days = Math.floor(hours / 24);
return `${days}d ago`;
```

## Get Initials

Use this snippet to get initials.

```ts
if (!name) return '??';
return name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();
```

## Render Contact Identity Column

Show avatar, name, job, and related account in the same cell.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const account = record.account?.name ? `<span class="contact-account">${record.account.name}</span>` : '';
const avatarImage = record.avatar
  ? `<img src="${record.avatar}" alt="${record.name || 'Contact'}" />`
  : `<span class="avatar-fallback">${getInitials(record.name)}</span>`;

container.innerHTML = `
  <div class="contact-identity">
    <div class="avatar">${avatarImage}</div>
    <div class="contact-info">
      <button type="button" class="contact-name" data-contact-id="${record.id ?? ''}">${
        record.name || 'Unnamed contact'
      }</button>
      <span class="job-title">${record.job_title || 'No title'}</span>
      ${account}
    </div>
  </div>
  <style>
    .contact-identity{display:flex;gap:8px;align-items:center;}
    .avatar{width:32px;height:32px;border-radius:50%;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;}
    .avatar img{width:100%;height:100%;object-fit:cover;}
    .avatar-fallback{font-weight:600;color:#1677ff;}
    .contact-info{display:flex;flex-direction:column;gap:2px;}
    .contact-name{background:none;border:none;padding:0;text-align:left;color:#1677ff;font-weight:600;cursor:pointer;}
    .contact-account{font-size:11px;color:#8c8c8c;}
    .job-title{font-size:12px;color:#8c8c8c;}
  </style>
`;

const nameButton = container.querySelector('button.contact-name');
if (nameButton) {
  nameButton.onclick = async () => {
    if (!record.id) return;
    await ctx.openView?.('CONTACT_DETAILS_VIEW_UID', {
      collectionName: ctx.collection?.name,
      dataSourceKey: ctx.collection?.dataSourceKey,
      filterByTk: record.id,
    });
  };
}
```

## Render Contact Engagement Column

Highlight latest interaction and the channel that was used.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const lastInteraction = (record.interactions || []).sort((a, b) =>
  (b.occurredAt || '').localeCompare(a.occurredAt || ''),
)[0];

container.innerHTML = `
  <div class="engagement-card">
    <div class="status-row">
      <span>Latest touch</span>
      <strong>${formatRelativeTime(lastInteraction?.occurredAt)}</strong>
    </div>
    <div class="status-row">
      <span>Channel</span>
      <strong>${channelLabels[lastInteraction?.channel || ''] || 'Unspecified'}</strong>
    </div>
    <div class="note">${lastInteraction?.note || 'No recent notes'}</div>
  </div>
  <style>
    .engagement-card{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#8c8c8c;}
    .status-row{display:flex;justify-content:space-between;align-items:center;}
    .status-row strong{color:#1f1f1f;font-size:13px;}
    .note{background:#f5f5f5;border-radius:6px;padding:6px;color:#595959;}
  </style>
`;
```

## Render Contact Channel Column

Display preferred contact channel with quick action buttons.

```ts
const record = getRecord(ctx);
const container = ctx.element;
if (!container) return;

const channel = record.preferred_channel || 'email';
const emailButton = record.email
  ? `<button type="button" data-type="email">✉️ Email</button>`
  : '<span class="muted">Email unavailable</span>';
const phoneButton = record.phone
  ? `<button type="button" data-type="phone">📞 Call</button>`
  : '<span class="muted">Phone unavailable</span>';

container.innerHTML = `
  <div class="channel-card">
    <div class="channel-label">Preferred: ${channelLabels[channel]}</div>
    <div class="channel-actions">${emailButton}${phoneButton}</div>
  </div>
  <style>
    .channel-card{display:flex;flex-direction:column;gap:6px;}
    .channel-label{font-size:12px;color:#8c8c8c;}
    .channel-actions{display:flex;gap:6px;flex-wrap:wrap;}
    .channel-actions button{border:1px solid #d9d9d9;border-radius:6px;padding:4px 10px;background:#fff;cursor:pointer;}
    .muted{font-size:12px;color:#bfbfbf;}
  </style>
`;

container.querySelectorAll('button[data-type]').forEach((button) => {
  button.onclick = () => {
    const type = button.dataset.type;
    const value = type === 'email' ? record.email : record.phone;
    if (!value) return;
    ctx.message?.info?.(`Use ${type} to reach ${record.name || 'contact'}: ${value}`);
  };
});
```
