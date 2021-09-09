import {
  getNameByParams,
  parseRequest,
  ResourcerContext,
  ResourceType,
} from '@nocobase/resourcer';
import { BELONGSTO, BELONGSTOMANY, HASMANY, HASONE } from '@nocobase/database';

export async function table2resource(
  ctx: ResourcerContext,
  next: () => Promise<any>,
) {
  const resourcer = ctx.resourcer;
  const database = ctx.database;
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
  const [tableName, fieldName] = resourceName.split('.');
  // 如果经过加载后是已经定义的表
  if (!database.isDefined(tableName)) {
    return next();
  }
  const table = database.getTable(tableName);
  const field = table.getField(fieldName) as
    | BELONGSTO
    | HASMANY
    | BELONGSTOMANY
    | HASONE;
  if (!fieldName || field) {
    let resourceType: ResourceType = 'single';
    let actions = {};
    if (field) {
      if (field instanceof HASONE) {
        resourceType = 'hasOne';
      } else if (field instanceof HASMANY) {
        resourceType = 'hasMany';
      } else if (field instanceof BELONGSTO) {
        resourceType = 'belongsTo';
      } else if (field instanceof BELONGSTOMANY) {
        resourceType = 'belongsToMany';
      }
      if (field.options.actions) {
        actions = field.options.actions || {};
      }
    } else {
      actions = table.getOptions('actions') || {};
    }
    resourcer.define({
      type: resourceType,
      name: resourceName,
      actions,
    });
  }
  return next();
}

export default table2resource;
