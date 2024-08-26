/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

import { utils } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';

export class PluginAuditLoggerServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // console.log('fff', this.app.auditManager);
    const subApp = this.app;
    this.app.auditManager.setLogger({
      // 记录方法，输出日志文件和写入文件日志表
      async log(auditLog: AuditLog) {
        // 默认注册数据表的资源操作
        const auditTrail = subApp.db.getCollection('auditTrails');
        await auditTrail.repository.create({
          values: auditLog,
        });
      },
    });

    this.app.auditManager.registerActions([
      'create',
      'update',
      'destroy',
      'firstOrCreate',
      'updateOrCreate',
      'move',
      'set',
      'add',
      'remove',
      'toggle',
      // 下面的特定接口后面会整理出来
      'app:restart',
      'pm:update',
      'app:getInfo',
      // ...
    ]);

    this.app.resourceManager.define({
      name: 'auditTrails',
      only: ['list', 'get', 'export'],
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['auditTrails:*'],
    });

    this.app.use(this.app.auditManager.middleware(), {
      tag: 'audit',
      after: 'dataWrapping',
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAuditLoggerServer;
