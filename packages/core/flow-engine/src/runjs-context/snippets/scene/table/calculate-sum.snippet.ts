/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSCollectionActionRunJSContext } from '../../../contexts/JSCollectionActionRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSCollectionActionRunJSContext],
  prefix: 'sn-act-sum',
  label: 'Calculate sum of selected rows',
  description: 'Calculate sum/average/count statistics for selected rows',
  locales: {
    'zh-CN': {
      label: '计算选中行统计值',
      description: '计算选中行的求和/平均/计数等统计',
    },
  },
  content: `
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select at least one row'));
  return;
}

// Calculate statistics for 'amount' field
const amounts = rows.map(r => Number(r.amount) || 0);
const sum = amounts.reduce((a, b) => a + b, 0);
const avg = sum / amounts.length;
const max = Math.max(...amounts);
const min = Math.min(...amounts);

const stats = ctx.t(
  'Selected {{count}} rows\\nSum: {{sum}}\\nAverage: {{avg}}\\nMax: {{max}}\\nMin: {{min}}',
  {
    count: rows.length,
    sum: sum.toFixed(2),
    avg: avg.toFixed(2),
    max: max.toFixed(2),
    min: min.toFixed(2),
  }
);

ctx.modal.info({
  title: ctx.t('Statistics'),
  content: ctx.React.createElement('pre', { style: { whiteSpace: 'pre-wrap' } }, stats),
});
`,
};

export default snippet;
