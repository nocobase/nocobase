/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import send from 'koa-send';
import path from 'path';
import supertest from 'supertest';
import { STORAGE_TYPE_LOCAL } from '../../constants';
import { getDocumentRoot } from '../storages/local';

export async function getApp(options = {}): Promise<MockServer> {
  const app = await createMockServer({
    ...options,
    cors: {
      origin: '*',
    },
    plugins: ['field-sort', 'users', 'auth', 'file-manager'],
  });

  app.use(async (ctx, next) => {
    if (ctx.path.startsWith('/storage/uploads')) {
      const storages = await app.db.getRepository('storages').find({
        filter: {
          type: STORAGE_TYPE_LOCAL,
        },
      });
      const matchedStorage = storages
        .map((storage) => (typeof storage.get === 'function' ? storage.get() : storage))
        .filter((storage) => {
          const baseUrl = storage.baseUrl || '/storage/uploads';
          return ctx.path === baseUrl || ctx.path.startsWith(`${baseUrl}/`);
        })
        .sort((a, b) => (b.baseUrl || '').length - (a.baseUrl || '').length)[0];

      if (matchedStorage) {
        const baseUrl = matchedStorage.baseUrl || '/storage/uploads';
        const relativePath = ctx.path.slice(baseUrl.length).replace(/^\/+/, '');
        await send(ctx, relativePath, { root: getDocumentRoot(matchedStorage) });
        return;
      }

      await send(ctx, ctx.path.replace(/^\/storage\/?/, ''), { root: path.resolve(process.cwd(), 'storage') });
      return;
    }
    await next();
  });

  await app.db.import({
    directory: path.resolve(__dirname, './collections'),
  });

  await app.db.sync();

  return app;
}

// because the app in supertest will use a random port
export function requestFile(url, agent) {
  // url starts with double slash "//" will be considered as http or https
  // url starts with single slash "/" will be considered from local server
  return url[0] === '/' && url[1] !== '/' ? agent.get(url) : supertest.agent(url).get('');
}
