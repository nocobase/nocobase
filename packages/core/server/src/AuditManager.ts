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
  metadata: string;
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

export interface AuditManageOptions {
  logger: AuditLogger;
  resources: Map<string, Map<string, Action>>;
}

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
      if (typeof action === 'string') {
        this.registerAction(action);
      } else {
        this.registerAction(action.name, action);
      }
    });
  }

  // 注册单个操作，支持的用法同上
  // registerAction('create')
  // registerAction('app:*')
  // registerAction('pm:update')
  // registerAction('create', { getMetaData })
  registerAction(actionName: string, options?: Action) {
    const { actionName: name, resourceName } = this.formatActionAndResource(actionName);

    if (this.resources.has(name)) {
      const preResourceMap: Map<string, Action> = this.resources.get(name);
      const preResouceName: string = Object.keys(preResourceMap)[0];
      const preOptions: Action = preResourceMap.get(preResouceName);
      const prePriority = this.calculatePriority(preResouceName, name, preOptions);
      const priority = this.calculatePriority(resourceName, name, options);

      if (prePriority < priority) {
        this.setResource(name, resourceName, options);
      }
    } else {
      this.setResource(name, resourceName, options);
    }

    console.log('register', this.resources);
  }

  setResource(actionName: string, resouceName: string, options?: Action) {
    const resourceMap = new Map<string, Action>();
    if (options && typeof options !== 'string') {
      const { getMetaData } = options;
      resourceMap.set(resouceName, { name: actionName, getMetaData: getMetaData });
    } else {
      resourceMap.set(resouceName, actionName);
    }
    this.resources.set(actionName, resourceMap);
  }

  calculatePriority(resouceName: string, actionName: string, options?: Action) {
    let priority = 0;

    if (options && typeof options !== 'string') {
      const { getMetaData } = options;
      if (getMetaData) {
        priority = priority + 100;
      }
    }

    if (resouceName === '*') {
      priority = priority + 25;
    } else {
      priority = priority + 50;
    }

    if (actionName) {
      priority = priority + 1;
    }

    return priority;
  }

  formatActionAndResource(actionName: string) {
    if (actionName.indexOf(':') >= 0) {
      const names = actionName.split(':');
      return {
        actionName: names[1],
        resourceName: names[0],
      };
    }

    return {
      actionName: actionName,
      resourceName: '*',
    };
  }

  getAction(action: string, resource?: string) {
    const act: Map<string, Action> = this.resources.get(action);
    if (!act) return null;

    if (resource) {
      return act.get(resource);
    } else {
      return act.get('*');
    }
  }

  async getDefaultMetaData(ctx: any) {
    if (ctx.response.status !== 200) {
      return {
        request: ctx.request,
        response: ctx.response,
      };
    } else {
      return null;
    }
  }

  formatAuditData(ctx: any) {
    const { filterByTk } = ctx.action.params;
    const { resourceName } = ctx.action;
    const resourceArray = resourceName.split('.');
    let association = '';
    if (resourceArray.length > 0) {
      association = resourceArray[1];
    }

    const auditLog: AuditLog = {
      uuid: ctx.reqId,
      dataSource: ctx.action.sourceId,
      resource: resourceName,
      association: association,
      collection: ctx.action.sourceId,
      action: ctx.action.name,
      resourceUk: filterByTk,
      userId: ctx.state?.currentUser?.id,
      roleName: ctx.state?.currentRole,
      ip: ctx.request.header['host'],
      ua: ctx.request.header['user-agent'],
      status: ctx.response.status,
      createdAt: new Date() + '',
      metadata: null,
    };
    return auditLog;
  }

  async output(ctx: any, status: number, metadata?: Record<string, any>) {
    // 操作后，记录审计日志
    // 1. 从ctx.action 获取 resourceName, actionName,
    const { resourceName, actionName } = ctx.action;
    // 2. 判断操作是否需要审计
    const action: Action = this.getAction(actionName, resourceName);
    if (!action) {
      return;
    }
    // 3. 从上下文获取各种信息，可以抽一个方法
    const auditLog: AuditLog = this.formatAuditData(ctx);
    // 4.获取默认metadata
    const defaultMetaData = await this.getDefaultMetaData(ctx);
    // 5. 用操作注册的 getMetadata 方法获取metadata
    if (defaultMetaData) {
      metadata = { ...defaultMetaData };
    }
    if (typeof action !== 'string') {
      const extra = await action.getMetaData(ctx);
      metadata = { ...metadata, ...extra };
    }
    if (metadata && Object.keys(metadata).length !== 0) {
      auditLog.metadata = JSON.stringify(metadata);
    }

    this.logger.log(auditLog);
  }

  // 中间件
  middleware() {
    return async (ctx: any, next: any) => {
      // console.log('middleware', ctx)
      let metadata = {};
      let status = 0;
      try {
        await next();
        status = 1;
      } catch (err) {
        // 操作失败的时候
        // HTTP相应状态码和error message 放到 metadata
        metadata = {
          status: ctx.status,
          errMsg: err.message,
        };
      } finally {
        this.output(ctx, status, metadata);
      }
    };
  }
}
