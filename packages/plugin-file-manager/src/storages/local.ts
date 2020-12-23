import crypto from 'crypto';
import path from 'path';
import { URL } from 'url';
import mkdirp from 'mkdirp';
import multer from 'multer';
import serve from 'koa-static';
import mount from 'koa-mount';
import { STORAGE_TYPE_LOCAL } from '../constants';

export function getDocumentRoot(storage): string {
  const { documentRoot = 'uploads' } = storage.options || {};
  // TODO(feature): 后面考虑以字符串模板的方式使用，可注入 req/action 相关变量，以便于区分文件夹
  return path.resolve(path.isAbsolute(documentRoot)
    ? documentRoot
    : path.join(process.env.PWD, documentRoot), storage.path);
}

// TODO(optimize): 初始化的时机不应该放在中间件里
export function middleware(app) {
  let initialized = false;
  return async (ctx, next) => {
    if (initialized) {
      return next();
    }

    const StorageModel = ctx.db.getModel('storages');
    const storages = await StorageModel.findAll({
      where: {
        type: STORAGE_TYPE_LOCAL,
      }
    });

    for (const storage of storages) {
      const baseUrl = storage.get('baseUrl');

      let url;
      try {
        url = new URL(baseUrl);
      } catch (e) {
        url = {
          protocol: 'http:',
          hostname: 'localhost',
          port: process.env.HTTP_PORT,
          pathname: baseUrl
        };
      }

      // 以下情况才认为当前进程所应该提供静态服务
      // 否则都忽略，交给其他 server 来提供（如 nginx/cdn 等）
      // TODO(bug): https、端口 80 默认值和其他本地 ip/hostname 的情况未考虑
      if (url.protocol === 'http:'
        && url.hostname === 'localhost'
        && url.port === process.env.HTTP_PORT
      ) {
        const basePath = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
        app.use(mount(basePath, serve(getDocumentRoot(storage))));
      }
    }

    initialized = true;

    await next();
  };
}

export default (storage) => multer.diskStorage({
  destination: function (req, file, cb) {
    const destPath = getDocumentRoot(storage);
    mkdirp(destPath).then(() => {
      cb(null, destPath);
    }).catch(cb);
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, (err, raw) => {
      cb(err, err ? undefined : `${raw.toString('hex')}${path.extname(file.originalname)}`)
    });
  }
});
