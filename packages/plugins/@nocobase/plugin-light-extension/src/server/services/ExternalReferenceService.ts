/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { uid } from '@nocobase/utils';

import { LightExtensionError } from '../../shared/errors';
import { stableJsonHash } from './ReferenceOwnerRegistry';

export const CLIENT_APP_REFERENCE_HEALTH_STATUSES = [
  'ready',
  'repo-disabled',
  'repo-archived',
  'entry-missing',
  'assets-missing',
  'provider-unavailable',
] as const;

export type ClientAppReferenceHealthStatus = (typeof CLIENT_APP_REFERENCE_HEALTH_STATUSES)[number];

export interface ExternalReferenceBinding {
  ownerId: string;
  entryIds: readonly string[];
}

export interface ExternalReferenceOwnerAdapter {
  ownerKind: string;
  listBindings(context: { transaction: Transaction }): Promise<readonly ExternalReferenceBinding[]>;
  getBindingForUpdate(ownerId: string, transaction: Transaction): Promise<ExternalReferenceBinding | null>;
  lockOwner?(ownerId: string, transaction: Transaction): Promise<void>;
}

export interface ExternalReferenceOwnerSummary {
  ownerKind: string;
  ownerId: string;
}

export interface ExternalReferenceHealth extends ExternalReferenceOwnerSummary {
  entryId: string;
  repoId: string | null;
  status: ClientAppReferenceHealthStatus;
}

export interface ReplaceExternalReferencesInput extends ExternalReferenceOwnerSummary {
  entryIds: readonly string[];
}

export interface ExternalReferenceMutationResult {
  upserted: number;
  removed: number;
}

export interface ExternalReferenceReconcileResult extends ExternalReferenceMutationResult {
  owners: number;
}

export interface ExternalReferenceServiceContext {
  transaction?: Transaction;
}

interface ExternalReferenceRecord {
  model?: Model;
  repoId: string;
  entryId: string;
  ownerKind: string;
  ownerId: string;
  ownerLocatorHash: string;
  resolvedStatus: string;
}

const EMPTY_SETTINGS_HASH = stableJsonHash({});

export class ExternalReferenceService {
  private readonly adapters = new Map<string, ExternalReferenceOwnerAdapter>();

  constructor(private readonly db: Database) {}

