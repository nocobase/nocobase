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
  prefix: 'sn-field-style',
  label: 'Set field style',
  description: 'Customize form and detail field styles',
  locales: {
    'zh-CN': {
      label: '表单、详情字段样式设置',
      description: '自定义表单字段和详情字段的样式',
    },
  },
  content: `
ctx.model.subModels.field.props.style = {
  fontWeight: 900,
};
`,
};

export default snippet;
