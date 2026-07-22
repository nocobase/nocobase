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
  it('consumes the server-canonical settings descriptor from the current RunJS workspace', async () => {
    const request = vi.fn(async () => ({
      data: {
        data: {
          repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_2' },
          files: [{ path: 'src/client/entry.json', content: '{ client parsing must not run' }],
          settingsDescriptor: {
            descriptorPath: 'src/client/entry.json',
            entryId: 'inline:repo_1:welcome-card',
            key: 'welcome-card',
            settingsSchemaHash: 'a'.repeat(64),
            settingsDefaultsHash: 'b'.repeat(64),
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
            diagnostics: [],
          },
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
      settingsSchemaHash: 'a'.repeat(64),
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
    ['missing file', 'entry_descriptor_missing'],
    ['bad JSON', 'entry_descriptor_json_invalid'],
    ['conflicting settings forms', 'entry_descriptor_settings_conflict'],
  ])('surfaces canonical diagnostics for %s', async (_label, diagnosticCode) => {
    const api = {
      request: vi.fn(async () => ({
        data: {
          data: {
            repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_1' },
            files: [],
            settingsDescriptor: {
              descriptorPath: 'src/client/entry.json',
              entryId: null,
              key: null,
              settingsSchemaHash: null,
              settingsDefaultsHash: null,
              schema: null,
              defaults: {},
              diagnostics: [
                {
                  code: diagnosticCode,
                  severity: 'error',
                  message: `Canonical ${diagnosticCode}`,
                  path: 'src/client/entry.json',
                },
              ],
            },
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
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
      status: 422,
      paths: ['src/client/entry.json'],
      details: {
        reasonCode: 'settings_invalid',
        diagnostics: [expect.objectContaining({ code: diagnosticCode })],
      },
    });
  });

  it('accepts the canonical no-settings descriptor without inventing a hash', async () => {
    const request = vi.fn(async () => ({
      data: {
        data: {
          repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_3' },
          files: [],
          settingsDescriptor: {
            descriptorPath: 'src/client/entry.json',
            entryId: 'inline:repo_1:no-settings',
            key: 'no-settings',
            settingsSchemaHash: null,
            settingsDefaultsHash: null,
            schema: null,
            defaults: {},
            diagnostics: [],
          },
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
      entryId: 'inline:repo_1:no-settings',
      settingsSchemaHash: null,
      schema: null,
      defaults: {},
    });
  });
});
