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
  prefix: 'sn-jsb-info-card',
  label: 'Render record info card',
  description: 'Display current record information in an Ant Design card',
  locales: {
    'zh-CN': {
      label: '渲染记录信息卡片',
      description: '使用 Ant Design 卡片显示当前记录的关键信息',
    },
  },
  content: `
const { Card, Descriptions, Tag, Typography } = ctx.antd;
const { createElement: h } = ctx.React;

if (!ctx.record) {
  ctx.element.innerHTML = '<div style="padding:16px;color:#999;">' + ctx.t('No record data') + '</div>';
  return;
}

const record = ctx.record;

ctx.ReactDOM.createRoot(ctx.element).render(
  h(Card, { title: ctx.t('Record Details'), bordered: true, style: { margin: 0 } },
    h(Descriptions, { column: 2, size: 'small' },
      h(Descriptions.Item, { label: ctx.t('ID') }, record.id || '-'),
      h(Descriptions.Item, { label: ctx.t('Status') },
        h(Tag, { color: record.status === 'active' ? 'green' : 'default' }, record.status || '-')
      ),
      h(Descriptions.Item, { label: ctx.t('Title') }, record.title || '-'),
      h(Descriptions.Item, { label: ctx.t('Created At') },
        record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'
      )
    )
  )
);

`,
};

export default snippet;
