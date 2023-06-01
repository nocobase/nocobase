import path from 'path';
import multer from '@koa/multer';
import { Context, Next } from '@nocobase/actions';

import { FILE_FIELD_NAME, LIMIT_FILES, DEFAULT_MAX_FILE_SIZE } from '../constants';
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
    ...(storageConfig.getFileData ? storageConfig.getFileData(file) : {}),
  };
}

export async function attachmentCreate(ctx: Context, next: Next) {
  const { associatedIndex } = ctx.action.params;

  // NOTE:
  // 1. 存储引擎选择依赖于字段定义
  // 2. 字段定义中需包含引擎的外键值
  // 3. 无字段时按 storages 表的默认项
  // 4. 插件初始化后应提示用户添加至少一个存储引擎并设为默认

  const StorageRepo = ctx.db.getRepository('storages');
  // 如果没有包含关联，则直接按默认文件上传至默认存储引擎
  const storage = await StorageRepo.findOne({
    filter: associatedIndex ? { name: associatedIndex } : { default: true },
  });

  // 传递已取得的存储引擎，避免重查
  ctx.storage = storage;

  await multipart(ctx, async () => {
    const values = getFileData(ctx);

    const attachment = await storage.createAttachment(values, { context: ctx });

    ctx.body = attachment;

    await next();
  });
}

export async function templateCollectionCreate(ctx: Context, next: Next) {
  const { resourceName, actionName } = ctx.action;
  const collection = ctx.db.getCollection(resourceName);
  if (collection?.options?.template !== 'file' || !['upload', 'create'].includes(actionName)) {
    return next();
  }

  const StorageRepo = ctx.db.getRepository('storages');
  const storage = await StorageRepo.findOne({ filter: { name: collection.options.storage } });

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
