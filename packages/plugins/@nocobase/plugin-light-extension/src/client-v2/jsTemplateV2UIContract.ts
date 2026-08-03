/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY } from '../constants';

export const JS_TEMPLATE_SETTINGS_KEY = 'js-templates';
export const JS_TEMPLATE_LEGACY_SETTINGS_KEY = LIGHT_EXTENSION_SETTINGS_KEY;

/**
 * JS Templates owns the visible v2 settings route. The historical route remains hidden but routable so bookmarks and
 * deployed links keep working with the same ACL and page implementation.
 */
export const JS_TEMPLATE_V2_UI_CONTRACT = Object.freeze({
  productNameKey: 'JS Templates',
  productNameZhCN: 'JS 模板',
  settings: Object.freeze({
    canonicalKey: JS_TEMPLATE_SETTINGS_KEY,
    legacyKey: JS_TEMPLATE_LEGACY_SETTINGS_KEY,
    legacyAclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
  }),
});
