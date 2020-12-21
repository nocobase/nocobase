import multer from '@koa/multer';
import actions from '@nocobase/actions';
import { FileManagerOptions } from '../server';
import supportedStorages from '../storages';



export default function middleware({ fieldName }: FileManagerOptions) {
  return async function (ctx: actions.Context, next: actions.Next) {
    const { associatedKey, resourceName, actionName } = ctx.action.params;

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
      // TODO: 根据关联字段选择存储引擎
      const [resName, fieldName] = resourceName.split('.');
  
      if (!fieldName) {
        return next();
      }
    }

    if (!storage) {
      console.error('[file-manager] no default or linked storage provided');
      return ctx.throw(500);
    }
    const getMulterOptions = supportedStorages.get(storage.type);
    if (!getMulterOptions) {
      console.error(`[file-manager] storage type "${storage.type}" is not defined`);
      return ctx.throw(500);
    }
    ctx.storage = storage;
    const multerOptions = getMulterOptions(ctx);
    const upload = multer(multerOptions);
    return upload.single(fieldName)(ctx, next);
  };
};
