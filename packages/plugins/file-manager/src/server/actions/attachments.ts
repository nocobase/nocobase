import multer from '@koa/multer';
import { Context, Next } from '@nocobase/actions';
import path from 'path';

import { DEFAULT_MAX_FILE_SIZE, FILE_FIELD_NAME, LIMIT_FILES } from '../constants';
import * as Rules from '../rules';
import { getStorageConfig } from '../storages';

// TODO(optimize): 需要优化错误处理，计算失败后需要抛出对应错误，以便程序处理
function getFileFilter(storage) {
  return (req, file, cb) => {
    // size 交给 limits 处理
    const { size, ...rules } = storage.rules;
    const ruleKeys = Object.keys(rules);
    const result =
      !ruleKeys.length || !ruleKeys.some((key) => typeof Rules[key] !== 'function' || !Rules[key](file, rules[key]));
    cb(null, result);
  };
}

function getFileData(ctx: Context) {
  const { [FILE_FIELD_NAME]: file, storage } = ctx;
  if (!file) {
    return ctx.throw(400, 'file validation failed');
  }

  const storageConfig = getStorageConfig(storage.type);
  const { [storageConfig.filenameKey || 'filename']: name } = file;
  // make compatible filename across cloud service (with path)
  const filename = path.basename(name);
  const extname = path.extname(filename);
  const urlPath = storage.path ? storage.path.replace(/^([^/])/, '/$1') : '';

  return {
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
    storageId: storage.id,
    ...(storageConfig.getFileData ? storageConfig.getFileData(file) : {}),
  };
}

export async function templateCollectionCreate(ctx: Context, next: Next) {
  const { resourceName, actionName } = ctx.action;
  const { attachmentField } = ctx.action.params;
  const collection = ctx.db.getCollection(resourceName);

  if (collection?.options?.template !== 'file' || !['upload', 'create'].includes(actionName)) {
    return next();
  }

  const storageName = ctx.db.getFieldByPath(attachmentField)?.options?.storage || collection.options.storage;
  const StorageRepo = ctx.db.getRepository('storages');
  const storage = await StorageRepo.findOne({ filter: storageName ? { name: storageName } : { default: true } });

  ctx.storage = storage;

  await multipart(ctx, async () => {
    const values = getFileData(ctx);

    ctx.action.mergeParams({
      values,
    });

    await next();
  });
}

export async function multipart(ctx: Context, next: Next) {
  const { storage } = ctx;
  if (!storage) {
    console.error('[file-manager] no linked or default storage provided');
    return ctx.throw(500);
  }

  const storageConfig = getStorageConfig(storage.type);
  if (!storageConfig) {
    console.error(`[file-manager] storage type "${storage.type}" is not defined`);
    return ctx.throw(500);
  }

  const multerOptions = {
    fileFilter: getFileFilter(storage),
    limits: {
      fileSize: storage.rules.size ?? DEFAULT_MAX_FILE_SIZE,
      // 每次只允许提交一个文件
      files: LIMIT_FILES,
    },
    storage: storageConfig.make(storage),
  };
  const upload = multer(multerOptions).single(FILE_FIELD_NAME);
  try {
    // NOTE: empty next and invoke after success
    await upload(ctx, () => {});
  } catch (err) {
    if (err.name === 'MulterError') {
      return ctx.throw(400, err);
    }
    return ctx.throw(500);
  }

  await next();
}
