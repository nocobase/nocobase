/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { BaseTaskManager } from './base-task-manager';
import { CommandTaskType } from './command-task-type';
import asyncTasksResource from './resourcers/async-tasks';

export class PluginAsyncTaskManagerServer extends Plugin {
  async beforeLoad() {
    const manager = new BaseTaskManager();
    // @ts-ignore
    manager.setLogger(this.app.logger);
    manager.setApp(this.app);
    manager.registerTaskType(CommandTaskType);
    this.app.container.register('AsyncTaskManager', manager);

    this.app.acl.allow('asyncTasks', ['list', 'get', 'fetchFile', 'stop'], 'loggedIn');
  }
  async load() {
    this.app.resourceManager.define(asyncTasksResource);
  }
}

export default PluginAsyncTaskManagerServer;