  registerOwnerAdapter(adapter: ExternalReferenceOwnerAdapter): () => void {
    const ownerKind = normalizeRequiredString(adapter.ownerKind, 'ownerKind');
    if (ownerKind.startsWith('flowModel.')) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'External reference owner kind must not use the FlowModel namespace',
      );
    }
    this.adapters.set(ownerKind, adapter);
    return () => {
      if (this.adapters.get(ownerKind) === adapter) {
        this.adapters.delete(ownerKind);
      }
    };
  }

  async replaceReferences(
    input: ReplaceExternalReferencesInput,
    ctx: ExternalReferenceServiceContext = {},
  ): Promise<ExternalReferenceMutationResult> {
    const normalized = normalizeReplaceInput(input);
    const adapter = this.requireAdapter(normalized.ownerKind);
    return this.withTransaction(ctx.transaction, async (transaction) => {
      await adapter.lockOwner?.(normalized.ownerId, transaction);
      return this.replaceReferencesInTransaction(normalized, transaction);
    });
  }

  async deleteReferences(
    input: ExternalReferenceOwnerSummary,
    ctx: ExternalReferenceServiceContext = {},
  ): Promise<ExternalReferenceMutationResult> {
    const ownerKind = normalizeRequiredString(input.ownerKind, 'ownerKind');
    const ownerId = normalizeRequiredString(input.ownerId, 'ownerId');
    const adapter = this.requireAdapter(ownerKind);
    return this.withTransaction(ctx.transaction, async (transaction) => {
      await adapter.lockOwner?.(ownerId, transaction);
      const removed = await this.db.getRepository('lightExtensionReferences').destroy({
        filter: {
          ownerKind,
          ownerLocatorHash: hashExternalOwner(ownerKind, ownerId),
        },
        transaction,
      });
      return { upserted: 0, removed };
    });
  }

  async reconcileReferences(
    input: { ownerKind: string },
    ctx: ExternalReferenceServiceContext = {},
  ): Promise<ExternalReferenceReconcileResult> {
    const ownerKind = normalizeRequiredString(input.ownerKind, 'ownerKind');
    const adapter = this.requireAdapter(ownerKind);
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const bindings = normalizeBindings(await adapter.listBindings({ transaction }));
      const desiredOwnerIds = new Set<string>();
      let upserted = 0;
      let removed = 0;
      for (const listedBinding of bindings) {
        const binding = await this.getBindingForUpdate(adapter, listedBinding.ownerId, transaction);
        if (!binding) {
          removed += await this.deleteOwnerReferencesInTransaction(ownerKind, listedBinding.ownerId, transaction);
          continue;
        }
        desiredOwnerIds.add(binding.ownerId);
        const result = await this.replaceReferencesInTransaction(
          {
            ownerKind,
            ownerId: binding.ownerId,
            entryIds: binding.entryIds,
          },
          transaction,
        );
        upserted += result.upserted;
        removed += result.removed;
      }

      const existing = await this.findExternalReferences({ ownerKind }, transaction);
      const staleOwnerIds = new Set(
        existing.map((reference) => reference.ownerId).filter((ownerId) => !desiredOwnerIds.has(ownerId)),
      );
      for (const ownerId of staleOwnerIds) {
        const binding = await this.getBindingForUpdate(adapter, ownerId, transaction);
        if (!binding) {
          removed += await this.deleteOwnerReferencesInTransaction(ownerKind, ownerId, transaction);
          continue;
        }
        desiredOwnerIds.add(binding.ownerId);
        const result = await this.replaceReferencesInTransaction(
          {
            ownerKind,
            ownerId: binding.ownerId,
            entryIds: binding.entryIds,
          },
          transaction,
        );
        upserted += result.upserted;
        removed += result.removed;
      }

      return {
        owners: desiredOwnerIds.size,
        upserted,
        removed,
      };
    });
  }

  async getReferenceHealth(
    input: ExternalReferenceOwnerSummary & { entryId: string },
    ctx: ExternalReferenceServiceContext = {},
  ): Promise<ExternalReferenceHealth> {
    const ownerKind = normalizeRequiredString(input.ownerKind, 'ownerKind');
    const ownerId = normalizeRequiredString(input.ownerId, 'ownerId');
    const entryId = normalizeRequiredString(input.entryId, 'entryId');
    if (!this.adapters.has(ownerKind)) {
      return {
        ownerKind,
        ownerId,
        entryId,
        repoId: null,
        status: 'provider-unavailable',
      };
    }
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const existing = await this.findExternalReferences({ ownerKind, ownerId }, transaction);
      const reference = existing.find((item) => item.entryId === entryId);
      const health = await this.resolveHealth(entryId, reference?.repoId || null, transaction);
      return {
        ownerKind,
        ownerId,
        entryId,
        repoId: health.repoId,
        status: health.status,
      };
    });
  }

  async listEntryOwners(entryId: string, transaction?: Transaction): Promise<ExternalReferenceOwnerSummary[]> {
    const normalizedEntryId = normalizeRequiredString(entryId, 'entryId');
    const references = await this.findExternalReferences({ entryId: normalizedEntryId }, transaction);
    return dedupeOwners(references);
  }

  async listRepoOwners(repoId: string, transaction?: Transaction): Promise<ExternalReferenceOwnerSummary[]> {
    const normalizedRepoId = normalizeRequiredString(repoId, 'repoId');
    const references = await this.findExternalReferences({ repoId: normalizedRepoId }, transaction);
    return dedupeOwners(references);
  }

  async assertEntryNotReferenced(entryId: string, transaction?: Transaction): Promise<void> {
    const owners = await this.listEntryOwners(entryId, transaction);
    if (!owners.length) {
      return;
    }
    throw new LightExtensionError(
      'LIGHT_EXTENSION_REFERENCE_EXISTS',
      'Client app Entry is referenced and cannot be deleted',
      {
        details: {
          entryId,
          referenceCount: owners.length,
          references: owners,
          workspaces: owners,
          owners,
        },
      },
    );
  }

  async assertRepoNotReferenced(repoId: string, transaction?: Transaction): Promise<void> {
    const owners = await this.listRepoOwners(repoId, transaction);
    if (!owners.length) {
      return;
    }
    throw new LightExtensionError(
      'LIGHT_EXTENSION_REFERENCE_EXISTS',
      'Light extension repository is referenced and cannot be deleted',
      {
        details: {
          repoId,
          referenceCount: owners.length,
          references: owners,
          workspaces: owners,
          owners,
        },
      },
    );
  }

  private async replaceReferencesInTransaction(
    input: ReplaceExternalReferencesInput,
    transaction: Transaction,
  ): Promise<ExternalReferenceMutationResult> {
    const ownerLocatorHash = hashExternalOwner(input.ownerKind, input.ownerId);
    const existing = await this.findExternalReferences(
      {
        ownerKind: input.ownerKind,
        ownerId: input.ownerId,
      },
      transaction,
    );
    const desiredEntryIds = [...new Set(input.entryIds.map((entryId) => normalizeRequiredString(entryId, 'entryId')))];
    let upserted = 0;

    for (const entryId of desiredEntryIds) {
      const previous = existing.find((reference) => reference.entryId === entryId);
      const health = await this.resolveHealth(entryId, previous?.repoId || null, transaction, { lockRepo: true });
      if (!health.repoId) {
        continue;
      }
      const values = {
        repoId: health.repoId,
        entryId,
        kind: 'client-app',
        ownerKind: input.ownerKind,
        ownerLocator: {
          kind: input.ownerKind,
          ownerId: input.ownerId,
        },
        ownerLocatorHash,
        settingsHash: EMPTY_SETTINGS_HASH,
        resolvedStatus: health.status,
      };
      if (previous?.model) {
        if (referenceNeedsUpdate(previous, values)) {
          await previous.model.update(values, { transaction });
          upserted += 1;
        }
        continue;
      }
      await this.db.getRepository('lightExtensionReferences').create({
        values: {
          id: `lef_${uid()}`,
          ...values,
        },
        transaction,
      });
      upserted += 1;
    }

    const desired = new Set(desiredEntryIds);
    let removed = 0;
    for (const reference of existing) {
      if (desired.has(reference.entryId)) {
        continue;
      }
      removed += await this.db.getRepository('lightExtensionReferences').destroy({
        filterByTk: reference.model?.get('id'),
        transaction,
      });
    }
    return { upserted, removed };
  }

  private async getBindingForUpdate(
    adapter: ExternalReferenceOwnerAdapter,
    ownerId: string,
    transaction: Transaction,
  ): Promise<ExternalReferenceBinding | null> {
    const binding = normalizeBinding(await adapter.getBindingForUpdate(ownerId, transaction));
    if (binding && binding.ownerId !== ownerId) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        `External reference owner adapter returned "${binding.ownerId}" while locking "${ownerId}"`,
      );
    }
    return binding;
  }

  private async deleteOwnerReferencesInTransaction(
    ownerKind: string,
    ownerId: string,
    transaction: Transaction,
  ): Promise<number> {
    return this.db.getRepository('lightExtensionReferences').destroy({
      filter: {
        ownerKind,
        ownerLocatorHash: hashExternalOwner(ownerKind, ownerId),
      },
      transaction,
    });
  }

  private async resolveHealth(
    entryId: string,
    fallbackRepoId: string | null,
    transaction: Transaction,
    options: { lockRepo?: boolean } = {},
  ): Promise<{ repoId: string | null; status: ClientAppReferenceHealthStatus }> {
    let entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: entryId,
      transaction,
    });
    if (!entry || entry.get('kind') !== 'client-app') {
      return { repoId: fallbackRepoId, status: 'entry-missing' };
    }
    const repoId = normalizeString(entry.get('repoId')) || fallbackRepoId;
    if (!repoId || entry.get('healthStatus') !== 'ready') {
      return { repoId, status: 'entry-missing' };
    }
    let repo: Model | null;
    if (options.lockRepo) {
      repo = await this.db.getModel<Model>('lightExtensionRepos').findByPk(repoId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      entry = await this.db.getRepository('lightExtensionEntries').findOne({ filterByTk: entryId, transaction });
      if (!entry || entry.get('kind') !== 'client-app' || normalizeString(entry.get('repoId')) !== repoId) {
        return { repoId, status: 'entry-missing' };
      }
    } else {
      repo = await this.db.getRepository('lightExtensionRepos').findOne({
        filterByTk: repoId,
        transaction,
      });
    }
    if (!repo) {
      return { repoId, status: 'entry-missing' };
    }
    const lifecycleStatus = normalizeString(repo.get('lifecycleStatus'));
    if (lifecycleStatus === 'disabled') {
      return { repoId, status: 'repo-disabled' };
    }
    if (lifecycleStatus === 'archived') {
      return { repoId, status: 'repo-archived' };
    }

    const clientApp = await this.db.getRepository('lightExtensionClientApps').findOne({
      filterByTk: entryId,
      transaction,
    });
    if (!clientApp) {
      return { repoId, status: 'assets-missing' };
    }
    const assetSetId = normalizeString(clientApp.get('assetSetId'));
    const expectedAssetCount = Number(clientApp.get('fileCount'));
    if (!assetSetId || !Number.isSafeInteger(expectedAssetCount) || expectedAssetCount < 1) {
      return { repoId, status: 'assets-missing' };
    }
    const readyAssetCount = await this.db.getRepository('lightExtensionClientAppAssets').count({
      filter: { repoId, entryId, assetSetId, state: 'ready' },
      transaction,
    });
    return {
      repoId,
      status: readyAssetCount === expectedAssetCount ? 'ready' : 'assets-missing',
    };
  }

  private async findExternalReferences(
    input: { ownerKind?: string; ownerId?: string; repoId?: string; entryId?: string },
    transaction?: Transaction,
  ): Promise<ExternalReferenceRecord[]> {
    const filter: Record<string, unknown> = { kind: 'client-app' };
    for (const key of ['ownerKind', 'repoId', 'entryId'] as const) {
      if (input[key]) {
        filter[key] = input[key];
      }
    }
    if (input.ownerId && input.ownerKind) {
      filter.ownerLocatorHash = hashExternalOwner(input.ownerKind, input.ownerId);
    }
    const records = await this.db.getRepository('lightExtensionReferences').find({ filter, transaction });
    return records.map(externalReferenceFromModel).filter((reference) => Boolean(reference.ownerId));
  }

  private requireAdapter(ownerKind: string): ExternalReferenceOwnerAdapter {
    const adapter = this.adapters.get(ownerKind);
    if (!adapter) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
        `External reference owner provider "${ownerKind}" is unavailable`,
      );
    }
    return adapter;
  }

  private async withTransaction<T>(
    transaction: Transaction | undefined,
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    return transaction ? run(transaction) : this.db.sequelize.transaction(run);
  }
}

