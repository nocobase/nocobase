# Contacts Filter Ant Style

## Setup

Shared helpers used by the following snippets.

```ts
const targetBlockUid = ctx.args?.targetBlockUid || 'CONTACT_TABLE_BLOCK_UID';
const now = Date.now();
const engagedISO = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
const staleISO = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();
const currentUserId = ctx.user?.id;

const chips = [
  { key: 'all', label: 'All contacts', emoji: '📇' },
  {
    key: 'recentlyEngaged',
    label: 'Engaged (14d)',
    emoji: '💬',
    filter: { last_contacted_at: { $gte: engagedISO } },
  },
  { key: 'stale', label: 'No touch (60d)', emoji: '🕒', filter: { last_contacted_at: { $lte: staleISO } } },
  { key: 'vip', label: 'VIP tier', emoji: '⭐', filter: { tier: 'VIP' } },
  { key: 'unassigned', label: 'Unassigned', emoji: '🎯', filter: { owner_id: null } },
  currentUserId ? { key: 'mine', label: 'My contacts', emoji: '👤', filter: { owner_id: currentUserId } } : null,
].filter(Boolean);

await renderToolbar(targetBlockUid, chips);
```

## Render Toolbar

Use this snippet to render toolbar.

```ts
const container = ctx.element;
if (!container) return;

let activeKey = chips[0]?.key || 'all';

const render = () => {
  container.innerHTML = `
    <div class="filter-toolbar">
      ${chips
        .map(
          (chip) => `
            <button type="button" class="chip ${chip.key === activeKey ? 'active' : ''}" data-key="${chip.key}">
              <span class="emoji">${chip.emoji}</span>
              <span>${chip.label}</span>
            </button>
          `,
        )
        .join('')}
    </div>
    <style>
      .filter-toolbar{display:flex;flex-wrap:wrap;gap:6px;}
      .chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #d9d9d9;border-radius:999px;padding:4px 12px;background:#fff;cursor:pointer;font-size:12px;}
      .chip.active{background:#1677ff;border-color:#1677ff;color:#fff;}
      .emoji{font-size:13px;}
    </style>
  `;

  container.querySelectorAll('button[data-key]').forEach((button) => {
    button.onclick = () => {
      const key = button.dataset.key;
      if (key && key !== activeKey) {
        void applyFilter(key);
      }
    };
  });
};

const applyFilter = async (key) => {
  const chip = chips.find((entry) => entry.key === key);
  if (!chip) return;

  const targetModel = ctx.engine?.getModel?.(targetBlockUid);
  if (!targetModel || !targetModel.resource) {
    ctx.message?.warning?.(`Block ${targetBlockUid} is not available`);
    return;
  }

  if (ctx.model?.uid && targetModel.resource.filters?.[ctx.model.uid]) {
    delete targetModel.resource.filters[ctx.model.uid];
  }

  if (ctx.model?.uid && chip.filter) {
    targetModel.resource.addFilterGroup?.(ctx.model.uid, chip.filter);
  }

  await targetModel.resource.refresh?.();
  activeKey = key;
  render();
};

render();
await applyFilter(activeKey);
```
