import { Context, Next } from '@nocobase/actions';
import { koaMulter as multer } from '@nocobase/utils';
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
    title: Buffer.from(file.originalname, 'latin1').toString('utf8').replace(extname, ''),
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

async function multipart(ctx: Context, next: Next) {
  const { storage } = ctx;
  if (!storage) {
    ctx.logger.error('[file-manager] no linked or default storage provided');
    return ctx.throw(500);
  }

  const storageConfig = getStorageConfig(storage.type);
  if (!storageConfig) {
    ctx.logger.error(`[file-manager] storage type "${storage.type}" is not defined`);
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
    ctx.logger.error(err);
    return ctx.throw(500);
  }

  const values = getFileData(ctx);

  ctx.action.mergeParams({
    values,
  });

  await next();
}

export async function createMiddleware(ctx: Context, next: Next) {
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

  await multipart(ctx, next);
}

export async function destroyMiddleware(ctx: Context, next: Next) {
  const { resourceName, actionName } = ctx.action;
  const collection = ctx.db.getCollection(resourceName);

  if (collection?.options?.template !== 'file' || actionName !== 'destroy') {
    return next();
  }

  const repository = ctx.db.getRepository(resourceName);

  const { filterByTk, filter } = ctx.action.params;

  const records = await repository.find({
    filterByTk,
    filter,
    context: ctx,
  });

  const storageIds = new Set(records.map((record) => record.storageId));
  const storageGroupedRecords = records.reduce((result, record) => {
    const storageId = record.storageId;
    if (!result[storageId]) {
      result[storageId] = [];
    }
    result[storageId].push(record);
    return result;
  }, {});

  const storages = await ctx.db.getRepository('storages').find({
    filter: {
      id: [...storageIds] as any[],
      paranoid: {
        $ne: true,
      },
    },
  });

  let count = 0;
  const undeleted = [];
  await storages.reduce(
    (promise, storage) =>
      promise.then(async () => {
        const storageConfig = getStorageConfig(storage.type);
        const result = await storageConfig.delete(storage, storageGroupedRecords[storage.id]);
        count += result[0];
        undeleted.push(...result[1]);
      }),
    Promise.resolve(),
  );

  if (undeleted.length) {
    const ids = undeleted.map((record) => record.id);
    ctx.action.mergeParams({
      filter: {
        id: {
          $notIn: ids,
        },
      },
    });

    ctx.logger.error('[file-manager] some of attachment files are not successfully deleted: ', { ids });
  }

  await next();
}