function normalizeReplaceInput(input: ReplaceExternalReferencesInput): ReplaceExternalReferencesInput {
  return {
    ownerKind: normalizeRequiredString(input.ownerKind, 'ownerKind'),
    ownerId: normalizeRequiredString(input.ownerId, 'ownerId'),
    entryIds: input.entryIds || [],
  };
}

function normalizeBindings(bindings: readonly ExternalReferenceBinding[]): ExternalReferenceBinding[] {
  const byOwnerId = new Map<string, Set<string>>();
  for (const binding of bindings) {
    const ownerId = normalizeRequiredString(binding.ownerId, 'ownerId');
    const entryIds = byOwnerId.get(ownerId) || new Set<string>();
    for (const entryId of binding.entryIds || []) {
      entryIds.add(normalizeRequiredString(entryId, 'entryId'));
    }
    byOwnerId.set(ownerId, entryIds);
  }
  return [...byOwnerId.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([ownerId, entryIds]) => ({ ownerId, entryIds: [...entryIds].sort() }));
}

function normalizeBinding(binding: ExternalReferenceBinding | null): ExternalReferenceBinding | null {
  if (!binding) {
    return null;
  }
  return normalizeBindings([binding])[0] || null;
}

function externalReferenceFromModel(model: Model): ExternalReferenceRecord {
  const ownerLocator = model.get('ownerLocator');
  return {
    model,
    repoId: normalizeString(model.get('repoId')),
    entryId: normalizeString(model.get('entryId')),
    ownerKind: normalizeString(model.get('ownerKind')),
    ownerId: isRecord(ownerLocator) ? normalizeString(ownerLocator.ownerId) : '',
    ownerLocatorHash: normalizeString(model.get('ownerLocatorHash')),
    resolvedStatus: normalizeString(model.get('resolvedStatus')),
  };
}

function referenceNeedsUpdate(reference: ExternalReferenceRecord, values: Record<string, unknown>): boolean {
  return (
    reference.repoId !== values.repoId ||
    reference.entryId !== values.entryId ||
    reference.ownerKind !== values.ownerKind ||
    reference.ownerLocatorHash !== values.ownerLocatorHash ||
    reference.resolvedStatus !== values.resolvedStatus
  );
}

function dedupeOwners(references: ExternalReferenceRecord[]): ExternalReferenceOwnerSummary[] {
  const owners = new Map<string, ExternalReferenceOwnerSummary>();
  for (const reference of references) {
    const key = `${reference.ownerKind}\0${reference.ownerId}`;
    owners.set(key, { ownerKind: reference.ownerKind, ownerId: reference.ownerId });
  }
  return [...owners.values()].sort(
    (left, right) => left.ownerKind.localeCompare(right.ownerKind) || left.ownerId.localeCompare(right.ownerId),
  );
}

function hashExternalOwner(ownerKind: string, ownerId: string): string {
  return stableJsonHash({ kind: ownerKind, ownerId });
}

function normalizeRequiredString(value: unknown, label: string): string {
  const normalized = normalizeString(value);
  if (!normalized) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${label} is required`);
  }
  return normalized;
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
