/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';

const snippet: SnippetModule = {
  contexts: ['*'],
  prefix: 'sn-link-cascade',
  label: 'Cascade select (load subcategory)',
  description: 'Load subcategories based on selected category',
  locales: {
    'zh-CN': {
      label: '级联选择（加载子分类）',
      description: '根据选择的分类加载对应的子分类',
    },
  },
  content: `
// Get selected category
const categoryId = ctx.record?.category?.id;

if (!categoryId) {
  return;
}

try {
  // Fetch subcategories from API
  const res = await ctx.api.request({
    url: 'subcategories:list',
    method: 'get',
    params: {
      filter: { categoryId },
      pageSize: 100,
    },
  });

  const subcategories = res?.data?.data || [];

  // Find subcategory field and update its options
  const items = ctx.model?.subModels?.grid?.subModels?.items;
  const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

  const subcategoryField = candidates.find((item) => item?.props?.name === 'subcategory');

  if (subcategoryField) {
    // Update field options
    subcategoryField.setProps({
      dataSource: subcategories,
      // Clear current value if it's not in new options
      value: undefined,
    });
  }
} catch (e) {
  console.error('[Form snippet] Failed to load subcategories:', e);
  ctx.message?.error?.(ctx.t('Failed to load subcategories'));
}
`,
};

export default snippet;
