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
  label: 'Cascade select (load child roles)',
  description: 'Load child roles based on the selected parent role',
  locales: {
    'zh-CN': {
      label: '级联选择（加载子角色）',
      description: '根据选择的父角色加载对应子角色',
    },
  },
  content: `
// Get selected parent role (adjust field name to match your form)
const parentRoleId = ctx.record?.parentRole?.id;

if (!parentRoleId) {
  return;
}

try {
  // Fetch child roles from API
  const res = await ctx.api.request({
    url: 'roles:list',
    method: 'get',
    params: {
      pageSize: 100,
      filter: {
        parentId: parentRoleId,
      },
    },
  });

  const childRoles = res?.data?.data || [];

  // Find the role select field and update its options
  const items = ctx.model?.subModels?.grid?.subModels?.items;
  const candidates = Array.isArray(items) ? items : Array.from(items?.values?.() || items || []);

  const roleField = candidates.find((item) => item?.props?.name === 'role');

  if (roleField) {
    // Update field options
    roleField.setProps({
      dataSource: childRoles.map((role) => ({
        value: role.id,
        label: role.name,
      })),
      // Clear current value if it's not in new options
      value: undefined,
    });
  }
} catch (e) {
  console.error('[Form snippet] Failed to load roles:', e);
  ctx.message?.error?.(ctx.t('Failed to load roles'));
}
`,
};

export default snippet;
