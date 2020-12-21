import path from 'path';
import actions from '@nocobase/actions';
import { FileManagerOptions } from '../server';



export default function action({ fieldName }: FileManagerOptions) {
  return async function (ctx: actions.Context, next: actions.Next) {
    const { [fieldName]: file, storage } = ctx;
    const { associatedKey, resourceName, actionName, values } = ctx.action.params;
    const extname = path.extname(file.filename);
    // TODO(optimize): 应使用关联 accessors 获取
    const result = await storage.createAttachment({
      id: file.filename.replace(extname, ''),
      name: file.originalname.replace(extname, ''),
      extname,
      // TODO(feature): 暂时两者相同，后面 storage.path 模版化以后，这里只是 file 实际的 path
      path: storage.path,
      size: file.size,
      mimetype: file.mimetype,
      meta: values
    });

    if (resourceName === 'attachments') {

    } else {

    }

    // 将存储引擎的信息附在已创建的记录里，节省一次查询
    result.setDataValue('storage', storage);
    ctx.body = result;

    await next();
  };
};
