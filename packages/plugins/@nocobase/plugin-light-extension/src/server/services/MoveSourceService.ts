/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import type {
  RunJSLegacySource,
  RunJSSourceAdapter,
  RunJSSourceAdapterContext,
  RunJSSourceAdapterRegistry,
  RunJSSourceLocator,
} from '../vsc-file/public-api';
import { buildRunJSSourceRepositoryIdentity, isVscError } from '../vsc-file/public-api';
import type { RunJSExternalSourceBinding, RunJSRuntimeWriteResult } from '@nocobase/server';
import ts from 'typescript';
import { posix as pathPosix } from 'path';
import { createHash, randomUUID } from 'crypto';
import { uid } from '@nocobase/utils';

import {
  LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../constants';
import { createLightExtensionBaseTemplate } from '../../shared/default-template';
import { isLightExtensionError, LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionEntryRecord,
  LightExtensionFileChange,
  LightExtensionMoveSourceInput,
  LightExtensionMoveSourceOriginBinding,
  LightExtensionMoveSourceResult,
  LightExtensionMoveSourceWorkspaceFile,
  LightExtensionRuntimeSourceBinding,
} from '../../shared/types';
import { LightExtensionEntryService } from './LightExtensionEntryService';
import { LightExtensionFileService } from './LightExtensionFileService';
import { getReferenceOwnerAdapterByUse } from './ReferenceOwnerRegistry';
import type { ReferenceService } from './ReferenceService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRepoService } from './LightExtensionRepoService';
import {
  LightExtensionRuntimeCompileService,
  type LightExtensionPreparedSave,
} from './LightExtensionRuntimeCompileService';

const RUNJS_MANIFEST_PATH = '.nocobase/runjs-source.json';
const INLINE_ENTRY_DESCRIPTOR_PATH = 'src/client/entry.json';
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const;
const RESOLVABLE_EXTENSIONS = [...CODE_EXTENSIONS, '.json'] as const;
const MOVE_OPERATION_STALE_AFTER_MS = 15 * 60 * 1000;

const ENTRY_ROOTS: Record<LightExtensionKind, string> = {
  'js-block': 'src/client/js-blocks',
  'js-page': 'src/client/js-pages',
  'js-field': 'src/client/js-fields',
  'js-action': 'src/client/js-actions',
  'js-item': 'src/client/js-items',
};

export interface MoveSourceServiceContext extends LightExtensionServiceContext {
  adapterContext: RunJSSourceAdapterContext;
}

type AdapterRegistryProvider = () => RunJSSourceAdapterRegistry | null;

interface MoveSourceOperationReservation {
  identityHash: string;
  attemptId: string;
}

interface MoveSourceOperationResolution {
  reservation?: MoveSourceOperationReservation;
  replayResult?: LightExtensionMoveSourceResult;
}

interface MoveSourceSourceSnapshotInput {
  locator: RunJSSourceLocator;
  sourceRepoId: string;
  sourceHeadCommitId: string | null;
  expectedOwnerFingerprint: string;
}

export interface MoveSourceSourceSnapshotValidator {
  assertCurrent(input: MoveSourceSourceSnapshotInput, transaction?: Transaction): Promise<void>;
}

export class PersistentMoveSourceSnapshotValidator implements MoveSourceSourceSnapshotValidator {
  constructor(private readonly db: Database) {}

  async assertCurrent(input: MoveSourceSourceSnapshotInput, transaction?: Transaction): Promise<void> {
    const repository = await this.db.getRepository('vscFileRepositories').findOne({
      filterByTk: input.sourceRepoId,
      transaction,
    });
    if (!repository) {
      throw sourceSnapshotOutdated(input, null);
    }

    const identity = buildRunJSSourceRepositoryIdentity(input.locator);
    if (
      repository.get('ownerType') !== identity.ownerType ||
      repository.get('ownerId') !== identity.ownerId ||
      repository.get('name') !== identity.name
    ) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_PERMISSION_DENIED',
        'RunJS source repository belongs to another host',
        { details: { sourceRepoId: input.sourceRepoId } },
      );
    }

    const currentHeadCommitId = readNullableModelString(repository, 'headCommitId');
    if (currentHeadCommitId !== input.sourceHeadCommitId || repository.get('status') === 'archived') {
      throw sourceSnapshotOutdated(input, currentHeadCommitId);
    }
    if (!input.sourceHeadCommitId) {
      return;
    }

    const commit = await this.db.getRepository('vscFileCommits').findOne({
      filter: {
        id: input.sourceHeadCommitId,
        repoId: input.sourceRepoId,
      },
      transaction,
    });
    if (!commit) {
      throw sourceSnapshotOutdated(input, currentHeadCommitId);
    }
    const metadata = commit.get('metadata');
    const headOwnerFingerprint = isRecord(metadata) ? metadata.ownerFingerprint : undefined;
    if (
      typeof headOwnerFingerprint === 'string' &&
      headOwnerFingerprint &&
      headOwnerFingerprint !== input.expectedOwnerFingerprint
    ) {
      throw sourceSnapshotOutdated(input, currentHeadCommitId);
    }
  }
}

