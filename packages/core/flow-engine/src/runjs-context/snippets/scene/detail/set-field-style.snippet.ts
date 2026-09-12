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
  scenes: ['detailFieldEvent', 'formFieldEvent'],
  prefix: 'sn-item-style',
  label: 'Set form item/details item style',
  description: 'Customize form item and details item container styles',
  locales: {
    'zh-CN': {
      label: '设置表单项/详情项样式',
      description: '自定义表单项和详情项容器样式',
    },
  },
  content: `
ctx.model.props.style = {
  background: 'red',
};
`,
};

export default snippet;
