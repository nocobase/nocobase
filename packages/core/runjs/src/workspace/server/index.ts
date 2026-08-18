/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { buildRunJSArtifactHash, buildRunJSFilesHash, buildRunJSRuntimeCodeHash } from '../../server';

export {
  buildRunJSOwnerFingerprint,
  RunJSSourceCodeInspectorRegistry,
  RunJSSourceError,
  runJSSourceCodeInspectorRegistry,
} from './runjs-source-contracts';

export type {
  RunJSSourceCodeInspectionInput,
  RunJSSourceCodeInspector,
  RunJSSourceErrorCode,
  RunJSSourceErrorOptions,
} from './runjs-source-contracts';

export {
  buildRunJSSourceRepositoryIdentity,
  commitHistoryDefaultLimit,
  commitHistoryMaxLimit,
  createRunJSAuthoringCapabilities,
  defaultRunJSEntryPath,
  defaultRunJSSourceRoot,
  defaultVscFileLimits,
  diffMaxFileSize,
  getRunJSSourceOwnerId,
  isVscError,
  maxCommitMessageLength,
  maxFileSize,
  maxFilesPerRepo,
  maxPathLength,
  maxRepoTextSize,
  normalizePath,
  normalizeRunJSSourceLocator,
  normalizeRunJSWorkspacePathValue,
  normalizeText,
  pathHash,
  pathLowerHash,
  resolveRunJSClientIndexEntryPath,
  resolveRunJSWorkspaceEntryPath,
  RUNJS_AUTHORING_CONTRACT_VERSION,
  RUNJS_EXTERNALIZATION_DESTINATION_TYPES,
  RUNJS_EXTERNALIZATION_ENTRY_KINDS,
  RUNJS_INLINE_WORKSPACE_MODEL_USES,
  RUNJS_INLINE_WORKSPACE_OWNER_KINDS,
  runJSAuthoringContractV1,
  runJSManifestPath,
  runJSSourceRequestActionNames,
  sha256Hex,
  validateRunJSWorkspacePathValue,
  VSC_FILE_NAMESPACE,
  VscError,
  vscErrorCodes,
} from '../shared';

export type {
  RunJSAuthoringCapabilities,
  RunJSCompileDiagnostic,
  RunJSCompileFailedDetails,
  RunJSExternalSourceBinding,
  RunJSExternalizationCapabilityContribution,
  RunJSExternalizationDestinationType,
  RunJSExternalizationEntryKind,
  RunJSInlineWorkspaceModelUse,
  RunJSInlineWorkspaceOwnerKind,
  RunJSLanguage,
  RunJSLegacySource,
  RunJSRuntimeArtifact,
  RunJSRuntimeWriteResult,
  RunJSSourceAdapter,
  RunJSSourceAdapterContext,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceAuthoringInspector,
  RunJSSourceAuthoringLegacyInfo,
  RunJSSourceCompilePreviewInput,
  RunJSSourceCompilePreviewResult,
  RunJSSourceDiffInput,
  RunJSSourceDiffResult,
  RunJSSourceExportZipInput,
  RunJSSourceFileChange,
  RunJSSourceGetVersionInput,
  RunJSSourceHistoryInput,
  RunJSSourceHistoryResult,
  RunJSSourceHistoryState,
  RunJSSourceImportZipInput,
  RunJSSourceImportZipResult,
  RunJSSourceInfo,
  RunJSSourceInitialSource,
  RunJSSourceKind,
  RunJSSourceLocator,
  RunJSSourceOpenResult,
  RunJSSourceOpenSettingsDescriptor,
  RunJSSourcePermissionCheck,
  RunJSSourcePermissionResult,
  RunJSSourcePermissions,
  RunJSSourceRepositoryRecord,
  RunJSSourceRequestActionInput,
  RunJSSourceRequestActionName,
  RunJSSourceRequestActionResult,
  RunJSSourceRequestMap,
  RunJSSourceSaveChangesInput,
  RunJSSourceSaveInput,
  RunJSSourceSaveResult,
  RunJSSourceVersionFile,
  RunJSSourceVersionResult,
  RunJSSourceWorkspaceFile,
  RunJSSurfaceStyle,
  RunJSWorkspaceDiagnostic,
  RunJSWorkspaceDiagnosticSeverity,
  RunJSWorkspacePathValidationReason,
  RunJSWorkspacePathValidationResult,
  VscCommitDiffInput,
  VscCommitDiffResult,
  VscCommitRecord,
  VscErrorCode,
  VscErrorDetails,
  VscErrorOptions,
  VscFileChange,
  VscFileDiffEntry,
  VscFileDiffStatus,
  VscFileDiffSummary,
  VscFileMode,
  VscFileOperation,
  VscFilePath,
  VscNormalizedTreeEntry,
  VscRefName,
  VscRefRecord,
  VscRepositoryIdentity,
  VscRepositoryOwner,
  VscRepositoryRecord,
  VscRepositoryStatus,
  VscSha256Hex,
  VscStoredBlob,
  VscStoredTree,
  VscTreeEntryInput,
} from '../shared';

