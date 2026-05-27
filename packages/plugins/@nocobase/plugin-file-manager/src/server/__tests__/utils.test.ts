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
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  getRepairedAttachmentValues,
  repairAttachmentFilenames,
  replaceInvisibleChars,
} from '../commands/repair-filenames';
import { AttachmentModel, StorageType } from '../storages';

const MOCK_REPAIR_STORAGE_TYPE = 'mock-repair-storage';
const describeLocalRepair = process.platform === 'win32' ? describe.skip : describe;

class MockRepairStorage extends StorageType {
  static sourceKeys = new Set<string>();
  static targetKeys = new Set<string>();
  static existsCalls: string[] = [];
  static copied: Array<{ source: string; target: string }> = [];
  static deleted: string[] = [];

  static reset() {
    this.sourceKeys = new Set();
    this.targetKeys = new Set();
    this.existsCalls = [];
    this.copied = [];
    this.deleted = [];
  }

  make() {
    return {} as never;
  }

  async exists(record: AttachmentModel) {
    const key = this.getFileKey(record);
    MockRepairStorage.existsCalls.push(key);
    return MockRepairStorage.sourceKeys.has(key) || MockRepairStorage.targetKeys.has(key);
  }

  async copy(source: AttachmentModel, target: AttachmentModel) {
    MockRepairStorage.copied.push({
      source: this.getFileKey(source),
      target: this.getFileKey(target),
    });
  }

  async delete(records: AttachmentModel[]) {
    MockRepairStorage.deleted.push(...records.map((record) => this.getFileKey(record)));
    return [records.length, []] as [number, AttachmentModel[]];
  }
}

