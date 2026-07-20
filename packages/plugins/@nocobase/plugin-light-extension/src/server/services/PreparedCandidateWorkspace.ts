/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import type {
  CanonicalCandidateChange,
  CanonicalCandidateFile,
  CanonicalCandidateSnapshot,
} from '../vsc-file/public-api';

import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionCommitRecord,
  LightExtensionRepoRecord,
  LightExtensionStoredTree,
} from '../../shared/types';
import type { LightExtensionWorkspaceValidationResult } from './LightExtensionValidator';

const candidateTransactions = new WeakMap<object, Transaction>();

export interface PreparedCandidateWorkspace {
  readonly repo: LightExtensionRepoRecord;
  readonly commit: LightExtensionCommitRecord;
  readonly tree: LightExtensionStoredTree;
  readonly baseCommitId: string | null;
  readonly baseTreeHash: string | null;
  readonly changedPaths: readonly string[];
  readonly changes: readonly CanonicalCandidateChange[];
  readonly files: readonly CanonicalCandidateFile[];
  readonly validation: LightExtensionWorkspaceValidationResult;
  readonly vscSnapshot: CanonicalCandidateSnapshot;
}

export function createPreparedCandidateWorkspace(
  input: {
    repo: LightExtensionRepoRecord;
    commit: LightExtensionCommitRecord;
    tree: LightExtensionStoredTree;
    validation: LightExtensionWorkspaceValidationResult;
    vscSnapshot: CanonicalCandidateSnapshot;
  },
  transaction: Transaction,
): PreparedCandidateWorkspace {
  assertCandidateIdentity(input);

  const candidate = Object.freeze({
    repo: Object.freeze({ ...input.repo }),
    commit: Object.freeze({ ...input.commit }),
    tree: Object.freeze({ ...input.tree }),
    baseCommitId: input.vscSnapshot.baseCommitId,
    baseTreeHash: input.vscSnapshot.baseTreeHash,
    changedPaths: input.vscSnapshot.changedPaths,
    changes: input.vscSnapshot.changes,
    files: input.vscSnapshot.files,
    validation: input.validation,
    vscSnapshot: input.vscSnapshot,
  });
  candidateTransactions.set(candidate, transaction);
  return candidate;
}

export function assertPreparedCandidateWorkspace(
  candidate: PreparedCandidateWorkspace,
  expected: {
    transaction?: Transaction;
    repoId?: string;
    commitId?: string;
  } = {},
): void {
  const transaction = candidateTransactions.get(candidate);
  if (!transaction) {
    throw invalidCandidate('Candidate workspace was not prepared by the light-extension file service');
  }
  if (expected.transaction && transaction !== expected.transaction) {
    throw invalidCandidate('Candidate workspace cannot be reused across transactions');
  }
  if (expected.repoId && candidate.repo.id !== expected.repoId) {
    throw invalidCandidate('Candidate workspace belongs to a different repository');
  }
  if (expected.commitId && candidate.commit.id !== expected.commitId) {
    throw invalidCandidate('Candidate workspace belongs to a different commit');
  }

  assertCandidateIdentity(candidate);
  if (
    candidate.files !== candidate.vscSnapshot.files ||
    candidate.changedPaths !== candidate.vscSnapshot.changedPaths ||
    candidate.changes !== candidate.vscSnapshot.changes
  ) {
    throw invalidCandidate('Candidate workspace snapshot references are inconsistent');
  }
}

function assertCandidateIdentity(input: {
  repo: LightExtensionRepoRecord;
  commit: LightExtensionCommitRecord;
  tree: LightExtensionStoredTree;
  vscSnapshot: CanonicalCandidateSnapshot;
}): void {
  if (
    input.repo.headCommitId !== input.commit.id ||
    input.commit.treeHash !== input.tree.hash ||
    input.vscSnapshot.commitId !== input.commit.id ||
    input.vscSnapshot.treeHash !== input.tree.hash
  ) {
    throw invalidCandidate('Candidate workspace identity does not match its repository, commit, and tree');
  }
}

function invalidCandidate(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', message);
}
