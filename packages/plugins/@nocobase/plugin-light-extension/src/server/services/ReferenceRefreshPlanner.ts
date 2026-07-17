/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CompilePlan } from './AffectedEntryCompilePlanner';
import type { EntryReconcileResult } from './LightExtensionEntryService';

export type ReferenceRefreshPlan =
  | { mode: 'skip'; reason: string }
  | { mode: 'entries'; entryIds: string[]; reason: string }
  | { mode: 'repo'; reason: string };

export interface EntryRuntimeAvailabilityChange {
  entryId: string;
  beforeUsable: boolean;
  afterUsable: boolean;
}

export interface ReferenceRefreshPlanInput {
  compilePlan: CompilePlan | null | undefined;
  reconcileResult: EntryReconcileResult | null | undefined;
  runtimeAvailability: readonly EntryRuntimeAvailabilityChange[] | null | undefined;
  forceRepoReason?: string;
}

export function createReferenceRefreshPlan(input: ReferenceRefreshPlanInput): ReferenceRefreshPlan {
  if (input.forceRepoReason) {
    return {
      mode: 'repo',
      reason: input.forceRepoReason,
    };
  }
  if (!input.compilePlan || !input.reconcileResult || !input.runtimeAvailability) {
    return {
      mode: 'repo',
      reason: 'reference_refresh_inputs_incomplete',
    };
  }
  if (input.compilePlan.entryChanges.changes.some((change) => change.reasons.includes('conservative_unknown'))) {
    return {
      mode: 'repo',
      reason: 'affected_entry_scope_unknown',
    };
  }

  const runtimeByEntryId = new Map<string, EntryRuntimeAvailabilityChange>();
  for (const runtime of input.runtimeAvailability) {
    const existing = runtimeByEntryId.get(runtime.entryId);
    if (existing && (existing.beforeUsable !== runtime.beforeUsable || existing.afterUsable !== runtime.afterUsable)) {
      return {
        mode: 'repo',
        reason: 'runtime_availability_conflict',
      };
    }
    runtimeByEntryId.set(runtime.entryId, runtime);
  }

  const compiledEntryIds = input.compilePlan.compileCandidates
    .map((entry) => entry.id)
    .filter((entryId): entryId is string => Boolean(entryId));
  if (compiledEntryIds.some((entryId) => !runtimeByEntryId.has(entryId))) {
    return {
      mode: 'repo',
      reason: 'runtime_availability_incomplete',
    };
  }

  const entryIds = new Set<string>();
  for (const change of input.compilePlan.entryChanges.changes) {
    if (
      !change.flags.added &&
      !change.flags.removed &&
      !change.flags.settingsChanged &&
      !change.flags.healthStatusChanged
    ) {
      continue;
    }
    const entryId = change.entryId || findReconciledEntryId(input.reconcileResult, change.identity);
    if (!entryId) {
      return {
        mode: 'repo',
        reason: 'entry_identity_reconcile_incomplete',
      };
    }
    entryIds.add(entryId);
  }
  addReconcileEntryIds(entryIds, input.reconcileResult.createdEntries);
  addReconcileEntryIds(entryIds, input.reconcileResult.restoredEntries);
  addReconcileEntryIds(entryIds, input.reconcileResult.missingEntries);
  addReconcileEntryIds(entryIds, input.reconcileResult.settingsChangedEntries);
  for (const runtime of runtimeByEntryId.values()) {
    if (runtime.beforeUsable !== runtime.afterUsable) {
      entryIds.add(runtime.entryId);
    }
  }

  const sortedEntryIds = [...entryIds].sort(compareText);
  if (sortedEntryIds.length === 0) {
    return {
      mode: 'skip',
      reason: 'reference_fingerprint_unchanged',
    };
  }
  return {
    mode: 'entries',
    entryIds: sortedEntryIds,
    reason: 'entry_reference_fingerprint_changed',
  };
}

function addReconcileEntryIds(target: Set<string>, changes: EntryReconcileResult['changes']): void {
  for (const change of changes) {
    target.add(change.entry.id);
  }
}

function findReconciledEntryId(
  reconcileResult: EntryReconcileResult,
  identity: CompilePlan['entryChanges']['changes'][number]['identity'],
): string | undefined {
  return reconcileResult.changes.find(
    (change) =>
      change.entry.target === identity.target &&
      change.entry.kind === identity.kind &&
      change.entry.entryName === identity.entryName,
  )?.entry.id;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
