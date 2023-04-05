import multer from '@koa/multer';
import { Context, Next } from '@nocobase/actions';
import path from 'path';
import { FILE_FIELD_NAME, LIMIT_FILES, LIMIT_MAX_FILE_SIZE } from '../constants';
import * as Rules from '../rules';
import { getStorageConfig } from '../storages';

function getRules(ctx: Context) {
  const { resourceField } = ctx;
  if (!resourceField) {
    return ctx.storage.rules;
  }
  const { rules = {} } = resourceField.options.attachment || {};
  return Object.assign({}, ctx.storage.rules, rules);
}

// TODO(optimize): 需要优化错误处理，计算失败后需要抛出对应错误，以便程序处理
function getFileFilter(ctx: Context) {
  return (req, file, cb) => {
    // size 交给 limits 处理
    const { size, ...rules } = getRules(ctx);
    const ruleKeys = Object.keys(rules);
    const result =
      !ruleKeys.length ||
      !ruleKeys.some((key) => typeof Rules[key] !== 'function' || !Rules[key](file, rules[key], ctx));
    cb(null, result);
  };
}

export async function middleware(ctx: Context, next: Next) {
  const { resourceName, actionName } = ctx.action;
  if (actionName !== 'upload') {
    return next();
  }

  const collection = ctx.db.getCollection(resourceName);
  const Storage = ctx.db.getCollection('storages');
  let storage;

  if (collection.options.storage) {
    storage = await Storage.repository.findOne({ filter: { name: collection.options.storage } });
  } else {
    storage = await Storage.repository.findOne({ filter: { default: true } });
  }

  if (!storage) {
    console.error('[file-manager] no default or linked storage provided');
    return ctx.throw(500);
  }
  // 传递已取得的存储引擎，避免重查
  ctx.storage = storage;

  const storageConfig = getStorageConfig(storage.type);
  if (!storageConfig) {
    console.error(`[file-manager] storage type "${storage.type}" is not defined`);
    return ctx.throw(500);
  }
  const multerOptions = {
    fileFilter: getFileFilter(ctx),
    limits: {
      fileSize: Math.min(getRules(ctx).size || LIMIT_MAX_FILE_SIZE, LIMIT_MAX_FILE_SIZE),
      // 每次只允许提交一个文件
      files: LIMIT_FILES,
    },
    storage: storageConfig.make(storage),
  };
  const upload = multer(multerOptions).single(FILE_FIELD_NAME);
  return upload(ctx, next);
}

export async function action(ctx: Context, next: Next) {
  const { [FILE_FIELD_NAME]: file, storage } = ctx;
  if (!file) {
    return ctx.throw(400, 'file validation failed');
  }

  const storageConfig = getStorageConfig(storage.type);
  const { [storageConfig.filenameKey || 'filename']: name } = file;
  // make compatible filename across cloud service (with path)
  const filename = path.basename(name);
  const extname = path.extname(filename);
  const urlPath = storage.path ? storage.path.replace(/^([^\/])/, '/$1') : '';

  const data = {
    title: file.originalname.replace(extname, ''),
    filename,
    extname,
    // TODO(feature): 暂时两者相同，后面 storage.path 模版化以后，这里只是 file 实际的 path
    path: storage.path,
    size: file.size,
    // 直接缓存起来
    url: `${storage.baseUrl}${urlPath}/${filename}`,
    mimetype: file.mimetype,
    // @ts-ignore
    meta: ctx.request.body,
    ...(storageConfig.getFileData ? storageConfig.getFileData(file) : {}),
  };

  const fileData = await ctx.db.sequelize.transaction(async (transaction) => {
    const { resourceName } = ctx.action;
    const repository = ctx.db.getRepository(resourceName);

    const result = await repository.create({
      values: {
        ...data,
        storage,
      },
      transaction,
    });

    return result;
  });

  ctx.body = fileData;

  await next();
}
