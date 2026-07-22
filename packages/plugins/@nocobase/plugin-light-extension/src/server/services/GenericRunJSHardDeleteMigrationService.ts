/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash, stableSerialize } from '@nocobase/runjs';
import { randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';

import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionEntryRecord } from '../../shared/types';
import type { CanonicalCandidateFile, PreparedPush, VscRepositoryRecord } from '../vsc-file/public-api';
import { VscFileService, VscPermissionHookRegistry } from '../vsc-file/public-api';
import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  type LightExtensionCompileSuccessResult,
} from './LightExtensionCompileContract';
import { buildLightExtensionCompileKey } from './LightExtensionCompileKey';
import {
  LightExtensionAuditService,
  type LightExtensionCompileAuditInput,
  type LightExtensionFileWriteAuditInput,
  type LightExtensionLifecycleAuditInput,
  type LightExtensionRawResourceDeniedAuditInput,
  type LightExtensionReferenceAuditInput,
  type LightExtensionSyncAuditInput,
} from './LightExtensionAuditService';
import { entryFromModel } from './LightExtensionEntryService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import { PublishCompiledEntriesService } from './PublishCompiledEntriesService';
import { SettingsResolverService } from './SettingsResolverService';
import {
  LightExtensionValidator,
  hasErrorDiagnostic,
  sortDiagnostics,
  type LightExtensionEntryValidationResult,
} from './LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './LightExtensionWorkspaceCompilerBridge';

const LEGACY_KIND = 'runjs';
const LEGACY_OWNER_KIND = 'flowModel.runjsHost';
const LEGACY_ENTRY_ROOT = 'src/client/runjs';
const ARTIFACT_GC_BATCH_SIZE = 500;
const BLOCKING_SYNC_JOB_STATUSES = ['pending', 'running', 'finalize-pending'] as const;
const REQUIRED_COLLECTIONS = [
  'flowModels',
  'lightExtensionEntries',
  'lightExtensionReferences',
  'lightExtensionRepos',
  'lightExtensionRuntimeArtifacts',
  'vscFileRepositories',
  'vscFileRemotes',
  'vscFileSyncJobs',
] as const;
const OWNED_MIGRATION_COLLECTIONS = REQUIRED_COLLECTIONS.filter((name) => name !== 'flowModels');
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

type JsonRecord = Record<string, unknown>;
type JsonPath = Array<string | number>;

interface GenericRunJSBindingSnapshot {
  modelUid: string;
  path: JsonPath;
  pathLabel: string;
  host: JsonRecord;
  repoId: string;
  entryId: string;
  entryPath: string;
  inlineCode?: string;
  inlineVersion?: string;
  inlineSettings?: JsonRecord;
}

interface FlowModelSnapshot {
  uid: string;
  options: JsonRecord;
  bindings: GenericRunJSBindingSnapshot[];
}

interface EntrySnapshot {
  record: Model;
  entry: LightExtensionEntryRecord;
}

interface RepoSnapshot {
  id: string;
  vscRepoId: string;
  headCommitId: string | null;
  vscRepository: VscRepositoryRecord;
  legacyFiles: CanonicalCandidateFile[];
  runjsEntries: EntrySnapshot[];
  survivingEntries: EntrySnapshot[];
  preparedCleanup?: PreparedMixedRepoCleanup;
}

interface PreparedMixedRepoCleanup {
  preparedPush: PreparedPush;
  compileResults: LightExtensionCompileSuccessResult[];
}

interface MigrationPreflight {
  models: FlowModelSnapshot[];
  repos: RepoSnapshot[];
  artifactHashes: string[];
  genericReferenceIds: string[];
}

export interface GenericRunJSHardDeleteMigrationResult {
  bindingCount: number;
  repoCount: number;
  entryCount: number;
  referenceCount: number;
  artifactCount: number;
  changed: boolean;
}

export interface GenericRunJSLegacyState {
  bindingCount: number;
  entryCount: number;
  referenceCount: number;
  unknownReferenceCount: number;
  orphanArtifactCount: number;
  legacyHeadPathCount: number;
  orphanLegacyVscRepoCount: number;
}

export class GenericRunJSHardDeleteMigrationService {
  private readonly settingsResolver = new SettingsResolverService();

  private readonly validator = new LightExtensionValidator();

  private readonly vscFileService: VscFileService;

  private readonly compilerBridge: LightExtensionWorkspaceCompilerBridge;

  private readonly publishCompiledEntries: PublishCompiledEntriesService;

  constructor(private readonly db: Database) {
    const permissionHooks = new VscPermissionHookRegistry();
    permissionHooks.register((input) => {
      const ownerType = input.repository?.ownerType || input.ownerType;
      if (ownerType !== 'light-extension') {
        return;
      }
      return { allowed: true, ownerType };
    });
    this.vscFileService = new VscFileService(db, permissionHooks);
    const auditService = new MigrationNoopAuditService(db);
    this.compilerBridge = new LightExtensionWorkspaceCompilerBridge(
      auditService,
      new LightExtensionPermissionService(auditService),
    );
    this.publishCompiledEntries = PublishCompiledEntriesService.forDatabase(db);
  }

  async isAvailable(): Promise<boolean> {
    const queryInterface = this.db.sequelize.getQueryInterface();
    const tableStates = new Map<string, boolean>();
    for (const name of REQUIRED_COLLECTIONS) {
      if (!this.db.hasCollection(name)) {
        tableStates.set(name, false);
        continue;
      }
      const collection = this.db.getCollection(name);
      tableStates.set(name, await queryInterface.tableExists(collection.getTableNameWithSchema()));
    }
    const existingOwnedTables = OWNED_MIGRATION_COLLECTIONS.filter((name) => tableStates.get(name));
    if (existingOwnedTables.length === 0) {
      return false;
    }
    const missingTables = REQUIRED_COLLECTIONS.filter((name) => !tableStates.get(name));
    if (missingTables.length > 0) {
      throw migrationBlocked('The generic RunJS migration cannot run against a partially initialized schema', {
        reasonCode: 'migration-schema-incomplete',
        existingTables: existingOwnedTables,
        missingTables,
      });
    }
    return true;
  }

