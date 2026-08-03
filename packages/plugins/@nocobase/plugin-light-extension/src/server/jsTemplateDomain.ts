/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { PluginLightExtensionServer as PluginJsTemplateServer } from './plugin';
export { registerLightExtensionDomainAvailabilityGuard as registerJsTemplateDomainAvailabilityGuard } from './domainAvailability';
export { lightExtensionExternalizationCapabilities as jsTemplateExternalizationCapabilities } from './externalizationCapabilities';
export { LightExtensionAuditService as JsTemplateAuditService } from './services/LightExtensionAuditService';
export { LightExtensionCompilePreviewService as JsTemplateCompilePreviewService } from './services/LightExtensionCompilePreviewService';
export {
  LightExtensionCompilePoolError as JsTemplateCompilePoolError,
  LightExtensionCompileWorkerPool as JsTemplateCompileWorkerPool,
} from './services/LightExtensionCompileWorkerPool';
export { LightExtensionEntryService as JsTemplateEntryService } from './services/LightExtensionEntryService';
export { LightExtensionPermissionService as JsTemplatePermissionService } from './services/LightExtensionPermissionService';
export {
  PublishCompiledEntriesService as JsTemplatePublishCompiledEntriesService,
  SequelizeCompiledEntriesPublishStore as SequelizeJsTemplateCompiledEntriesPublishStore,
} from './services/PublishCompiledEntriesService';
export { LightExtensionRuntimeCompileService as JsTemplateRuntimeCompileService } from './services/LightExtensionRuntimeCompileService';
export {
  LightExtensionValidator as JsTemplateValidator,
  buildCapabilities as buildJsTemplateCapabilities,
} from './services/LightExtensionValidator';
export { LightExtensionWorkspaceCompilerBridge as JsTemplateWorkspaceCompilerBridge } from './services/LightExtensionWorkspaceCompilerBridge';
export { ReferenceService as JsTemplateReferenceService } from './services/ReferenceService';
export { RuntimeResolveService as JsTemplateRuntimeResolveService } from './services/RuntimeResolveService';
export {
  LightExtensionError as JsTemplateError,
  isLightExtensionError as isJsTemplateError,
  mapRemoteSyncErrorToLightExtension as mapRemoteSyncErrorToJsTemplate,
} from '../shared/errors';

export type {
  LightExtensionAclAction as JsTemplateAclAction,
  LightExtensionKind as JsTemplateKind,
} from '../constants';
export type {
  LightExtensionCapabilities as JsTemplateCapabilities,
  LightExtensionCompilePreviewResult as JsTemplateCompilePreviewResult,
  LightExtensionCreateJobAcceptedResult as JsTemplateCreateJobAcceptedResult,
  LightExtensionCreateJobListResult as JsTemplateCreateJobListResult,
  LightExtensionDiagnostic as JsTemplateDiagnostic,
  LightExtensionEntryRecord as JsTemplateEntryRecord,
  LightExtensionMoveSourceInput as JsTemplateMoveSourceInput,
  LightExtensionMoveSourceResult as JsTemplateMoveSourceResult,
  LightExtensionMoveToInlineInput as JsTemplateMoveToInlineInput,
  LightExtensionMoveToInlineResult as JsTemplateMoveToInlineResult,
  LightExtensionReferenceRecord as JsTemplateReferenceRecord,
  LightExtensionRepoRecord as JsTemplateRepoRecord,
  LightExtensionRuntimeArtifactRecord as JsTemplateRuntimeArtifactRecord,
  LightExtensionRuntimeResolveInput as JsTemplateRuntimeResolveInput,
  LightExtensionRuntimeResolveResult as JsTemplateRuntimeResolveResult,
  LightExtensionRuntimeSourceBinding as JsTemplateRuntimeSourceBinding,
  LightExtensionSaveSourceInput as JsTemplateSaveSourceInput,
  LightExtensionSaveSourceResult as JsTemplateSaveSourceResult,
  LightExtensionValidationLimits as JsTemplateValidationLimits,
} from '../shared/types';
export type {
  LightExtensionErrorCode as JsTemplateErrorCode,
  LightExtensionErrorOptions as JsTemplateErrorOptions,
} from '../shared/errors';
export type { LightExtensionCompilePreviewInput as JsTemplateCompilePreviewInput } from './services/LightExtensionCompilePreviewService';
export type { LightExtensionServiceContext as JsTemplateServiceContext } from './services/LightExtensionRepoService';
export type { LightExtensionWorkspaceValidationResult as JsTemplateWorkspaceValidationResult } from './services/LightExtensionValidator';
