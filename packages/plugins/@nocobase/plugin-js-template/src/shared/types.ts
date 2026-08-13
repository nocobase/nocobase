/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_TEMPLATE_HEALTH_STATUSES,
  JS_TEMPLATE_PROJECT_HEALTH_STATUSES,
  JS_TEMPLATE_PROJECT_LIFECYCLE_STATUSES,
  JS_TEMPLATE_SUPPORTED_KINDS,
  JS_TEMPLATE_USAGE_RESOLVED_STATUSES,
  JS_TEMPLATE_SOURCE_BINDING_TYPE,
  JS_TEMPLATE_SOURCE_MODE,
  type JsTemplateKind,
} from '../constants';
import type { RunJSSourceLocator, VscCommitRecord } from '@nocobase/runjs/workspace/shared';
import type {
  VscGitRemoteConfig,
  VscGitRemoteConfigDraft,
  VscRemotePlannerAction,
  VscRemotePlannerLocalSummary,
  VscRemotePlannerRemoteSummary,
  VscRemotePlannerState,
  VscRemoteProvider,
  VscRemoteSyncPlan,
} from './vsc-file/remote-sync-types';

export type { JsTemplateKind } from '../constants';

export function assertJsTemplateKind(value: unknown): JsTemplateKind {
  if (typeof value === 'string' && (JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(value)) {
    return value as JsTemplateKind;
  }
  throw new TypeError(`Unsupported JS Template kind: ${String(value)}`);
}

export type JsTemplateProjectLifecycleStatus = (typeof JS_TEMPLATE_PROJECT_LIFECYCLE_STATUSES)[number];

export type JsTemplateProjectHealthStatus = (typeof JS_TEMPLATE_PROJECT_HEALTH_STATUSES)[number];

export type JsTemplateHealthStatus = (typeof JS_TEMPLATE_HEALTH_STATUSES)[number];

export type JsTemplateUsageResolvedStatus = (typeof JS_TEMPLATE_USAGE_RESOLVED_STATUSES)[number];

export type JsTemplateFileOperation = 'upsert' | 'delete';

export type JsTemplateIncludeContentMode = 'none' | 'selected' | 'all';

export interface JsTemplateProject {
  id: string;
  name: string;
  normalizedName: string;
  title?: string | null;
  description?: string | null;
  lifecycleStatus: JsTemplateProjectLifecycleStatus;
  healthStatus: JsTemplateProjectHealthStatus;
  headCommitId: string | null;
  lastCompiledAt?: string | null;
  templateCount?: number;
  templateKinds?: Partial<Record<JsTemplateKind, number>>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface JsTemplateProjectDetails extends JsTemplateProject {
  permissions: {
    canWriteSource: boolean;
  };
}

export interface JsTemplateCreateProjectInput {
  name: string;
  title?: string | null;
  description?: string | null;
  zipBase64?: string;
  initialFiles?: JsTemplateTreeEntryInput[];
  message?: string;
}

export const jsTemplateCreateSourceTypes = ['starter', 'zip', 'git'] as const;

export type JsTemplateCreateSourceType = (typeof jsTemplateCreateSourceTypes)[number];

export const jsTemplateCreateJobStatuses = ['pending', 'running', 'succeeded', 'failed'] as const;

export type JsTemplateCreateJobStatus = (typeof jsTemplateCreateJobStatuses)[number];

export interface JsTemplateCreateJob {
  id: string;
  applicationName: string;
  targetProjectId: string;
  name: string;
  normalizedName: string;
  title: string | null;
  description: string | null;
  sourceType: JsTemplateCreateSourceType;
  status: JsTemplateCreateJobStatus;
  resultProjectId: string | null;
  payload: Record<string, unknown> | null;
  errorCode: string | null;
  errorReasonCode?: string | null;
  errorMessage: string | null;
  reservationKey: string | null;
  actorUserId: string | null;
  requestId: string | null;
  claimToken: string | null;
  claimOwner: string | null;
  leaseExpiresAt: string | null;
  heartbeatAt: string | null;
  attempt: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JsTemplateCreateJobSummary {
  id: string;
  targetProjectId: string;
  name: string;
  title: string | null;
  description: string | null;
  sourceType: JsTemplateCreateSourceType;
  status: JsTemplateCreateJobStatus;
  resultProjectId: string | null;
  errorCode: string | null;
  errorReasonCode?: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type JsTemplateCreateJobAcceptedResult = JsTemplateCreateJobSummary;

export interface JsTemplateCreateJobListResult {
  jobs: JsTemplateCreateJobSummary[];
}

export interface JsTemplateCreateJobMutationInput {
  jobId: string;
}

export type JsTemplateCreateJobDismissInput = JsTemplateCreateJobMutationInput;

export interface JsTemplateCreateJobDismissResult {
  id: string;
}

export interface JsTemplateCreateJobActionContract {
  list: {
    result: JsTemplateCreateJobListResult;
  };
  dismiss: {
    input: JsTemplateCreateJobDismissInput;
    result: JsTemplateCreateJobDismissResult;
  };
}

export type JsTemplateCreateJobActionName = keyof JsTemplateCreateJobActionContract;

export interface JsTemplateUpdateProjectInput {
  projectId: string;
  title: string;
  description?: string | null;
}

export interface JsTemplateInspectSourceArchiveInput {
  projectId: string;
  zipBase64: string;
}

export interface JsTemplateInspectSourceArchiveResult {
  files: JsTemplateTreeEntryInput[];
}

export interface JsTemplateChangeLifecycleInput {
  projectId: string;
  lifecycleStatus: JsTemplateProjectLifecycleStatus;
}

export interface JsTemplateDeleteProjectInput {
  projectId: string;
}

export interface JsTemplateTreeEntryInput {
  path: string;
  content?: string;
  blobHash?: string;
  size?: number;
  language?: string;
  mode?: string;
}

export interface JsTemplateFileChange extends JsTemplateTreeEntryInput {
  operation?: JsTemplateFileOperation;
}

export type JsTemplateCommitRecord = Omit<VscCommitRecord, 'repoId'> & {
  projectId: string;
};

export interface JsTemplatePulledFile {
  path: string;
  pathHash: string;
  pathLowerHash: string;
  blobHash: string;
  size: number;
  language: string;
  mode: string;
  content?: string;
}

export interface JsTemplateStoredTree {
  hash: string;
  entryCount: number;
  byteSize: number;
}

export interface JsTemplatePullResult {
  project: JsTemplateProject;
  commit: JsTemplateCommitRecord | null;
  tree: JsTemplateStoredTree | null;
  unchanged: boolean;
  files?: JsTemplatePulledFile[];
}

export interface JsTemplateFileResult extends JsTemplatePulledFile {
  content: string;
}

export interface JsTemplatePushInput {
  projectId: string;
  expectedHeadCommitId: string | null;
  message: string;
  files: JsTemplateFileChange[];
  allowEmptyCommit?: boolean;
}

export type JsTemplateDiagnosticSeverity = 'error' | 'warning';

export interface JsTemplateDiagnostic {
  code: string;
  severity: JsTemplateDiagnosticSeverity;
  message: string;
  path?: string;
  line?: number;
  column?: number;
  kind?: string;
  templateName?: string;
  details?: Record<string, unknown>;
}

export interface CompiledJsTemplateArtifact {
  code: string;
  sourceMap?: string;
  runtimeVersion: string;
  entryPath: string;
  filesHash?: string;
  diagnostics?: JsTemplateDiagnostic[];
  metadata?: Record<string, unknown>;
}

export interface JsTemplate {
  id: string;
  projectId: string;
  target: 'client';
  kind: JsTemplateKind;
  templateName: string;
  entryPath: string;
  descriptorPath: string;
  title: string | null;
  description: string | null;
  category: string | null;
  icon: string | null;
  tags: string[] | null;
  sort: number | null;
  settingsSchema: Record<string, unknown> | null;
  settingsSchemaHash: string | null;
  compiledCommitId: string | null;
  compiledInputKey: string | null;
  compilerBuildId: string | null;
  runtimeArtifact: CompiledJsTemplateArtifact | null;
  runtimeVersion: string | null;
  surfaceStyle: string | null;
  runtimeCodeHash: string | null;
  artifactHash: string | null;
  filesHash: string | null;
  settingsDefaultsHash: string | null;
  compiledAt: string | null;
  healthStatus: JsTemplateHealthStatus;
  diagnostics: JsTemplateDiagnostic[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type JsTemplateSaveSourceInput = Omit<JsTemplatePushInput, 'allowEmptyCommit'>;

export type JsTemplateCompileTemplateStatus = 'success' | 'failed' | 'skipped';

export interface JsTemplateSaveSourceCompileTemplateResult {
  templateId: string;
  templateName: string;
  kind: JsTemplateKind;
  entryPath: string;
  status: JsTemplateCompileTemplateStatus;
  execution?: 'compiled' | 'skipped';
  diagnostics: JsTemplateDiagnostic[];
  artifact?: JsTemplateCompilePreviewArtifactSummary;
  failureCode?: string;
}

export interface JsTemplateSaveSourceResult {
  project: JsTemplateProject;
  commit: JsTemplateCommitRecord;
  tree: JsTemplateStoredTree;
  compile: {
    status: 'success' | 'skipped';
    templates: JsTemplateSaveSourceCompileTemplateResult[];
  };
  diagnostics: JsTemplateDiagnostic[];
}

export interface JsTemplateValidationLimits {
  maxProjectFiles: number;
  maxTemplateFiles: number;
  maxFileBytes: number;
  maxTemplateDescriptorBytes: number;
  maxProjectBytes: number;
  maxTemplates: number;
  maxSyncBatchFiles: number;
  maxZipBytes: number;
  maxZipCompressionRatio: number;
  maxJsonBytes: number;
  maxSettingsSchemaDepth: number;
}

export interface JsTemplateCapabilities {
  templateDescriptor: {
    schemaVersion: number;
    keyPattern: string;
  };
  allowedPaths: {
    project: string[];
    templates: Record<string, string[]>;
  };
  schemaSubset: {
    allowedTypes: string[];
    allowedKeywords: string[];
    maxDepth: number;
  };
  xComponentWhitelist: string[];
  conditions: {
    operators: string[];
    logic: string[];
    limits: {
      maxDepth: number;
      maxNodes: number;
      maxItemsPerGroup: number;
      maxPathSegments: number;
    };
  };
  sdk: {
    packageName: string;
    version: string;
    clientImport: string;
    sharedImport: string;
    templateSchemaUri: string;
    templateSchemaSha256: string;
  };
  limits: JsTemplateValidationLimits;
  writePolicy: {
    validateFinalWorkspaceOnPush: boolean;
    allowDeleteExistingInvalidPaths: boolean;
  };
  supportedKinds: JsTemplateKind[];
  validatorVersion: string;
  sdkTemplateVersion: string;
}

export interface JsTemplateCompilePreviewArtifactSummary {
  runtimeVersion: string;
  entryPath: string;
  filesHash?: string;
  metadata?: Record<string, unknown>;
}

export type JsTemplateCompilePreviewTemplateStatus = 'success' | 'failed' | 'skipped';

export interface JsTemplateCompilePreviewTemplateResult {
  templateId: string | null;
  projectId: string;
  target: 'client';
  kind?: JsTemplateKind;
  templateName: string;
  entryPath: string | null;
  status: JsTemplateCompilePreviewTemplateStatus;
  accepted: boolean;
  diagnostics: JsTemplateDiagnostic[];
  failureCode?: string;
  artifact?: JsTemplateCompilePreviewArtifactSummary;
}

export interface JsTemplateCompilePreviewResult {
  project: JsTemplateProject;
  commitId: string | null;
  accepted: boolean;
  diagnostics: JsTemplateDiagnostic[];
  templates: JsTemplateCompilePreviewTemplateResult[];
}

export interface JsTemplateWorkspacePreviewFile {
  path: string;
  content: string;
  language?: string;
  mode?: string;
}

export interface JsTemplateWorkspacePreviewInput {
  projectId: string;
  expectedHeadCommitId?: string | null;
  templateId?: string | null;
  kind?: JsTemplateKind;
  entryPath?: string;
  runtimeVersion?: string;
  files: JsTemplateWorkspacePreviewFile[];
}

export interface JsTemplateWorkspacePreviewResult {
  accepted: boolean;
  httpStatus: 200 | 207 | 422;
  diagnostics: JsTemplateDiagnostic[];
  failureCode?: string;
  artifact?: CompiledJsTemplateArtifact;
  templates?: JsTemplateCompilePreviewTemplateResult[];
}

export interface JsTemplateSelectableTemplateSummary {
  id: string;
  projectId: string;
  projectName?: string | null;
  projectTitle?: string | null;
  kind: JsTemplateKind;
  templateName: string;
  entryPath: string;
  title: string | null;
  category: string | null;
  settingsSchema: Record<string, unknown> | null;
  settingsSchemaHash: string | null;
  settingsDefaultsHash: string | null;
  artifactHash?: string;
  runtimeCodeHash: string;
  runtimeAvailable: true;
}

export type JsTemplateSelectableTemplateRecord = JsTemplateSelectableTemplateSummary;

export interface JsTemplateSelectableTemplatesInput {
  projectId?: string;
  kind?: JsTemplateKind;
}

export type JsTemplateRuntimeSourceBinding = {
  type: typeof JS_TEMPLATE_SOURCE_BINDING_TYPE;
  projectId: string;
  templateId: string;
  kind: JsTemplateKind;
};

export interface SaveAsJsTemplateWorkspaceFile {
  path: string;
  content: string;
  language?: string;
  mode?: string;
}

export type SaveAsJsTemplateDestination =
  | {
      type: 'existing';
      projectId: string;
    }
  | {
      type: 'new';
      name: string;
      title?: string | null;
      description?: string | null;
    };

export type SaveAsJsTemplateOriginBinding = Pick<
  JsTemplateRuntimeSourceBinding,
  'type' | 'projectId' | 'templateId' | 'kind'
>;

export interface SaveAsJsTemplateInput {
  idempotencyKey: string;
  locator: RunJSSourceLocator;
  expectedOwnerFingerprint: string;
  sourceRepoId: string;
  sourceHeadCommitId: string | null;
  entryPath: string;
  runtimeVersion: string;
  files: SaveAsJsTemplateWorkspaceFile[];
  originBinding?: SaveAsJsTemplateOriginBinding;
  destination: SaveAsJsTemplateDestination;
  templateName: string;
  templateTitle?: string | null;
}

export interface SaveAsJsTemplateResult {
  project: JsTemplateProject;
  template: JsTemplate;
  binding: JsTemplateRuntimeSourceBinding;
  ownerFingerprint: string;
}

export interface DetachJsTemplateToInlineInput {
  idempotencyKey: string;
  locator: RunJSSourceLocator;
  projectId: string;
  templateId: string;
  expectedProjectHeadCommitId: string;
}

export interface DetachJsTemplateToInlineResult {
  runJSRepoId: string;
  commitId: string;
  ownerFingerprint: string;
  code: string;
  runtimeVersion: string;
  entryPath: string;
  filesHash: string;
  sourceRef: {
    type: 'vsc-file';
    repoId: string;
    commitId: string;
    entry: string;
  };
}

export interface DeleteJsTemplateInput {
  templateId: string;
}

export interface DeleteJsTemplateResult {
  project: JsTemplateProject;
  templateId: string;
}

export interface JsTemplateRuntimeResolveInput {
  sourceMode: typeof JS_TEMPLATE_SOURCE_MODE;
  sourceBinding: JsTemplateRuntimeSourceBinding;
  settings?: Record<string, unknown> | null;
}

export interface JsTemplateRuntimeCacheMetadata {
  etag: string;
  immutable: boolean;
}

export interface JsTemplateRuntimeResolveResult {
  templateId: string;
  entryPath: string;
  artifactHash: string;
  artifactUrl: string;
  runtimeCodeHash: string;
  runtimeVersion: string;
  settings: Record<string, unknown>;
  settingsHash: string;
}

export interface JsTemplateArtifact {
  artifactHash: string;
  runtimeCodeHash: string;
  code: string;
  sourceMap?: string;
  runtimeVersion: string;
  entryPath: string;
  runtimeContract: string;
  byteSize: number;
}

export type JsTemplateUsageOwnerKind =
  | 'flowModel.step'
  | 'flowModel.pageSettings'
  | 'flowModel.fieldSettings'
  | 'flowModel.actionSettings'
  | 'flowModel.itemSettings';

export interface JsTemplateFlowModelOwnerLocator {
  kind: 'flowModel.step';
  modelUid: string;
  use: 'JSBlockModel';
  stepPath: ['stepParams', 'jsSettings'];
}

export interface JsTemplateModelOwnerLocator {
  kind: Exclude<JsTemplateUsageOwnerKind, 'flowModel.step'>;
  modelUid?: string;
  use?: string;
  stepPath?: string[];
  descriptor?: string;
}

export type JsTemplateUsageOwnerLocator = JsTemplateFlowModelOwnerLocator | JsTemplateModelOwnerLocator;

export interface JsTemplateUsageOwnerAdapterContract {
  kind: JsTemplateKind;
  ownerKind: JsTemplateUsageOwnerKind;
  title: string;
  locatorContract: string;
  modelUse?: string;
}

export interface JsTemplateUsage {
  id: string;
  projectId: string;
  templateId: string;
  kind: JsTemplateKind;
  ownerKind: JsTemplateUsageOwnerKind;
  ownerLocator: JsTemplateUsageOwnerLocator;
  ownerLocatorHash: string;
  settingsHash: string;
  resolvedStatus: JsTemplateUsageResolvedStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface JsTemplateUsageLocation extends JsTemplateUsage {
  ownerTitle: string;
  locationTitle: string;
  routeId: string | null;
}

export interface JsTemplateUsageListInput {
  templateId: string;
  page: number;
  pageSize: number;
}

export interface JsTemplateUsageListMeta {
  page: number;
  pageSize: number;
  count: number;
  totalPage: number;
  effectiveCount: number;
  hiddenCount: number;
}

export interface JsTemplateUsageListResult {
  data: JsTemplateUsageLocation[];
  meta: JsTemplateUsageListMeta;
}

export interface JsTemplateUsageRebuildInput {
  rootUid?: string;
  ownerLocator?: Partial<JsTemplateUsageOwnerLocator>;
  projectId?: string;
  dryRun?: boolean;
}

export type JsTemplateUsageRebuildItemAction = 'upsert' | 'remove' | 'owner_missing';

export interface JsTemplateUsageRebuildItem {
  action: JsTemplateUsageRebuildItemAction;
  kind?: JsTemplateKind;
  ownerKind: JsTemplateUsageOwnerKind;
  ownerLocatorHash: string;
  projectId?: string;
  templateId?: string;
  resolvedStatus?: JsTemplateUsageResolvedStatus;
  reasonCode?: string;
}

export interface JsTemplateUsageRebuildResult {
  dryRun?: boolean;
  scanned: number;
  upserted: number;
  removed: number;
  ownerMissing: number;
  statusCounts: Partial<Record<JsTemplateUsageResolvedStatus, number>>;
  items?: JsTemplateUsageRebuildItem[];
}

/**
 * The provider-neutral remote framework, snapshots, jobs, mappings, and conflicts belong to the internal VSC module.
 * The JS Template synchronization API exposes only a project id and safe remote summaries. The internal VSC repository
 * remains the authoritative local source, while synchronization exchanges source snapshots rather than attempting to mirror provider history.
 */
export type JsTemplateSyncProvider = VscRemoteProvider;

export type JsTemplateSyncState = VscRemotePlannerState;

export type JsTemplateSyncAction = VscRemotePlannerAction;

export type JsTemplateSyncSourceStatus = 'active' | 'disabled';

export interface JsTemplateSyncRemoteTarget {
  provider: JsTemplateSyncProvider;
  config: VscGitRemoteConfig;
}

export interface JsTemplateSyncRemoteTargetDraft {
  provider: JsTemplateSyncProvider;
  config: VscGitRemoteConfigDraft;
}

export interface JsTemplateSyncSourceSummary extends JsTemplateSyncRemoteTarget {
  status: JsTemplateSyncSourceStatus;
  remoteTargetVersion: number;
  revision: string | null;
  credentialConfigured: boolean;
  authRefDisplay: string | null;
  lastSyncedAt?: string | null;
}

export interface JsTemplateSyncGetInput {
  projectId: string;
}

export interface JsTemplateSyncGetResult {
  projectId: string;
  source: JsTemplateSyncSourceSummary | null;
}

export interface JsTemplateSyncConfigureInput extends JsTemplateSyncGetInput, JsTemplateSyncRemoteTargetDraft {
  authRef?: string;
}

export interface JsTemplateSyncConfigureResult {
  projectId: string;
  source: JsTemplateSyncSourceSummary;
}

export type JsTemplateSyncDisconnectInput = JsTemplateSyncGetInput;

export interface JsTemplateSyncDisconnectResult {
  projectId: string;
  source: null;
}

export interface JsTemplateSyncTestConnectionInput extends JsTemplateSyncGetInput {
  provider?: JsTemplateSyncProvider;
  config?: VscGitRemoteConfigDraft;
  authRef?: string;
}

export interface JsTemplateSyncTestConnectionResult {
  ok: true;
  provider: JsTemplateSyncProvider;
  config: VscGitRemoteConfig;
  revision: string | null;
  credentialConfigured: boolean;
  authRefDisplay: string | null;
}

export type JsTemplateSyncPlanInput = JsTemplateSyncGetInput;

export type JsTemplateSyncPlanLocalSummary = VscRemotePlannerLocalSummary;

export type JsTemplateSyncPlanRemoteSummary = VscRemotePlannerRemoteSummary;

export type JsTemplateSyncPlan = VscRemoteSyncPlan;

export interface JsTemplateSyncPlanResult {
  projectId: string;
  source: JsTemplateSyncSourceSummary | null;
  plan: JsTemplateSyncPlan;
}

export interface JsTemplateSyncExecutionInput extends JsTemplateSyncGetInput {
  expectedHeadCommitId: string | null;
  expectedRemoteRevision: string | null;
  expectedRemoteTargetVersion: number;
  planFingerprint: string;
}

export type JsTemplateSyncPullInput = JsTemplateSyncExecutionInput;

export type JsTemplateSyncPushInput = JsTemplateSyncExecutionInput;

export interface JsTemplateSyncOperationResult {
  project: JsTemplateProject;
  source: JsTemplateSyncSourceSummary;
  plan: JsTemplateSyncPlan;
}

export type JsTemplateSyncPullResult = JsTemplateSyncOperationResult;

export type JsTemplateSyncPushResult = JsTemplateSyncOperationResult;

export interface JsTemplateSyncCreateFromGitInput extends JsTemplateSyncRemoteTargetDraft {
  name: string;
  title?: string | null;
  description?: string | null;
  authRef?: string;
}

export type JsTemplateSyncCreateFromGitResult = JsTemplateCreateJobAcceptedResult;

export interface JsTemplateSyncActionContract {
  get: {
    input: JsTemplateSyncGetInput;
    result: JsTemplateSyncGetResult;
  };
  configure: {
    input: JsTemplateSyncConfigureInput;
    result: JsTemplateSyncConfigureResult;
  };
  disconnect: {
    input: JsTemplateSyncDisconnectInput;
    result: JsTemplateSyncDisconnectResult;
  };
  testConnection: {
    input: JsTemplateSyncTestConnectionInput;
    result: JsTemplateSyncTestConnectionResult;
  };
  plan: {
    input: JsTemplateSyncPlanInput;
    result: JsTemplateSyncPlanResult;
  };
  pull: {
    input: JsTemplateSyncPullInput;
    result: JsTemplateSyncPullResult;
  };
  push: {
    input: JsTemplateSyncPushInput;
    result: JsTemplateSyncPushResult;
  };
  createFromGit: {
    input: JsTemplateSyncCreateFromGitInput;
    result: JsTemplateSyncCreateFromGitResult;
  };
}

export type JsTemplateSyncActionName = keyof JsTemplateSyncActionContract;
