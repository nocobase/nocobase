/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default as JsTemplateListPage, default as LightExtensionListPage } from './pages/LightExtensionListPage';
export {
  default as JsTemplateWorkspacePage,
  default as LightExtensionWorkspacePage,
} from './pages/LightExtensionWorkspacePage';
export {
  JSActionLightExtensionSourceField as JsTemplateActionSourceField,
  JSBlockLightExtensionSourceField as JsTemplateBlockSourceField,
  JSFieldLightExtensionSourceField as JsTemplateFieldSourceField,
  JSItemLightExtensionSourceField as JsTemplateItemSourceField,
  JSPageLightExtensionSourceField as JsTemplatePageSourceField,
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
  MoveSourceToLightExtension as MoveSourceToJsTemplate,
  MoveSourceToLightExtension,
} from './components/MoveSourceToLightExtension';
export {
  LightExtensionCreateSourceSelector as JsTemplateCreateSourceSelector,
  type LightExtensionCreateSource as JsTemplateCreateSource,
  type LightExtensionCreateSourceMode as JsTemplateCreateSourceMode,
  type LightExtensionCreateSourceSelectorProps as JsTemplateCreateSourceSelectorProps,
} from './components/LightExtensionCreateSourceSelector';
export {
  LightExtensionGitSourceFields as JsTemplateGitSourceFields,
  type LightExtensionGitSourceDraft as JsTemplateGitSourceDraft,
  type LightExtensionGitSourceFieldsProps as JsTemplateGitSourceFieldsProps,
  type LightExtensionGitSourceValue as JsTemplateGitSourceValue,
} from './components/LightExtensionGitSourceFields';
export {
  LightExtensionCredentialInput as JsTemplateCredentialInput,
  type LightExtensionCredentialInputProps as JsTemplateCredentialInputProps,
} from './components/LightExtensionSecretVariableInput';
export {
  LightExtensionSyncDrawer as JsTemplateSyncDrawer,
  type LightExtensionSyncDrawerProps as JsTemplateSyncDrawerProps,
} from './components/LightExtensionSyncDrawer';
export {
  useLightExtensionCreateJobs as useJsTemplateCreateJobs,
  type UseLightExtensionCreateJobsResult as UseJsTemplateCreateJobsResult,
} from './hooks/useLightExtensionCreateJobs';
export {
  useLightExtensionRepo as useJsTemplateRepo,
  type UseLightExtensionRepoResult as UseJsTemplateRepoResult,
} from './hooks/useLightExtensionRepo';
export {
  useLightExtensionSync as useJsTemplateSync,
  type UseLightExtensionSyncResult as UseJsTemplateSyncResult,
} from './hooks/useLightExtensionSync';
export * from './jsTemplateRunJSIntegration';
export * from './jsTemplateRunJSIntegrationContract';
export * from './jsTemplateV2UIContract';
export * from './vsc-file/public-api';
export { PluginJsTemplateClientV2, PluginLightExtensionClientV2 } from './plugin';
export { default } from './plugin';