  async migrate(): Promise<GenericRunJSHardDeleteMigrationResult> {
    if (!(await this.isAvailable())) {
      return emptyResult();
    }
    const state = await this.inspectLegacyState();
    if (!hasLegacyState(state)) {
      return emptyResult();
    }
    const preflight = await this.preflight();
    const result = await this.db.sequelize.transaction((transaction) => this.apply(preflight, transaction));
    await this.assertNoLegacyData();
    return result;
  }

  async assertNoLegacyData(): Promise<void> {
    if (!(await this.isAvailable())) {
      return;
    }
    const state = await this.inspectLegacyState();
    if (!hasLegacyState(state)) {
      return;
    }
    throw migrationBlocked(
      'Generic RunJS light-extension data remains. Run "yarn nocobase upgrade" and resolve the reported migration blocker before starting or enabling this plugin.',
      { reasonCode: 'legacy-data-remains', ...state },
    );
  }

  async inspectLegacyState(): Promise<GenericRunJSLegacyState> {
    if (!(await this.isAvailable())) {
      return emptyLegacyState();
    }
    const [models, entries, references, artifacts, lightRepos, vscRepositories] = await Promise.all([
      this.scanFlowModels(),
      this.db.getRepository('lightExtensionEntries').find({ fields: ['kind', 'artifactHash'] }),
      this.db.getRepository('lightExtensionReferences').find({
        filter: { $or: [{ kind: LEGACY_KIND }, { ownerKind: LEGACY_OWNER_KIND }] },
        fields: ['kind', 'ownerKind'],
      }),
      this.db.getRepository('lightExtensionRuntimeArtifacts').find({ fields: ['artifactHash', 'entryPath'] }),
      this.db.getRepository('lightExtensionRepos').find({ fields: ['id', 'vscRepoId'] }),
      this.db.getRepository('vscFileRepositories').find({
        filter: { ownerType: 'light-extension', status: 'active' },
        fields: ['id', 'ownerId'],
      }),
    ]);
    const lightRepoByVscId = new Map(
      lightRepos.map((record) => [readString(record, 'vscRepoId'), readString(record, 'id')]),
    );
    let legacyHeadPathCount = 0;
    let orphanLegacyVscRepoCount = 0;
    for (const record of vscRepositories) {
      const vscRepoId = readString(record, 'id');
      const pull = await this.vscFileService.pull({ repoId: vscRepoId, includeContent: 'none' });
      const legacyPaths = (pull.files || []).filter((file) => isLegacyPath(file.path));
      legacyHeadPathCount += legacyPaths.length;
      if (legacyPaths.length > 0 && !lightRepoByVscId.has(vscRepoId)) {
        orphanLegacyVscRepoCount += 1;
      }
    }
    const referencedArtifactHashes = new Set(
      entries.map((record) => readString(record, 'artifactHash')).filter(Boolean),
    );
    return {
      bindingCount: models.reduce((count, model) => count + model.bindings.length, 0),
      entryCount: entries.filter((record) => readString(record, 'kind') === LEGACY_KIND).length,
      referenceCount: references.filter(isKnownGenericReference).length,
      unknownReferenceCount: references.filter((record) => !isKnownGenericReference(record)).length,
      orphanArtifactCount: artifacts.filter(
        (record) =>
          isLegacyPath(readString(record, 'entryPath')) &&
          !referencedArtifactHashes.has(readString(record, 'artifactHash')),
      ).length,
      legacyHeadPathCount,
      orphanLegacyVscRepoCount,
    };
  }

