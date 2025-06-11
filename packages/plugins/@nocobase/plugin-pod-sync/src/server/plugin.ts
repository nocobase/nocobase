/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor, Plugin } from '@nocobase/server';
import { Cache } from '@nocobase/cache';
import { createRedisPubSubAdapter } from './RedisPubSubAdapter';
import {
  SYNC_MESSAGE_TYPE,
  SYSTEM_MANAGEMENT,
  SYSTEM_MANAGEMENT_SNIPPET,
  SYSTEM_MANAGEMENT_ACTIONS,
  disableMetaOpMap,
  SYSTEM_MANAGEMENT_SUB_APP_START_EVENT,
} from './constants';
import { getConfig, setConfig } from './actions';
import SystemManager from './SystemManager';
// @ts-ignore
import { name } from '../../package.json';

export class PluginPodSyncServer extends Plugin {
  cache: Cache;

  async afterAdd() {
    if (process.env.CACHE_REDIS_URL) {
      const redisAdapter = createRedisPubSubAdapter({ url: process.env.CACHE_REDIS_URL });
      this.app.pubSubManager.setAdapter(redisAdapter);
    }
  }
  async beforeLoad() {
    this.cache = await this.app.cacheManager.createCache({
      name: SYSTEM_MANAGEMENT,
      prefix: SYSTEM_MANAGEMENT,
      isGlobal: true,
    });

    this.app.container.register(SystemManager.displayName, () => {
      const manager = new SystemManager(this.app, this.cache);
      return manager;
    });
  }
  async load() {
    this.defineResources();

    this.setupEvents();

    this.setMiddleware();
  }
  setMiddleware() {
    this.app.resourceManager.use(async (ctx, next) => {
      const { actionName, resourceName, params } = ctx.action;
      // 禁用元数据操作
      if (disableMetaOpMap.has(resourceName)) {
        const actions = disableMetaOpMap.get(resourceName);
        const isDisableAction = Array.isArray(actions) && actions.includes(actionName);
        const systemManager = ctx.app.container.get(SystemManager.displayName);
        const { disableMetaOp } = await systemManager.getConfig();

        if ((actions === '*' || isDisableAction) && disableMetaOp) {
          ctx.throw(
            403,
            ctx.t(
              'The platform is currently being upgraded, and this operation is temporarily disabled. If you have any issues, please contact GT at zohar.chen.',
              {
                ns: name,
              },
            ),
          );
        }
      }

      // 同步消息处理
      await this.app.syncMessageManager.sync();

      // 创建应用时，等待子应用安装完成
      if (actionName === 'create' && resourceName === 'applications') {
        ctx.waitSubAppInstall = true;
      }

      // 应用重启
      if (actionName === 'restart' && resourceName === 'app') {
        this.sendSyncMessage({
          type: SYNC_MESSAGE_TYPE.APP_RESTART,
          appName: ctx.app.name,
          from: 'resourceManager restart',
        });
      }

      await next();

      if (['enable', 'disable'].includes(actionName) && resourceName === 'pm') {
        const message: any = {
          type: SYNC_MESSAGE_TYPE.PLUGIN_ACTION,
          action: actionName,
          from: 'resourceManager',
        };
        // 支持批量启动的情况
        if (Array.isArray(params.filterByTk)) {
          message.pluginNames = params.filterByTk;
        } else {
          message.pluginName = params.filterByTk;
        }
        this.sendSyncMessage(message, {
          debounce: 0,
          skipSelf: false,
        });
      }

      // 应用重启 backupFiles:restore
      if (resourceName === 'backupFiles' && actionName === 'restore') {
        this.sendSyncMessage({
          type: SYNC_MESSAGE_TYPE.APP_RESTART,
          appName: ctx.app.name,
          from: 'resourceManager restore',
        });
      }
    });
  }
  // 接口定义
  defineResources() {
    this.app.resourceManager.define({
      name: SYSTEM_MANAGEMENT,
      actions: {
        getConfig,
        setConfig,
      },
    });

    this.app.acl.registerSnippet({
      name: SYSTEM_MANAGEMENT_SNIPPET,
      actions: [SYSTEM_MANAGEMENT_ACTIONS],
    });

    // 权限限制
    this.app.acl.allow(SYSTEM_MANAGEMENT, ['setConfig', 'create', 'update', 'destory'], (ctx) => {
      return ctx.state.currentRole === 'root' && ctx.app.name === 'main';
    });

    this.app.acl.allow(SYSTEM_MANAGEMENT, 'getConfig', 'loggedIn');
  }
  // 事件监听
  setupEvents() {
    const sendAppStart = async (app) => {
      try {
        const mainApp = await AppSupervisor.getInstance().getApp('main');
        const plugin = mainApp.pm.get('multi-app-manager');
        await plugin.sendSyncMessage({
          type: 'subAppStarted',
          appName: app.name,
        });
      } catch (error) {
        this.app.logger.error(error);
      }
    };
    // 有工作流时触发一次
    this.app.once(SYSTEM_MANAGEMENT_SUB_APP_START_EVENT, sendAppStart);
  }
  // 向主应用(无论是否服务应用)发送全局同步消息
  handleSyncMessage = async (message: any) => {
    const { type } = message || {};

    // 重启应用
    if (type === SYNC_MESSAGE_TYPE.APP_RESTART) {
      const { appName } = message;
      if (appName) {
        await this.app.runAsCLI(['restart'], { from: 'user' });
      } else {
        await this.app.restart();
      }
    }

    // 插件开关
    if (type === SYNC_MESSAGE_TYPE.PLUGIN_ACTION) {
      const { action } = message;
      let { pluginNames } = message;

      if (!pluginNames) {
        pluginNames = [message.pluginName];
      }

      for (const pluginName of pluginNames) {
        try {
          await this.app.runAsCLI(['pm', action, pluginName], { from: 'user' });
          // await this.app.pm[action](pluginName);
          await this.app.runAsCLI(['restart'], { from: 'user' });
          this.app.logger.warn(`pluginAction >>>>> ${pluginName} enabled: ${this.pm.get(pluginName)?.enabled}`);
        } catch (error) {
          this.app.logger.error(`Failed to ${action} plugin ${pluginName}`, error);
          await this.app.tryReloadOrRestart({ recover: true });
        }
      }
    }
  };
}

export default PluginPodSyncServer;
