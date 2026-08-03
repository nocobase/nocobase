/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_TEMPLATE_ACTION_FULL_SOURCE_FIELD,
  JS_TEMPLATE_ACTION_SETTINGS_STEP_FIELD,
  JS_TEMPLATE_BLOCK_FULL_SOURCE_FIELD,
  JS_TEMPLATE_BLOCK_SETTINGS_STEP_FIELD,
  JS_TEMPLATE_FIELD_FULL_SOURCE_FIELD,
  JS_TEMPLATE_FIELD_SETTINGS_STEP_FIELD,
  JS_TEMPLATE_ITEM_FULL_SOURCE_FIELD,
  JS_TEMPLATE_ITEM_SETTINGS_STEP_FIELD,
  JS_TEMPLATE_PAGE_FULL_SOURCE_FIELD,
  JS_TEMPLATE_PAGE_SETTINGS_STEP_FIELD,
} from '@nocobase/client-v2';

import { JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT } from '../shared/jsTemplateRunJSPersistence';

export const JS_TEMPLATE_RUNJS_HTTP_ALIASES = Object.freeze({
  listSelectableEntries: 'jsTemplateEntries:listSelectable',
  getEntry: 'jsTemplateEntries:get',
  listRepos: 'jsTemplateRepos:list',
  moveSource: 'jsTemplates:moveSource',
  moveToInline: 'jsTemplates:moveToInline',
  runtimeResolve: 'jsTemplateRuntime:resolve',
  runtimeGetArtifact: 'jsTemplateRuntime:getArtifact',
  workspaceOpen: 'runJSSources:open',
  workspaceCheck: 'runJSSources:compilePreview',
  workspaceSave: 'runJSSources:save',
  workspaceSaveChanges: 'runJSSources:saveChanges',
});

export const JS_TEMPLATE_RUNJS_FLOW_SURFACES = Object.freeze([
  { modelUse: 'JSBlockModel', flowKey: 'jsSettings', kind: 'js-block', surfaceStyle: 'render' },
  { modelUse: 'JSPageModel', flowKey: 'jsSettings', kind: 'js-page', surfaceStyle: 'render' },
  { modelUse: 'JSFieldModel', flowKey: 'jsSettings', kind: 'js-field', surfaceStyle: 'render' },
  { modelUse: 'JSEditableFieldModel', flowKey: 'jsSettings', kind: 'js-field', surfaceStyle: 'render' },
  { modelUse: 'JSColumnModel', flowKey: 'jsSettings', kind: 'js-field', surfaceStyle: 'render' },
  { modelUse: 'JSItemModel', flowKey: 'jsSettings', kind: 'js-item', surfaceStyle: 'render' },
  { modelUse: 'JSItemActionModel', flowKey: 'jsSettings', kind: 'js-item', surfaceStyle: 'render' },
  { modelUse: 'JSActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
  { modelUse: 'JSRecordActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
  { modelUse: 'JSCollectionActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
  { modelUse: 'JSFormActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
  { modelUse: 'FilterFormJSActionModel', flowKey: 'clickSettings', kind: 'js-action', surfaceStyle: 'action' },
] as const);

/**
 * Canonical integration names deliberately resolve to the established registry and FlowModel keys. These values are
 * protocol identities, not product copy, and must remain readable when the plugin is disabled or temporarily absent.
 */
export const JS_TEMPLATE_RUNJS_FLOW_SURFACES_INTEGRATION_CONTRACT = Object.freeze({
  persistence: JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT,
  locatorKind: 'flowModel.step',
  stepKey: 'runJs',
  paramPath: Object.freeze(['code']),
  versionPath: Object.freeze(['version']),
  sourceMetadataKindKey: 'lightExtensionKind',
  runtimeContextKey: 'lightExtension',
  sourceMenuGroupKey: 'light-extension',
  editorProviderKey: 'light-extension-runjs-value',
  toolbarContributionKey: '@nocobase/plugin-light-extension/move-source',
  modelMenuProviderKey: '@nocobase/plugin-light-extension/model-menus',
  supportedSurfaceStyles: Object.freeze(['render', 'value', 'action']),
  automaticPreviewSurfaceStyles: Object.freeze(['render']),
  components: Object.freeze({
    actionSource: JS_TEMPLATE_ACTION_FULL_SOURCE_FIELD,
    actionSettings: JS_TEMPLATE_ACTION_SETTINGS_STEP_FIELD,
    blockSource: JS_TEMPLATE_BLOCK_FULL_SOURCE_FIELD,
    blockSettings: JS_TEMPLATE_BLOCK_SETTINGS_STEP_FIELD,
    fieldSource: JS_TEMPLATE_FIELD_FULL_SOURCE_FIELD,
    fieldSettings: JS_TEMPLATE_FIELD_SETTINGS_STEP_FIELD,
    itemSource: JS_TEMPLATE_ITEM_FULL_SOURCE_FIELD,
    itemSettings: JS_TEMPLATE_ITEM_SETTINGS_STEP_FIELD,
    pageSource: JS_TEMPLATE_PAGE_FULL_SOURCE_FIELD,
    pageSettings: JS_TEMPLATE_PAGE_SETTINGS_STEP_FIELD,
  }),
  surfaces: JS_TEMPLATE_RUNJS_FLOW_SURFACES,
  http: JS_TEMPLATE_RUNJS_HTTP_ALIASES,
});
