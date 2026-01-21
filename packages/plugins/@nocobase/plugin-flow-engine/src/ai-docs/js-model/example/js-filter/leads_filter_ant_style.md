# Leads Filter Ant Style

## Setup

Shared helpers used by the following snippets.

```ts
const targetBlockUid = ctx.args?.targetBlockUid || 'LEAD_TABLE_BLOCK_UID';
const now = Date.now();
const hotISO = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
const coldISO = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
const ownerId = ctx.user?.id;

const chips = [
  { key: 'all', label: 'All leads', emoji: '🧲' },
  { key: 'new', label: 'New', emoji: '✨', filter: { status: 'New' } },
  { key: 'qualified', label: 'Qualified', emoji: '✅', filter: { status: 'Qualified' } },
  { key: 'hot', label: 'Hot (7d)', emoji: '🔥', filter: { last_activity_at: { $gte: hotISO } } },
  { key: 'cold', label: 'Cold (90d+)', emoji: '❄️', filter: { last_activity_at: { $lte: coldISO } } },
  ownerId ? { key: 'assigned', label: 'Assigned to me', emoji: '👤', filter: { owner_id: ownerId } } : null,
].filter(Boolean);

await renderToolbar(targetBlockUid, chips);
```

## Render Toolbar

Use this snippet to render toolbar.

```ts
const container = ctx.element as HTMLElement;
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
