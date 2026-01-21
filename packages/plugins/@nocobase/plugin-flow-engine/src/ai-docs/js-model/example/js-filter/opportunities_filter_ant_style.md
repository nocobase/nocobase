# Opportunities Filter Ant Style

## Setup

Shared helpers used by the following snippets.

```ts
const targetBlockUid = ctx.args?.targetBlockUid || 'OPPORTUNITY_TABLE_BLOCK_UID';
const wonISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const chips = [
  { key: 'all', label: 'All deals', emoji: '📈' },
  {
    key: 'pipeline',
    label: 'Active pipeline',
    emoji: '⚙️',
    filter: { stage: { $in: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation'] } },
  },
  {
    key: 'won',
    label: 'Closed won (30d)',
    emoji: '🏆',
    filter: { stage: 'Closed Won', updatedAt: { $gte: wonISO } },
  },
  { key: 'lost', label: 'Closed lost', emoji: '📉', filter: { stage: 'Closed Lost' } },
  { key: 'highValue', label: '>$100K', emoji: '💰', filter: { amount: { $gte: 100000 } } },
];

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