  private async preflight(): Promise<MigrationPreflight> {
    const [models, entryModels, referenceModels, artifactModels, repoModels, vscModels] = await Promise.all([
      this.scanFlowModels(),
      this.db.getRepository('lightExtensionEntries').find(),
      this.db.getRepository('lightExtensionReferences').find({
        filter: { $or: [{ kind: LEGACY_KIND }, { ownerKind: LEGACY_OWNER_KIND }] },
      }),
      this.db.getRepository('lightExtensionRuntimeArtifacts').find({ fields: ['artifactHash', 'entryPath'] }),
      this.db.getRepository('lightExtensionRepos').find(),
      this.db.getRepository('vscFileRepositories').find({ filter: { ownerType: 'light-extension' } }),
    ]);
    const unknownReferences = referenceModels.filter((record) => !isKnownGenericReference(record));
    if (unknownReferences.length > 0) {
      throw migrationBlocked('Unknown generic RunJS reference kind/ownerKind combinations must be repaired first', {
        reasonCode: 'unknown-reference-combination',
        references: unknownReferences.map((record) => ({
          id: readString(record, 'id'),
          kind: readString(record, 'kind'),
          ownerKind: readString(record, 'ownerKind'),
        })),
      });
    }

    const entries = entryModels.map((record) => ({ record, entry: entryFromModel(record) }));
    const entriesById = new Map(entries.map((snapshot) => [snapshot.entry.id, snapshot]));
    const reposById = new Map(repoModels.map((record) => [readString(record, 'id'), record]));
    const vscById = new Map(vscModels.map((record) => [readString(record, 'id'), record]));
    const artifactHashes = new Set<string>();
    for (const artifact of artifactModels) {
      if (isLegacyPath(readString(artifact, 'entryPath'))) {
        artifactHashes.add(readString(artifact, 'artifactHash'));
      }
    }

    for (const model of models) {
      for (const binding of model.bindings) {
        const entrySnapshot = entriesById.get(binding.entryId);
        if (!entrySnapshot || entrySnapshot.entry.kind !== LEGACY_KIND) {
          throw bindingBlocker(binding, 'The bound generic RunJS entry is missing or has a different kind', {
            reasonCode: 'entry-missing-or-kind-mismatch',
          });
        }
        const entry = entrySnapshot.entry;
        if (entry.repoId !== binding.repoId || normalizePath(entry.entryPath) !== normalizePath(binding.entryPath)) {
          throw bindingBlocker(binding, 'The bound entry repo or entryPath no longer matches the FlowModel binding', {
            reasonCode: 'entry-binding-mismatch',
            actualRepoId: entry.repoId,
            actualEntryPath: entry.entryPath,
          });
        }
        const repo = reposById.get(binding.repoId);
        if (!repo) {
          throw bindingBlocker(binding, 'The bound light-extension repository is missing', {
            reasonCode: 'repo-missing',
          });
        }
        if (readString(repo, 'lifecycleStatus') === 'archived') {
          throw bindingBlocker(binding, 'The bound light-extension repository is archived', {
            reasonCode: 'repo-archived',
          });
        }
        const headCommitId = readNullableString(repo, 'headCommitId');
        if (!headCommitId || entry.compiledCommitId !== headCommitId) {
          throw bindingBlocker(binding, 'The bound entry was not compiled from the current repository HEAD', {
            reasonCode: 'compiled-head-mismatch',
            repoHeadCommitId: headCommitId,
            compiledCommitId: entry.compiledCommitId,
          });
        }
        const vscRepoId = readString(repo, 'vscRepoId');
        const vscRecord = vscById.get(vscRepoId);
        if (!vscRecord || readString(vscRecord, 'status') === 'archived') {
          throw bindingBlocker(binding, 'The bound VSC repository is missing or archived', {
            reasonCode: 'vsc-repo-unavailable',
            vscRepoId,
          });
        }
        if (readNullableString(vscRecord, 'headCommitId') !== headCommitId) {
          throw bindingBlocker(binding, 'Light-extension metadata and VSC HEAD do not match', {
            reasonCode: 'vsc-head-mismatch',
            vscRepoId,
            vscHeadCommitId: readNullableString(vscRecord, 'headCommitId'),
            repoHeadCommitId: headCommitId,
          });
        }
        const artifact = await this.loadAndValidateArtifact(entry, binding);
        binding.inlineCode = artifact.code;
        binding.inlineVersion = artifact.version;
        binding.inlineSettings = this.resolveBindingSettings(binding, entry);
        artifactHashes.add(entry.artifactHash as string);
      }
    }

    const runjsEntries = entries.filter((snapshot) => snapshot.entry.kind === LEGACY_KIND);
    for (const snapshot of runjsEntries) {
      if (snapshot.entry.artifactHash) {
        artifactHashes.add(snapshot.entry.artifactHash);
      }
    }
    const runjsEntriesByRepo = groupEntries(runjsEntries);
    const lightRepoByVscId = new Map(
      repoModels.map((record) => [readString(record, 'vscRepoId'), readString(record, 'id')]),
    );
    for (const vscModel of vscModels) {
      if (readString(vscModel, 'status') !== 'active') {
        continue;
      }
      const vscRepoId = readString(vscModel, 'id');
      const pull = await this.vscFileService.pull({ repoId: vscRepoId, includeContent: 'all' });
      if ((pull.files || []).some((file) => isLegacyPath(file.path)) && !lightRepoByVscId.has(vscRepoId)) {
        throw migrationBlocked('An orphan light-extension VSC repository still contains generic RunJS source', {
          reasonCode: 'orphan-vsc-repo',
          vscRepoId,
          ownerId: readString(vscModel, 'ownerId'),
        });
      }
    }

    const repos: RepoSnapshot[] = [];
    for (const repoModel of repoModels) {
      const id = readString(repoModel, 'id');
      const vscRepoId = readString(repoModel, 'vscRepoId');
      const vscModel = vscById.get(vscRepoId);
      if (!vscModel) {
        if ((runjsEntriesByRepo.get(id) || []).length > 0) {
          throw migrationBlocked('A repository containing generic RunJS entries has no VSC repository', {
            reasonCode: 'vsc-repo-missing',
            repoId: id,
            vscRepoId,
          });
        }
        continue;
      }
      const pull = await this.vscFileService.pull({ repoId: vscRepoId, includeContent: 'all' });
      const files = (pull.files || []).map(toCanonicalFile);
      const legacyFiles = files.filter((file) => isLegacyPath(file.path));
      const repoRunjsEntries = runjsEntriesByRepo.get(id) || [];
      if (repoRunjsEntries.length === 0 && legacyFiles.length === 0) {
        continue;
      }
      const survivingEntries = entries.filter(
        (snapshot) => snapshot.entry.repoId === id && snapshot.entry.kind !== LEGACY_KIND,
      );
      const repo: RepoSnapshot = {
        id,
        vscRepoId,
        headCommitId: readNullableString(repoModel, 'headCommitId'),
        vscRepository: vscRepositoryFromModel(vscModel),
        legacyFiles,
        runjsEntries: repoRunjsEntries,
        survivingEntries,
      };
      await this.assertRepoSyncIdle(repo);
      this.assertRetainedWorkspaceMatchesMetadata(
        repo,
        files.filter((file) => !isLegacyPath(file.path)),
      );
      if (survivingEntries.length > 0 && legacyFiles.length > 0) {
        await this.assertMixedRepoHasNoActiveRemote(repo);
        repo.preparedCleanup = await this.prepareMixedRepoCleanup(repo, files);
      }
      repos.push(repo);
    }
    return {
      models,
      repos,
      artifactHashes: [...artifactHashes],
      genericReferenceIds: referenceModels.map((record) => readString(record, 'id')),
    };
  }

