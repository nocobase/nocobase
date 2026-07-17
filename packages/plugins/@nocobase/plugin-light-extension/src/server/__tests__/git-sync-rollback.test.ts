/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import {
  createGitSyncAcceptanceFixture,
  type GitSyncAcceptanceFixture,
  validGitSyncFiles,
} from './helpers/gitSyncAcceptance';

describe('light extension Git sync rollback and race acceptance', () => {
  let fixture: GitSyncAcceptanceFixture;

  beforeEach(async () => {
    fixture = await createGitSyncAcceptanceFixture();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.close();
  });

  it('rolls back repo, VSC, Entry, artifact, remote, map, and job when initial baseline persistence fails', async () => {
    const countsBefore = await persistenceCounts();
    vi.spyOn(fixture.runtime, 'establishInitialBaseline').mockRejectedValueOnce(new Error('injected baseline failure'));

    await expect(fixture.createFromRemote('Atomic Create Rollback')).rejects.toThrow('injected baseline failure');
    await expect(persistenceCounts()).resolves.toEqual(countsBefore);
  });

  it('rolls back Head, Entry, artifact, reference, map, and job finalization when Pull compilation fails', async () => {
    const created = await fixture.createFromRemote('Compile Rollback');
    const headBefore = created.repo.headCommitId;
    const entryBefore = await fixture.app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: created.repo.id, entryName: 'sales-kpi' },
    });
    const artifactCountBefore = await fixture.app.db.getRepository('lightExtensionRuntimeArtifacts').count();
    const referenceCountBefore = await fixture.app.db.getRepository('lightExtensionReferences').count();
    fixture.adapter.advanceRemote([
      {
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        content: "import Missing from './missing';\nctx.render(<Missing />);\n",
        language: 'typescript',
      },
      validGitSyncFiles()[1],
    ]);
    const input = await fixture.createPullInput(created.repo.id);
    const internal = await fixture.repoService.getInternalRepo(created.repo.id);
    const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');
    const mapBefore = await fixture.app.db.getRepository('vscFileExternalCommitMaps').findOne({
      filter: { remoteId: remote?.id },
      sort: ['-createdAt'],
    });

    await expect(fixture.pullService.pull(input)).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
    });

    await expect(fixture.repoService.getRepo(created.repo.id)).resolves.toMatchObject({ headCommitId: headBefore });
    const entryAfter = await fixture.app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: created.repo.id, entryName: 'sales-kpi' },
    });
    expect(entryAfter?.get('artifactHash')).toBe(entryBefore?.get('artifactHash'));
    await expect(fixture.app.db.getRepository('lightExtensionRuntimeArtifacts').count()).resolves.toBe(
      artifactCountBefore,
    );
    await expect(fixture.app.db.getRepository('lightExtensionReferences').count()).resolves.toBe(referenceCountBefore);
    await expect(
      fixture.app.db.getRepository('vscFileExternalCommitMaps').findOne({
        filter: { remoteId: remote?.id },
        sort: ['-createdAt'],
      }),
    ).resolves.toMatchObject({ id: mapBefore?.get('id') });
    await expect(
      fixture.app.db
        .getRepository('vscFileSyncJobs')
        .findOne({ filter: { remoteId: remote?.id }, sort: ['-createdAt'] }),
    ).resolves.toMatchObject({ status: 'failed' });
  });

  it('refuses to apply after local Head or remote target changes during fetch', async () => {
    const localRace = await fixture.createFromRemote('Local Fetch Race');
    fixture.adapter.advanceRemote(validGitSyncFiles('Remote local-race update'));
    const localInput = await fixture.createPullInput(localRace.repo.id);
    const fetchSnapshot = fixture.adapter.fetchSnapshot.bind(fixture.adapter);
    vi.spyOn(fixture.adapter, 'fetchSnapshot').mockImplementationOnce(async (target, expectedRevision) => {
      const result = await fetchSnapshot(target, expectedRevision);
      await fixture.runtimeCompileService.saveSource({
        repoId: localRace.repo.id,
        expectedHeadCommitId: localRace.repo.headCommitId,
        message: 'concurrent local write',
        files: [{ path: 'src/shared/concurrent.ts', content: 'export const concurrent = true;\n' }],
      });
      return result;
    });
    await expect(fixture.pullService.pull(localInput)).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SYNC_LOCAL_OUTDATED',
    });

    const targetRace = await fixture.createFromRemote('Target Fetch Race');
    fixture.adapter.advanceRemote(validGitSyncFiles('Remote target-race update'));
    const targetInput = await fixture.createPullInput(targetRace.repo.id);
    vi.spyOn(fixture.adapter, 'fetchSnapshot').mockImplementationOnce(async (target, expectedRevision) => {
      const result = await fetchSnapshot(target, expectedRevision);
      const internal = await fixture.repoService.getInternalRepo(targetRace.repo.id);
      const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');
      if (!remote) {
        throw new Error('Expected an origin remote');
      }
      await fixture.app.db.getRepository('vscFileRemotes').update({
        filterByTk: remote.id,
        values: { version: remote.version + 1, status: 'disabled' },
      });
      return result;
    });
    await expect(fixture.pullService.pull(targetInput)).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SYNC_REMOTE_CHANGED',
    });
  });

  async function persistenceCounts() {
    return {
      repos: await fixture.app.db.getRepository('lightExtensionRepos').count(),
      vscRepos: await fixture.app.db.getRepository('vscFileRepositories').count(),
      commits: await fixture.app.db.getRepository('vscFileCommits').count(),
      entries: await fixture.app.db.getRepository('lightExtensionEntries').count(),
      artifacts: await fixture.app.db.getRepository('lightExtensionRuntimeArtifacts').count(),
      remotes: await fixture.app.db.getRepository('vscFileRemotes').count(),
      maps: await fixture.app.db.getRepository('vscFileExternalCommitMaps').count(),
      jobs: await fixture.app.db.getRepository('vscFileSyncJobs').count(),
    };
  }
});
