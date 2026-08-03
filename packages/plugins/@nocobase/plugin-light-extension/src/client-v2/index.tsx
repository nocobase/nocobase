/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default as LightExtensionListPage } from './pages/LightExtensionListPage';
export { default as LightExtensionWorkspacePage } from './pages/LightExtensionWorkspacePage';
export {
  JSActionLightExtensionSourceField,
  JSBlockLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from './components/JSBlockLightExtensionSourceField';
export {
  createJsTemplateRunJSResolver,
  createLightExtensionRunJSResolver,
  resolveJsTemplateRuntimeSource,
  resolveLightExtensionRuntimeSource,
  type JsTemplateRunJSSourceResolver,
  type LightExtensionRunJSSourceResolver,
} from './resolvers/LightExtensionRunJSResolver';
export {
  createJsTemplateModelMenuProvider,
  createJsTemplateSurfaceMenuProvider,
  createLightExtensionModelMenuProvider,
  type LightExtensionModelMenuOptions,
  type LightExtensionModelMenuTarget,
} from './modelMenu/createLightExtensionModelMenuProvider';
export {
  registerJsTemplateModelMenus,
  registerLightExtensionModelMenus,
} from './modelMenu/registerLightExtensionModelMenus';
export {
  createJsTemplateRunJSEditorProvider,
  createRunJSLightExtensionEditorProvider,
} from './components/RunJSLightExtensionEditorProvider';
export {
  createMoveSourceToJsTemplateContribution,
  createMoveSourceToLightExtensionContribution,
} from './components/MoveSourceToLightExtension';
export * from './jsTemplateRunJSIntegration';
export * from './jsTemplateRunJSIntegrationContract';
export * from './vsc-file/public-api';
export { PluginLightExtensionClientV2 } from './plugin';
export { default } from './plugin';
