/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import WorkflowPlugin from '@nocobase/plugin-workflow';

import { getJavaScriptProcessConcurrency } from './JavaScriptProcessLimiter';
import ScriptInstruction from './ScriptInstruction';
import { JavaScriptTaskConsumer } from './JavaScriptTaskConsumer';
import { getJavaScriptQueueConcurrency, JavaScriptTaskQueue } from './JavaScriptTaskQueue';
import { JavaScriptTaskRecovery } from './JavaScriptTaskRecovery';

export class PluginWorkflowScriptServer extends Plugin {
  private taskQueue: JavaScriptTaskQueue;
  private taskConsumer: JavaScriptTaskConsumer;
  private taskRecovery: JavaScriptTaskRecovery;

  public get channelPendingJavaScriptTask() {
    return `${this.name}.pendingJavaScriptTask`;
  }

  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    this.taskQueue = new JavaScriptTaskQueue(this.app, this.channelPendingJavaScriptTask);
    this.taskConsumer = new JavaScriptTaskConsumer(workflowPlugin);
    this.taskRecovery = new JavaScriptTaskRecovery(workflowPlugin, this.taskQueue);

    workflowPlugin.registerInstruction('script', new ScriptInstruction(workflowPlugin, this.taskQueue));
    this.app.eventQueue.subscribe(this.channelPendingJavaScriptTask, {
      concurrency: Math.min(getJavaScriptQueueConcurrency(), getJavaScriptProcessConcurrency()),
      idle: () => this.taskConsumer.idle(),
      process: this.taskConsumer.process,
    });

    this.app.on('afterStart', () => {
      this.taskConsumer.setReady(true);
      this.taskRecovery.start();
    });

    this.app.on('beforeStop', async () => {
      this.taskConsumer.setReady(false);
      await this.taskConsumer.beforeStop();
      await this.taskRecovery.stop();
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginWorkflowScriptServer;