  private assertRetainedWorkspaceMatchesMetadata(repo: RepoSnapshot, files: readonly CanonicalCandidateFile[]): void {
    const validation = this.validator.validateWorkspace({ files });
    if (hasErrorDiagnostic(validation.diagnostics)) {
      throw migrationBlocked('The repository is invalid after excluding generic RunJS source', {
        reasonCode: 'retained-workspace-validation-failed',
        repoId: repo.id,
        diagnostics: validation.diagnostics,
      });
    }
    this.assertSurvivingEntrySet(repo, validation.entries);
  }

  private async loadAndValidateArtifact(entry: LightExtensionEntryRecord, binding: GenericRunJSBindingSnapshot) {
    if (!entry.artifactHash || !entry.runtimeCodeHash || !entry.runtimeVersion || !entry.runtimeArtifact) {
      throw bindingBlocker(binding, 'The bound entry has no complete runtime artifact metadata', {
        reasonCode: 'artifact-metadata-missing',
      });
    }
    const record = await this.db
      .getRepository('lightExtensionRuntimeArtifacts')
      .findOne({ filterByTk: entry.artifactHash });
    if (!record) {
      throw bindingBlocker(binding, 'The bound runtime artifact row is missing', {
        reasonCode: 'artifact-missing',
        artifactHash: entry.artifactHash,
      });
    }
    const artifact = {
      code: readString(record, 'code'),
      sourceMap: readNullableString(record, 'sourceMap'),
      version: readString(record, 'version'),
      entryPath: readString(record, 'entryPath'),
      runtimeContract: readString(record, 'runtimeContract'),
    };
    const artifactHash = buildRunJSArtifactHash({
      code: artifact.code,
      sourceMap: artifact.sourceMap || undefined,
      version: artifact.version,
      entryPath: artifact.entryPath,
      runtimeContract: artifact.runtimeContract,
    });
    const metadata = isRecord(entry.runtimeArtifact.metadata) ? entry.runtimeArtifact.metadata : {};
    const consistent =
      buildRunJSRuntimeCodeHash(artifact.code) === entry.runtimeCodeHash &&
      artifactHash === entry.artifactHash &&
      artifact.version === entry.runtimeVersion &&
      normalizePath(artifact.entryPath) === normalizePath(entry.entryPath) &&
      entry.runtimeArtifact.code === artifact.code &&
      (entry.runtimeArtifact.sourceMap || null) === artifact.sourceMap &&
      entry.runtimeArtifact.version === artifact.version &&
      normalizePath(entry.runtimeArtifact.entryPath) === normalizePath(artifact.entryPath) &&
      metadata.repoId === entry.repoId &&
      metadata.entryId === entry.id &&
      metadata.kind === LEGACY_KIND;
    if (!consistent) {
      throw bindingBlocker(binding, 'The bound runtime artifact and entry metadata are inconsistent', {
        reasonCode: 'artifact-inconsistent',
        artifactHash: entry.artifactHash,
      });
    }
    return artifact;
  }

  private resolveBindingSettings(binding: GenericRunJSBindingSnapshot, entry: LightExtensionEntryRecord) {
    const inputSettings = binding.host.settings;
    if (inputSettings !== null && typeof inputSettings !== 'undefined' && !isRecord(inputSettings)) {
      throw bindingBlocker(binding, 'The FlowModel binding settings must be an object or null', {
        reasonCode: 'settings-shape-invalid',
      });
    }
    try {
      return this.settingsResolver.resolveRuntimeSettings(
        { id: entry.id, settingsSchema: entry.settingsSchema, settingsDefaultsHash: entry.settingsDefaultsHash },
        inputSettings,
      );
    } catch (error) {
      throw bindingBlocker(binding, error instanceof Error ? error.message : 'Runtime settings could not be resolved', {
        reasonCode: 'settings-invalid',
      });
    }
  }

  private async assertRepoSyncIdle(repo: RepoSnapshot): Promise<void> {
    const remotes = await this.db.getRepository('vscFileRemotes').find({
      filter: { repoId: repo.vscRepoId },
      fields: ['id'],
    });
    if (remotes.length === 0) {
      return;
    }
    const blockingCount = await this.db.getRepository('vscFileSyncJobs').count({
      filter: {
        remoteId: { $in: remotes.map((record) => readString(record, 'id')) },
        status: { $in: [...BLOCKING_SYNC_JOB_STATUSES] },
      },
    });
    if (blockingCount > 0) {
      throw migrationBlocked('A generic RunJS repository has a non-idle remote synchronization job', {
        reasonCode: 'active-sync-job',
        repoId: repo.id,
        vscRepoId: repo.vscRepoId,
        blockingJobCount: blockingCount,
      });
    }
  }

  private async assertMixedRepoHasNoActiveRemote(repo: RepoSnapshot): Promise<void> {
    const activeRemoteCount = await this.db.getRepository('vscFileRemotes').count({
      filter: { repoId: repo.vscRepoId, status: 'active' },
    });
    if (activeRemoteCount > 0) {
      throw migrationBlocked(
        'A mixed repository with generic RunJS source has an active remote. In the previous version, push the cleanup first or disconnect the remote, then retry the upgrade.',
        { reasonCode: 'mixed-repo-active-remote', repoId: repo.id, vscRepoId: repo.vscRepoId, activeRemoteCount },
      );
    }
  }