describe('file manager > utils', () => {
  let app;
  let agent;
  let db;
  let plugin: PluginFileManagerServer;
  let StorageRepo;
  let AttachmentRepo;
  let FileRepo;
  let local;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;
    plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;

    AttachmentRepo = db.getCollection('attachments').repository;
    FileRepo = db.getCollection('files').repository;
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

    it('keeps unicode filename without binary-decoding it again', async () => {
      const storage = { renameMode: 'none', path: '' };
      const filename = await getFilename(storage, '1 场景_用户[普通表]-jypc1s.xlsx');
      expect(filename).toBe('1 场景_用户[普通表]-jypc1s.xlsx');
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

    it('replaces control characters in filename', async () => {
      const storage = { renameMode: 'none', path: '' };
      const filename = await getFilename(storage, '1 -o_(7[n\u001Ah].xlsx');
      expect(filename).toBe('1 -o_(7[n-h].xlsx');
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

  describe('repair filename helpers', () => {
    it('replaces C0 and C1 invisible characters only', () => {
      expect(replaceInvisibleChars('a\u0000b\u001Ac\u007Fd\u0085e')).toBe('a-b-c-d-e');
      expect(replaceInvisibleChars('1 场景_用户[普通表]-jypc1s.xlsx')).toBe('1 场景_用户[普通表]-jypc1s.xlsx');
    });

    it('returns repaired path and filename values', () => {
      expect(
        getRepairedAttachmentValues({
          path: 'reports\u001A',
          filename: 'file\u001A.xlsx',
        }),
      ).toEqual({
        path: 'reports-',
        filename: 'file-.xlsx',
      });
    });
  });

  describe('repairAttachmentFilenames with storage interface', () => {
    let mockStorage;

    beforeEach(async () => {
      MockRepairStorage.reset();
      plugin.registerStorageType(MOCK_REPAIR_STORAGE_TYPE, MockRepairStorage);
      mockStorage = await StorageRepo.create({
        values: {
          title: 'Mock repair storage',
          name: 'mock-repair-storage',
          type: MOCK_REPAIR_STORAGE_TYPE,
          baseUrl: '/mock',
          options: {},
        },
      });
      await plugin.loadStorages();
    });

    it('dry-runs through exists without copy, delete, or db updates', async () => {
      const oldPath = 'mock\u001A';
      const oldFilename = 'dry\u001A.xlsx';
      const oldKey = `${oldPath}/${oldFilename}`;
      MockRepairStorage.sourceKeys.add(oldKey);
      const attachment = await AttachmentRepo.create({
        values: {
          title: 'test',
          filename: oldFilename,
          extname: '.xlsx',
          path: oldPath,
          storageId: mockStorage.get('id'),
        },
      });

      const result = await repairAttachmentFilenames(app, plugin, { batchSize: 10 });

      expect(result.candidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: attachment.get('id'),
            oldKey,
            newKey: 'mock-/dry-.xlsx',
            sourceExists: true,
            targetExists: false,
            status: 'pending',
          }),
        ]),
      );
      expect(MockRepairStorage.existsCalls).toEqual([oldKey, 'mock-/dry-.xlsx']);
      expect(MockRepairStorage.copied).toEqual([]);
      expect(MockRepairStorage.deleted).toEqual([]);

      const unchanged = await AttachmentRepo.findOne({ filterByTk: attachment.get('id') });
      expect(unchanged.get('path')).toBe(oldPath);
      expect(unchanged.get('filename')).toBe(oldFilename);
    });

    it('applies copy, db update, url rewrite, and delete through the storage interface', async () => {
      const oldPath = 'mock\u001A';
      const oldFilename = 'apply\u001A.xlsx';
      const oldKey = `${oldPath}/${oldFilename}`;
      const newKey = 'mock-/apply-.xlsx';
      MockRepairStorage.sourceKeys.add(oldKey);
      const attachment = await AttachmentRepo.create({
        values: {
          title: 'test',
          filename: oldFilename,
          extname: '.xlsx',
          path: oldPath,
          url: `/mock/${encodeURIComponent(oldPath)}/${encodeURIComponent(oldFilename)}`,
          storageId: mockStorage.get('id'),
        },
      });

      const result = await repairAttachmentFilenames(app, plugin, { apply: true, batchSize: 10 });

      expect(result.repaired).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: attachment.get('id'),
            oldKey,
            newKey,
            status: 'repaired',
          }),
        ]),
      );
      expect(MockRepairStorage.copied).toEqual([{ source: oldKey, target: newKey }]);
      expect(MockRepairStorage.deleted).toEqual([oldKey]);

      const updated = await AttachmentRepo.findOne({ filterByTk: attachment.get('id') });
      expect(updated.get('path')).toBe('mock-');
      expect(updated.get('filename')).toBe('apply-.xlsx');
      expect(updated.get('url')).toBe('/mock/mock-/apply-.xlsx');
    });

    it('skips records when the repaired target already exists', async () => {
      const oldPath = 'mock\u001A';
      const oldFilename = 'exists\u001A.xlsx';
      const oldKey = `${oldPath}/${oldFilename}`;
      const newKey = 'mock-/exists-.xlsx';
      MockRepairStorage.sourceKeys.add(oldKey);
      MockRepairStorage.targetKeys.add(newKey);
      const attachment = await AttachmentRepo.create({
        values: {
          title: 'test',
          filename: oldFilename,
          extname: '.xlsx',
          path: oldPath,
          storageId: mockStorage.get('id'),
        },
      });

      const result = await repairAttachmentFilenames(app, plugin, { apply: true, batchSize: 10 });

      expect(result.skipped).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: attachment.get('id'),
            reason: 'target_exists',
            status: 'skipped',
          }),
        ]),
      );
      expect(MockRepairStorage.copied).toEqual([]);
      expect(MockRepairStorage.deleted).toEqual([]);
    });
  });

  describeLocalRepair('repairAttachmentFilenames with local storage', () => {
    let documentRoot: string;

    beforeEach(async () => {
      documentRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-file-repair-'));
      await local.update({
        options: {
          ...local.get('options'),
          documentRoot,
        },
      });
      await plugin.loadStorages();
    });

    afterEach(async () => {
      await fs.rm(documentRoot, { recursive: true, force: true });
    });

    it('dry-runs and repairs file records with invisible chars in path and filename', async () => {
      const oldPath = 'reports\u001A';
      const oldFilename = '1 -o_(7[n\u001Ah]-jypc1s.xlsx';
      const newPath = 'reports-';
      const newFilename = '1 -o_(7[n-h]-jypc1s.xlsx';
      const fileOldPath = 'files\u001A';
      const fileOldFilename = 'file\u001A.xlsx';
      const fileNewPath = 'files-';
      const fileNewFilename = 'file-.xlsx';
      await fs.mkdir(path.join(documentRoot, oldPath), { recursive: true });
      await fs.writeFile(path.join(documentRoot, oldPath, oldFilename), 'test');
      await fs.mkdir(path.join(documentRoot, fileOldPath), { recursive: true });
      await fs.writeFile(path.join(documentRoot, fileOldPath, fileOldFilename), 'test');
      const attachment = await AttachmentRepo.create({
        values: {
          title: 'test',
          filename: oldFilename,
          extname: '.xlsx',
          path: oldPath,
          storageId: local.get('id'),
        },
      });
      const file = await FileRepo.create({
        values: {
          title: 'test',
          filename: fileOldFilename,
          extname: '.xlsx',
          path: fileOldPath,
          storageId: local.get('id'),
        },
      });

      const dryRun = await repairAttachmentFilenames(app, plugin, { batchSize: 10 });
      expect(dryRun.dryRun).toBe(true);
      expect(dryRun.candidates).toHaveLength(2);
      expect(dryRun.candidates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collectionName: 'attachments',
            id: attachment.get('id'),
            oldKey: `${oldPath}/${oldFilename}`,
            newKey: `${newPath}/${newFilename}`,
            sourceExists: true,
            targetExists: false,
            status: 'pending',
          }),
          expect.objectContaining({
            collectionName: 'files',
            id: file.get('id'),
            oldKey: `${fileOldPath}/${fileOldFilename}`,
            newKey: `${fileNewPath}/${fileNewFilename}`,
            sourceExists: true,
            targetExists: false,
            status: 'pending',
          }),
        ]),
      );
      await expect(fs.stat(path.join(documentRoot, oldPath, oldFilename))).resolves.toBeTruthy();
      await expect(fs.stat(path.join(documentRoot, fileOldPath, fileOldFilename))).resolves.toBeTruthy();

      const applied = await repairAttachmentFilenames(app, plugin, { apply: true, batchSize: 10 });
      expect(applied.repaired).toHaveLength(2);
      expect(applied.repaired).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            collectionName: 'attachments',
            id: attachment.get('id'),
            status: 'repaired',
          }),
          expect.objectContaining({
            collectionName: 'files',
            id: file.get('id'),
            status: 'repaired',
          }),
        ]),
      );
      await expect(fs.stat(path.join(documentRoot, newPath, newFilename))).resolves.toBeTruthy();
      await expect(fs.stat(path.join(documentRoot, fileNewPath, fileNewFilename))).resolves.toBeTruthy();
      await expect(fs.stat(path.join(documentRoot, oldPath, oldFilename))).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(fs.stat(path.join(documentRoot, fileOldPath, fileOldFilename))).rejects.toMatchObject({
        code: 'ENOENT',
      });

      const updated = await AttachmentRepo.findOne({ filterByTk: attachment.get('id') });
      expect(updated.get('path')).toBe(newPath);
      expect(updated.get('filename')).toBe(newFilename);
      const updatedFile = await FileRepo.findOne({ filterByTk: file.get('id') });
      expect(updatedFile.get('path')).toBe(fileNewPath);
      expect(updatedFile.get('filename')).toBe(fileNewFilename);
    });

    it('supports limit across file collections', async () => {
      const oldPath = 'reports\u001A';
      const oldFilename = 'limited\u001A.xlsx';
      await fs.mkdir(path.join(documentRoot, oldPath), { recursive: true });
      await fs.writeFile(path.join(documentRoot, oldPath, oldFilename), 'test');
      const attachment = await AttachmentRepo.create({
        values: {
          title: 'test',
          filename: oldFilename,
          extname: '.xlsx',
          path: oldPath,
          storageId: local.get('id'),
        },
      });

      const dryRun = await repairAttachmentFilenames(app, plugin, { batchSize: 10, limit: 1 });
      expect(dryRun.scanned).toBe(1);
      expect(dryRun.candidates[0]).toMatchObject({
        id: attachment.get('id'),
        collectionName: 'attachments',
      });
    });
  });
});
