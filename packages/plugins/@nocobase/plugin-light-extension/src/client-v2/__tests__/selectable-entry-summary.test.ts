/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { listSelectableLightExtensionEntries, type ApiClientLike } from '../api/lightExtensionEntriesRequests';

describe('light extension selectable entry summary', () => {
  it('uses the runtimeAvailable summary contract without runtime artifact payloads', async () => {
    const summary = {
      id: 'entry_1',
      repoId: 'repo_1',
      kind: 'js-block',
      entryName: 'example',
      entryPath: 'src/client/js-blocks/example/index.tsx',
      title: 'Example',
      settingsSchema: null,
      settingsDefaultsHash: 'settings_hash',
      runtimeCodeHash: 'runtime_hash',
      runtimeAvailable: true as const,
    };
    const request = vi.fn().mockResolvedValue({ data: { data: [summary] } });
    const api: ApiClientLike = {
      request: async <TResponse>(options) => (await request(options)) as TResponse,
    };

    const entries = await listSelectableLightExtensionEntries(api, { kind: 'js-block' });

    expect(entries).toEqual([summary]);
    expect(entries[0].runtimeAvailable).toBe(true);
    expect(entries[0]).not.toHaveProperty('runtimeArtifact');
    expect(entries[0]).not.toHaveProperty('code');
    expect(entries[0]).not.toHaveProperty('sourceMap');
  });
});
