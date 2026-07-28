/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MockServer } from '@nocobase/test/server';
import { MAX_BACKUP_KEEP_COUNT } from '../../constants';
import { SETTINGS } from '../utils';
import { getApp } from './index';

describe('backup settings validation', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await getApp();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('accepts the maximum backup retention value', async () => {
    const settings = await app.db.getRepository(SETTINGS).findOne();
    const response = await app
      .agent()
      .resource(SETTINGS)
      .update({
        filterByTk: settings.get('id'),
        values: { keep: MAX_BACKUP_KEEP_COUNT },
      });

    expect(response.status).toBe(200);
    expect((await app.db.getRepository(SETTINGS).findOne()).get('keep')).toBe(MAX_BACKUP_KEEP_COUNT);
  });

  it.each([0, 1.5, MAX_BACKUP_KEEP_COUNT + 1])('rejects an invalid backup retention value: %s', async (keep) => {
    const settings = await app.db.getRepository(SETTINGS).findOne();
    const originalKeep = settings.get('keep');
    const response = await app
      .agent()
      .resource(SETTINGS)
      .update({
        filterByTk: settings.get('id'),
        values: { keep },
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(1);
    expect((await app.db.getRepository(SETTINGS).findOne()).get('keep')).toBe(originalKeep);
  });
});
