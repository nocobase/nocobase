import { getNameByParams, parseRequest, ResourcerContext, ResourceType } from '@nocobase/resourcer';
import Database from '@nocobase/database';

export function table2resource(ctx: ResourcerContext & { db: Database }, next: () => Promise<any>) {
  const resourcer = ctx.resourcer;
  const database = ctx.db;
  let params = parseRequest(
    {
      path: ctx.request.path,
      method: ctx.request.method,
    },
    {
      prefix: resourcer.options.prefix,
      accessors: resourcer.options.accessors,
    },
  );
  if (!params) {
    return next();
  }
  const resourceName = getNameByParams(params);
  // 如果资源名称未被定义
  if (resourcer.isDefined(resourceName)) {
    return next();
  }
  const [collectionName, fieldName] = resourceName.split('.');
  // 如果经过加载后是已经定义的表
  if (!database.hasCollection(collectionName)) {
    return next();
  }
  const collection = database.getCollection(collectionName);
  let resourceType: ResourceType = 'single';
  if (fieldName && collection.hasField(fieldName)) {
    const field = collection.getField(fieldName);
    resourceType = field.type;
  }
  resourcer.define({
    type: resourceType,
    name: resourceName,
  });
  return next();
}

export default table2resource;
