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
const { Timeline, Card } = ctx.libs.antd;

const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
  },
});

const records = res?.data?.data || [];

if (!records.length) {
  ctx.render('<div style="padding:16px;color:#999;">' + ctx.t('No data') + '</div>');
  return;
}

ctx.render(
  <Card title={ctx.t('Activity Timeline')} bordered>
    <Timeline mode="left">
      {records.map((record) => (
        <Timeline.Item
          key={record.id}
          label={record.createdAt ? new Date(record.createdAt).toLocaleString() : ''}
        >
          <div>
            <strong>{record.nickname || record.username || ctx.t('Unnamed user')}</strong>
            {record.email ? (
              <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>{record.email}</div>
            ) : null}
          </div>
        </Timeline.Item>
      ))}
    </Timeline>
  </Card>
);
`,
};

export default snippet;
