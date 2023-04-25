import compose from 'koa-compose';
import { requireModule } from '@nocobase/utils';
import { ActionName } from './action';
import { HandlerType } from './resourcer';

export type MiddlewareType = string | string[] | HandlerType | HandlerType[] | MiddlewareOptions | MiddlewareOptions[];

export interface MiddlewareOptions {
  /**
   * actions 白名单，默认有 list、get、create、update、delete
   */
  only?: Array<ActionName>;

  /**
   * actions 黑名单，默认有 list、get、create、update、delete
   */
  except?: Array<ActionName>;

  handler?: HandlerType | Function;

  [key: string]: any;
}

export class Middleware {
  protected options: MiddlewareOptions;
  private middlewares: HandlerType[] = [];

  constructor(options: MiddlewareOptions | Function) {
    options = requireModule(options);
    if (typeof options === 'function') {
      this.options = { handler: options };
    } else {
      this.options = options;
    }
  }

  getHandler() {
    const handler = requireModule(this.options.handler);
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function!');
    }
    return (ctx, next) => compose([handler, ...this.middlewares])(ctx, next);
  }

  use(middleware: HandlerType) {
    this.middlewares.push(middleware);
  }

  disuse(middleware: HandlerType) {
    this.middlewares.splice(this.middlewares.indexOf(middleware), 1);
  }

  canAccess(name: ActionName) {
    const { only = [], except = [] } = this.options;
    if (only.length > 0) {
      return only.includes(name);
    }
    if (except.length > 0) {
      return !except.includes(name);
    }
    return true;
  }

  static toInstanceArray(middlewares: any): Middleware[] {
    if (!middlewares) {
      return [];
    }
    if (!Array.isArray(middlewares)) {
      middlewares = [middlewares];
    }
    return middlewares.map((middleware) => {
      if (middleware instanceof Middleware) {
        return middleware;
      }
      if (typeof middleware === 'object') {
        return new Middleware(middleware);
      }
      if (typeof middleware === 'function') {
        return new Middleware({ handler: middleware });
      }
    });
  }
}

export default Middleware;

export function branch(
  map: {
    [key: string]: HandlerType;
  } = {},
  reducer: (ctx) => string,
  options: {
    keyNotFound?(ctx, next): void;
    handlerNotSet?(ctx, next): void;
  } = {},
): HandlerType {
  return (ctx, next) => {
    const key = reducer(ctx);

    if (!key) {
      return options.keyNotFound ? options.keyNotFound(ctx, next) : ctx.throw(404);
    }

    const handler = map[key];
    if (!handler) {
      return options.handlerNotSet ? options.handlerNotSet(ctx, next) : ctx.throw(404);
    }

    return handler(ctx, next);
  };
}
