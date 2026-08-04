/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_ACL_SNIPPET, JS_TEMPLATE_SETTINGS_KEY } from '../constants';

export { JS_TEMPLATE_SETTINGS_KEY } from '../constants';

export const JS_TEMPLATE_V2_UI_CONTRACT = Object.freeze({
  productNameKey: 'JS Templates',
  productNameZhCN: 'JS 模板',
  settings: Object.freeze({
    key: JS_TEMPLATE_SETTINGS_KEY,
    aclSnippet: JS_TEMPLATE_ACL_SNIPPET,
  }),
});
