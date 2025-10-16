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
  prefix: 'sn-jsb-timeline',
  label: 'Render timeline from records',
  description: 'Display records as a timeline using Ant Design Timeline',
  locales: {
    'zh-CN': {
      label: '渲染时间轴',
      description: '使用 Ant Design 时间轴组件显示记录历史',
    },
  },
  content: `
const { Timeline, Card } = ctx.antd;
const { createElement: h } = ctx.React;

const res = await ctx.api.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
  },
});

const records = res?.data?.data || [];

if (!records.length) {
  ctx.element.innerHTML = '<div style="padding:16px;color:#999;">' + ctx.t('No data') + '</div>';
  return;
}

ctx.ReactDOM.createRoot(ctx.element).render(
  h(Card, { title: ctx.t('Activity Timeline'), bordered: true },
    h(Timeline, { mode: 'left' },
      ...records.map(record =>
        h(Timeline.Item, {
          key: record.id,
          label: record.createdAt ? new Date(record.createdAt).toLocaleString() : '',
        },
          h('div', {},
            h('strong', {}, record.nickname || record.username || ctx.t('Unnamed user')),
            record.email
              ? h('div', { style: { color: '#999', fontSize: '12px', marginTop: '4px' } }, record.email)
              : null,
          )
        )
      )
    )
  )
);
`,
};

export default snippet;
