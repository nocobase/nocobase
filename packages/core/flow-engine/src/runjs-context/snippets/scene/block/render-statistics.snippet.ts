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
  prefix: 'sn-jsb-stats',
  label: 'Render statistics cards',
  description: 'Display multiple statistic cards with numbers from API',
  locales: {
    'zh-CN': {
      label: '渲染统计卡片',
      description: '显示多个统计数字卡片（从 API 获取数据）',
    },
  },
  content: `
const { Card, Statistic, Row, Col } = ctx.antd;
const { createElement: h } = ctx.React;

try {
  // Fetch statistics from API
  const res = await ctx.api.request({
    url: 'your-collection:list',
    method: 'get',
    params: { pageSize: 9999 },
  });

  const records = res?.data?.data || [];

  // Calculate statistics
  const total = records.length;
  const active = records.filter(r => r.status === 'active').length;
  const pending = records.filter(r => r.status === 'pending').length;
  const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Render statistics cards
  const root = ctx.ReactDOM.createRoot(ctx.element);
  root.render(
    h(Row, { gutter: 16 },
      h(Col, { span: 6 },
        h(Card, {},
          h(Statistic, { title: ctx.t('Total Records'), value: total, valueStyle: { color: '#3f8600' } })
        )
      ),
      h(Col, { span: 6 },
        h(Card, {},
          h(Statistic, { title: ctx.t('Active'), value: active, valueStyle: { color: '#1890ff' } })
        )
      ),
      h(Col, { span: 6 },
        h(Card, {},
          h(Statistic, { title: ctx.t('Pending'), value: pending, valueStyle: { color: '#faad14' } })
        )
      ),
      h(Col, { span: 6 },
        h(Card, {},
          h(Statistic, {
            title: ctx.t('Total Amount'),
            value: totalAmount,
            precision: 2,
            prefix: '$',
            valueStyle: { color: '#cf1322' },
          })
        )
      )
    )
  );

  ctx.__dispose = () => root.unmount?.();
} catch (e) {
  ctx.element.innerHTML = '<div style="padding:16px;color:red;">' +
    ctx.t('Failed to load statistics: {{msg}}', { msg: String(e?.message || e) }) +
    '</div>';
}
`,
};

export default snippet;
