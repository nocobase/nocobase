/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { createInlineLightExtensionSettingsDescriptorProvider } from '../resolvers/InlineLightExtensionSettingsDescriptorProvider';

const locator = {
  kind: 'flowModel.step' as const,
  modelUid: 'model_1',
  flowKey: 'jsSettings',
  stepKey: 'runJs',
  paramPath: ['code'],
  versionPath: ['version'],
};

describe('inline light extension settings descriptor provider', () => {
  it('opens the current RunJS workspace and parses src/client/entry.json settings', async () => {
    const request = vi.fn(async () => ({
      data: {
        data: {
          repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_2' },
          files: [
            { path: 'src/client/index.tsx', content: 'ctx.render(<div />);' },
            {
              path: 'src/client/entry.json',
              content: JSON.stringify({
                schemaVersion: 1,
                key: 'welcome-card',
                settings: {
                  title: { type: 'string', default: 'Welcome', required: true },
                  enabled: { type: 'boolean', default: false },
                  count: { type: 'integer', default: 0 },
                  label: { type: 'string', default: '' },
                },
              }),
            },
          ],
        },
      },
    }));
    const provider = createInlineLightExtensionSettingsDescriptorProvider({ request } as ApiClientLike);

    await expect(
      provider.getSettingsDescriptor({
        sourceMode: 'inline',
        sourceRef: { type: 'vsc-file', repoId: 'repo_1', commitId: 'commit_1' },
        runJs: { code: 'ctx.render(<div />);', version: 'v2' },
        locator,
      }),
    ).resolves.toEqual({
      entryId: 'inline:repo_1:welcome-card',
      settingsSchemaHash: expect.stringMatching(/^commit_2:/u),
      schema: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', default: 'Welcome' },
          enabled: { type: 'boolean', default: false },
          count: { type: 'integer', default: 0 },
          label: { type: 'string', default: '' },
        },
      },
      defaults: { title: 'Welcome', enabled: false, count: 0, label: '' },
    });
    expect(request).toHaveBeenCalledWith({
      url: 'runJSSources:open',
      method: 'post',
      data: {
        locator,
        initialSource: { code: 'ctx.render(<div />);', version: 'v2' },
      },
    });
  });

  it.each([
    ['missing file', [{ path: 'src/client/index.tsx', content: 'return 1;' }]],
    ['bad JSON', [{ path: 'src/client/entry.json', content: '{' }]],
    [
      'conflicting settings forms',
      [
        {
          path: 'src/client/entry.json',
          content: JSON.stringify({
            schemaVersion: 1,
            key: 'legacy',
            settings: {},
            settingsSchema: { type: 'object', properties: {} },
          }),
        },
      ],
    ],
  ])('returns no descriptor for %s', async (_label, files) => {
    const api = {
      request: vi.fn(async () => ({
        data: {
          data: {
            repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_1' },
            files,
          },
        },
      })),
    } as ApiClientLike;
    const provider = createInlineLightExtensionSettingsDescriptorProvider(api);

    await expect(
      provider.getSettingsDescriptor({
        sourceMode: 'inline',
        sourceRef: { type: 'vsc-file', repoId: 'repo_1', commitId: 'commit_1' },
        locator,
      }),
    ).resolves.toBeUndefined();
  });

  it('accepts the JSON Schema descriptor form with the same defaults contract', async () => {
    const request = vi.fn(async () => ({
      data: {
        data: {
          repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_3' },
          files: [
            {
              path: 'src/client/entry.json',
              content: JSON.stringify({
                schemaVersion: 1,
                key: 'schema-form',
                settingsSchema: {
                  type: 'object',
                  properties: {
                    enabled: { type: 'boolean', default: false },
                    count: { type: 'integer', default: 0 },
                    label: { type: 'string', default: '' },
                  },
                },
              }),
            },
          ],
        },
      },
    }));
    const provider = createInlineLightExtensionSettingsDescriptorProvider({ request } as ApiClientLike);

    await expect(
      provider.getSettingsDescriptor({
        sourceMode: 'inline',
        sourceRef: { type: 'vsc-file', repoId: 'repo_1' },
        locator,
      }),
    ).resolves.toMatchObject({
      entryId: 'inline:repo_1:schema-form',
      schema: { type: 'object' },
      defaults: { enabled: false, count: 0, label: '' },
    });
  });
});