type ExternalBindingAdapter = RunJSSourceAdapter & {
  writeExternalBinding: (input: {
    locator: RunJSSourceLocator;
    binding: RunJSExternalSourceBinding;
    baseOwnerFingerprint: string;
    ctx: RunJSSourceAdapterContext;
  }) => Promise<RunJSRuntimeWriteResult> | RunJSRuntimeWriteResult;
};

export class MoveSourceService {
  constructor(
    private readonly db: Database,
    private readonly repoService: LightExtensionRepoService,
    private readonly fileService: LightExtensionFileService,
    private readonly entryService: LightExtensionEntryService,
    private readonly runtimeCompileService: LightExtensionRuntimeCompileService,
    private readonly referenceService: ReferenceService,
    private readonly getAdapterRegistry: AdapterRegistryProvider,
    private readonly applicationName = 'main',
    private readonly sourceSnapshotValidator: MoveSourceSourceSnapshotValidator = new PersistentMoveSourceSnapshotValidator(
      db,
    ),
  ) {}

  async moveSource(
    input: LightExtensionMoveSourceInput,
    ctx: MoveSourceServiceContext,
  ): Promise<LightExtensionMoveSourceResult> {
    let operation: MoveSourceOperationReservation | undefined;
    try {
      assertMoveSourceInputSupported(input);
      const completedResult = await this.findCompletedMoveOperation(input);
      if (completedResult) {
        await this.assertCanReplayMoveSource(input, ctx);
        return completedResult;
      }
      await this.assertCanStartMoveSource(input, ctx);
      const operationResolution = await this.reserveMoveOperation(input);
      if (operationResolution.replayResult) {
        return operationResolution.replayResult;
      }
      operation = operationResolution.reservation;
      if (input.destination.type === 'default') {
        const defaultRepo = await this.repoService.getOrCreateApplicationDefaultRepo(this.applicationName, ctx);
        return await this.moveSourceToExistingRepo(
          {
            ...input,
            destination: { type: 'existing', repoId: defaultRepo.id },
          },
          ctx,
          operation,
        );
      }
      if (input.destination.type === 'existing') {
        return await this.moveSourceToExistingRepo(input, ctx, operation);
      }
      return await this.db.sequelize.transaction(async (transaction) => {
        const result = await this.moveSourceInTransaction(input, ctx, transaction);
        await this.completeMoveOperation(operation, result, transaction);
        return result;
      });
    } catch (error) {
      await this.failMoveOperation(operation, error);
      throw normalizeMoveSourceError(error);
    }
  }