  private async prepareMixedRepoCleanup(
    repo: RepoSnapshot,
    files: CanonicalCandidateFile[],
  ): Promise<PreparedMixedRepoCleanup> {
    if (repo.vscRepository.status !== 'active' || repo.vscRepository.headCommitId !== repo.headCommitId) {
      throw migrationBlocked('Mixed repository metadata and VSC HEAD are not writable at the same commit', {
        reasonCode: 'mixed-repo-head-mismatch',
        repoId: repo.id,
        repoHeadCommitId: repo.headCommitId,
        vscHeadCommitId: repo.vscRepository.headCommitId,
        vscStatus: repo.vscRepository.status,
      });
    }
    const preparedPush = await this.vscFileService.preparePush({
      repoId: repo.vscRepoId,
      baseCommitId: repo.vscRepository.headCommitId,
      message: 'Remove legacy generic RunJS light-extension source',
      files: repo.legacyFiles.map((file) => ({ path: file.path, operation: 'delete' })),
      metadata: { migration: 'remove-generic-runjs' },
    });
    if (preparedPush.candidate.files.some((file) => isLegacyPath(file.path))) {
      throw migrationBlocked('The mixed repository cleanup candidate still contains generic RunJS source', {
        reasonCode: 'legacy-path-remains-in-candidate',
        repoId: repo.id,
      });
    }
    const validation = this.validator.validateWorkspace({ files: preparedPush.candidate.files });
    if (hasErrorDiagnostic(validation.diagnostics)) {
      throw migrationBlocked('The mixed repository is invalid after removing generic RunJS source', {
        reasonCode: 'mixed-repo-validation-failed',
        repoId: repo.id,
        diagnostics: validation.diagnostics,
      });
    }
    this.assertSurvivingEntrySet(repo, validation.entries);
    return {
      preparedPush,
      compileResults: await this.compileSurvivingEntries(repo, preparedPush.candidate.files || files),
    };
  }

  private assertSurvivingEntrySet(repo: RepoSnapshot, validatedEntries: LightExtensionEntryValidationResult[]): void {
    const validatedByIdentity = new Map(validatedEntries.map((entry) => [`${entry.kind}:${entry.entryName}`, entry]));
    if (validatedByIdentity.size !== repo.survivingEntries.length) {
      throw migrationBlocked('The mixed repository surviving entry set does not match persisted metadata', {
        reasonCode: 'surviving-entry-set-mismatch',
        repoId: repo.id,
        persistedCount: repo.survivingEntries.length,
        validatedCount: validatedByIdentity.size,
      });
    }
    for (const snapshot of repo.survivingEntries) {
      const entry = snapshot.entry;
      const validated = validatedByIdentity.get(`${entry.kind}:${entry.entryName}`);
      if (
        !validated ||
        normalizePath(validated.entryPath) !== normalizePath(entry.entryPath) ||
        normalizePath(validated.descriptorPath) !== normalizePath(entry.descriptorPath)
      ) {
        throw migrationBlocked('A surviving entry identity changed in the cleanup candidate', {
          reasonCode: 'surviving-entry-identity-mismatch',
          repoId: repo.id,
          entryId: entry.id,
          kind: entry.kind,
          entryName: entry.entryName,
        });
      }
    }
  }

  private async compileSurvivingEntries(
    repo: RepoSnapshot,
    files: readonly CanonicalCandidateFile[],
  ): Promise<LightExtensionCompileSuccessResult[]> {
    const results: LightExtensionCompileSuccessResult[] = [];
    for (const [ordinal, snapshot] of repo.survivingEntries.entries()) {
      const entry = snapshot.entry;
      if (!isSupportedSurvivingKind(entry.kind)) {
        throw migrationBlocked('The mixed repository contains an unsupported surviving entry kind', {
          reasonCode: 'unsupported-surviving-kind',
          repoId: repo.id,
          entryId: entry.id,
          kind: entry.kind,
        });
      }
      const compileFiles = getEntryCompileFiles(files, entry);
      const compileKey = buildLightExtensionCompileKey({
        entry,
        files: compileFiles,
        runtimeVersion: entry.runtimeVersion || 'v2',
        compilerBuildIdentity: LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
      });
      const compiled = await this.compilerBridge.compileEntry(
        {
          repoId: repo.id,
          entryId: entry.id,
          operation: 'runtimeCompile',
          kind: entry.kind,
          entryName: entry.entryName,
          entryPath: entry.entryPath,
          runtimeVersion: compileKey.inputManifest.runtimeVersion,
          files: compileFiles,
        },
        { requestSource: 'remove-generic-runjs-migration', deferSuccessfulCompileAudit: true },
      );
      if (!compiled.accepted) {
        throw migrationBlocked('A surviving mixed-repository entry could not be compiled', {
          reasonCode: 'surviving-entry-compile-failed',
          repoId: repo.id,
          entryId: entry.id,
          diagnostics: compiled.diagnostics,
          failureCode: compiled.failureCode,
        });
      }
      const artifactHash = buildRunJSArtifactHash({
        code: compiled.artifact.code,
        sourceMap: compiled.artifact.sourceMap,
        version: compiled.artifact.version,
        entryPath: compiled.artifact.entryPath || entry.entryPath,
        runtimeContract: compileKey.inputManifest.runtimeContract,
      });
      results.push({
        jobId: randomUUID(),
        requestId: randomUUID(),
        correlationId: randomUUID(),
        repoId: repo.id,
        entryId: entry.id,
        entryName: entry.entryName,
        ordinal,
        compileKey: compileKey.compileKey,
        filesHash: compileKey.filesHash,
        kind: entry.kind,
        entryPath: entry.entryPath,
        compilerBuildId: LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId,
        inputManifest: compileKey.inputManifest,
        diagnostics: sortDiagnostics(compiled.diagnostics),
        observation: { workerId: 0, threadId: 0, attempt: 1, queueDurationMs: 0, runDurationMs: 0 },
        accepted: true,
        artifact: compiled.artifact,
        artifactHash,
        runtimeCodeHash: buildRunJSRuntimeCodeHash(compiled.artifact.code),
      });
    }
    return results;
  }

