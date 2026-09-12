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
  scenes: ['tableFieldEvent'],
  prefix: 'sn-table-cell-style',
  label: 'Set table cell style',
  description: 'Customize table field cell styles with onCell',
  locales: {
    'zh-CN': {
      label: '表格字段样式设置',
      description: '通过 onCell 自定义表格字段单元格样式',
    },
  },
  content: `
ctx.model.props.onCell = (record, rowIndex) => {
  return {
    style: {
      background: 'red',
    },
  };
};
`,
};

export default snippet;
