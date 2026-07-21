/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useSyncExternalStore } from 'react';

import { uniqueLightExtensionProblems } from '../../shared/problems';
import type { LightExtensionProblem } from '../../shared/types';

export interface WorkspaceProblemStoreSnapshot {
  snapshotId: string;
  problems: LightExtensionProblem[];
  staleProblems: LightExtensionProblem[];
  errorCount: number;
  warningCount: number;
}

export interface ReplaceWorkspaceProblemsInput {
  producer: string;
  snapshotId: string;
  problems: readonly LightExtensionProblem[];
}

interface WorkspaceProblemBatch {
  snapshotId: string;
  problems: LightExtensionProblem[];
}

const EMPTY_SNAPSHOT: WorkspaceProblemStoreSnapshot = {
  snapshotId: '',
  problems: [],
  staleProblems: [],
  errorCount: 0,
  warningCount: 0,
};

export class WorkspaceProblemStore {
  private snapshotId = '';
  private readonly currentBatches = new Map<string, WorkspaceProblemBatch>();
  private readonly staleBatches = new Map<string, WorkspaceProblemBatch>();
  private readonly listeners = new Set<() => void>();
  private snapshot: WorkspaceProblemStoreSnapshot = EMPTY_SNAPSHOT;

  getSnapshot = (): WorkspaceProblemStoreSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setSnapshot(snapshotId: string): void {
    if (snapshotId === this.snapshotId) {
      return;
    }

    this.staleBatches.clear();
    for (const [producer, batch] of this.currentBatches) {
      this.staleBatches.set(producer, batch);
    }
    this.currentBatches.clear();
    this.snapshotId = snapshotId;
    this.publish();
  }

  replaceProblems(input: ReplaceWorkspaceProblemsInput): boolean {
    if (!input.snapshotId || input.snapshotId !== this.snapshotId) {
      return false;
    }

    const nextProblems = uniqueLightExtensionProblems(input.problems);
    if (nextProblems.length > 0) {
      this.currentBatches.set(input.producer, {
        snapshotId: input.snapshotId,
        problems: nextProblems,
      });
    } else {
      this.currentBatches.delete(input.producer);
    }
    this.staleBatches.delete(input.producer);
    this.publish();
    return true;
  }

  appendProblems(input: ReplaceWorkspaceProblemsInput): boolean {
    const current = this.currentBatches.get(input.producer)?.problems || [];
    return this.replaceProblems({
      ...input,
      problems: [...current, ...input.problems],
    });
  }

  clear(): void {
    this.currentBatches.clear();
    this.staleBatches.clear();
    this.publish();
  }

  private publish(): void {
    const problems = mergeBatches(this.currentBatches.values());
    const currentFingerprints = new Set(problems.map((problem) => problem.fingerprint));
    const staleProblems = mergeBatches(this.staleBatches.values()).filter(
      (problem) => !currentFingerprints.has(problem.fingerprint),
    );
    this.snapshot = {
      snapshotId: this.snapshotId,
      problems,
      staleProblems,
      errorCount: problems.filter((problem) => problem.severity === 'error').length,
      warningCount: problems.filter((problem) => problem.severity === 'warning').length,
    };
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export function useWorkspaceProblemStore(store: WorkspaceProblemStore): WorkspaceProblemStoreSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function getWorkspaceProblemRowKey(problem: LightExtensionProblem): string {
  const provenance = [
    ...(problem.provenance || []),
    { source: problem.source, phase: problem.phase, requestId: problem.requestId },
  ]
    .map((item) => `${item.source}:${item.phase}:${item.requestId}`)
    .sort()
    .join('|');
  return `${problem.fingerprint}:${provenance}`;
}

function mergeBatches(batches: Iterable<WorkspaceProblemBatch>): LightExtensionProblem[] {
  return uniqueLightExtensionProblems(Array.from(batches).flatMap((batch) => batch.problems));
}
