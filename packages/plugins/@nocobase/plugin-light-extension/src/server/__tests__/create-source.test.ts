/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import JSZip from 'jszip';
import { vi } from 'vitest';

import { DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES } from '../../shared/default-template';
import PluginLightExtensionServer from '../plugin';
import type { LightExtensionCreateJobRecord } from '../../shared/types';
import { LightExtensionCreateJobExecutor } from '../services/LightExtensionCreateJobExecutor';
import type { LightExtensionCreateFromRemoteService } from '../services/LightExtensionCreateFromRemoteService';
import type { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import type { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';

describe('plugin-light-extension initial source creation', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginLightExtensionServer],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('creates and compiles the default source as the first version when ZIP is omitted', async () => {
    const createResponse = await app.agent().post('/lightExtensionRepos:create').send({ name: 'Default Source' });
    expect(createResponse.status).toBe(202);
    const job = await waitForCreateJob(app, createResponse.body.data.id);
    expect(job).toMatchObject({ status: 'succeeded', resultRepoId: job.targetRepoId });
    const repoResponse = await app.agent().resource('lightExtensionRepos').get({ filterByTk: job.resultRepoId });
    const repo = repoResponse.body.data;
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

    expect(repo).toMatchObject({
      healthStatus: 'ready',
      headCommitId: expect.stringMatching(/^vscc_/),
      lastCompiledAt: expect.any(String),
    });
    expect(pullResponse.body.data.files.map((file) => file.path).sort()).toEqual(
      DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => file.path).sort(),
    );
    expect(historyResponse.body.data).toHaveLength(1);
    expect(entriesResponse.body.data).toHaveLength(6);
    expect(entriesResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'js-block', entryName: 'welcome-card', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-action', entryName: 'refresh-data', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-field', entryName: 'status-tag', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-field', entryName: 'record-status-column', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-item', entryName: 'form-total-preview', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-page', entryName: 'hello-page', healthStatus: 'ready' }),
      ]),
    );
    expect(entriesResponse.body.data.some((entry) => entry.kind === 'runjs')).toBe(false);
    expect(entriesResponse.body.data.every((entry) => Boolean(entry.runtimeArtifact?.code))).toBe(true);
  });

  it('rejects uploaded source that uses the removed generic RunJS root', async () => {
    const zip = new JSZip();
    zip.file('src/client/runjs/example/index.ts', 'return 1;\n');
    zip.file('src/client/runjs/example/entry.json', '{"schemaVersion":1,"key":"example"}\n');
    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    const createResponse = await app
      .agent()
      .post('/lightExtensionRepos:create')
      .send({ name: 'Removed RunJS Source', zipBase64 });

    expect(createResponse.status).toBe(202);
    await expect(waitForCreateJob(app, createResponse.body.data.id)).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
    });
  });

  it('uses uploaded ZIP source for the first version and compiles it immediately', async () => {
    const zip = new JSZip();
    zip.file('uploaded/README.md', '# Uploaded\n');
    zip.file('uploaded/src/client/js-blocks/example/index.jsx', 'ctx.render(<div>Uploaded</div>);\n');
    zip.file('uploaded/src/client/js-blocks/example/entry.json', '{"schemaVersion":1,"key":"example"}\n');
    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    const createResponse = await app
      .agent()
      .post('/lightExtensionRepos:create')
      .send({ name: 'Uploaded Source', zipBase64 });
    expect(createResponse.status).toBe(202);
    const job = await waitForCreateJob(app, createResponse.body.data.id);
    expect(job.status).toBe('succeeded');
    const repoResponse = await app.agent().resource('lightExtensionRepos').get({ filterByTk: job.resultRepoId });
    const repo = repoResponse.body.data;
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
      .post('/lightExtensionRepos:create')
      .send({ name: 'Broken Uploaded Source', zipBase64 });

    expect(createResponse.status).toBe(202);
    await expect(waitForCreateJob(app, createResponse.body.data.id)).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
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
    Object.assign(repoService, { findInternalRepoById: vi.fn(async () => null) });
    const executor = new LightExtensionCreateJobExecutor(
      app.db,
      repoService,
      runtimeCompileService,
      {} as LightExtensionCreateFromRemoteService,
    );

    await expect(
      executor.execute(createJob('lecj_missing_commit', repoId, 'Missing Initial Commit')),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_ERROR',
      details: { repoId },
    });

    expect(runtimeCompileService.compileCurrentRuntime).not.toHaveBeenCalled();
    await expect(
      app.db.getRepository('lightExtensionRepos').findOne({
        filterByTk: repoId,
      }),
    ).resolves.toBeNull();
  });
});

async function waitForCreateJob(app: MockServer, jobId: string): Promise<LightExtensionCreateJobRecord> {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const record = await app.db.getRepository('lightExtensionCreateJobs').findOne({ filterByTk: jobId });
    if (record && ['succeeded', 'failed'].includes(String(record.get('status')))) {
      return record.toJSON() as LightExtensionCreateJobRecord;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Creation job ${jobId} did not finish`);
}

function createJob(id: string, targetRepoId: string, name: string): LightExtensionCreateJobRecord {
  return {
    id,
    applicationName: 'main',
    targetRepoId,
    name,
    normalizedName: 'missing-initial-commit',
    title: null,
    description: null,
    sourceType: 'template',
    status: 'running',
    payload: { sourceType: 'template', message: 'Initial light extension source' },
    resultRepoId: null,
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:missing',
    claimToken: 'claim-missing',
    leaseOwner: 'worker',
    leaseExpiresAt: new Date(Date.now() + 30_000).toISOString(),
    heartbeatAt: new Date().toISOString(),
    attempt: 1,
    maxAttempts: 3,
    actorUserId: null,
    requestId: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
