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

import { JsTemplateError } from '../../shared/errors';
import type { JsTemplateCommitRecord, JsTemplateProject, JsTemplateStoredTree } from '../../shared/types';
import type { JsTemplateWorkspaceValidationResult } from './JsTemplateValidator';

const candidateTransactions = new WeakMap<object, Transaction>();

export interface PreparedCandidateWorkspace {
  readonly project: JsTemplateProject;
  readonly commit: JsTemplateCommitRecord;
  readonly tree: JsTemplateStoredTree;
  readonly baseCommitId: string | null;
  readonly baseTreeHash: string | null;
  readonly changedPaths: readonly string[];
  readonly changes: readonly CanonicalCandidateChange[];
  readonly files: readonly CanonicalCandidateFile[];
  readonly validation: JsTemplateWorkspaceValidationResult;
  readonly vscSnapshot: CanonicalCandidateSnapshot;
}

export function createPreparedCandidateWorkspace(
  input: {
    project: JsTemplateProject;
    commit: JsTemplateCommitRecord;
    tree: JsTemplateStoredTree;
    validation: JsTemplateWorkspaceValidationResult;
    vscSnapshot: CanonicalCandidateSnapshot;
  },
  transaction: Transaction,
): PreparedCandidateWorkspace {
  assertCandidateIdentity(input);

  const candidate = Object.freeze({
    project: Object.freeze({ ...input.project }),
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
    projectId?: string;
    commitId?: string;
  } = {},
): void {
  const transaction = candidateTransactions.get(candidate);
  if (!transaction) {
    throw invalidCandidate('Candidate workspace was not prepared by the js-template file service');
  }
  if (expected.transaction && transaction !== expected.transaction) {
    throw invalidCandidate('Candidate workspace cannot be reused across transactions');
  }
  if (expected.projectId && candidate.project.id !== expected.projectId) {
    throw invalidCandidate('Candidate workspace belongs to a different JS Template project');
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
    throw invalidCandidate('Candidate workspace snapshot usages are inconsistent');
  }
}

function assertCandidateIdentity(input: {
  project: JsTemplateProject;
  commit: JsTemplateCommitRecord;
  tree: JsTemplateStoredTree;
  vscSnapshot: CanonicalCandidateSnapshot;
}): void {
  if (
    input.project.headCommitId !== input.commit.id ||
    input.commit.treeHash !== input.tree.hash ||
    input.vscSnapshot.commitId !== input.commit.id ||
    input.vscSnapshot.treeHash !== input.tree.hash
  ) {
    throw invalidCandidate('Candidate workspace identity does not match its JS Template project, commit, and tree');
  }
}

function invalidCandidate(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', message);
}
