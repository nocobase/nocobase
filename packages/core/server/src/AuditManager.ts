/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { app } from 'packages/core/app/client/src/pages';

interface AuditLog {
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
  log(auditLog: AuditLog): void;
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
   * 当注册的接口有重叠是，颗粒度洗的注册方法优先级更高 ？怎么进行判断？
   * registerActions(['create']);
   * registerAction([{ name: 'xxx:create', getMetaData }]); // 采用这个
   */

  registerActions(actions: Action[]) {
    actions.forEach((action) => {
      if (typeof action === 'string') {
        this.registerAction(action);
      } else {
        this.registerAction(action.name, action.getMetaData);
      }
    });
  }

  // 注册单个操作，支持的用法同上
  // registerAction('create')
  // registerAction('app:*')
  // registerAction('pm:update')
  // registerAction('create', { getMetaData })
  registerAction(actionName: string, options?: Omit<Action, 'name'>) {
    const resourceMap = new Map<string, Action>();
    const { actionName: name, resouceName } = this.formatActionAndResource(actionName);
    resourceMap.set(resouceName, null);
    this.resources.set(name, resourceMap);
  }

  formatActionAndResource(actionName: string) {
    if (actionName.indexOf(':') >= 0) {
      const names = actionName.split(':');
      return {
        actionName: names[0],
        resourceName: names[1],
      };
    }

    return {
      actionName: actionName,
      resouceName: '*',
    };
  }

  // 获取action
  getAction(action: string, resource?: string) {
    const act: Map<string, Action> = this.resources.get(action);

    if (resource) {
      return act.get(resource);
    } else {
      return act.get('*');
    }
  }

  async getDefaultMetaData(ctx: Context) {
    return {
      request: {
        params: {},
        body: {},
      },
      response: {
        body: {},
      },
    };
  }

  getMetaData(actionName: string, resouceName: string) {}

  formatAuditData(ctx: any) {
    const auditLog: AuditLog = {
      uuid: ctx.app.reqId,
      dataSource: ctx.db.database,
      resource: ctx.action.resouceName,
      association: ctx.db.association,
      action: ctx.action,
      resourceUk: ctx.resourceUk,
      userId: ctx.app.userId,
      roleName: ctx.app.roleName,
      ip: ctx.app.ip,
      ua: ctx.app.ua,
      status: ctx.app.status,
      createdAt: ctx.app.createdAt,
      metadata: null,
    };
    return auditLog;
  }

  async output(ctx: Context, status: number, metadata: Record<string, any>) {
    // 操作后，记录审计日志
    // 1. 从ctx.action 获取 resourceName, actionName,
    const { resourceName, actionName } = ctx.action;
    // 2. 判断操作是否需要审计
    const action = this.getAction(actionName, resourceName);
    if (!action) {
      return;
    }
    // 3. 从上下文获取各种信息，可以抽一个方法
    // let uuid = ctx.reqId;

    // let dataSource
    // ...
    const auditLog: AuditLog = this.formatAuditData(ctx);
    // 4.获取默认metadata
    const defaultMetaData = await this.getDefaultMetaData(ctx);
    // 5. 用操作注册的 getMetadata 方法获取metadata
    const extra = await action.getMetaData?.(ctx);
    metadata = { ...defaultMetaData, ...metadata, ...extra };
    auditLog.metadata = metadata;
    this.logger.log(auditLog);
  }

  // 中间件
  middleware() {
    return async (ctx, next) => {
      const metadata = {};
      let status = 0;
      try {
        await next();
        status = 1;
      } catch (err) {
        // 操作失败的时候
        // HTTP相应状态码和error message 放到 metadata
        metadata.status = ctx.status;
        metadata.errMsg = err.message;
      } finally {
        this.output(ctx, status, metadata);
      }
    };
  }
}

class Application {
  auditManager: AuditManager;
}

app.use(app.auditManager.middleware, {
  tag: 'audit',
  after: 'dataWrapping',
});
