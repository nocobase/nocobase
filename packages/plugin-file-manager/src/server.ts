import path from 'path';
import { URL } from 'url';
import serve from 'koa-static';
import mount from 'koa-mount';
import Database, { registerFields } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

import * as fields from './fields';
import {
  action as uploadAction,
  middleware as uploadMiddleware,
} from './actions/upload';
import { STORAGE_TYPE_LOCAL } from './constants';
import { getDocumentRoot } from './storages/local';



export default async function () {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  registerFields(fields);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  const StorageModel = database.getModel('storages');
  // 暂时中间件只能通过 use 加进来
  resourcer.use(uploadMiddleware);
  resourcer.registerActionHandler('upload', uploadAction);
  this.use(async (ctx, next) => {
    const storages = await StorageModel.findAll({
      where: {
        type: STORAGE_TYPE_LOCAL,
      }
    });

    for (const storage of storages) {
      if (storage.get('serve')) {
        continue;
      }

      const baseUrl = storage.get('baseUrl');

      let url;
      try {
        url = new URL(baseUrl);
      } catch (e) {
        url = {
          protocol: 'http',
          hostname: 'localhost',
          port: process.env.HTTP_PORT,
          pathname: baseUrl
        };
      }

      // 以下情况才认为当前进程所应该提供静态服务
      // 否则都忽略，交给其他 server 来提供（如 nginx/cdn 等）
      if (url.protocol === 'http:'
        && url.hostname === 'localhost'
        && url.port === process.env.HTTP_PORT
      ) {
        const basePath = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
        this.use(mount(basePath, serve(getDocumentRoot(storage))));
      }
      storage.set('serve', true);
    }
    await next();
  });
}
