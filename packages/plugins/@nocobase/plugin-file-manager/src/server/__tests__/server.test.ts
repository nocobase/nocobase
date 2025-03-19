/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';

import { getApp } from '.';
import PluginFileManagerServer from '../server';

import { FILE_FIELD_NAME, STORAGE_TYPE_LOCAL } from '../../constants';

const { LOCAL_STORAGE_BASE_URL, LOCAL_STORAGE_DEST = 'storage/uploads', APP_PORT = '13000' } = process.env;
const DEFAULT_LOCAL_BASE_URL = LOCAL_STORAGE_BASE_URL || `/storage/uploads`;

describe('file manager > server', () => {
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

  describe('api', () => {
    describe('createFileRecord', () => {
      it('should be create file record', async () => {
        const model = await plugin.createFileRecord({
          collectionName: 'attachments',
          filePath: path.resolve(__dirname, './files/text.txt'),
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          // size: 13,
          meta: {},
          storageId: 1,
        };
        expect(model.toJSON()).toMatchObject(matcher);
      });

      it('should be local2 storage', async () => {
        const storage = await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            baseUrl: DEFAULT_LOCAL_BASE_URL,
            rules: {
              size: 1024,
            },
            paranoid: true,
          },
        });
        const model = await plugin.createFileRecord({
          collectionName: 'attachments',
          storageName: 'local2',
          filePath: path.resolve(__dirname, './files/text.txt'),
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          // size: 13,
          meta: {},
          storageId: storage.id,
        };
        expect(model.toJSON()).toMatchObject(matcher);
      });

      it('should be custom values', async () => {
        const model = await plugin.createFileRecord({
          collectionName: 'attachments',
          filePath: path.resolve(__dirname, './files/text.txt'),
          values: {
            size: 22,
          },
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          size: 22,
          meta: {},
          storageId: 1,
        };
        expect(model.toJSON()).toMatchObject(matcher);
      });
    });

    describe('uploadFile', () => {
      it('should be upload file', async () => {
        const data = await plugin.uploadFile({
          filePath: path.resolve(__dirname, './files/text.txt'),
          documentRoot: 'storage/backups/test',
        });
        const matcher = {
          title: 'text',
          extname: '.txt',
          path: '',
          meta: {},
          storageId: 1,
        };
        expect(data).toMatchObject(matcher);
      });
    });

    describe('getFileURL', () => {
      it('local attachment without env', async () => {
        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/[]中文报告! 1%~50.4% (123) {$#}.txt'),
        });

        const url = await plugin.getFileURL(body.data);
        expect(url).toBe(`${process.env.APP_PUBLIC_PATH?.replace(/\/$/g, '') || ''}${body.data.url}`);
      });

      it('local (default with base url) attachment with env', async () => {
        const originalPath = process.env.APP_PUBLIC_PATH;
        process.env.APP_PUBLIC_PATH = '/app';

        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const url = await plugin.getFileURL(body.data);
        expect(url).toBe(`${process.env.APP_PUBLIC_PATH}/storage/uploads/${body.data.filename}`);

        process.env.APP_PUBLIC_PATH = originalPath;
      });

      it('local (default without base url) attachment with env', async () => {
        const storage = await StorageRepo.create({
          values: {
            name: 'local2',
            type: STORAGE_TYPE_LOCAL,
            rules: {
              size: 1024,
            },
            default: true,
          },
        });

        const originalPath = process.env.APP_PUBLIC_PATH;
        process.env.APP_PUBLIC_PATH = '/nocobase/';

        const { body } = await agent.resource('attachments').create({
          [FILE_FIELD_NAME]: path.resolve(__dirname, './files/text.txt'),
        });

        const url = await plugin.getFileURL(body.data);
        expect(url).toBe(`/nocobase/${body.data.filename}`);

        process.env.APP_PUBLIC_PATH = originalPath;
      });
    });
  });
});
