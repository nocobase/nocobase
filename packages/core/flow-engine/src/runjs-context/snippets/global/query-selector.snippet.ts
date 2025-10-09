/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../types';
import { JSBlockRunJSContext } from '../../contexts/JSBlockRunJSContext';
import { JSFieldRunJSContext } from '../../contexts/JSFieldRunJSContext';
import { FormJSFieldItemRunJSContext } from '../../contexts/FormJSFieldItemRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext, JSFieldRunJSContext, FormJSFieldItemRunJSContext],
  prefix: 'sn-query-selector',
  label: 'Query selector',
  description: 'Find a child element inside ctx.element using querySelector',
  locales: {
    'zh-CN': {
      label: '查询子元素',
      description: '使用 querySelector 在 ctx.element 内查找子元素',
    },
  },
  content: `
const child = ctx.element.querySelector('.child-class');
if (child) {
  child.textContent = ctx.t('Hello from querySelector');
}
`,
};

export default snippet;