  private async apply(
    preflight: MigrationPreflight,
    transaction: Transaction,
  ): Promise<GenericRunJSHardDeleteMigrationResult> {
    let bindingCount = 0;
    for (const model of preflight.models) {
      if (model.bindings.length === 0) {
        continue;
      }
      const record = await this.db.getModel<Model>('flowModels').findByPk(model.uid, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!record) {
        throw migrationBlocked('A FlowModel disappeared after migration preflight', {
          reasonCode: 'flow-model-disappeared',
          modelUid: model.uid,
        });
      }
      if (stableSerialize(readRecord(record, 'options')) !== stableSerialize(model.options)) {
        throw migrationBlocked('A FlowModel changed after migration preflight', {
          reasonCode: 'flow-model-changed',
          modelUid: model.uid,
        });
      }
      const nextOptions = cloneRecord(model.options);
      for (const binding of model.bindings) {
        const currentHost = getAtPath(nextOptions, binding.path);
        if (!isRecord(currentHost) || stableSerialize(currentHost) !== stableSerialize(binding.host)) {
          throw bindingBlocker(binding, 'The FlowModel binding changed after migration preflight', {
            reasonCode: 'binding-changed',
          });
        }
        if (
          typeof binding.inlineCode !== 'string' ||
          typeof binding.inlineVersion !== 'string' ||
          !binding.inlineSettings
        ) {
          throw bindingBlocker(binding, 'The migration preflight did not materialize the runtime value', {
            reasonCode: 'materialized-runtime-missing',
          });
        }
        const nextHost = cloneRecord(binding.host);
        nextHost.code = binding.inlineCode;
        nextHost.version = binding.inlineVersion;
        nextHost.settings = cloneRecord(binding.inlineSettings);
        nextHost.sourceMode = 'inline';
        delete nextHost.sourceBinding;
        delete nextHost.sourceRef;
        setAtPath(nextOptions, binding.path, nextHost);
        bindingCount += 1;
      }
      await record.update({ options: nextOptions }, { transaction, hooks: false });
    }

    const remainingBindings = (await this.scanFlowModels(transaction)).reduce(
      (count, model) => count + model.bindings.length,
      0,
    );
    if (remainingBindings > 0) {
      throw migrationBlocked('Generic RunJS bindings remain after FlowModel conversion', {
        reasonCode: 'binding-rescan-failed',
        remainingBindings,
      });
    }
    if (preflight.genericReferenceIds.length > 0) {
      await this.db.getRepository('lightExtensionReferences').destroy({
        filter: { id: { $in: preflight.genericReferenceIds } },
        transaction,
      });
    }

    for (const repo of preflight.repos) {
      const lockedRepo = await this.db.getModel<Model>('lightExtensionRepos').findByPk(repo.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!lockedRepo) {
        throw migrationBlocked('A light-extension repository disappeared after migration preflight', {
          reasonCode: 'repo-disappeared',
          repoId: repo.id,
        });
      }
      if (
        readString(lockedRepo, 'vscRepoId') !== repo.vscRepoId ||
        readNullableString(lockedRepo, 'headCommitId') !== repo.headCommitId
      ) {
        throw migrationBlocked('A light-extension repository changed after migration preflight', {
          reasonCode: 'repo-changed',
          repoId: repo.id,
        });
      }
      if (repo.survivingEntries.length === 0) {
        await this.vscFileService.archiveRepository({ repoId: repo.vscRepoId }, { transaction });
        await this.db.getRepository('lightExtensionEntries').destroy({ filter: { repoId: repo.id }, transaction });
        await this.db.getRepository('lightExtensionRepos').destroy({ filterByTk: repo.id, transaction });
        continue;
      }
      if (repo.preparedCleanup) {
        const published = await this.vscFileService.publishPreparedPush(repo.preparedCleanup.preparedPush, {
          transaction,
        });
        await lockedRepo.update({ headCommitId: published.commit.id }, { transaction });
        await this.publishCompiledEntries.publishCompiledEntries(
          { commitId: published.commit.id, results: repo.preparedCleanup.compileResults },
          transaction,
        );
      }
    }

    const entryCount = Number(
      (await this.db.getRepository('lightExtensionEntries').destroy({
        filter: { kind: LEGACY_KIND },
        transaction,
      })) || 0,
    );
    let artifactCount = 0;
    const survivingArtifactEntries = await this.db.getRepository('lightExtensionEntries').find({
      fields: ['artifactHash'],
      transaction,
    });
    const survivingArtifactHashes = new Set(
      survivingArtifactEntries.map((record) => readString(record, 'artifactHash')).filter(Boolean),
    );
    const orphanArtifactHashes = preflight.artifactHashes.filter(
      (artifactHash) => artifactHash && !survivingArtifactHashes.has(artifactHash),
    );
    for (const artifactHashBatch of chunkValues(orphanArtifactHashes, ARTIFACT_GC_BATCH_SIZE)) {
      artifactCount += Number(
        (await this.db.getRepository('lightExtensionRuntimeArtifacts').destroy({
          filter: { artifactHash: { $in: artifactHashBatch } },
          transaction,
        })) || 0,
      );
    }
    return {
      bindingCount,
      repoCount: preflight.repos.length,
      entryCount,
      referenceCount: preflight.genericReferenceIds.length,
      artifactCount,
      changed:
        bindingCount > 0 ||
        preflight.repos.length > 0 ||
        entryCount > 0 ||
        preflight.genericReferenceIds.length > 0 ||
        artifactCount > 0,
    };
  }

