/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';

type FlowCtx = FlowModel['context'];

type FilterChip = {
  key: string;
  label: string;
  emoji: string;
  filter?: Record<string, any>;
};

/**
 * Toolbar filters for product catalog dashboards.
 */
export async function setupProductCategoriesFilterToolbar(ctx: FlowCtx) {
  const targetBlockUid = ctx.args?.targetBlockUid || 'PRODUCT_CATEGORY_BLOCK_UID';

  const chips: FilterChip[] = [
    { key: 'all', label: 'All categories', emoji: '🗂️' },
    { key: 'hardware', label: 'Hardware', emoji: '💻', filter: { type: 'Hardware' } },
    { key: 'software', label: 'Software', emoji: '🧩', filter: { type: 'Software' } },
    { key: 'subscription', label: 'Subscription', emoji: '🔁', filter: { billing_model: 'Subscription' } },
    { key: 'discontinued', label: 'Discontinued', emoji: '⛔', filter: { status: 'Discontinued' } },
  ];

  await renderToolbar(ctx, targetBlockUid, chips);
}

async function renderToolbar(ctx: FlowCtx, targetBlockUid: string, chips: FilterChip[]) {
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

    container.querySelectorAll<HTMLButtonElement>('button[data-key]').forEach((button) => {
      button.onclick = () => {
        const key = button.dataset.key;
        if (key && key !== activeKey) {
          void applyFilter(key);
        }
      };
    });
  };

  const applyFilter = async (key: string) => {
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
}
