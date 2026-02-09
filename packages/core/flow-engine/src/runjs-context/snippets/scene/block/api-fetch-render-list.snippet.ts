/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSBlockRunJSContext } from '../../../contexts/JSBlockRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-jsb-fetch-list',
  label: 'Fetch & render list',
  description: 'Fetch a small list via ctx.api and render basic HTML',
  locales: {
    'zh-CN': {
      label: '拉取并渲染列表',
      description: '使用 ctx.api 拉取少量数据，并渲染基础 HTML 列表',
    },
  },
  content: `
// Fetch users
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

// Render as a simple HTML list
ctx.render([
  '<div style="padding:12px">',
  '<h4 style="margin:0 0 8px">' + ctx.t('Users') + '</h4>',
  '<ul style="margin:0; padding-left:20px">',
  ...rows.map((r, i) => '<li>#' + (i + 1) + ': ' + String((r && (r.nickname ?? r.username ?? r.id)) ?? '') + '</li>'),
  '</ul>',
  '</div>'
].join(''));
`,
};

export default snippet;
