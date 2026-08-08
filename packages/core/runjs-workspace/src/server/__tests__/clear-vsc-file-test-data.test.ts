/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import path from 'path';

import { clearVscFileTestData } from './helpers/clearVscFileTestData';

describe('clearVscFileTestData', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({
      directory: path.resolve(__dirname, '../collections'),
    });
    await db.sync();
  });

  afterEach(async () => {
    await db?.close();
  });

  it('deletes repositories, remotes, and remote child records in foreign-key-safe order', async () => {
    await db.getRepository('vscFileRepositories').create({
      values: {
        id: 'vscr_cleanup',
        ownerType: 'plugin',
        ownerId: 'cleanup-test',
        name: 'main',
      },
    });
    await db.getRepository('vscFileRemotes').create({
      values: {
        id: 'vscrmt_cleanup',
        repoId: 'vscr_cleanup',
        name: 'origin',
        provider: 'test',
        config: {},
      },
    });
    await db.getRepository('vscFileSyncJobs').create({
      values: {
        id: 'vscjob_cleanup',
        remoteId: 'vscrmt_cleanup',
        remoteTargetVersion: 1,
        operation: 'push',
        idempotencyKey: 'cleanup-test',
      },
    });
    await db.getRepository('vscFileExternalCommitMaps').create({
      values: {
        id: 'vscmap_cleanup',
        remoteId: 'vscrmt_cleanup',
        remoteTargetVersion: 1,
        localCommitId: 'a'.repeat(64),
        remoteRevision: 'remote-cleanup',
        contentHash: 'b'.repeat(64),
      },
    });
    await db.getRepository('vscFileConflicts').create({
      values: {
        id: 'vsccf_cleanup',
        remoteId: 'vscrmt_cleanup',
        remoteTargetVersion: 1,
        reasonCode: 'cleanup-test',
      },
    });

    await clearVscFileTestData(db);

    expect(await db.getRepository('vscFileSyncJobs').count()).toBe(0);
    expect(await db.getRepository('vscFileExternalCommitMaps').count()).toBe(0);
    expect(await db.getRepository('vscFileConflicts').count()).toBe(0);
    expect(await db.getRepository('vscFileRemotes').count()).toBe(0);
    expect(await db.getRepository('vscFileRefs').count()).toBe(0);
    expect(await db.getRepository('vscFileCommits').count()).toBe(0);
    expect(await db.getRepository('vscFileTreeEntries').count()).toBe(0);
    expect(await db.getRepository('vscFileTrees').count()).toBe(0);
    expect(await db.getRepository('vscFileBlobs').count()).toBe(0);
    expect(await db.getRepository('vscFileRepositories').count()).toBe(0);
  });
});
