/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Transaction } from '@nocobase/database';
import PluginVscFileServer from '../vsc-file';
import { MockServer, createMockServer } from '@nocobase/test';
import JSZip from 'jszip';
import { vi } from 'vitest';

import { DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES } from '../../shared/default-template';
import PluginLightExtensionServer from '../plugin';
import { createLightExtensionReposResource } from '../resources/lightExtensionRepos';
import type { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import type { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';

describe('plugin-light-extension initial source creation', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginVscFileServer, PluginLightExtensionServer],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('creates and compiles the default source as the first version when ZIP is omitted', async () => {
    const createResponse = await app
      .agent()
      .resource('lightExtensionRepos')
      .create({
        values: { name: 'Default Source' },
      });
    const repo = createResponse.body.data;
    const pullResponse = await app
      .agent()
      .resource('lightExtensionFiles')
      .pull({
        values: { repoId: repo.id, includeContent: 'all' },
      });
    const historyResponse = await app
      .agent()
      .resource('lightExtensionFiles')
      .listCommits({
        values: { repoId: repo.id },
      });
    const entriesResponse = await app
      .agent()
      .resource('lightExtensionEntries')
      .list({
        values: { repoId: repo.id },
      });

    expect(createResponse.status).toBe(200);
    expect(repo).toMatchObject({
      healthStatus: 'ready',
      headCommitId: expect.stringMatching(/^vscc_/),
      lastCompiledAt: expect.any(String),
    });
    expect(pullResponse.body.data.files.map((file) => file.path).sort()).toEqual(
      DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => file.path).sort(),
    );
    expect(historyResponse.body.data).toHaveLength(1);
    expect(entriesResponse.body.data).toHaveLength(7);
    expect(entriesResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'js-block', entryName: 'welcome-card', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-action', entryName: 'refresh-data', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-field', entryName: 'status-tag', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-field', entryName: 'record-status-column', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-item', entryName: 'form-total-preview', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'runjs', entryName: 'calculate-subtotal', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-page', entryName: 'hello-page', healthStatus: 'ready' }),
      ]),
    );
    expect(entriesResponse.body.data.every((entry) => Boolean(entry.runtimeArtifact?.code))).toBe(true);
  });

  it('uses uploaded ZIP source for the first version and compiles it immediately', async () => {
    const zip = new JSZip();
    zip.file('uploaded/README.md', '# Uploaded\n');
    zip.file('uploaded/src/client/js-blocks/example/index.jsx', 'ctx.render(<div>Uploaded</div>);\n');
    zip.file('uploaded/src/client/js-blocks/example/entry.json', '{"schemaVersion":1,"key":"example"}\n');
    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    const createResponse = await app
      .agent()
      .resource('lightExtensionRepos')
      .create({
        values: {
          name: 'Uploaded Source',
          zipBase64,
        },
      });
    const repo = createResponse.body.data;
    const pullResponse = await app
      .agent()
      .resource('lightExtensionFiles')
      .pull({
        values: { repoId: repo.id, includeContent: 'all' },
      });
    const entriesResponse = await app
      .agent()
      .resource('lightExtensionEntries')
      .list({
        values: { repoId: repo.id },
      });

    expect(createResponse.status).toBe(200);
    expect(repo).toMatchObject({ healthStatus: 'ready', headCommitId: expect.any(String) });
    expect(pullResponse.body.data.files.map((file) => file.path)).toEqual([
      'README.md',
      'src/client/js-blocks/example/entry.json',
      'src/client/js-blocks/example/index.jsx',
    ]);
    expect(entriesResponse.body.data).toEqual([
      expect.objectContaining({
        kind: 'js-block',
        entryName: 'example',
        healthStatus: 'ready',
        runtimeArtifact: expect.objectContaining({ code: expect.any(String) }),
      }),
    ]);
  });

  it('rolls back repository creation when uploaded source cannot be compiled', async () => {
    const zip = new JSZip();
    zip.file('src/client/js-blocks/broken/index.tsx', "import Missing from './missing';\nctx.render(<Missing />);\n");
    zip.file('src/client/js-blocks/broken/entry.json', '{"schemaVersion":1,"key":"broken"}\n');
    const zipBase64 = await zip.generateAsync({ type: 'base64' });
    const repoCount = await app.db.getRepository('lightExtensionRepos').count();
    const vscRepoCount = await app.db.getRepository('vscFileRepositories').count();
    const commitCount = await app.db.getRepository('vscFileCommits').count();

    const createResponse = await app
      .agent()
      .resource('lightExtensionRepos')
      .create({
        values: {
          name: 'Broken Uploaded Source',
          zipBase64,
        },
      });

    expect(createResponse.status).toBe(422);
    expect(createResponse.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            severity: 'error',
            path: 'src/client/js-blocks/broken/index.tsx',
          }),
        ]),
      },
    });
    await expect(app.db.getRepository('lightExtensionRepos').count()).resolves.toBe(repoCount);
    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(vscRepoCount);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
  });

  it('rolls back repository creation when the initial source commit is missing', async () => {
    const repoId = 'ler_missing_initial_commit';
    const repoService = {
      createRepo: vi.fn(async (_input: unknown, ctx: { transaction?: Transaction }) => {
        await app.db.getRepository('lightExtensionRepos').create({
          values: {
            id: repoId,
            vscRepoId: 'vscr_missing_initial_commit',
            name: 'Missing Initial Commit',
            normalizedName: 'missing-initial-commit',
            headCommitId: null,
          },
          transaction: ctx.transaction,
        });

        return {
          id: repoId,
          headCommitId: null,
        };
      }),
    } as unknown as LightExtensionRepoService;
    const runtimeCompileService = {
      compileCurrentRuntime: vi.fn(),
    } as unknown as LightExtensionRuntimeCompileService;
    const resource = createLightExtensionReposResource(app.db, repoService, runtimeCompileService);
    const next = vi.fn(async () => {});
    const ctx = {
      action: {
        params: {
          values: {
            name: 'Missing Initial Commit',
          },
        },
      },
      request: {
        headers: {},
      },
    } as unknown as Context;

    await resource.actions?.create?.(ctx, next);

    expect((ctx as { status?: number }).status).toBe(500);
    expect((ctx as { body?: unknown }).body).toMatchObject({
      errors: [
        expect.objectContaining({
          code: 'LIGHT_EXTENSION_SOURCE_ERROR',
          details: { repoId },
        }),
      ],
    });
    expect(runtimeCompileService.compileCurrentRuntime).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    await expect(
      app.db.getRepository('lightExtensionRepos').findOne({
        filterByTk: repoId,
      }),
    ).resolves.toBeNull();
  });
});