  private async assertCanStartMoveSource(
    input: LightExtensionMoveSourceInput,
    ctx: MoveSourceServiceContext,
  ): Promise<void> {
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }
    const adapter = registry.require(input.locator.kind);
    if (!supportsExternalBinding(adapter)) {
      throw unsupportedLocator(input.locator);
    }
    const adapterContext: RunJSSourceAdapterContext = { ...ctx.adapterContext };
    await adapter.assertCanWrite({ locator: input.locator, ctx: adapterContext });
    const legacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, legacy.ownerFingerprint);
    await this.sourceSnapshotValidator.assertCurrent(toSourceSnapshotInput(input));
  }

  private async assertCanReplayMoveSource(
    input: LightExtensionMoveSourceInput,
    ctx: MoveSourceServiceContext,
  ): Promise<void> {
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }
    const adapter = registry.require(input.locator.kind);
    if (!supportsExternalBinding(adapter)) {
      throw unsupportedLocator(input.locator);
    }
    await adapter.assertCanWrite({ locator: input.locator, ctx: { ...ctx.adapterContext } });
  }

  private async moveSourceToExistingRepo(
    input: LightExtensionMoveSourceInput,
    ctx: MoveSourceServiceContext,
    operation?: MoveSourceOperationReservation,
  ): Promise<LightExtensionMoveSourceResult> {
    if (input.destination.type !== 'existing') {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'Existing light extension destination is required',
      );
    }
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }
    const adapter = registry.require(input.locator.kind);
    if (!supportsExternalBinding(adapter)) {
      throw unsupportedLocator(input.locator);
    }
    const prepareAdapterContext: RunJSSourceAdapterContext = { ...ctx.adapterContext };
    await adapter.assertCanWrite({ locator: input.locator, ctx: prepareAdapterContext });
    const legacy = await adapter.readLegacy({ locator: input.locator, ctx: prepareAdapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, legacy.ownerFingerprint);
    const kind = resolveLightExtensionKind(input.locator, legacy);
    const originSettingsSchema = await this.loadOriginSettingsSchema(input.originBinding, kind, ctx);
    const entryFiles = relocateRunJSWorkspace({
      files: input.files,
      entryPath: input.entryPath,
      kind,
      entryName: input.entryName,
      entryTitle: input.entryTitle,
      category: resolveMovedEntryCategory(kind, legacy),
      settingsSchema: originSettingsSchema,
    });
    const entryKey = getRelocatedEntryKey(entryFiles, kind, input.entryName);
    await this.repoService.assertApplicationOwnership(input.destination.repoId, this.applicationName, ctx);
    const current = await this.fileService.pull({
      repoId: input.destination.repoId,
      includeContent: 'none',
    });
    assertDestinationRepoEnabled(current.repo);
    this.assertDestinationEntryAvailable(
      input.destination.repoId,
      kind,
      input.entryName,
      entryKey,
      entryFiles,
      current.files || [],
      await this.entryService.listEntries(input.destination.repoId),
    );
    const prepared = await this.runtimeCompileService.prepareSaveSource(
      {
        repoId: input.destination.repoId,
        expectedHeadCommitId: current.commit?.id || null,
        message: buildMoveCommitMessage(input),
        files: entryFiles,
      },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'light-extension-move-source',
      },
    );
    return this.db.sequelize.transaction(async (transaction) => {
      const result = await this.publishExistingMove(input, ctx, adapter, kind, entryKey, prepared, transaction);
      await this.completeMoveOperation(operation, result, transaction);
      return result;
    });
  }

  private async findCompletedMoveOperation(
    input: LightExtensionMoveSourceInput,
  ): Promise<LightExtensionMoveSourceResult | undefined> {
    if (!input.idempotencyKey) {
      return undefined;
    }
    const applicationName = this.applicationName.trim();
    if (!applicationName) {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Application identity is required');
    }
    const identityHash = hashMoveOperation({
      action: 'move-source',
      applicationName,
      idempotencyKey: input.idempotencyKey,
    });
    const record = await this.db.getRepository('lightExtensionMoveOperations').model.findOne({
      where: { identityHash },
    });
    if (!record) {
      return undefined;
    }
    const requestHash = hashMoveOperation({ ...input, idempotencyKey: undefined });
    if (readModelString(record, 'requestHash') !== requestHash) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_IDEMPOTENCY_CONFLICT',
        'Move source idempotency key was already used with a different request',
      );
    }
    return readModelString(record, 'status') === 'completed'
      ? readMoveSourceOperationResult(record.get('result'))
      : undefined;
  }

  private async reserveMoveOperation(input: LightExtensionMoveSourceInput): Promise<MoveSourceOperationResolution> {
    if (!input.idempotencyKey) {
      return {};
    }
    const applicationName = this.applicationName.trim();
    if (!applicationName) {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Application identity is required');
    }
    const identityHash = hashMoveOperation({
      action: 'move-source',
      applicationName,
      idempotencyKey: input.idempotencyKey,
    });
    const requestHash = hashMoveOperation({ ...input, idempotencyKey: undefined });
    const attemptId = randomUUID();
    const operationRepository = this.db.getRepository('lightExtensionMoveOperations');
    const [record, created] = await operationRepository.model.findOrCreate({
      where: { identityHash },
      defaults: {
        id: `lemo_${uid()}`,
        identityHash,
        applicationName,
        idempotencyKey: input.idempotencyKey,
        requestHash,
        attemptId,
        status: 'pending',
      },
    });
    if (created) {
      return { reservation: { identityHash, attemptId } };
    }
    if (readModelString(record, 'requestHash') !== requestHash) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_IDEMPOTENCY_CONFLICT',
        'Move source idempotency key was already used with a different request',
      );
    }
    if (readModelString(record, 'status') === 'completed') {
      return { replayResult: readMoveSourceOperationResult(record.get('result')) };
    }

    const storedAttemptId = readModelString(record, 'attemptId');
    const status = readModelString(record, 'status');
    if (status !== 'failed' && !isMoveOperationStale(record.get('updatedAt'))) {
      throw moveOperationInProgress();
    }
    const [claimed] = await operationRepository.model.update(
      {
        attemptId,
        status: 'pending',
        result: null,
        errorCode: null,
      },
      {
        where: {
          identityHash,
          attemptId: storedAttemptId,
          status,
        },
      },
    );
    if (claimed !== 1) {
      throw moveOperationInProgress();
    }
    return { reservation: { identityHash, attemptId } };
  }

  private async completeMoveOperation(
    operation: MoveSourceOperationReservation | undefined,
    result: LightExtensionMoveSourceResult,
    transaction: Transaction,
  ): Promise<void> {
    if (!operation) {
      return;
    }
    const [completed] = await this.db.getRepository('lightExtensionMoveOperations').model.update(
      {
        status: 'completed',
        result,
        errorCode: null,
      },
      {
        where: {
          identityHash: operation.identityHash,
          attemptId: operation.attemptId,
          status: 'pending',
        },
        transaction,
      },
    );
    if (completed !== 1) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Move source operation could not persist its completed result',
      );
    }
  }

  private async failMoveOperation(
    operation: MoveSourceOperationReservation | undefined,
    error: unknown,
  ): Promise<void> {
    if (!operation) {
      return;
    }
    try {
      await this.db.getRepository('lightExtensionMoveOperations').model.update(
        {
          status: 'failed',
          errorCode: getMoveOperationErrorCode(error),
        },
        {
          where: {
            identityHash: operation.identityHash,
            attemptId: operation.attemptId,
            status: 'pending',
          },
        },
      );
    } catch {
      // Preserve the original move failure if the best-effort operation status update also fails.
    }
  }

  private async publishExistingMove(
    input: LightExtensionMoveSourceInput,
    ctx: MoveSourceServiceContext,
    adapter: ExternalBindingAdapter,
    kind: LightExtensionKind,
    entryKey: string,
    prepared: LightExtensionPreparedSave,
    transaction: Transaction,
  ): Promise<LightExtensionMoveSourceResult> {
    const adapterContext: RunJSSourceAdapterContext = { ...ctx.adapterContext, transaction };
    const serviceContext: LightExtensionServiceContext = { ...ctx, transaction };
    await adapter.assertCanWrite({ locator: input.locator, ctx: adapterContext });
    const currentLegacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, currentLegacy.ownerFingerprint);
    await this.sourceSnapshotValidator.assertCurrent(toSourceSnapshotInput(input), transaction);
    const saved = await this.runtimeCompileService.publishPreparedSave(prepared, serviceContext);
    const entry = await this.requireEntry(saved.repo.id, kind, entryKey, serviceContext);
    const binding = buildSourceBinding(saved.repo, entry, kind);
    const writeResult = await adapter.writeExternalBinding({
      locator: input.locator,
      binding: { sourceMode: 'light-extension', sourceBinding: { ...binding } },
      baseOwnerFingerprint: input.expectedOwnerFingerprint,
      ctx: adapterContext,
    });
    const ownerFingerprint =
      writeResult.ownerFingerprint || (await adapter.getFingerprint({ locator: input.locator, ctx: adapterContext }));
    await this.referenceService.syncFlowModelReferencesForNodeTree(
      { rootUid: getFlowModelUid(input.locator), action: 'lightExtensions.moveSource' },
      serviceContext,
    );
    return { repo: saved.repo, entry, binding, ownerFingerprint };
  }

  private assertDestinationEntryAvailable(
    repoId: string,
    kind: LightExtensionKind,
    entryDirectory: string,
    entryKey: string,
    entryFiles: LightExtensionFileChange[],
    currentFiles: Array<{ path: string }>,
    entries: LightExtensionEntryRecord[],
  ): void {
    const entryRoot = getEntryRoot(kind, entryDirectory);
    if (currentFiles.some((file) => file.path === entryRoot || file.path.startsWith(`${entryRoot}/`))) {
      throw entryConflict(repoId, kind, entryDirectory);
    }
    if (entries.some((entry) => entry.kind === kind && entry.entryName === entryKey)) {
      throw entryConflict(repoId, kind, entryKey);
    }
    if (!entryFiles.some((file) => file.path.startsWith(`${entryRoot}/`))) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Moved entry workspace is incomplete');
    }
  }

  private async moveSourceInTransaction(
    input: LightExtensionMoveSourceInput,
    ctx: MoveSourceServiceContext,
    transaction: Transaction,
  ): Promise<LightExtensionMoveSourceResult> {
    if (input.destination.type !== 'new') {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'New light extension destination is required');
    }
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }

    const adapter = registry.require(input.locator.kind);
    if (!supportsExternalBinding(adapter)) {
      throw unsupportedLocator(input.locator);
    }

    const adapterContext: RunJSSourceAdapterContext = {
      ...ctx.adapterContext,
      transaction,
    };
    const serviceContext: LightExtensionServiceContext = {
      ...ctx,
      transaction,
    };

    await adapter.assertCanWrite({ locator: input.locator, ctx: adapterContext });
    const legacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, legacy.ownerFingerprint);
    await this.sourceSnapshotValidator.assertCurrent(toSourceSnapshotInput(input), transaction);

    const kind = resolveLightExtensionKind(input.locator, legacy);
    const category = resolveMovedEntryCategory(kind, legacy);
    const originSettingsSchema = await this.loadOriginSettingsSchema(input.originBinding, kind, serviceContext);
    const entryFiles = relocateRunJSWorkspace({
      files: input.files,
      entryPath: input.entryPath,
      kind,
      entryName: input.entryName,
      entryTitle: input.entryTitle,
      category,
      settingsSchema: originSettingsSchema,
    });
    const entryKey = getRelocatedEntryKey(entryFiles, kind, input.entryName);
    const commitMessage = buildMoveCommitMessage(input);

    const repo = await this.createDestinationRepo(input, entryFiles, commitMessage, serviceContext);

    const entry = await this.requireEntry(repo.id, kind, entryKey, serviceContext);
    const binding = buildSourceBinding(repo, entry, kind);
    const writeResult = await adapter.writeExternalBinding({
      locator: input.locator,
      binding: {
        sourceMode: 'light-extension',
        sourceBinding: { ...binding },
      },
      baseOwnerFingerprint: input.expectedOwnerFingerprint,
      ctx: adapterContext,
    });
    const ownerFingerprint =
      writeResult.ownerFingerprint || (await adapter.getFingerprint({ locator: input.locator, ctx: adapterContext }));

    await this.referenceService.syncFlowModelReferencesForNodeTree(
      {
        rootUid: getFlowModelUid(input.locator),
        action: 'lightExtensions.moveSource',
      },
      serviceContext,
    );

    return {
      repo,
      entry,
      binding,
      ownerFingerprint,
    };
  }

  private async createDestinationRepo(
    input: LightExtensionMoveSourceInput,
    entryFiles: LightExtensionFileChange[],
    commitMessage: string,
    ctx: LightExtensionServiceContext,
  ) {
    if (input.destination.type !== 'new') {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'New light extension destination is required');
    }

    const repo = await this.repoService.createRepo(
      {
        name: input.destination.name,
        title: input.destination.title,
        description: input.destination.description,
        initialFiles: [...createLightExtensionBaseTemplate(), ...entryFiles.map(toInitialTreeEntry)],
        message: commitMessage,
      },
      ctx,
    );
    if (!repo.headCommitId) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Created light extension has no source commit');
    }

    const compiled = await this.runtimeCompileService.compileCurrentRuntime(repo.id, repo.headCommitId, {
      ...ctx,
      requestSource: ctx.requestSource || 'light-extension-move-source',
    });
    return compiled.repo;
  }

  private async requireEntry(
    repoId: string,
    kind: LightExtensionKind,
    entryName: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionEntryRecord> {
    const entries = await this.entryService.listEntries(repoId, ctx);
    const entry = entries.find(
      (candidate) => candidate.kind === kind && candidate.entryName === entryName && candidate.healthStatus === 'ready',
    );
    if (!entry) {
      throw new LightExtensionError('LIGHT_EXTENSION_ENTRY_NOT_FOUND', 'Moved light extension entry was not created', {
        details: { repoId, kind, entryName },
      });
    }
    return entry;
  }

  private async loadOriginSettingsSchema(
    originBinding: LightExtensionMoveSourceOriginBinding | undefined,
    kind: LightExtensionKind,
    ctx: LightExtensionServiceContext,
  ): Promise<Record<string, unknown> | null> {
    if (!originBinding || originBinding.kind !== kind) {
      return null;
    }
    try {
      const originEntry = await this.entryService.getEntry(originBinding.entryId, ctx);
      if (originEntry.repoId !== originBinding.repoId || originEntry.kind !== kind) {
        return null;
      }
      return originEntry.settingsSchema;
    } catch (error) {
      if (isLightExtensionError(error) && error.code === 'LIGHT_EXTENSION_ENTRY_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }
}

function assertDestinationRepoEnabled(repo: LightExtensionMoveSourceResult['repo']): void {
  if (repo.lifecycleStatus === 'enabled') {
    return;
  }
  if (repo.lifecycleStatus === 'archived') {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_REPO_ARCHIVED',
      'Archived light extension repositories cannot receive moved source',
      { details: { repoId: repo.id, lifecycleStatus: repo.lifecycleStatus } },
    );
  }
  throw new LightExtensionError(
    'LIGHT_EXTENSION_REPO_DISABLED',
    'Disabled light extension repositories cannot receive moved source',
    { details: { repoId: repo.id, lifecycleStatus: repo.lifecycleStatus } },
  );
}

export function relocateRunJSWorkspace(input: {
  files: LightExtensionMoveSourceWorkspaceFile[];
  entryPath: string;
  kind: LightExtensionKind;
  entryName: string;
  entryTitle?: string | null;
  category?: string | null;
  settingsSchema?: Record<string, unknown> | null;
}): LightExtensionFileChange[] {
  if (!LIGHT_EXTENSION_ENTRY_KEY_PATTERN.test(input.entryName)) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Entry name must be a lowercase slug');
  }

  const sourceFiles = input.files
    .map((file) => ({ ...file, path: normalizeWorkspacePath(file.path) }))
    .filter((file) => file.path !== RUNJS_MANIFEST_PATH);
  const normalizedEntryPath = normalizeWorkspacePath(input.entryPath);
  const entryFile = sourceFiles.find((file) => file.path === normalizedEntryPath);
  const entryExtension = pathPosix.extname(normalizedEntryPath).toLowerCase();
  if (!entryFile || !CODE_EXTENSIONS.includes(entryExtension as (typeof CODE_EXTENSIONS)[number])) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS workspace entry file is invalid', {
      details: { entryPath: normalizedEntryPath },
    });
  }

  const sourceBasePath = pathPosix.dirname(normalizedEntryPath);
  const relocatableFiles = sourceFiles.filter(
    (file) => file.path !== `${sourceBasePath}/meta.json` && file.path !== `${sourceBasePath}/settings.json`,
  );
  const entryRoot = getEntryRoot(input.kind, input.entryName);
  const targetBySource = new Map<string, string>();
  const targetPaths = new Set<string>();

  for (const file of relocatableFiles) {
    const targetPath =
      file.path === normalizedEntryPath
        ? `${entryRoot}/index${entryExtension}`
        : file.path === INLINE_ENTRY_DESCRIPTOR_PATH
          ? `${entryRoot}/entry.json`
          : buildRelocatedPath(entryRoot, sourceBasePath, file.path);
    if (targetPaths.has(targetPath)) {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS workspace files collide after relocation', {
        details: { path: targetPath },
      });
    }
    targetPaths.add(targetPath);
    targetBySource.set(file.path, targetPath);
  }

  const relocated = relocatableFiles.map<LightExtensionFileChange>((file) => {
    const targetPath = targetBySource.get(file.path);
    if (!targetPath) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'RunJS workspace relocation failed');
    }
    return {
      path: targetPath,
      content: rewriteRelativeImports(file.content, file.path, targetPath, targetBySource),
      language: file.language,
      mode: file.mode,
      operation: 'upsert',
    };
  });

  upsertEntryDescriptor(
    relocated,
    entryRoot,
    input.entryName,
    input.entryTitle?.trim() || null,
    input.category?.trim() || null,
    input.settingsSchema || null,
  );

  return relocated;
}