  private async scanFlowModels(transaction?: Transaction): Promise<FlowModelSnapshot[]> {
    const [records, entryModels] = await Promise.all([
      this.db.getRepository('flowModels').find({
        fields: ['uid', 'options'],
        sort: ['uid'],
        transaction,
      }),
      this.db.getRepository('lightExtensionEntries').find({
        fields: ['id', 'kind'],
        transaction,
      }),
    ]);
    const entryKindsById = new Map(entryModels.map((record) => [readString(record, 'id'), readString(record, 'kind')]));
    return records.map((record) => {
      const uid = readString(record, 'uid');
      const options = readRecord(record, 'options');
      return { uid, options: cloneRecord(options), bindings: collectBindings(uid, options, entryKindsById) };
    });
  }
}

class MigrationNoopAuditService extends LightExtensionAuditService {
  async recordRawResourceDenied(_input: LightExtensionRawResourceDeniedAuditInput): Promise<void> {}
  async recordLifecycleEvent(_input: LightExtensionLifecycleAuditInput): Promise<void> {}
  async recordFileWrite(_input: LightExtensionFileWriteAuditInput): Promise<void> {}
  async recordCompileEvent(_input: LightExtensionCompileAuditInput): Promise<void> {}
  async recordReferenceEvent(_input: LightExtensionReferenceAuditInput): Promise<void> {}
  async recordSyncEvent(_input: LightExtensionSyncAuditInput): Promise<void> {}
}

function collectBindings(
  modelUid: string,
  options: JsonRecord,
  entryKindsById: ReadonlyMap<string, string>,
): GenericRunJSBindingSnapshot[] {
  const bindings: GenericRunJSBindingSnapshot[] = [];
  walkJson(options, [], (value, path) => {
    if (value.sourceMode !== 'light-extension') {
      return;
    }
    if (!isRecord(value.sourceBinding)) {
      throw malformedBindingBlocker(modelUid, path, 'A light-extension source binding must be an object', {
        reasonCode: 'binding-shape-invalid',
      });
    }
    const sourceBinding = value.sourceBinding;
    const entryId = optionalBindingString(sourceBinding, 'entryId');
    const bindingKind = optionalBindingString(sourceBinding, 'kind');
    const persistedEntryKind = entryId ? entryKindsById.get(entryId) : undefined;
    if (isSupportedSurvivingKind(bindingKind)) {
      if (persistedEntryKind && persistedEntryKind !== bindingKind) {
        throw malformedBindingBlocker(modelUid, path, 'The light-extension binding kind does not match its entry', {
          reasonCode: 'binding-kind-mismatch',
          bindingKind,
          entryId,
          persistedEntryKind,
        });
      }
      return;
    }
    if (!bindingKind && isSupportedSurvivingKind(persistedEntryKind || '')) {
      return;
    }
    if (bindingKind !== LEGACY_KIND) {
      throw malformedBindingBlocker(modelUid, path, 'A light-extension source binding cannot be classified safely', {
        reasonCode: 'binding-kind-invalid',
        bindingKind: bindingKind || null,
        entryId: entryId || null,
        persistedEntryKind: persistedEntryKind || null,
      });
    }
    if (sourceBinding.type !== 'light-extension-entry') {
      throw malformedBindingBlocker(modelUid, path, 'Generic RunJS binding type is invalid', {
        reasonCode: 'binding-type-invalid',
        bindingType: optionalBindingString(sourceBinding, 'type') || null,
      });
    }
    bindings.push({
      modelUid,
      path: [...path],
      pathLabel: formatPath(path),
      host: cloneRecord(value),
      repoId: requiredBindingString(modelUid, path, sourceBinding, 'repoId'),
      entryId: requiredBindingString(modelUid, path, sourceBinding, 'entryId'),
      entryPath: requiredBindingString(modelUid, path, sourceBinding, 'entryPath'),
    });
  });
  return bindings;
}

function optionalBindingString(binding: JsonRecord, key: string): string {
  const value = binding[key];
  return typeof value === 'string' ? value.trim() : '';
}

function malformedBindingBlocker(
  modelUid: string,
  path: JsonPath,
  message: string,
  details: JsonRecord,
): LightExtensionError {
  return migrationBlocked(message, {
    ...details,
    modelUid,
    path: formatPath(path),
  });
}

function walkJson(value: unknown, path: JsonPath, visit: (record: JsonRecord, path: JsonPath) => void): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkJson(item, [...path, index], visit));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  visit(value, path);
  for (const [key, child] of Object.entries(value)) {
    if (!UNSAFE_PATH_SEGMENTS.has(key)) {
      walkJson(child, [...path, key], visit);
    }
  }
}

