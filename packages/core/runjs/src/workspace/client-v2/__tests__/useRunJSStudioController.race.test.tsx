/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { buildWorkspaceDraftToken } from '../runjs-studio/workspaceUtils';

describe('RunJS Studio draft tokens', () => {
  it('have one compact schema independent of workspace content and server Head', () => {
    const token = buildWorkspaceDraftToken(12, 3, 'v2');

    expect(token.length).toBeLessThan(100);
    expect(JSON.parse(token)).toEqual({
      draftRevision: 12,
      runtimeVersion: 'v2',
      workspaceSession: 3,
    });
  });

  it('invalidates responses for a newer draft, workspace session, or runtime', () => {
    const current = buildWorkspaceDraftToken(1, 1, 'v2');

    expect(buildWorkspaceDraftToken(2, 1, 'v2')).not.toBe(current);
    expect(buildWorkspaceDraftToken(1, 2, 'v2')).not.toBe(current);
    expect(buildWorkspaceDraftToken(1, 1, 'v3')).not.toBe(current);
  });
});
