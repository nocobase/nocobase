/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { UniqueConstraintError } from '@nocobase/database';

import { VscError } from '../../shared/errors';
import { normalizePath, pathHash, pathLowerHash } from '../../shared/path';
import type {
  VscDraftFileChange,
  VscDraftFileOperation,
  VscDraftFileRecord,
  VscDraftRecord,
  VscFileMode,
  VscNormalizedTreeEntry,
  VscRepositoryRecord,
  VscTreeEntryInput,
} from '../../shared/types';
import { BlobService } from './BlobService';
import { CommitService } from './CommitService';
import { RepositoryService } from './RepositoryService';
import { TreeService } from './TreeService';

export type VscDraftWriteAction = 'saveDraft' | 'discardDraft';

export interface VscDraftWritePermissionInput {
  action: VscDraftWriteAction;
  repoId: string;
  userId: string;
  repository: VscRepositoryRecord;
}

export type VscDraftWritePermissionChecker = (input: VscDraftWritePermissionInput) => Promise<void> | void;

export interface VscDraftServiceContext {
  transaction?: Transaction;
  assertCanWrite?: VscDraftWritePermissionChecker;
}

export interface GetDraftInput {
  repoId: string;
  userId: string;
}

export interface SaveDraftInput extends GetDraftInput {
  baseCommitId: string | null;
  files: VscDraftFileChange[];
}

export type DiscardDraftInput = GetDraftInput;

const maxLanguageLength = 64;
const maxModeLength = 16;

export interface MarkDraftCommittedInput {
  draftId: string;
  repoId?: string;
  baseCommitId?: string | null;
}

export interface ActiveDraftResult {
  draft: VscDraftRecord;
  files: VscDraftFileRecord[];
}

interface DraftFileValues {
  id?: string;
  draftId: string;
  path: string;
  pathHash: string;
  pathLowerHash: string;
  operation: VscDraftFileOperation;
  blobHash: string | null;
  language: string | null;
  mode: VscFileMode | null;
}

export class DraftService {
  private readonly blobService: BlobService;

  private readonly repositoryService: RepositoryService;

  private readonly commitService: CommitService;

  private readonly treeService: TreeService;

  constructor(
    private readonly db: Database,
    blobService?: BlobService,
    repositoryService?: RepositoryService,
    commitService?: CommitService,
    treeService?: TreeService,
  ) {
    this.blobService = blobService || new BlobService(db);
    this.repositoryService = repositoryService || new RepositoryService(db);
    this.commitService = commitService || new CommitService(db);
    this.treeService = treeService || new TreeService(db, this.blobService);
  }

  async getDraft(input: GetDraftInput, ctx: VscDraftServiceContext = {}): Promise<ActiveDraftResult | null> {
    await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    return this.loadActiveDraft(input.repoId, input.userId, ctx.transaction);
  }

  async saveDraft(input: SaveDraftInput, ctx: VscDraftServiceContext = {}): Promise<ActiveDraftResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.assertWritableRepository('saveDraft', input, ctx, transaction);
      const draft = await this.findOrCreateActiveDraft(input, transaction);

      if (draft.repoId !== repository.id || draft.baseCommitId !== input.baseCommitId) {
        throw new VscError('DRAFT_BASE_OUTDATED', 'Active draft base is no longer current');
      }

      const draftFileValues: DraftFileValues[] = [];
      for (const change of input.files) {
        draftFileValues.push(await this.normalizeDraftFileChange(draft.id, change, transaction));
      }

      await this.assertDraftTreeWithinLimits(draft, draftFileValues, transaction);

      for (const values of draftFileValues) {
        await this.db.getRepository('vscFileDraftFiles').updateOrCreate({
          filterKeys: ['draftId', 'pathHash'],
          values,
          transaction,
        });
      }

      const saved = await this.loadActiveDraft(input.repoId, input.userId, transaction);
      if (!saved) {
        throw new VscError('DRAFT_BASE_OUTDATED', 'Active draft was not found after saving');
      }