export function rewriteRelativeImports(
  content: string,
  sourcePath: string,
  targetPath: string,
  targetBySource: Map<string, string>,
): string {
  if (!CODE_EXTENSIONS.includes(pathPosix.extname(sourcePath).toLowerCase() as (typeof CODE_EXTENSIONS)[number])) {
    return content;
  }

  const sourceFile = ts.createSourceFile(sourcePath, content, ts.ScriptTarget.Latest, true);
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith('.')) {
        const importedSourcePath = resolveImportedSourcePath(sourcePath, specifier, targetBySource);
        const importedTargetPath = importedSourcePath ? targetBySource.get(importedSourcePath) : undefined;
        if (importedTargetPath) {
          replacements.push({
            start: node.moduleSpecifier.getStart(sourceFile) + 1,
            end: node.moduleSpecifier.getEnd() - 1,
            value: buildRelativeSpecifier(targetPath, importedTargetPath, specifier),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce(
      (current, replacement) =>
        `${current.slice(0, replacement.start)}${replacement.value}${current.slice(replacement.end)}`,
      content,
    );
}

function resolveImportedSourcePath(
  sourcePath: string,
  specifier: string,
  targetBySource: Map<string, string>,
): string | null {
  const basePath = normalizeWorkspacePath(pathPosix.join(pathPosix.dirname(sourcePath), specifier));
  const candidates = [
    basePath,
    ...RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}/index${extension}`),
  ];
  return candidates.find((candidate) => targetBySource.has(candidate)) || null;
}

function buildRelativeSpecifier(fromPath: string, toPath: string, originalSpecifier: string): string {
  let relative = pathPosix.relative(pathPosix.dirname(fromPath), toPath);
  if (!pathPosix.extname(originalSpecifier)) {
    const extension = pathPosix.extname(relative);
    if (CODE_EXTENSIONS.includes(extension as (typeof CODE_EXTENSIONS)[number])) {
      relative = relative.slice(0, -extension.length);
    }
  }
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function buildRelocatedPath(entryRoot: string, sourceBasePath: string, sourcePath: string): string {
  const relative = pathPosix.relative(sourceBasePath, sourcePath);
  if (relative && relative !== '..' && !relative.startsWith('../')) {
    return `${entryRoot}/${relative}`;
  }
  return `${entryRoot}/__workspace/${sourcePath}`;
}

function normalizeWorkspacePath(value: string): string {
  const normalized = pathPosix.normalize(String(value || '').trim()).replace(/^\.\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.startsWith('/')) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS workspace contains an invalid file path', {
      details: { path: value },
    });
  }
  return normalized;
}

function resolveLightExtensionKind(locator: RunJSSourceLocator, legacy: RunJSLegacySource): LightExtensionKind {
  if (locator.kind !== 'flowModel.step') {
    throw unsupportedLocator(locator);
  }

  const modelUse = typeof legacy.metadata?.modelUse === 'string' ? legacy.metadata.modelUse : '';
  const ownerAdapter = getReferenceOwnerAdapterByUse(modelUse);
  if (!ownerAdapter || !(LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(ownerAdapter.kind)) {
    throw unsupportedLocator(locator, modelUse);
  }
  assertCanonicalModelSourceLocator(locator, ownerAdapter.kind, modelUse);
  return ownerAdapter.kind;
}

function assertCanonicalModelSourceLocator(
  locator: Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>,
  kind: LightExtensionKind,
  modelUse: string,
): void {
  const expectedFlowKey = kind === 'js-action' ? 'clickSettings' : 'jsSettings';
  const hasCanonicalVersionPath =
    !locator.versionPath || (locator.versionPath.length === 1 && locator.versionPath[0] === 'version');
  if (
    locator.flowKey !== expectedFlowKey ||
    locator.stepKey !== 'runJs' ||
    locator.paramPath.length !== 1 ||
    locator.paramPath[0] !== 'code' ||
    !hasCanonicalVersionPath
  ) {
    throw unsupportedLocator(locator, modelUse);
  }
}

function resolveMovedEntryCategory(kind: LightExtensionKind, legacy: RunJSLegacySource): string | null {
  if (kind !== 'js-field') {
    return null;
  }
  return legacy.metadata?.modelUse === 'JSColumnModel' ? 'js-column' : 'js-field';
}

function buildSourceBinding(
  repo: LightExtensionMoveSourceResult['repo'],
  entry: LightExtensionEntryRecord,
  kind: LightExtensionKind,
): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: repo.id,
    repoTitle: repo.title || repo.name,
    entryId: entry.id,
    entryTitle: entry.title || entry.entryName,
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    kind,
  };
}

function getEntryRoot(kind: LightExtensionKind, entryName: string): string {
  return `${ENTRY_ROOTS[kind]}/${entryName}`;
}

function getFlowModelUid(locator: RunJSSourceLocator): string {
  if (locator.kind === 'flowModel.step') {
    return locator.modelUid;
  }
  throw unsupportedLocator(locator);
}

function assertMoveSourceInputSupported(input: LightExtensionMoveSourceInput): void {
  if (typeof input.idempotencyKey !== 'undefined') {
    if (!input.idempotencyKey.trim()) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'Move source idempotency key must be a non-empty string',
      );
    }
    if (input.idempotencyKey.length > 255) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'Move source idempotency key must be at most 255 characters',
      );
    }
  }
  if (input.locator.kind !== 'flowModel.step') {
    throw unsupportedLocator(input.locator);
  }
  if (
    input.originBinding &&
    !(LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(input.originBinding.kind)
  ) {
    throw unsupportedLocator(input.locator, undefined, input.originBinding.kind);
  }
}

function assertOwnerFingerprint(expected: string, current: string): void {
  if (expected === current) {
    return;
  }
  throw new LightExtensionError(
    'LIGHT_EXTENSION_BINDING_OUTDATED',
    'RunJS source changed before it could be moved to a light extension',
    {
      details: {
        expectedOwnerFingerprint: expected,
        currentOwnerFingerprint: current,
      },
    },
  );
}

function entryConflict(repoId: string, kind: LightExtensionKind, entryName: string): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_ENTRY_CONFLICT',
    `Light extension entry "${entryName}" already exists`,
    {
      details: { repoId, kind, entryName },
    },
  );
}

function unsupportedLocator(
  locator: RunJSSourceLocator,
  modelUse?: string,
  originBindingKind?: string,
): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_INVALID_INPUT',
    'This RunJS source cannot be moved to a light extension',
    {
      details: { locatorKind: locator.kind, modelUse, originBindingKind },
    },
  );
}

function buildMoveCommitMessage(input: LightExtensionMoveSourceInput): string {
  const sourceVersion = input.sourceHeadCommitId || 'working-copy';
  return `Move RunJS source ${input.sourceRepoId}@${sourceVersion} to ${input.entryName}`.slice(0, 200);
}

function toInitialTreeEntry(file: LightExtensionFileChange) {
  const { operation: _operation, ...entry } = file;
  return entry;
}

function upsertEntryDescriptor(
  files: LightExtensionFileChange[],
  entryRoot: string,
  key: string,
  title: string | null,
  category: string | null,
  fallbackSettingsSchema: Record<string, unknown> | null,
): void {
  const descriptorPath = `${entryRoot}/entry.json`;
  const existing = files.find((file) => file.path === descriptorPath);
  const sourceDescriptor = existing ? parseEntryDescriptor(existing.content, descriptorPath) : {};
  const sourceKey =
    typeof sourceDescriptor.key === 'string' && LIGHT_EXTENSION_ENTRY_KEY_PATTERN.test(sourceDescriptor.key)
      ? sourceDescriptor.key
      : key;
  const descriptor: Record<string, unknown> = {
    schemaVersion: 1,
    key: sourceKey,
  };
  if (title) {
    descriptor.title = title;
  }
  if (Object.prototype.hasOwnProperty.call(sourceDescriptor, 'description')) {
    descriptor.description = sourceDescriptor.description;
  }
  if (category) {
    descriptor.category = category;
  } else if (Object.prototype.hasOwnProperty.call(sourceDescriptor, 'category')) {
    descriptor.category = sourceDescriptor.category;
  }
  for (const field of ['icon', 'tags', 'sort'] as const) {
    if (Object.prototype.hasOwnProperty.call(sourceDescriptor, field)) {
      descriptor[field] = sourceDescriptor[field];
    }
  }
  if (Object.prototype.hasOwnProperty.call(sourceDescriptor, 'settings')) {
    descriptor.settings = sourceDescriptor.settings;
  } else if (Object.prototype.hasOwnProperty.call(sourceDescriptor, 'settingsSchema')) {
    descriptor.settingsSchema = sourceDescriptor.settingsSchema;
  } else if (fallbackSettingsSchema) {
    descriptor.settingsSchema = fallbackSettingsSchema;
  }
  const content = `${JSON.stringify(descriptor, null, 2)}\n`;
  if (!existing) {
    files.push({
      path: descriptorPath,
      content,
      language: 'json',
      operation: 'upsert',
    });
    return;
  }

  existing.content = content;
  existing.language = 'json';
  existing.operation = 'upsert';
}

function getRelocatedEntryKey(
  files: LightExtensionFileChange[],
  kind: LightExtensionKind,
  entryDirectory: string,
): string {
  const descriptorPath = `${getEntryRoot(kind, entryDirectory)}/entry.json`;
  const descriptorFile = files.find((file) => file.path === descriptorPath);
  if (!descriptorFile) {
    throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Moved entry descriptor is missing', {
      details: { descriptorPath },
    });
  }
  const descriptor = parseEntryDescriptor(descriptorFile.content, descriptorPath);
  if (typeof descriptor.key !== 'string' || !LIGHT_EXTENSION_ENTRY_KEY_PATTERN.test(descriptor.key)) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS entry descriptor key is invalid', {
      details: { descriptorPath },
    });
  }
  return descriptor.key;
}

function parseEntryDescriptor(content: string, path: string): Record<string, unknown> {
  let descriptor: unknown;
  try {
    descriptor = JSON.parse(content);
  } catch {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS entry descriptor is invalid JSON', {
      details: { path },
    });
  }
  if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS entry descriptor must be a JSON object', {
      details: { path },
    });
  }
  return { ...(descriptor as Record<string, unknown>) };
}

function supportsExternalBinding(adapter: RunJSSourceAdapter): adapter is ExternalBindingAdapter {
  return typeof (adapter as { writeExternalBinding?: unknown }).writeExternalBinding === 'function';
}

function hashMoveOperation(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(sortObjectKeys(value)))
    .digest('hex');
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => typeof entryValue !== 'undefined')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, sortObjectKeys(entryValue)]),
  );
}

function readModelString(record: Model, key: string): string {
  const value = record.get(key);
  return typeof value === 'string' ? value : '';
}

function readNullableModelString(record: Model, key: string): string | null {
  const value = record.get(key);
  return typeof value === 'string' && value ? value : null;
}

function toSourceSnapshotInput(input: LightExtensionMoveSourceInput): MoveSourceSourceSnapshotInput {
  return {
    locator: input.locator,
    sourceRepoId: input.sourceRepoId,
    sourceHeadCommitId: input.sourceHeadCommitId,
    expectedOwnerFingerprint: input.expectedOwnerFingerprint,
  };
}

function sourceSnapshotOutdated(
  input: MoveSourceSourceSnapshotInput,
  currentHeadCommitId: string | null,
): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_SOURCE_OUTDATED',
    'RunJS workspace Head changed before it could be moved to a light extension',
    {
      details: {
        sourceRepoId: input.sourceRepoId,
        expectedHeadCommitId: input.sourceHeadCommitId,
        currentHeadCommitId,
      },
    },
  );
}

function readMoveSourceOperationResult(value: unknown): LightExtensionMoveSourceResult {
  if (
    !isRecord(value) ||
    !isRecord(value.repo) ||
    !isRecord(value.entry) ||
    !isRecord(value.binding) ||
    typeof value.ownerFingerprint !== 'string'
  ) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_SOURCE_ERROR',
      'Move source operation has an invalid completed result',
    );
  }
  return value as unknown as LightExtensionMoveSourceResult;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isMoveOperationStale(updatedAt: unknown): boolean {
  const timestamp = updatedAt instanceof Date ? updatedAt.getTime() : Date.parse(String(updatedAt || ''));
  return Number.isFinite(timestamp) && Date.now() - timestamp >= MOVE_OPERATION_STALE_AFTER_MS;
}

function moveOperationInProgress(): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_IDEMPOTENCY_IN_PROGRESS',
    'Move source with this idempotency key is still in progress; retry the same request',
  );
}

function getMoveOperationErrorCode(error: unknown): string {
  if (isLightExtensionError(error) || isVscError(error)) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return 'UNKNOWN_ERROR';
}

function normalizeMoveSourceError(error: unknown): unknown {
  if (!isVscError(error)) {
    return error;
  }
  if (error.code === 'RUNJS_SOURCE_OWNER_OUTDATED') {
    return new LightExtensionError(
      'LIGHT_EXTENSION_BINDING_OUTDATED',
      'RunJS source changed before it could be moved to a light extension',
      { details: error.details },
    );
  }
  if (error.code === 'PERMISSION_DENIED') {
    return new LightExtensionError('LIGHT_EXTENSION_PERMISSION_DENIED', 'RunJS source write permission is required', {
      details: error.details,
    });
  }
  return new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'RunJS source could not be moved', {
    status: error.status,
    details: {
      sourceCode: error.code,
      ...(error.details || {}),
    },
  });
}
