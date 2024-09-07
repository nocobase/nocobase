/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// import Database from '@nocobase/database';
// import { createMockServer, MockServer } from '@nocobase/test';
// import {
//   allListAction,
//   createAction,
//   formatTemplateAction,
//   tableListAction,
//   updateAction,
//   uploadSelfAction,
// } from '../actions';
// import PluginFileManagerServer from '@nocobase/plugin-file-manager';
// import { ResourcerContext } from '@nocobase/resourcer';
// import fs from 'fs';
// import path from 'path';
// import { jest } from '@jest/globals';

// describe('PluginPrintTemplateServer Actions', () => {
//   let app: MockServer;
//   let db: Database;
//   let agent;
//   let adminUser;
//   let fileManagerPlugin: PluginFileManagerServer;
//   let collection;
//   let attachmentsCollection;
//   let storagesCollection;

//   beforeEach(async () => {
//     process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
//     process.env.INIT_ROOT_PASSWORD = '123456';
//     process.env.INIT_ROOT_NICKNAME = 'Test';
//     app = await createMockServer({
//       plugins: ['auth', 'users', 'acl', 'data-source-manager', 'file-manager'],
//     });
//     db = app.db;
//     fileManagerPlugin = app.getPlugin('file-manager') as PluginFileManagerServer;
//     collection = db.getCollection('printTemplate');
//     attachmentsCollection = db.getCollection('attachments');
//     storagesCollection = db.getCollection('storages');

//     agent = app.agent();
//     adminUser = await db.getRepository('users').findOne({
//       filter: {
//         email: process.env.INIT_ROOT_EMAIL,
//       },
//       appends: ['roles'],
//     });
//   });

//   afterEach(async () => {
//     await app.destroy();
//   });

//   it('should handle allListAction', async () => {
//     await collection.model.create({ templateName: 'Template 1', templateType: 'docx' });
//     await collection.model.create({ templateName: 'Template 2', templateType: 'xlsx' });

//     const ctx: ResourcerContext = { body: null, db: { getCollection: () => collection }, request: {} } as any;
//     await allListAction(ctx, () => Promise.resolve(), collection);

//     expect(ctx.body).toHaveLength(2);
//     expect(ctx.body[0].templateName).toBe('Template 1');
//   });

//   it('should handle createAction with file', async () => {
//     jest.spyOn(fileManagerPlugin, 'createFileRecord').mockResolvedValue({ id: 'attachmentId' });

//     const ctx: ResourcerContext = {
//       action: {
//         params: {
//           values: {
//             templateName: 'New Template',
//             templateFile: {
//               filename: 'test.docx',
//               mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//             },
//             templateType: 'docx',
//           },
//         },
//       },
//       body: null,
//       db: { getRepository: () => collection },
//     } as any;

//     await createAction(ctx, () => Promise.resolve(), fileManagerPlugin);

//     expect(ctx.body.code).toBe('0');
//   });

//   it('should handle formatTemplateAction', async () => {
//     const attachmentId = 'attachmentId';
//     await attachmentsCollection.model.create({
//       id: attachmentId,
//       storageId: 'storageId',
//       filename: 'file.docx',
//       url: '/path/to/file',
//     });
//     await storagesCollection.model.create({ id: 'storageId', type: 'local', baseUrl: '/storage/base' });
//     await collection.model.create({
//       id: 'templateId',
//       templateName: 'Template',
//       templateType: 'docx',
//       attachmentsId: attachmentId,
//     });

//     const ctx: ResourcerContext = {
//       action: {
//         params: {
//           values: { printTemplateId: 'templateId', tableName: 'someTable', rowFilterByTk: 1, dataSource: 'dataSource' },
//         },
//       },
//       body: null,
//       db: {
//         getCollection: (name) => {
//           if (name === 'printTemplate') return collection;
//           if (name === 'attachments') return attachmentsCollection;
//           if (name === 'storages') return storagesCollection;
//           return db.getCollection(name);
//         },
//       },
//     } as any;

//     await formatTemplateAction(ctx, () => Promise.resolve(), app, db, fileManagerPlugin);

//     expect(ctx.body).toBeInstanceOf(fs.ReadStream);
//   });

//   it('should handle tableListAction', async () => {
//     const dictionaryCollections = [{ id: '1', name: 'Collection 1' }];
//     const ctx: ResourcerContext = { body: null, db: { getCollection: () => collection }, request: {} } as any;
//     await tableListAction(ctx, () => Promise.resolve(), dictionaryCollections);

//     expect(ctx.body).toEqual(dictionaryCollections);
//   });

//   it('should handle updateAction with file', async () => {
//     jest.spyOn(fileManagerPlugin, 'createFileRecord').mockResolvedValue({ id: 'attachmentId' });

//     await collection.model.create({ id: 'templateId', templateName: 'Old Name' });

//     const ctx: ResourcerContext = {
//       action: {
//         params: {
//           values: {
//             templateName: 'Updated Template',
//             templateFile: {
//               filename: 'newfile.docx',
//               mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//             },
//             templateType: 'docx',
//           },
//           filterByTk: 'templateId',
//         },
//       },
//       body: null,
//       db: { getRepository: () => collection },
//     } as any;

//     await updateAction(ctx, () => Promise.resolve(), fileManagerPlugin);

//     expect(ctx.body.code).toBe('0');
//   });

//   it('should handle uploadSelfAction', async () => {
//     const ctx: any = {
//       file: {
//         filename: 'uploaded-file.docx',
//         size: 1234,
//         mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       },
//       body: null,
//     };
//     await uploadSelfAction(ctx, () => Promise.resolve());

//     expect(ctx.body).toHaveProperty('filename', 'uploaded-file.docx');
//   });
// });
