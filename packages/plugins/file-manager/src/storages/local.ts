import Application from '@nocobase/server';
import serve from 'koa-static';
import mkdirp from 'mkdirp';
import multer from 'multer';
import path from 'path';
import { URL } from 'url';
import { STORAGE_TYPE_LOCAL } from '../constants';
import { getFilename } from '../utils';

// use koa-mount match logic
function match(basePath: string, pathname: string): boolean {
  if (!pathname.startsWith(basePath)) {
    return false;
  }

  const newPath = pathname.replace(basePath, '') || '/';
  if (basePath.slice(-1) === '/') {
    return true;
  }

  return newPath[0] === '/';
}

async function update(app: Application, storages) {
  const Storage = app.db.getCollection('storages');

  const items = await Storage.repository.find({
    filter: {
      type: STORAGE_TYPE_LOCAL,
    },
  });

  const primaryKey = Storage.model.primaryKeyAttribute;

  storages.clear();
  for (const storage of items) {
    storages.set(storage[primaryKey], storage);
  }
}

function createLocalServerUpdateHook(app, storages) {
  return async function (row) {
    if (row.get('type') === STORAGE_TYPE_LOCAL) {
      await update(app, storages);
    }
  };
}

function getDocumentRoot(storage): string {
  const { documentRoot = 'uploads' } = storage.options || {};
  // TODO(feature): 后面考虑以字符串模板的方式使用，可注入 req/action 相关变量，以便于区分文件夹
  return path.resolve(path.isAbsolute(documentRoot) ? documentRoot : path.join(process.cwd(), documentRoot));
}

async function middleware(app: Application, options?) {
  const LOCALHOST = `http://localhost:${process.env.APP_PORT || '13000'}`;

  const Storage = app.db.getCollection('storages');
  const storages = new Map<string, any>();

  const localServerUpdateHook = createLocalServerUpdateHook(app, storages);
  Storage.model.addHook('afterCreate', localServerUpdateHook);
  Storage.model.addHook('afterUpdate', localServerUpdateHook);
  Storage.model.addHook('afterDestroy', localServerUpdateHook);

  app.on('beforeStart', async () => {
    await update(app, storages);
  });

  app.use(async function (ctx, next) {
    for (const storage of storages.values()) {
      const baseUrl = storage.get('baseUrl');

      let url;
      try {
        url = new URL(baseUrl);
      } catch (e) {
        url = {
          pathname: baseUrl,
        };
      }

      // 以下情况才认为当前进程所应该提供静态服务
      // 否则都忽略，交给其他 server 来提供（如 nginx/cdn 等）
      if (url.origin && storage?.options?.serve === false) {
        continue;
      }

      const basePath = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;

      if (!match(basePath, ctx.path)) {
        continue;
      }

      return serve(getDocumentRoot(storage), {
        // for handle files after any api handlers
        defer: true,
      })(ctx, async () => {
        if (ctx.path.startsWith(basePath)) {
          ctx.path = ctx.path.replace(basePath, '');
        }
        await next();
      });
    }

    await next();
  });
}

export default {
  middleware,
  make(storage) {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        const destPath = path.join(getDocumentRoot(storage), storage.path);
        mkdirp(destPath, (err: Error | null) => cb(err, destPath));
      },
      filename: getFilename,
    });
  },
  defaults() {
    const { LOCAL_STORAGE_DEST, LOCAL_STORAGE_BASE_URL, APP_PORT } = process.env;
    const documentRoot = LOCAL_STORAGE_DEST || 'uploads';
    return {
      title: '本地存储',
      type: STORAGE_TYPE_LOCAL,
      name: `local`,
      baseUrl: LOCAL_STORAGE_BASE_URL || `http://localhost:${APP_PORT || '13000'}/${documentRoot}`,
      options: {
        documentRoot,
      },
    };
  },
};
