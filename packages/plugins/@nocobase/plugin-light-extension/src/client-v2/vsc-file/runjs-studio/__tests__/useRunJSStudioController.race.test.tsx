/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { buildWorkspaceSnapshotKey } from '../workspaceUtils';

const files = [{ content: 'x'.repeat(10 * 1024 * 1024), path: 'src/client/index.tsx', revision: 1 }];

function token(overrides: Partial<NonNullable<Parameters<typeof buildWorkspaceSnapshotKey>[3]>> = {}) {
  return buildWorkspaceSnapshotKey(files, 'src/client/index.tsx', 'v2', {
    locatorKey: 'locator-a',
    operationSequence: 1,
    projectRevision: 1,
    repoId: 'repo-a',
    workspaceGeneration: 1,
    ...overrides,
  });
}

describe('RunJS Studio operation tokens', () => {
  it('stay compact for a 10 MiB workspace', () => {
    expect(token().length).toBeLessThan(300);
  });

  it('invalidate responses across operations, edits, repositories, and locators', () => {
    const current = token();
    expect(token({ operationSequence: 2 })).not.toBe(current);
    expect(token({ projectRevision: 2 })).not.toBe(current);
    expect(token({ workspaceGeneration: 2 })).not.toBe(current);
    expect(token({ repoId: 'repo-b' })).not.toBe(current);
    expect(token({ locatorKey: 'locator-b' })).not.toBe(current);
    expect(buildWorkspaceSnapshotKey(files, 'src/client/other.tsx', 'v2', JSON.parse(current))).not.toBe(current);
    expect(buildWorkspaceSnapshotKey(files, 'src/client/index.tsx', 'v3', JSON.parse(current))).not.toBe(current);
  });
});
