/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

export interface AuditLog {
  uuid: string;
  dataSource: string;
  resource: string;
  collection?: string;
  association?: string;
  action: string;
  resourceUk: string;
  userId: string;
  roleName: string;
  ip: string;
  ua: string;
  status: number;
  createdAt: string;
  metadata: Record<string, any>;
}

export interface AuditLogger {
  log(auditLog: AuditLog): Promise<void>;
}

type Action =
  | string
  | {
      name: string;
      // 在操作上下文中获取 MetaData
      getMetaData?: (ctx: Context) => Promise<Record<string, any>>;
    };

export class AuditManager {
  logger: AuditLogger;
  resources: Map<string, Map<string, Action>>; // 不一定是这个类型，根据存取方便处理

  constructor() {
    this.resources = new Map();
  }

  public setLogger(logger: AuditLogger) {
    this.logger = logger;
  }
  /**
   * 注册需要参与审计的资源和操作，支持几种写法
   * 注册全局的操作，对所有资源生效；
   * registerActions(['create'])
   * 对某个资源的所有操作生效 resource:*
   * registerActions(['app:*'])
   * 对某个资源的某个操作生效 resouce:action
   * registerAction(['pm:update'])
   *
   * 支持传getMetaData方法
   * registerActions([
   *  'create',
   *  { name: 'auth:signIn', getMetaData}
   * ])
   *
   * 当注册的接口有重叠是，颗粒度细的注册方法优先级更高 ？怎么进行判断？
   * registerActions(['create']);
   * registerAction([{ name: 'xxx:create', getMetaData }]); // 采用这个
   */

  registerActions(actions: Action[]) {
    actions.forEach((action) => {
      this.registerAction(action);
    });
  }

  // 注册单个操作，支持的用法同上
  // registerAction('create')
  // registerAction('app:*')
  // registerAction('pm:update')
  // registerAction('create', { getMetaData })
  registerAction(action: Action) {
    let originAction = '';
    let getMetaData = null;
    if (typeof action === 'string') {
      originAction = action;
    } else {
      originAction = action.name;
      getMetaData = action.getMetaData;
    }
    // 解析originAction, 获取actionName, resourceName
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    const resourceWildcardRegex = /^([a-zA-Z0-9_-]+):\*$/;
    const resourceAndActionRegex = /^([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)$/;
    let resourceName = '';
    let actionName = '';
    if (nameRegex.test(originAction)) {
      actionName = originAction;
      resourceName = '__default__';
    }
    if (resourceWildcardRegex.test(originAction)) {
      const match = originAction.match(resourceWildcardRegex);
      resourceName = match[1];
      actionName = '__default__';
    }
    if (resourceAndActionRegex.test(originAction)) {
      const match = originAction.match(resourceAndActionRegex);
      resourceName = match[1];
      actionName = match[2];
    }
    if (!resourceName && !actionName) {
      return;
    }
    let resource = this.resources.get(resourceName);
    if (!resource) {
      resource = new Map();
      this.resources.set(resourceName, resource);
    }
    if (getMetaData) {
      resource.set(actionName, { name: originAction, getMetaData });
    } else {
      resource.set(actionName, { name: originAction });
    }
  }

  getAction(action: string, resource?: string) {
    // 1. 匹配resource:action
    // 2. 匹配resource:*
    // 3. 匹配*:action
    let resourceName = resource;
    if (!resource) {
      resourceName = '__default__';
    }
    if (resourceName === '__default__') {
      const resourceActions = this.resources.get(resourceName);
      if (resourceActions) {
        const resourceAction = resourceActions.get(action);
        if (resourceAction) {
          return resourceAction;
        }
      }
    } else {
      const resourceActions = this.resources.get(resourceName);
      if (resourceActions) {
        let resourceAction = resourceActions.get(action);
        if (resourceAction) {
          return resourceAction;
        } else {
          resourceAction = resourceActions.get('__default__');
          if (resourceAction) {
            return resourceAction;
          }
        }
      } else {
        const resourceActions = this.resources.get('__default__');
        if (resourceActions) {
          const resourceAction = resourceActions.get(action);
          if (resourceAction) {
            return resourceAction;
          }
        }
      }
    }
    return null;
  }

  async getDefaultMetaData(ctx: any) {
    return {
      request: {
        params: ctx.request.params,
        query: ctx.request.query,
        body: ctx.request.body,
      },
      response: {
        body: ctx.body,
      },
    };
  }

  formatAuditData(ctx: Context) {
    const { resourceName } = ctx.action;
    let association = '';
    let collection = '';
    if (resourceName) {
      const resourceArray = resourceName.split('.');
      if (resourceArray.length > 1) {
        collection = resourceArray[0];
        association = resourceArray[1];
      } else {
        collection = resourceName;
      }
    }
    const resourceUk: string = this.formatResourceUk(ctx);

    const auditLog: AuditLog = {
      uuid: ctx.reqId,
      dataSource: (ctx.request.header['x-data-source'] || 'main') as string,
      resource: resourceName,
      association: association,
      collection: collection,
      action: ctx.action.actionName,
      resourceUk: resourceUk,
      userId: ctx.state?.currentUser?.id,
      roleName: ctx.state?.currentRole,
      ip: ctx.request.ip,
      ua: ctx.request.header['user-agent'],
      status: ctx.response.status,
      createdAt: new Date().toISOString(),
      metadata: null,
    };
    return auditLog;
  }

  formatResourceUk(ctx: any) {
    const { filterByTk, filterKeys } = ctx.action.params;
    let resourceUk = '';

    if (filterByTk) {
      resourceUk = filterByTk;
    }

    if (filterKeys && filterKeys.length > 0) {
      resourceUk = filterKeys.join(',');
    }

    return resourceUk;
  }

  async output(ctx: any, metadata?: Record<string, any>) {
    try {
      const { resourceName, actionName } = ctx.action;
      const action: Action = this.getAction(actionName, resourceName);
      if (!action) {
        return;
      }
      const auditLog: AuditLog = this.formatAuditData(ctx);
      if (typeof action !== 'string' && action.getMetaData) {
        const extra = await action.getMetaData(ctx);
        auditLog.metadata = { ...metadata, ...extra };
      } else {
        const defaultMetaData = await this.getDefaultMetaData(ctx);
        auditLog.metadata = { ...metadata, ...defaultMetaData };
      }
      this.logger.log(auditLog);
    } catch (err) {
      ctx.log?.error('audit output error: ' + err.message);
    }
  }
  // 中间件
  middleware() {
    return async (ctx: any, next: any) => {
      let metadata = {};
      try {
        await next();
      } catch (err) {
        // 操作失败的时候
        // HTTP相应状态码和error message 放到 metadata
        metadata = {
          status: ctx.status,
          errMsg: err.message,
        };
        throw err;
      } finally {
        this.output(ctx, metadata);
      }
    };
  }
}
