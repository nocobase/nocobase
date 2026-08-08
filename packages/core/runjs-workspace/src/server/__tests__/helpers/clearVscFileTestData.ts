/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';

export async function clearVscFileTestData(db: Database): Promise<void> {
  await db.sequelize.transaction(async (transaction) => {
    await db.getCollection('vscFileSyncJobs').model.destroy({ where: {}, transaction });
    await db.getCollection('vscFileExternalCommitMaps').model.destroy({ where: {}, transaction });
    await db.getCollection('vscFileConflicts').model.destroy({ where: {}, transaction });
    await db.getCollection('vscFileRemotes').model.destroy({ where: {}, transaction });
    await db.getCollection('vscFileRefs').model.destroy({ where: {}, transaction });
    await db.getCollection('vscFileCommits').model.destroy({ where: {}, transaction });
    await db.getCollection('vscFileTreeEntries').model.destroy({ where: {}, transaction });
    await db.getCollection('vscFileTrees').model.destroy({ where: {}, transaction });
    await db.getCollection('vscFileBlobs').model.destroy({ where: {}, transaction });
    await db.getCollection('vscFileRepositories').model.destroy({ where: {}, transaction });
  });
}