function requiredBindingString(modelUid: string, path: JsonPath, binding: JsonRecord, key: string): string {
  const value = binding[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  throw migrationBlocked(`Generic RunJS binding ${key} is missing`, {
    reasonCode: 'binding-field-missing',
    modelUid,
    path: formatPath(path),
    field: key,
  });
}

function getEntryCompileFiles(files: readonly CanonicalCandidateFile[], entry: LightExtensionEntryRecord) {
  const entryRoot = pathPosix.dirname(normalizePath(entry.entryPath));
  return files
    .filter(
      (file) =>
        normalizePath(file.path) !== normalizePath(entry.descriptorPath) &&
        (normalizePath(file.path) === entryRoot ||
          normalizePath(file.path).startsWith(`${entryRoot}/`) ||
          normalizePath(file.path).startsWith('src/shared/')),
    )
    .map((file) => ({
      path: file.path,
      content: file.content,
      blobHash: file.blobHash,
      language: file.language,
      mode: file.mode,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function isSupportedSurvivingKind(kind: string): kind is keyof typeof LIGHT_EXTENSION_AUTHORING_SURFACES {
  return Object.prototype.hasOwnProperty.call(LIGHT_EXTENSION_AUTHORING_SURFACES, kind);
}

function groupEntries(entries: EntrySnapshot[]): Map<string, EntrySnapshot[]> {
  const grouped = new Map<string, EntrySnapshot[]>();
  for (const entry of entries) {
    const current = grouped.get(entry.entry.repoId) || [];
    current.push(entry);
    grouped.set(entry.entry.repoId, current);
  }
  return grouped;
}

function chunkValues<T>(values: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function isKnownGenericReference(record: Model): boolean {
  return readString(record, 'kind') === LEGACY_KIND && readString(record, 'ownerKind') === LEGACY_OWNER_KIND;
}

function hasLegacyState(state: GenericRunJSLegacyState): boolean {
  return Object.values(state).some((count) => count > 0);
}

function emptyLegacyState(): GenericRunJSLegacyState {
  return {
    bindingCount: 0,
    entryCount: 0,
    referenceCount: 0,
    unknownReferenceCount: 0,
    orphanArtifactCount: 0,
    legacyHeadPathCount: 0,
    orphanLegacyVscRepoCount: 0,
  };
}

function emptyResult(): GenericRunJSHardDeleteMigrationResult {
  return { bindingCount: 0, repoCount: 0, entryCount: 0, referenceCount: 0, artifactCount: 0, changed: false };
}

function isLegacyPath(path: string): boolean {
  const normalized = normalizePath(path);
  return normalized === LEGACY_ENTRY_ROOT || normalized.startsWith(`${LEGACY_ENTRY_ROOT}/`);
}

function normalizePath(path: string): string {
  return pathPosix.normalize(String(path || '').trim()).replace(/^\.\/+/, '');
}

function toCanonicalFile(file: {
  path: string;
  blobHash: string;
  size: number;
  mode: string;
  language: string;
  content?: string;
}): CanonicalCandidateFile {
  if (typeof file.content !== 'string') {
    throw migrationBlocked('A VSC HEAD file could not be read during generic RunJS migration preflight', {
      reasonCode: 'vsc-file-unreadable',
      path: file.path,
    });
  }
  return Object.freeze({ ...file, content: file.content });
}

function vscRepositoryFromModel(record: Model): VscRepositoryRecord {
  return {
    id: readString(record, 'id'),
    ownerType: readString(record, 'ownerType'),
    ownerId: readString(record, 'ownerId'),
    name: readString(record, 'name'),
    status: readString(record, 'status') as VscRepositoryRecord['status'],
    defaultRef: readString(record, 'defaultRef') as VscRepositoryRecord['defaultRef'],
    headCommitId: readNullableString(record, 'headCommitId'),
    headSeq: Number(record.get('headSeq') || 0),
  };
}

function readString(record: Model, key: string): string {
  const value = record.get(key);
  return typeof value === 'string' ? value : '';
}

function readNullableString(record: Model, key: string): string | null {
  const value = record.get(key);
  return typeof value === 'string' && value ? value : null;
}

function readRecord(record: Model, key: string): JsonRecord {
  const value = record.get(key);
  return isRecord(value) ? value : {};
}

function cloneRecord(value: JsonRecord): JsonRecord {
  return JSON.parse(JSON.stringify(value)) as JsonRecord;
}

function getAtPath(root: unknown, path: JsonPath): unknown {
  let current = root;
  for (const segment of path) {
    if (typeof segment === 'string' && UNSAFE_PATH_SEGMENTS.has(segment)) {
      return undefined;
    }
    if (Array.isArray(current) && typeof segment === 'number') {
      current = current[segment];
      continue;
    }
    if (!isRecord(current) || typeof segment !== 'string') {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function setAtPath(root: JsonRecord, path: JsonPath, value: unknown): void {
  if (path.length === 0) {
    throw migrationBlocked('A generic RunJS binding cannot replace the FlowModel options root', {
      reasonCode: 'invalid-root-binding',
    });
  }
  const parent = getAtPath(root, path.slice(0, -1));
  const last = path[path.length - 1];
  if (Array.isArray(parent) && typeof last === 'number') {
    parent[last] = value;
    return;
  }
  if (!isRecord(parent) || typeof last !== 'string' || UNSAFE_PATH_SEGMENTS.has(last)) {
    throw migrationBlocked('A generic RunJS binding path is no longer writable', {
      reasonCode: 'binding-path-unwritable',
      path: formatPath(path),
    });
  }
  parent[last] = value;
}

function formatPath(path: JsonPath): string {
  if (path.length === 0) {
    return '$.options';
  }
  return `$.options${path.map((segment) => (typeof segment === 'number' ? `[${segment}]` : `.${segment}`)).join('')}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function bindingBlocker(
  binding: GenericRunJSBindingSnapshot,
  message: string,
  details: JsonRecord,
): LightExtensionError {
  return migrationBlocked(message, {
    ...details,
    modelUid: binding.modelUid,
    path: binding.pathLabel,
    repoId: binding.repoId,
    entryId: binding.entryId,
    entryPath: binding.entryPath,
  });
}

function migrationBlocked(message: string, details: JsonRecord): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', message, {
    status: 409,
    details: { migration: 'remove-generic-runjs', ...details },
  });
}
