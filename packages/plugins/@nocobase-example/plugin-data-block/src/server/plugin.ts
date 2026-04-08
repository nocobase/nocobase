/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // 登录用户可以对 todoItems 进行增删改查
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // 插件首次安装时，插入几条示例数据
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
