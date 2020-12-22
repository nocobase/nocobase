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
  // TODO(optimize): hook 需要在插件初始化之后执行
  // 应在扫描全部 storage 后统一先初始化一次
  // 用于处理创建新的本地存储后是否要启动静态服务
  StorageModel.addHook('afterCreate', (storage) => {
    const { type, baseUrl } = storage.get();
    if (type !== STORAGE_TYPE_LOCAL) {
      return;
    }

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
  });

  // 暂时中间件只能通过 use 加进来
  resourcer.use(uploadMiddleware);
  resourcer.registerActionHandler('upload', uploadAction);
}
