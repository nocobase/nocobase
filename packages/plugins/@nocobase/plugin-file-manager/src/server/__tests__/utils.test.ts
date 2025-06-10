/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getApp } from '.';
import PluginFileManagerServer from '../server';

import { STORAGE_TYPE_LOCAL } from '../../constants';

import { getFileKey } from '../utils';

describe('file manager > utils', () => {
  let app;
  let agent;
  let db;
  let plugin: PluginFileManagerServer;
  let StorageRepo;
  let AttachmentRepo;
  let local;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;
    plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;

    AttachmentRepo = db.getCollection('attachments').repository;
    StorageRepo = db.getCollection('storages').repository;
    local = await StorageRepo.findOne({
      filter: {
        type: STORAGE_TYPE_LOCAL,
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('getFileKey', () => {
    it('path as null should works', async () => {
      expect(getFileKey({ path: null, filename: 'test.jpg' })).toBe('test.jpg');
    });
  });
});
