/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES,
  LIGHT_EXTENSION_REPO_HEALTH_STATUSES,
  LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES,
  LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES,
  LightExtensionKind,
} from '../constants';
import type {
  RunJSSourceLocator,
  VscGitHubRemoteConfig,
  VscRemotePlannerAction,
  VscRemotePlannerLocalSummary,
  VscRemotePlannerRemoteSummary,
  VscRemotePlannerState,
  VscRemoteProvider,
  VscRemoteSyncPlan,
} from './vsc-file/public-api';

export type { LightExtensionKind } from '../constants';

export type LightExtensionRepoLifecycleStatus = (typeof LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES)[number];

export type LightExtensionRepoHealthStatus = (typeof LIGHT_EXTENSION_REPO_HEALTH_STATUSES)[number];

export type LightExtensionEntryHealthStatus = (typeof LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES)[number];

export type LightExtensionReferenceResolvedStatus = (typeof LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES)[number];

export type LightExtensionFileOperation = 'upsert' | 'delete';

export type LightExtensionIncludeContentMode = 'none' | 'selected' | 'all';

export type LightExtensionFileEncoding = 'utf8' | 'base64';

export interface LightExtensionRepoRecord {
  id: string;
  name: string;
  normalizedName: string;
  title?: string | null;
  description?: string | null;
  lifecycleStatus: LightExtensionRepoLifecycleStatus;
  healthStatus: LightExtensionRepoHealthStatus;
  headCommitId: string | null;
  lastCompiledAt?: string | null;
  entryCount?: number;
  entryKinds?: Partial<Record<LightExtensionKind, number>>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LightExtensionCreateRepoInput {
  name: string;
  title?: string | null;
  description?: string | null;
  zipBase64?: string;
  initialFiles?: LightExtensionTreeEntryInput[];
  message?: string;
}

export interface LightExtensionUpdateRepoInput {
  repoId: string;
  title: string;
  description?: string | null;
}

export interface LightExtensionInspectSourceArchiveInput {
  repoId: string;
  zipBase64: string;
}

export interface LightExtensionInspectSourceArchiveResult {
  files: LightExtensionTreeEntryInput[];
}

export interface LightExtensionChangeLifecycleInput {
  repoId: string;
  lifecycleStatus: LightExtensionRepoLifecycleStatus;
}

export interface LightExtensionDeleteRepoInput {
  repoId: string;
}

export interface LightExtensionTreeEntryInput {
  path: string;
  content?: string;
  encoding?: LightExtensionFileEncoding;
  blobHash?: string;
  size?: number;
  language?: string;
  mode?: string;
}

export interface LightExtensionFileChange extends LightExtensionTreeEntryInput {
  operation?: LightExtensionFileOperation;
}

export interface LightExtensionCommitRecord {
  id: string;
  repoId: string;
  hash: string;
  seq: number;
  parentCommitId: string | null;
  treeHash: string;
  message: string;
  authorId: string | null;
  metadata: Record<string, unknown>;
  createdAt?: string;
}

export interface LightExtensionPulledFile {
  path: string;
  pathHash: string;
  pathLowerHash: string;
  blobHash: string;
  size: number;
  language: string;
  mode: string;
  content?: string;
  encoding?: LightExtensionFileEncoding;
}

export interface LightExtensionStoredTree {
  hash: string;
  entryCount: number;
  byteSize: number;
}

export interface LightExtensionPullResult {
  repo: LightExtensionRepoRecord;
  commit: LightExtensionCommitRecord | null;
  tree: LightExtensionStoredTree | null;
  unchanged: boolean;
  files?: LightExtensionPulledFile[];
}

export interface LightExtensionFileResult extends LightExtensionPulledFile {
  content: string;
}

export interface LightExtensionPushInput {
  repoId: string;
  expectedHeadCommitId: string | null;
  message: string;
  files: LightExtensionFileChange[];
  allowEmptyCommit?: boolean;
}

export interface LightExtensionPushResult {
  repo: LightExtensionRepoRecord;
  commit: LightExtensionCommitRecord;
  tree: LightExtensionStoredTree;
}

export type LightExtensionProblemSchemaVersion = 1;

export type LightExtensionProblemSeverity = 'error' | 'warning';

export type LightExtensionProblemPhase =
  | 'schema'
  | 'typecheck'
  | 'policy'
  | 'compile'
  | 'infrastructure'
  | 'runtime'
  | 'react'
  | 'api'
  | 'permission';

export type LightExtensionProblemSource =
  | 'validator'
  | 'typescript'
  | 'runjs-compiler'
  | 'esbuild'
  | 'browser-preview'
  | 'host-runtime'
  | 'react'
  | 'api'
  | 'server';

export interface LightExtensionProblemPosition {
  /** One-based line number in the original source file. */
  line: number;
  /** One-based column number in the original source file. */
  column: number;
}

export interface LightExtensionProblemRange {
  start: LightExtensionProblemPosition;
  end?: LightExtensionProblemPosition;
}

export interface LightExtensionProblemProvenance {
  source: LightExtensionProblemSource;
  phase: LightExtensionProblemPhase;
  requestId: string;
}

export interface LightExtensionProblem {
  schemaVersion: LightExtensionProblemSchemaVersion;
  phase: LightExtensionProblemPhase;
  source: LightExtensionProblemSource;
  severity: LightExtensionProblemSeverity;
  code: string;
  message: string;
  path?: string;
  range?: LightExtensionProblemRange;
  snapshotId: string;
  requestId: string;
  fingerprint: string;
  kind?: string;
  entryName?: string;
  stack?: string;
  fixHint?: string;
  details?: Record<string, unknown>;
  provenance?: LightExtensionProblemProvenance[];
}

export type LightExtensionPreviewProblemSessionState = 'active' | 'completed' | 'stale' | 'expired';

export interface LightExtensionPreviewProblemSessionIdentity {
  repoId: string;
  entryId: string;
  ownerLocator: LightExtensionReferenceOwnerLocator;
  snapshotId: string;
  artifactHash: string;
  executionId: string;
}

export interface LightExtensionPreviewProblemOpenInput
  extends Omit<LightExtensionPreviewProblemSessionIdentity, 'executionId'> {
  ttlMs?: number;
}

export interface LightExtensionPreviewProblemSessionInput extends LightExtensionPreviewProblemSessionIdentity {
  sessionId: string;
}

export interface LightExtensionPreviewProblemAppendInput extends LightExtensionPreviewProblemSessionInput {
  problems: LightExtensionProblem[];
}

export interface LightExtensionPreviewProblemListInput extends LightExtensionPreviewProblemSessionInput {
  cursor?: number;
}

export interface LightExtensionPreviewProblemCloseInput extends LightExtensionPreviewProblemSessionInput {
  state: Extract<LightExtensionPreviewProblemSessionState, 'completed' | 'stale'>;
}

export interface LightExtensionPreviewProblemItem {
  cursor: number;
  problem: LightExtensionProblem;
}

export interface LightExtensionPreviewProblemSessionResult extends LightExtensionPreviewProblemSessionIdentity {
  schemaVersion: 1;
  sessionId: string;
  state: LightExtensionPreviewProblemSessionState;
  cursor: number;
  nextCursor: number;
  expiresAt: string;
  droppedCount: number;
  items: LightExtensionPreviewProblemItem[];
}

export interface LightExtensionEntryRuntimeArtifact {
  artifactHash?: string;
  code: string;
  sourceMap?: string;
  version: string;
  entryPath: string;
  filesHash?: string;
  metadata?: Record<string, unknown>;
}

export interface LightExtensionEntryRecord {
  id: string;
  repoId: string;
  target: 'client';
  kind: string;
  entryName: string;
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
  runtimeArtifact: LightExtensionEntryRuntimeArtifact | null;
  runtimeVersion: string | null;
  surfaceStyle: string | null;
  runtimeCodeHash: string | null;
  artifactHash: string | null;
  filesHash: string | null;
  settingsDefaultsHash: string | null;
  compiledAt: string | null;
  healthStatus: LightExtensionEntryHealthStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type LightExtensionSaveSourceInput = Omit<LightExtensionPushInput, 'allowEmptyCommit'>;

export type LightExtensionCompileEntryStatus = 'success' | 'failed' | 'skipped';

export interface LightExtensionSaveSourceCompileEntryResult {
  entryId: string;
  entryName: string;
  kind: string;
  entryPath: string;
  status: LightExtensionCompileEntryStatus;
  execution?: 'compiled' | 'skipped';
  problems: LightExtensionProblem[];
  artifact?: LightExtensionCompilePreviewArtifactSummary;
  failureCode?: string;
}

export interface LightExtensionSaveSourceResult {
  repo: LightExtensionRepoRecord;
  commit: LightExtensionCommitRecord;
  tree: LightExtensionStoredTree;
  compile: {
    status: 'success' | 'skipped';
    entries: LightExtensionSaveSourceCompileEntryResult[];
  };
  problems: LightExtensionProblem[];
}

export interface LightExtensionValidationLimits {
  maxRepoFiles: number;
  maxEntryFiles: number;
  maxFileBytes: number;
  maxEntryDescriptorBytes: number;
  maxRepoBytes: number;
  maxEntries: number;
  maxSyncBatchFiles: number;
  maxZipBytes: number;
  maxZipCompressionRatio: number;
  maxJsonBytes: number;
  maxSettingsSchemaDepth: number;
}

export interface LightExtensionCapabilities {
  entryDescriptor: {
    schemaVersion: number;
    keyPattern: string;
  };
  allowedPaths: {
    repo: string[];
    entries: Record<string, string[]>;
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
    entrySchemaUri: string;
    entrySchemaSha256: string;
  };
  limits: LightExtensionValidationLimits;
  writePolicy: {
    validateFinalWorkspaceOnPush: boolean;
    allowDeleteExistingInvalidPaths: boolean;
  };
  supportedKinds: LightExtensionKind[];
  validatorVersion: string;
  sdkTemplateVersion: string;
}

export interface LightExtensionCompilePreviewArtifactSummary {
  artifactHash?: string;
  version: string;
  entryPath: string;
  filesHash?: string;
  metadata?: Record<string, unknown>;
}

export type LightExtensionCompilePreviewEntryStatus = 'success' | 'failed' | 'skipped';

export interface LightExtensionCompilePreviewEntryResult {
  entryId: string | null;
  repoId: string;
  target: 'client';
  kind: string;
  entryName: string;
  entryPath: string | null;
  status: LightExtensionCompilePreviewEntryStatus;
  accepted: boolean;
  problems: LightExtensionProblem[];
  failureCode?: string;
  artifact?: LightExtensionCompilePreviewArtifactSummary;
}

export interface LightExtensionCompilePreviewResult {
  repo: LightExtensionRepoRecord;
  commitId: string | null;
  accepted: boolean;
  problems: LightExtensionProblem[];
  entries: LightExtensionCompilePreviewEntryResult[];
}

export interface LightExtensionWorkspacePreviewFile {
  path: string;
  content: string;
  encoding?: LightExtensionFileEncoding;
  language?: string;
  mode?: string;
}

export interface LightExtensionWorkspacePreviewInput {
  repoId: string;
  expectedHeadCommitId: string | null;
  entryId?: string | null;
  kind?: LightExtensionKind;
  entryPath?: string;
  runtimeVersion?: string;
  files: LightExtensionWorkspacePreviewFile[];
}

export interface LightExtensionWorkspaceCheckResult {
  baseHeadCommitId: string | null;
  snapshotId: string;
  requestId: string;
  accepted: boolean;
  problems: LightExtensionProblem[];
  failureCode?: string;
  artifact?: LightExtensionEntryRuntimeArtifact & { artifactHash: string };
  entries: LightExtensionCompilePreviewEntryResult[];
}

export type LightExtensionWorkspacePreviewResult = LightExtensionWorkspaceCheckResult;

export interface LightExtensionSelectableEntrySummary {
  id: string;
  repoId: string;
  kind: string;
  entryName: string;
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

export type LightExtensionSelectableEntryRecord = LightExtensionSelectableEntrySummary;

export interface LightExtensionSelectableEntriesInput {
  repoId?: string;
  kind?: LightExtensionKind;
}

export interface LightExtensionRuntimeSourceBinding extends Record<string, unknown> {
  type: 'light-extension-entry';
  repoId: string;
  repoTitle?: string | null;
  entryId: string;
  entryTitle?: string | null;
  entryName?: string | null;
  entryPath?: string | null;
  kind: string;
}

export interface LightExtensionMoveSourceWorkspaceFile {
  path: string;
  content: string;
  language?: string;
  mode?: string;
}

export type LightExtensionMoveSourceDestination =
  | {
      type: 'existing';
      repoId: string;
    }
  | {
      type: 'new';
      name: string;
      title?: string | null;
      description?: string | null;
    };

export type LightExtensionMoveSourceOriginBinding = Pick<
  LightExtensionRuntimeSourceBinding,
  'type' | 'repoId' | 'entryId' | 'kind'
>;

export interface LightExtensionMoveSourceInput {
  locator: RunJSSourceLocator;
  expectedOwnerFingerprint: string;
  sourceRepoId: string;
  sourceHeadCommitId: string | null;
  entryPath: string;
  version: string;
  files: LightExtensionMoveSourceWorkspaceFile[];
  originBinding?: LightExtensionMoveSourceOriginBinding;
  destination: LightExtensionMoveSourceDestination;
  entryName: string;
  entryTitle?: string | null;
}

export interface LightExtensionMoveSourceResult {
  repo: LightExtensionRepoRecord;
  entry: LightExtensionEntryRecord;
  binding: LightExtensionRuntimeSourceBinding;
  ownerFingerprint: string;
}

export interface LightExtensionMoveToInlineInput {
  locator: RunJSSourceLocator;
  repoId: string;
  entryId: string;
  entryPath: string;
  kind: LightExtensionKind;
  version: string;
  files: LightExtensionMoveSourceWorkspaceFile[];
}

export interface LightExtensionMoveToInlineResult {
  runJSRepoId: string;
  commitId: string;
  ownerFingerprint: string;
  code: string;
  version: string;
  entryPath: string;
  filesHash?: string;
  sourceRef: {
    type: 'vsc-file';
    repoId: string;
    commitId: string;
    entry: string;
  };
}

export interface LightExtensionRuntimeResolveInput {
  sourceMode: 'light-extension';
  sourceBinding: LightExtensionRuntimeSourceBinding;
  settings?: Record<string, unknown> | null;
}

export interface LightExtensionRuntimeCacheMetadata {
  etag: string;
  immutable: boolean;
}

export interface LightExtensionRuntimeResolveResult {
  entryId: string;
  entryPath: string;
  artifactHash: string;
  artifactUrl: string;
  runtimeCodeHash: string;
  version: string;
  settings: Record<string, unknown>;
  settingsHash: string;
}

export interface LightExtensionRuntimeArtifactRecord {
  artifactHash: string;
  runtimeCodeHash: string;
  code: string;
  sourceMap?: string;
  version: string;
  entryPath: string;
  runtimeContract: string;
  byteSize: number;
}

export type LightExtensionReferenceOwnerKind =
  | 'flowModel.step'
  | 'flowModel.pageSettings'
  | 'flowModel.fieldSettings'
  | 'flowModel.actionSettings'
  | 'flowModel.itemSettings'
  | 'flowModel.runjsHost';

export interface LightExtensionFlowModelOwnerLocator {
  kind: 'flowModel.step';
  modelUid: string;
  use: 'JSBlockModel';
  stepPath: ['stepParams', 'jsSettings'];
}

export interface LightExtensionModelOwnerLocator {
  kind: Exclude<LightExtensionReferenceOwnerKind, 'flowModel.step'>;
  modelUid?: string;
  use?: string;
  stepPath?: string[];
  hostPath?: string[];
  descriptor?: string;
}

export type LightExtensionReferenceOwnerLocator = LightExtensionFlowModelOwnerLocator | LightExtensionModelOwnerLocator;

export interface LightExtensionReferenceOwnerAdapterContract {
  kind: LightExtensionKind;
  ownerKind: LightExtensionReferenceOwnerKind;
  title: string;
  locatorContract: string;
  modelUse?: string;
}

export interface LightExtensionReferenceRecord {
  id: string;
  repoId: string;
  entryId: string;
  kind: LightExtensionKind;
  ownerKind: LightExtensionReferenceOwnerKind;
  ownerLocator: LightExtensionReferenceOwnerLocator;
  ownerLocatorHash: string;
  settingsHash: string;
  resolvedStatus: LightExtensionReferenceResolvedStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LightExtensionReferenceListInput {
  repoId?: string;
  entryId?: string;
  ownerLocator?: Partial<LightExtensionReferenceOwnerLocator>;
}

export interface LightExtensionReferenceRebuildInput {
  rootUid?: string;
  ownerLocator?: Partial<LightExtensionReferenceOwnerLocator>;
  repoId?: string;
  dryRun?: boolean;
}

export type LightExtensionReferenceRebuildItemAction = 'upsert' | 'remove' | 'owner_missing';

export interface LightExtensionReferenceRebuildItem {
  action: LightExtensionReferenceRebuildItemAction;
  kind?: LightExtensionKind;
  ownerKind: LightExtensionReferenceOwnerKind;
  ownerLocatorHash: string;
  repoId?: string;
  entryId?: string;
  resolvedStatus?: LightExtensionReferenceResolvedStatus;
  reasonCode?: string;
}

export interface LightExtensionReferenceRebuildResult {
  dryRun?: boolean;
  scanned: number;
  upserted: number;
  removed: number;
  ownerMissing: number;
  statusCounts: Partial<Record<LightExtensionReferenceResolvedStatus, number>>;
  items?: LightExtensionReferenceRebuildItem[];
}

/**
 * The provider-neutral remote framework, snapshots, jobs, mappings, and conflicts belong to the internal VSC module.
 * This facade deliberately exposes only a light-extension repository id and safe remote summaries. The internal VSC
 * repository remains the authoritative local source, while synchronization exchanges source snapshots rather than attempting to mirror provider history.
 */
export type LightExtensionSyncProvider = VscRemoteProvider;

export type LightExtensionSyncState = VscRemotePlannerState;

export type LightExtensionSyncAction = VscRemotePlannerAction;

export type LightExtensionSyncSourceStatus = 'active' | 'disabled';

export interface LightExtensionSyncRemoteTarget {
  provider: LightExtensionSyncProvider;
  config: VscGitHubRemoteConfig;
}

export interface LightExtensionSyncSourceSummary extends LightExtensionSyncRemoteTarget {
  status: LightExtensionSyncSourceStatus;
  remoteTargetVersion: number;
  revision: string | null;
  credentialConfigured: boolean;
  authRefDisplay: string | null;
  lastSyncedAt?: string | null;
}

export interface LightExtensionSyncGetInput {
  repoId: string;
}

export interface LightExtensionSyncGetResult {
  repoId: string;
  source: LightExtensionSyncSourceSummary | null;
}

export interface LightExtensionSyncConfigureInput extends LightExtensionSyncGetInput, LightExtensionSyncRemoteTarget {
  authRef?: string;
}

export interface LightExtensionSyncConfigureResult {
  repoId: string;
  source: LightExtensionSyncSourceSummary;
}

export type LightExtensionSyncDisconnectInput = LightExtensionSyncGetInput;

export interface LightExtensionSyncDisconnectResult {
  repoId: string;
  source: null;
}

export interface LightExtensionSyncTestConnectionInput extends LightExtensionSyncGetInput {
  provider?: LightExtensionSyncProvider;
  config?: VscGitHubRemoteConfig;
  authRef?: string;
}

export interface LightExtensionSyncTestConnectionResult {
  ok: true;
  provider: LightExtensionSyncProvider;
  config: VscGitHubRemoteConfig;
  revision: string | null;
  credentialConfigured: boolean;
  authRefDisplay: string | null;
}

export type LightExtensionSyncPlanInput = LightExtensionSyncGetInput;

export type LightExtensionSyncPlanLocalSummary = VscRemotePlannerLocalSummary;

export type LightExtensionSyncPlanRemoteSummary = VscRemotePlannerRemoteSummary;

export type LightExtensionSyncPlan = VscRemoteSyncPlan;

export interface LightExtensionSyncPlanResult {
  repoId: string;
  source: LightExtensionSyncSourceSummary | null;
  plan: LightExtensionSyncPlan;
}

export interface LightExtensionSyncExecutionInput extends LightExtensionSyncGetInput {
  expectedHeadCommitId: string | null;
  expectedRemoteRevision: string | null;
  expectedRemoteTargetVersion: number;
  planFingerprint: string;
}

export type LightExtensionSyncPullInput = LightExtensionSyncExecutionInput;

export type LightExtensionSyncPushInput = LightExtensionSyncExecutionInput;

export interface LightExtensionSyncOperationResult {
  repo: LightExtensionRepoRecord;
  source: LightExtensionSyncSourceSummary;
  plan: LightExtensionSyncPlan;
}

export type LightExtensionSyncPullResult = LightExtensionSyncOperationResult;

export type LightExtensionSyncPushResult = LightExtensionSyncOperationResult;

export interface LightExtensionSyncCreateFromGitInput extends LightExtensionSyncRemoteTarget {
  name: string;
  title?: string | null;
  description?: string | null;
  authRef?: string;
}

export type LightExtensionSyncCreateFromGitResult = LightExtensionSyncOperationResult;

export interface LightExtensionSyncActionContract {
  get: {
    input: LightExtensionSyncGetInput;
    result: LightExtensionSyncGetResult;
  };
  configure: {
    input: LightExtensionSyncConfigureInput;
    result: LightExtensionSyncConfigureResult;
  };
  disconnect: {
    input: LightExtensionSyncDisconnectInput;
    result: LightExtensionSyncDisconnectResult;
  };
  testConnection: {
    input: LightExtensionSyncTestConnectionInput;
    result: LightExtensionSyncTestConnectionResult;
  };
  plan: {
    input: LightExtensionSyncPlanInput;
    result: LightExtensionSyncPlanResult;
  };
  pull: {
    input: LightExtensionSyncPullInput;
    result: LightExtensionSyncPullResult;
  };
  push: {
    input: LightExtensionSyncPushInput;
    result: LightExtensionSyncPushResult;
  };
  createFromGit: {
    input: LightExtensionSyncCreateFromGitInput;
    result: LightExtensionSyncCreateFromGitResult;
  };
}

export type LightExtensionSyncActionName = keyof LightExtensionSyncActionContract;
