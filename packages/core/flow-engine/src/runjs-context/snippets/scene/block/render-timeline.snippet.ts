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
const { Timeline, Card, Tag } = ctx.antd;
const { createElement: h } = ctx.React;

try {
  // Fetch timeline data
  const res = await ctx.api.request({
    url: 'your-collection:list',
    method: 'get',
    params: {
      pageSize: 20,
      sort: ['-createdAt'], // Sort by creation time descending
    },
  });

  const records = res?.data?.data || [];

  if (!records.length) {
    ctx.element.innerHTML = '<div style="padding:16px;color:#999;">' + ctx.t('No data') + '</div>';
    return;
  }

  // Render timeline
  const root = ctx.ReactDOM.createRoot(ctx.element);
  root.render(
    h(Card, { title: ctx.t('Activity Timeline'), bordered: true },
      h(Timeline, { mode: 'left' },
        ...records.map(record =>
          h(Timeline.Item, {
            key: record.id,
            label: record.createdAt ? new Date(record.createdAt).toLocaleString() : '',
          },
            h('div', {},
              h('strong', {}, record.title || ctx.t('Untitled')),
              ' ',
              h(Tag, { color: record.status === 'success' ? 'green' : 'blue' }, record.status || '-'),
              h('div', { style: { color: '#999', fontSize: '12px', marginTop: '4px' } },
                record.description || ''
              )
            )
          )
        )
      )
    )
  );

  ctx.__dispose = () => root.unmount?.();
} catch (e) {
  ctx.element.innerHTML = '<div style="padding:16px;color:red;">' +
    ctx.t('Failed to load timeline: {{msg}}', { msg: String(e?.message || e) }) +
    '</div>';
}
`,
};

export default snippet;