export {
  createRunJSSourceAuditActions,
  createVscFileAuditActions,
  runJSSourceAuditActionNames,
  vscFileAuditActionNames,
} from './audit';

export { vscFileServerDefaults } from './config';

export {
  getOrCreateRunJSWorkspaceServerModule,
  getRunJSWorkspaceServerModule,
  importRunJSWorkspaceCollections,
  RunJSWorkspaceServerModule,
} from './module';

export { createRunJSSourcePermissionHook, RUNJS_SOURCE_OWNER_TYPE, VscPermissionHookRegistry } from './permissions';

export type {
  VscPermissionAction,
  VscPermissionAllowResult,
  VscPermissionDenyResult,
  VscPermissionHook,
  VscPermissionHookInput,
  VscPermissionHookResult,
  VscPermissionRequestMetadata,
} from './permissions';

export {
  assertRunJSCompileInputLimits,
  canonicalizeRunJSCompileFile,
  canonicalizeRunJSCompileFiles,
  compileRunJSSourceWorkspace,
  createFlowSurfaceRunJSWorkspaceBootstrapPort,
  createRunJSSourcesResource,
  createRunJSWorkspaceDiagnostic,
  createRunJSWorkspaceDiagnosticAt,
  defaultRunJSWorkspaceZipLimits,
  getRunJSWorkspaceDiagnosticDetailsKey,
  inspectRunJSSourceCode,
  readRunJSWorkspaceZip,
  RUNJS_WORKSPACE_HOSTS,
  RunJSAuthoringCapabilityRegistry,
  runJSSourceActionNames,
  RunJSSourceAdapterRegistry,
  RunJSSourceAuthoringInspectorRegistry,
  RunJSWorkspaceSchemaValidator,
} from './runjs-sources';

export type {
  CanonicalRunJSCompileFile,
  ReadRunJSWorkspaceZipOptions,
  RunJSWorkspaceBootstrapInput,
  RunJSWorkspaceBootstrapPort,
  RunJSWorkspaceBootstrapResult,
  RunJSWorkspaceHostKind,
  RunJSWorkspaceModelUse,
  RunJSWorkspaceZipLimits,
  RunJSWorkspaceZipMetadataPolicy,
} from './runjs-sources';

export { BlobService, normalizeBlob } from './services/BlobService';

export type { EnsureBlobOptions, VscStoredBlobMetadata } from './services/BlobService';

export { CanonicalCandidateService } from './services/CanonicalCandidateService';

export type {
  CanonicalCandidateChange,
  CanonicalCandidateFile,
  CanonicalCandidateSnapshot,
  PreparedCanonicalCandidateSnapshot,
} from './services/CanonicalCandidateService';

export { commitFromRecord, CommitService } from './services/CommitService';

export type { CreateCommitInput, ListCommitsInput } from './services/CommitService';

export { DiffService } from './services/DiffService';

export type {
  DiffCommitsInput,
  DiffFileEndpoint,
  DiffFileInput,
  DiffFileResult,
  FileDiffEntry,
  FileDiffResult,
  FileDiffSummary,
  LineDiffHunk,
  LineDiffLine,
  LineDiffType,
} from './services/DiffService';

export { RefService } from './services/RefService';

export type {
  ListRefsInput,
  RefServiceContext,
  RestoreCommitInput,
  RestoreFileInput,
  RestoreResult,
  UpdateRefInput,
  UpdateRefResult,
} from './services/RefService';

export { refFromRecord, repositoryFromRecord, RepositoryService } from './services/RepositoryService';

export type { EnsureRepositoryRecordResult } from './services/RepositoryService';

export { TreeService } from './services/TreeService';

export type { EnsureTreeOptions, PreparedTree, PreparedTreeBlobMetadata } from './services/TreeService';

export { incrementVscFileMetric, vscFileMetricCounterNames } from './services/VscFileMetrics';

export type { VscFileMetricCounterName, VscFileMetricsCollector } from './services/VscFileMetrics';

export { VscFileService } from './services/VscFileService';

export type {
  CreateRepositoryInput,
  CreateRepositoryResult,
  EnsureAndPushInput,
  EnsureRepositoryInput,
  GetCommitInput,
  GetFileInput,
  GetFileResult,
  IncludeContentMode,
  PreparedPush,
  PullCommitInput,
  PulledFile,
  PullInput,
  PullResult,
  PushInput,
  PushResult,
  PushWithCandidateOptions,
  PushWithCandidateResult,
  RepositoryIdInput,
  VscServiceContext,
} from './services/VscFileService';
