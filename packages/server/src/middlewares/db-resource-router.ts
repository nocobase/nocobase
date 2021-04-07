import compose from 'koa-compose';
import { pathToRegexp } from 'path-to-regexp';
import Resourcer, { getNameByParams, KoaMiddlewareOptions, parseRequest, parseQuery, ResourcerContext, ResourceType } from '@nocobase/resourcer';
import Database, { BELONGSTO, BELONGSTOMANY, HASMANY, HASONE } from '@nocobase/database';

interface MiddlewareOptions extends KoaMiddlewareOptions {
  resourcer?: Resourcer;
  database?: Database;
}
/**
 * database + resourcer 结合的中间件（暂时不知道起什么名好）
 * 
 * @param options 
 */
export function dbResourceRouter(options: MiddlewareOptions = {}) {
  const {
    prefix,
    database,
    resourcer,
    accessors,
    paramsKey = 'params',
    nameRule = getNameByParams,
  } = options;
  return async (ctx: ResourcerContext, next: () => Promise<any>) => {
    ctx.resourcer = resourcer;
    let params = parseRequest({
      path: ctx.request.path,
      method: ctx.request.method,
    }, {
      prefix,
      accessors,
    });
    if (!params) {
      return next();
    }
    try {
      const resourceName = nameRule(params);
      // 如果资源名称未被定义
      if (!resourcer.isDefined(resourceName)) {
        const [tableName, fieldName] = resourceName.split('.');
        const Collection = database.getModel('collections');
        // 检查资源对应的表名是否已经定义
        if (!database.isDefined(tableName) && Collection) {
          // 未定义则尝试通过 collection 表来加载
          await Collection.load({
            where: {
              name: tableName,
            },
          });
        }
        // 如果经过加载后是已经定义的表
        if (database.isDefined(tableName)) {
          const table = database.getTable(tableName);
          const field = table.getField(fieldName) as BELONGSTO | HASMANY | BELONGSTOMANY | HASONE;
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
                actions = field.options.actions;
              }
            } else {
              const items = table.getOptions('actions') || [];
              for (const item of (items as any[])) {
                actions[item.name] = item;
              }
            }
            resourcer.define({
              type: resourceType,
              name: resourceName,
              actions,
            });
          }
        }
      }
      const resource = resourcer.getResource(resourceName);
      // 为关系资源时，暂时需要再执行一遍 parseRequest
      if (resource.options.type !== 'single') {
        params = parseRequest({
          path: ctx.request.path,
          method: ctx.request.method,
          type: resource.options.type,
        }, {
          prefix,
          accessors,
        });
        if (!params) {
          return next();
        }
      }
      // console.log(resource);
      // action 需要 clone 之后再赋给 ctx
      ctx.action = resourcer.getAction(resourceName, params.actionName).clone();
      ctx.action.setContext(ctx);
      // 自带 query 处理的不太给力，需要用 qs 转一下
      const query = parseQuery(ctx.request.querystring);
      // 兼容 ctx.params 的处理，之后的版本里会去掉
      ctx[paramsKey] = {
        table: params.resourceName,
        tableKey: params.resourceKey,
        relatedTable: params.associatedName,
        relatedKey: params.resourceKey,
        action: params.actionName,
      };
      if (pathToRegexp('/resourcer/{:associatedName.}?:resourceName{\\::actionName}').test(ctx.request.path)) {
        await ctx.action.mergeParams({
          ...query,
          ...params,
          ...ctx.request.body,
        });
      } else {
        await ctx.action.mergeParams({
          ...query,
          ...params,
          values: ctx.request.body,
        });
      }
      return compose(ctx.action.getHandlers())(ctx, next);
    } catch (error) {
      console.log(error);
      return next();
    }
  }
}
