import path from 'path';
import { URL } from 'url';
import mkdirp from 'mkdirp';
import multer from 'multer';
import serve from 'koa-static';
import mount from 'koa-mount';
import { STORAGE_TYPE_LOCAL } from '../constants';
import { getFilename } from '../utils';

export function getDocumentRoot(storage): string {
  const { documentRoot = 'uploads' } = storage.options || {};
  // TODO(feature): 后面考虑以字符串模板的方式使用，可注入 req/action 相关变量，以便于区分文件夹
  return path.resolve(path.isAbsolute(documentRoot)
    ? documentRoot
    : path.join(process.cwd(), documentRoot), storage.path);
}

// TODO(optimize): 初始化的时机不应该放在中间件里
export function middleware(app) {
  if (process.env.NOCOBASE_ENV === 'production') {
    return;
  }

  const storages = new Map<string, any>();
  const StorageModel = app.db.getModel('storages');

  return app.use(async function (ctx, next) {
    const items = await StorageModel.findAll({
      where: {
        type: STORAGE_TYPE_LOCAL,
      }
    });

    const primaryKey = StorageModel.primaryKeyAttribute;

    for (const storage of items) {

      // TODO：未解决 storage 更新问题
      if (storages.has(storage[primaryKey])) {
        continue;
      }

      const baseUrl = storage.get('baseUrl');

      let url;
      try {
        url = new URL(baseUrl);
      } catch (e) {
        url = {
          protocol: 'http:',
          hostname: 'localhost',
          port: process.env.API_PORT,
          pathname: baseUrl
        };
      }

      // 以下情况才认为当前进程所应该提供静态服务
      // 否则都忽略，交给其他 server 来提供（如 nginx/cdn 等）
      // TODO(bug): https、端口 80 默认值和其他本地 ip/hostname 的情况未考虑
      // TODO 实际应该用 NOCOBASE_ENV 来判断，或者抛给 env 处理
      if (process.env.LOCAL_STORAGE_USE_STATIC_SERVER) {
        const basePath = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
        app.use(mount(basePath, serve(getDocumentRoot(storage))));
      }
      storages.set(storage.primaryKey, storage);
    }
    await next();
  });
}

export default (storage) => multer.diskStorage({
  destination: function (req, file, cb) {
    const destPath = getDocumentRoot(storage);
    mkdirp(destPath).then(() => {
      cb(null, destPath);
    }).catch(cb);
  },
  filename: getFilename
});
