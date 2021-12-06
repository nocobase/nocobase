import path from 'path';
import multer from '@koa/multer';
import { Context, Next } from '@nocobase/actions';
import { getStorageConfig } from '../storages';
import * as Rules from '../rules';
import { FILE_FIELD_NAME, LIMIT_FILES, LIMIT_MAX_FILE_SIZE } from '../constants';

function getRules(ctx: Context) {
  const { resourceField } = ctx.action.params;
  if (!resourceField) {
    return ctx.storage.rules;
  }
  const { rules = {} } = resourceField.getOptions().attachment || {};
  return Object.assign({}, ctx.storage.rules, rules);
}

// TODO(optimize): 需要优化错误处理，计算失败后需要抛出对应错误，以便程序处理
function getFileFilter(ctx: Context) {
  return (req, file, cb) => {
    // size 交给 limits 处理
    const { size, ...rules } = getRules(ctx);
    const ruleKeys = Object.keys(rules);
    const result = !ruleKeys.length || !ruleKeys
      .some(key => typeof Rules[key] !== 'function'
        || !Rules[key](file, rules[key], ctx));
    cb(null, result);
  }
}

export async function middleware(ctx: Context, next: Next) {
  const { resourceName, actionName, resourceField } = ctx.action.params;
  if (actionName !== 'upload') {
    return next();
  }

  // NOTE:
  // 1. 存储引擎选择依赖于字段定义
  // 2. 字段定义中需包含引擎的外键值
  // 3. 无字段时按 storages 表的默认项
  // 4. 插件初始化后应提示用户添加至少一个存储引擎并设为默认

  const StorageModel = ctx.db.getModel('storages');
  let storage;

  if (resourceName === 'attachments') {
    // 如果没有包含关联，则直接按默认文件上传至默认存储引擎
    storage = await StorageModel.findOne({ where: { default: true } });
  } else {
    const { attachment = {} } = resourceField.getOptions();
    storage = await StorageModel.findOne({
      where: attachment.storage
        ? { name: attachment.storage }
        : { default: true }
    });
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
      files: LIMIT_FILES
    },
    storage: storageConfig.make(storage),
  };
  const upload = multer(multerOptions).single(FILE_FIELD_NAME);
  return upload(ctx, next);
};

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
  const urlPath = storage.path
    ? storage.path.replace(/^([^\/])/, '/$1')
    : '';

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
    ...(storageConfig.getFileData ? storageConfig.getFileData(file) : {})
  };
  
  const attachment = await ctx.db.sequelize.transaction(async transaction => {
    // TODO(optimize): 应使用关联 accessors 获取
    const result = await storage.createAttachment(data, { transaction });
    
    const { associatedName, associatedIndex, resourceField } = ctx.action.params;
    if (associatedIndex && resourceField) {
      const Attachment = ctx.db.getModel('attachments');
      const SourceModel = ctx.db.getModel(associatedName);
      const source = await SourceModel.findByPk(associatedIndex, { transaction });
      await source[resourceField.getAccessors().set](result[Attachment.primaryKeyAttribute], { transaction });
    }

    return result;
  });

  // 将存储引擎的信息附在已创建的记录里，节省一次查询
  // attachment.setDataValue('storage', storage);
  ctx.body = attachment;

  await next();
};
