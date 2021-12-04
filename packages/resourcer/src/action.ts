import _ from 'lodash';
import compose from 'koa-compose';
import Resource from './resource';
import { requireModule } from './utils';
import { HandlerType } from './resourcer';
import Middleware, { MiddlewareType } from './middleware';
import { ActionParameterTypes, ActionParameter, UnknownParameter, PageParameter } from './parameter';

export type ActionType = string | HandlerType | ActionOptions;

export type DefaultActionType = 'list' | 'create' | 'get' | 'update' | 'destroy' | 'set' | 'add' | 'remove';

export type ActionName = DefaultActionType | Omit<String, DefaultActionType>;

export interface ActionContext {
  action?: Action;
  [key: string]: any;
}

export type FieldsOptions = string[] | {
  only?: string[];
  appends?: string[];
} | {
  except?: string[];
  appends?: string[];
};

export type FieldsOptionsFn = (ctx: ActionContext) => FieldsOptions | Promise<FieldsOptions>;

/**
 * 过滤参数
 * 
 * TODO：细节待定
 */
export interface FilterOptions {
  [key: string]: any;
}

export type FilterOptionsFn = (ctx: ActionContext) => FilterOptions | Promise<FieldsOptions>;

export type ParamsCallback = (ctx: ActionContext) => ActionParams | Promise<ActionParams>;

export interface ActionOptions {
  /**
   * 默认数据
   */
  values?: any;
  /**
   * 字段
   * 
   * 示例一：
   * ['col1', 'col2', 'relation.col1'];
   * 
   * 示例二：
   * {
   *  only: ['col1'],
   * }
   * 
   * 示例三：
   * {
   *  except: ['col1'],
   * }
   */
  fields?: FieldsOptions;
  /**
   * 过滤
   */
  filter?: FilterOptions;
  /**
   * 排序
   */
  sort?: string | string[];
  /**
   * 当前页码
   */
  page?: number;
  /**
   * 每页显示数量
   */
  perPage?: number;
  /**
   * 最大每页显示数量
   */
  maxPerPage?: number;
  /**
   * 中间件
   */
  middleware?: MiddlewareType;
  /**
   * 中间件
   * 
   * 与 middleware 用法相同
   */
  middlewares?: MiddlewareType;
  /**
   * 当前 Action 待执行的方法
   * 
   * 支持 Function 和 require 调用
   */
  handler?: HandlerType;
  /**
   * 其他扩展配置
   */
  [key: string]: any;
}

/**
 * action params 与 action options 略有不同
 * - options 的参数更灵活，主要用于开发配置
 * - params 是开发配置参数 + 客户端参数的结合体
 */
export interface ActionParams {
  /**
   * 输出哪些字段
   * 
   * 与 ActionOptions 的不同，这里的 fields 是 object，提供 only，except，appends 三种情况
   */
  fields?: {
    only?: string[];
    except?: string[];
    appends?: string[];
  };
  /**
   * 过滤
   */
  filter?: FilterOptions;
  /**
   * 排序
   * 
   * 与 ActionOptions 的不同，这里的 sort 只有一种 array 类型
   */
  sort?: string[];
  /**
   * 当前页码
   */
  page?: number;
  /**
   * 每页显示数量
   */
  perPage?: number;
  /**
   * 数据，默认为 options.defaultValues + request.body
   */
  values?: any;
  /**
   * 当前资源的主体，对应的表名或 Model 名称
   */
  resourceName?: string;
  /**
   * 资源标识符
   */
  resourceIndex?: string;
  /**
   * 资源的从属关系
   */
  associatedName?: string;
  /**
   * 从属关系的标识符
   */
  associatedIndex?: string;
  /**
   * 从属关系的当前实例
   */
  associated?: any;
  /**
   * 资源提供哪些行为或方法
   */
  actionName?: string;
  /**
   * 其他扩展配置
   */
  [key: string]: any;
}

export class Action {

  protected handler: any;

  protected resource: Resource;

  protected name: ActionName;

  protected options: ActionOptions;

  protected parameters: Map<string, ActionParameter | UnknownParameter> = new Map();

  protected context: ActionContext = {};

  public readonly middlewares: Array<Middleware> = [];

  constructor(options: ActionOptions) {
    options = requireModule(options);
    if (typeof options === 'function') {
      options = { handler: options };
    }
    const {
      middleware,
      middlewares = [],
      handler,
      ...params
    } = options;
    this.middlewares = Middleware.toInstanceArray(middleware || middlewares);
    this.handler = handler;
    this.options = options;
    this.mergeParams(params, {});
  }

  get params(): ActionParams {
    const result = this.parameters.get('_').get();
    for (const paramType of this.parameters.values()) {
      Object.assign(result, paramType.get());
    }
    return result;
  }

  clone() {
    const options = _.cloneDeep(this.options);
    delete options.middleware;
    delete options.middlewares;
    const action = new Action(options);
    action.setName(this.name);
    action.setResource(this.resource);
    action.middlewares.push(...this.middlewares);
    return action;
  }

  setContext(context: any) {
    this.context = context;
  }

  async mergeParams(params, strategies = {}) {
    const typeKeys = new Set<string>();
    Object.keys(params).forEach(key => {
      for (const typeKey of ActionParameterTypes.getAllKeys()) {
        if (typeof params[key] !== 'undefined' && key in ActionParameterTypes.get(typeKey).picking) {
          typeKeys.add(typeKey);
        }
      }
    });
    let type;
    for (const key of typeKeys) {
      const strategy = strategies[key];
      type = this.parameters.get(key);
      if (!type) {
        const Type = ActionParameterTypes.get(key);
        if (!Type) {
          throw new Error(`parameter type ${key} is unregistered`);
        }
        // @ts-ignore
        type = new Type(params);
        this.parameters.set(key, type);
      }
      type.merge(params, strategy);
    }
    type = this.parameters.get('_');
    if (!type) {
      type = new UnknownParameter(params);
      this.parameters.set('_', type);
    }
    type.merge(params, strategies['_']);
  }

  setResource(resource: Resource) {
    this.resource = resource;
    return this;
  }

  getResource() {
    return this.resource;
  }

  getOptions(): ActionOptions {
    return this.options;
  }

  setName(name: ActionName) {
    this.name = name;
    return this;
  }

  getName() {
    return this.name;
  }

  getMiddlewareHandlers() {
    return this.middlewares
      .filter(middleware => middleware.canAccess(this.name))
      .map(middleware => middleware.getHandler());
  }

  getHandler() {
    const handler = requireModule(this.handler || this.resource.resourcer.getRegisteredHandler(this.name));
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function!');
    }
    return handler;
  }

  getHandlers() {
    return [...this.resource.resourcer.getMiddlewares(), ...this.getMiddlewareHandlers(), this.getHandler()].filter(Boolean);
  }

  async execute(context: any, next?: any) {
    return await compose(this.getHandlers())(context, next);
  }

  static toInstanceMap(actions: object, resource?: Resource) {
    return new Map(Object.entries(actions).map(([key, options]) => {
      let action: Action;
      if (options instanceof Action) {
        action = options;
      } else {
        action = new Action(options);
      }
      action.setName(key);
      action.setResource(resource);
      resource && action.middlewares.unshift(...resource.middlewares);
      return [key, action];
    }));
  }
}

export default Action;
