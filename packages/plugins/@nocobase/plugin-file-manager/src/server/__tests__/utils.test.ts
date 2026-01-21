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

import { cloudFilenameGetter, getFileKey } from '../utils';

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
    it('handles null path', async () => {
      expect(getFileKey({ path: null, filename: 'test.jpg' })).toBe('test.jpg');
    });
  });

  describe('cloudFilenameGetter', () => {
    const testFilename = '[]中文报告! 1%~50.4% (123) {$#}.txt';
    const asciiFilename = 'report.txt';
    const getFilename = (storage, originalname) =>
      new Promise<string>((resolve, reject) => {
        cloudFilenameGetter(storage)(null, { originalname }, (err, filename) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(filename);
        });
      });

    it('keeps utf8 filename as-is', async () => {
      const storage = { renameMode: 'none', path: 'uploads/' };
      const filename = await getFilename(storage, testFilename);
      expect(filename).toBe(`uploads/${testFilename}`);
    });

    it('decodes binary-encoded filename', async () => {
      const storage = { renameMode: 'none', path: '' };
      const originalname = Buffer.from(testFilename, 'utf8').toString('binary');
      const filename = await getFilename(storage, originalname);
      expect(filename).toBe(testFilename);
    });

    it('keeps ascii filename when renameMode is none', async () => {
      const storage = { renameMode: 'none', path: 'uploads' };
      const filename = await getFilename(storage, asciiFilename);
      expect(filename).toBe(`uploads/${asciiFilename}`);
    });

    it('uses random name when renameMode is random', async () => {
      const storage = { renameMode: 'random', path: 'uploads' };
      const filename = await getFilename(storage, asciiFilename);
      expect(filename).toMatch(/^uploads\/[a-f0-9]{32}\.txt$/);
    });

    it('adds uid suffix when renameMode is default', async () => {
      const storage = { path: 'uploads' };
      const filename = await getFilename(storage, asciiFilename);
      expect(filename).toMatch(/^uploads\/report-[0-9a-z]{6}\.txt$/);
    });
  });
});