      return saved;
    });
  }

  async discardDraft(input: DiscardDraftInput, ctx: VscDraftServiceContext = {}): Promise<VscDraftRecord | null> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      await this.assertWritableRepository('discardDraft', input, ctx, transaction);
      const draft = await this.findActiveDraftRecord(input.repoId, input.userId, transaction);
      if (!draft) {
        return null;
      }

      const draftModel = this.db.getModel<Model<VscDraftRecord>>('vscFileDrafts');
      const [updatedCount] = await draftModel.update(
        {
          status: 'discarded',
          activeKey: null,
        },
        {
          where: {
            id: draft.id,
            status: 'active',
            activeKey: activeDraftKey(input.repoId, input.userId),
          },
          transaction,
        },
      );

      if (updatedCount !== 1) {
        throw new VscError('DRAFT_BASE_OUTDATED', 'Active draft was already changed');
      }

      return this.getDraftRecord(draft.id, transaction);
    });
  }

  async markDraftCommitted(
    input: string | MarkDraftCommittedInput,
    transaction?: Transaction,
  ): Promise<VscDraftRecord> {
    return this.withTransaction(transaction, async (activeTransaction) => {
      const options = typeof input === 'string' ? { draftId: input } : input;
      const filter: {
        id: string;
        status: VscDraftRecord['status'];
        repoId?: string;
        baseCommitId?: string | null;
      } = {
        id: options.draftId,
        status: 'active',
      };

      if (options.repoId) {
        filter.repoId = options.repoId;
      }
      if ('baseCommitId' in options) {
        filter.baseCommitId = options.baseCommitId;
      }

      const draftModel = this.db.getModel<Model<VscDraftRecord>>('vscFileDrafts');
      const [updatedCount] = await draftModel.update(
        {
          status: 'committed',
          activeKey: null,
        },
        {
          where: filter,
          transaction: activeTransaction,
        },
      );

      if (updatedCount !== 1) {
        throw new VscError('DRAFT_BASE_OUTDATED', 'Draft is not active for the pushed repository base');
      }

      return this.getDraftRecord(options.draftId, activeTransaction);
    });
  }

  private async assertWritableRepository(
    action: VscDraftWriteAction,
    input: GetDraftInput,
    ctx: VscDraftServiceContext,
    transaction: Transaction,
  ): Promise<VscRepositoryRecord> {
    const repository = await this.repositoryService.getRepository(input.repoId, transaction);
    if (repository.status === 'archived') {
      throw new VscError('REPO_ARCHIVED', `Repository "${repository.id}" is archived`);
    }

    await ctx.assertCanWrite?.({
      action,
      repoId: input.repoId,
      userId: input.userId,
      repository,
    });

    return repository;
  }

  private async findOrCreateActiveDraft(input: SaveDraftInput, transaction: Transaction): Promise<VscDraftRecord> {
    const activeKey = activeDraftKey(input.repoId, input.userId);
    const draftModel = this.db.getModel<Model<VscDraftRecord>>('vscFileDrafts');

    try {
      const [draft] = await draftModel.findOrCreate({
        where: {
          activeKey,
        },
        defaults: {
          repoId: input.repoId,
          userId: input.userId,
          baseCommitId: input.baseCommitId,
          status: 'active',
          activeKey,
        },
        transaction,
      });

      return draftFromRecord(draft);
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) {
        throw error;
      }
    }

    const existing = await this.findActiveDraftRecord(input.repoId, input.userId, transaction);
    if (!existing) {
      throw new VscError('DRAFT_BASE_OUTDATED', 'Active draft was created concurrently but could not be loaded');
    }

    return existing;
  }

  private async normalizeDraftFileChange(
    draftId: string,
    change: VscDraftFileChange,
    transaction: Transaction,
  ): Promise<DraftFileValues> {
    const normalizedPath = normalizePath(change.path);
    const operation = change.operation;

    if (operation === 'delete') {
      return {
        draftId,
        path: normalizedPath,
        pathHash: pathHash(normalizedPath),
        pathLowerHash: pathLowerHash(normalizedPath),
        operation,
        blobHash: null,
        language: null,
        mode: null,
      };
    }
    if (operation !== 'upsert') {
      throw new VscError('PATH_INVALID', `Unsupported draft file operation "${operation}"`);
    }
    if (typeof change.content !== 'string') {
      throw new VscError('PATH_INVALID', `Draft file "${normalizedPath}" must include content`);
    }

    const blob = await this.blobService.ensureBlob(change.content, { transaction });
    return {
      draftId,
      path: normalizedPath,
      pathHash: pathHash(normalizedPath),
      pathLowerHash: pathLowerHash(normalizedPath),
      operation,
      blobHash: blob.hash,
      language: normalizeOptionalDraftMetadata(change.language, 'language', maxLanguageLength),
      mode: normalizeOptionalDraftMetadata(change.mode, 'mode', maxModeLength),
    };
  }

  private async assertDraftTreeWithinLimits(
    draft: VscDraftRecord,
    draftFileValues: DraftFileValues[],
    transaction: Transaction,
  ): Promise<void> {
    const baseEntries = await this.loadBaseTreeEntries(draft, transaction);
    const existingDraftFiles = await this.loadDraftFiles(draft.id, transaction);
    const draftFilesByPathHash = new Map<string, DraftFileValues>();

    for (const draftFile of existingDraftFiles) {
      draftFilesByPathHash.set(draftFile.pathHash, {
        id: draftFile.id,
        draftId: draftFile.draftId,
        path: draftFile.path,
        pathHash: draftFile.pathHash,
        pathLowerHash: draftFile.pathLowerHash,
        operation: draftFile.operation,
        blobHash: draftFile.blobHash,
        language: draftFile.language,
        mode: draftFile.mode,
      });
    }

    for (const draftFile of draftFileValues) {
      draftFilesByPathHash.set(draftFile.pathHash, draftFile);
    }

    const nextEntriesByPathHash = new Map<string, VscTreeEntryInput>();
    for (const entry of baseEntries) {
      nextEntriesByPathHash.set(entry.pathHash, treeEntryInputFromEntry(entry));
    }

    for (const draftFile of draftFilesByPathHash.values()) {
      if (draftFile.operation === 'delete') {
        nextEntriesByPathHash.delete(draftFile.pathHash);
        continue;
      }
      if (!draftFile.blobHash) {
        throw new VscError('BLOB_NOT_FOUND', `Draft file "${draftFile.path}" does not reference a blob`);
      }

      nextEntriesByPathHash.set(draftFile.pathHash, {
        path: draftFile.path,
        blobHash: draftFile.blobHash,
        language: draftFile.language || nextEntriesByPathHash.get(draftFile.pathHash)?.language,
        mode: draftFile.mode || nextEntriesByPathHash.get(draftFile.pathHash)?.mode,
      });
    }

    await this.treeService.hashTree(Array.from(nextEntriesByPathHash.values()), { transaction });
  }

  private async loadBaseTreeEntries(
    draft: VscDraftRecord,
    transaction: Transaction,
  ): Promise<VscNormalizedTreeEntry[]> {
    if (!draft.baseCommitId) {
      return [];
    }

    const baseCommit = await this.commitService.getCommit(draft.repoId, draft.baseCommitId, transaction);
    return this.treeService.loadTreeEntries(baseCommit.treeHash, { transaction });
  }

  private async loadActiveDraft(
    repoId: string,
    userId: string,
    transaction?: Transaction,
  ): Promise<ActiveDraftResult | null> {
    const draft = await this.findActiveDraftRecord(repoId, userId, transaction);
    if (!draft) {
      return null;
    }

    const files = await this.loadDraftFiles(draft.id, transaction);

    return {
      draft,
      files,
    };
  }

  private async loadDraftFiles(draftId: string, transaction?: Transaction): Promise<VscDraftFileRecord[]> {
    const records = await this.db.getRepository('vscFileDraftFiles').find({
      filter: {
        draftId,
      },
      sort: ['path'],
      transaction,
    });

    return records.map(draftFileFromRecord);
  }

  private async findActiveDraftRecord(
    repoId: string,
    userId: string,
    transaction?: Transaction,
  ): Promise<VscDraftRecord | null> {
    const record = await this.db.getRepository('vscFileDrafts').findOne({
      filter: {
        activeKey: activeDraftKey(repoId, userId),
        status: 'active',
      },
      transaction,
    });

    return record ? draftFromRecord(record) : null;
  }

  private async getDraftRecord(draftId: string, transaction?: Transaction): Promise<VscDraftRecord> {
    const record = await this.db.getRepository('vscFileDrafts').findOne({
      filterByTk: draftId,
      transaction,
    });

    if (!record) {
      throw new VscError('DRAFT_BASE_OUTDATED', `Draft "${draftId}" was not found`);
    }

    return draftFromRecord(record);
  }

  private async withTransaction<T>(
    transaction: Transaction | undefined,
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    return this.db.sequelize.transaction(run);
  }
}

