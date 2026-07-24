/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';

import {
  assertPreparedCandidateWorkspace,
  createPreparedCandidateWorkspace,
} from '../services/PreparedCandidateWorkspace';

describe('PreparedCandidateWorkspace identity guard', () => {
  it('binds candidates to the creating transaction, repository, commit, and tree', () => {
    const transaction = { id: 'tx_candidate' } as unknown as Transaction;
    const candidate = createPreparedCandidateWorkspace(
      {
        repo: {
          id: 'repo_candidate',
          name: 'candidate',
          normalizedName: 'candidate',
          title: null,
          description: null,
          lifecycleStatus: 'enabled',
          healthStatus: 'ready',
          headCommitId: 'commit_candidate',
          lastCompiledAt: null,
          createdAt: null,
          updatedAt: null,
        },
        commit: {
          id: 'commit_candidate',
          repoId: 'repo_candidate',
          hash: 'commit_hash_candidate',
          parentCommitId: null,
          treeHash: 'tree_candidate',
          seq: 1,
          message: 'candidate',
          authorId: null,
          metadata: {},
        },
        tree: {
          hash: 'tree_candidate',
          entryCount: 0,
          byteSize: 0,
        },
        validation: {
          accepted: true,
          diagnostics: [],
          entries: [],
          capabilities: {} as never,
        },
        vscSnapshot: {
          baseCommitId: null,
          baseTreeHash: null,
          commitId: 'commit_candidate',
          treeHash: 'tree_candidate',
          changedPaths: [],
          changes: [],
          files: [],
        },
      },
      transaction,
    );

    expect(() =>
      assertPreparedCandidateWorkspace(candidate, {
        transaction,
        repoId: 'repo_candidate',
        commitId: 'commit_candidate',
      }),
    ).not.toThrow();
    expect(() =>
      assertPreparedCandidateWorkspace(candidate, {
        transaction: { id: 'tx_other' } as unknown as Transaction,
      }),
    ).toThrow('cannot be reused across transactions');
    expect(() => assertPreparedCandidateWorkspace(candidate, { repoId: 'repo_other' })).toThrow(
      'belongs to a different repository',
    );
    expect(() => assertPreparedCandidateWorkspace(candidate, { commitId: 'commit_other' })).toThrow(
      'belongs to a different commit',
    );
    const forgedCandidate = { ...candidate };
    expect(() => assertPreparedCandidateWorkspace(forgedCandidate, { transaction })).toThrow(
      'was not prepared by the light-extension file service',
    );
    expect(() => assertPreparedCandidateWorkspace(structuredClone(candidate), { transaction })).toThrow(
      'was not prepared by the light-extension file service',
    );
    expect(Object.keys(candidate)).not.toContain('transaction');
  });
});
