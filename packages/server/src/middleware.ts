import qs from 'qs';
import compose from 'koa-compose';
import { pathToRegexp } from 'path-to-regexp';
import Resourcer, { getNameByParams, KoaMiddlewareOptions, parseRequest, ResourcerContext } from '@nocobase/resourcer';
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
export function middleware(options: MiddlewareOptions = {}) {
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
      if (!resourcer.isDefined(resourceName)) {
        const names = resourceName.split('.');
        const tableName = names.shift();
        const Collection = database.getModel('collections');
        if (!database.isDefined(tableName) && Collection) {
          await Collection.load({
            where: {
              name: tableName,
            },
          });
        }
        if (database.isDefined(tableName)) {
          const table = database.getTable(tableName);
          const field = table.getField(names[0]) as BELONGSTO | HASMANY | BELONGSTOMANY | HASONE;
          if (names.length == 0 || field) {
            let resourceType = 'single';
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
            }
            resourcer.define({
              type: resourceType as any,
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
      const query = qs.parse(ctx.request.querystring, {
        // 原始 query string 中如果一个键连等号“=”都没有可以被认为是 null 类型
        strictNullHandling: true
      });
      // filter 支持 json string
      if (typeof query.filter === 'string') {
        query.filter = JSON.parse(query.filter);
      }
      // 兼容 ctx.params 的处理，之后的版本里会去掉
      ctx[paramsKey] = {
        table: params.resourceName,
        tableKey: params.resourceKey,
        relatedTable: params.associatedName,
        relatedKey: params.resourceKey,
        action: params.actionName,
      };
      // 这里 body 里取不到值
      console.log('ctx.request.body', ctx.request.body)
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

export default middleware;