export function activeDraftKey(repoId: string, userId: string): string {
  return `${repoId}:${userId}`;
}

export function draftFromRecord(record: Model): VscDraftRecord {
  return {
    id: record.get('id') as string,
    repoId: record.get('repoId') as string,
    userId: record.get('userId') as string,
    baseCommitId: (record.get('baseCommitId') as string | null) || null,
    status: record.get('status') as VscDraftRecord['status'],
    activeKey: (record.get('activeKey') as string | null) || null,
  };
}

function treeEntryInputFromEntry(entry: VscNormalizedTreeEntry): VscTreeEntryInput {
  return {
    path: entry.path,
    blobHash: entry.blobHash,
    size: entry.size,
    language: entry.language,
    mode: entry.mode,
  };
}

export function draftFileFromRecord(record: Model): VscDraftFileRecord {
  return {
    id: record.get('id') as string,
    draftId: record.get('draftId') as string,
    path: record.get('path') as string,
    pathHash: record.get('pathHash') as string,
    pathLowerHash: record.get('pathLowerHash') as string,
    operation: record.get('operation') as VscDraftFileOperation,
    blobHash: (record.get('blobHash') as string | null) || null,
    language: (record.get('language') as string | null) || null,
    mode: (record.get('mode') as VscFileMode | null) || null,
  };
}

function normalizeOptionalDraftMetadata(
  value: string | undefined,
  fieldName: string,
  maxLength: number,
): string | null {
  if (typeof value === 'undefined') {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.includes('\0') || normalized.includes('\n') || normalized.includes('\r')) {
    throw new VscError('PATH_INVALID', `Draft file ${fieldName} must not contain line breaks or NUL`);
  }
  if (normalized.length > maxLength) {
    throw new VscError('PATH_INVALID', `Draft file ${fieldName} length must not exceed ${maxLength}`, {
      details: {
        fieldName,
        maxLength,
      },
    });
  }

  return normalized;
}
