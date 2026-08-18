/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsTemplateKind } from '../constants';

/**
 * Canonical integration names deliberately resolve to the established registry and FlowModel keys. These values are
 * protocol identities, not product copy, and must remain readable when the plugin is disabled or temporarily absent.
 */
export const JS_TEMPLATE_SOURCE_METADATA_KIND_KEY = 'jsTemplateKind';
export const JS_TEMPLATE_RUNTIME_CONTEXT_KEY = 'jsTemplate';
export const JS_TEMPLATE_SOURCE_MENU_GROUP_KEY = 'js-template';
export const JS_TEMPLATE_EDITOR_PROVIDER_KEY = 'js-template-runjs-value';
export const JS_TEMPLATE_TOOLBAR_CONTRIBUTION_KEY = '@nocobase/plugin-js-template/save-as-js-template';
export const JS_TEMPLATE_MODEL_MENU_PROVIDER_KEY = '@nocobase/plugin-js-template/model-menus';

export const JS_TEMPLATE_KIND_BY_MODEL_USE: Readonly<Record<string, JsTemplateKind>> = Object.freeze({
  JSBlockModel: 'js-block',
  JSFieldModel: 'js-field',
  JSEditableFieldModel: 'js-field',
  JSColumnModel: 'js-field',
  JSItemModel: 'js-item',
  JSItemActionModel: 'js-item',
  JSActionModel: 'js-action',
  JSRecordActionModel: 'js-action',
  JSCollectionActionModel: 'js-action',
  JSFormActionModel: 'js-action',
  FilterFormJSActionModel: 'js-action',
});
