/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InstallOptions, Plugin } from '@nocobase/server';
import { authType, namespace } from '../constants';
import { WeChatAuth } from './wechat-auth';
import { tval } from '@nocobase/utils';

/**
 * 微信认证服务器端插件类
 * 负责注册微信认证类型和连接测试功能
 */
export class PluginAuthWeChatServer extends Plugin {
  // 插件添加后的初始化钩子，目前为空实现
  afterAdd() {}

  /**
   * 插件加载时的主要逻辑
   * 1. 注册微信认证类型
   * 2. 注册API路由
   */
  async load() {
    try {
      // 步骤1：注册微信认证类型到认证管理器
      this.app.authManager.registerTypes(authType, {
        auth: WeChatAuth, // 使用WeChatAuth类处理认证逻辑
        title: tval('WeChat', { ns: namespace }), // 认证类型的显示名称，支持国际化
      });

      // 步骤2：注册API路由
      this.registerRoutes();

      // 记录插件加载成功日志
      this.app.logger.info('WeChat auth plugin loaded successfully', { plugin: namespace });
    } catch (error) {
      // 记录插件加载失败日志
      this.app.logger.error('Failed to load WeChat auth plugin', {
        plugin: namespace,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 注册API路由
   * 包括连接测试端点
   */
  private registerRoutes() {
    // 注册连接测试API端点
    this.app.resource({
      name: 'wechat',
      actions: {
        // 连接测试功能：验证微信AppID和AppSecret是否有效
        testConnection: async (ctx, next) => {
          const { appId, appSecret } = ctx.request.body || {};

          if (!appId || !appSecret) {
            ctx.body = {
              success: false,
              message: 'AppID和AppSecret不能为空',
            };
            ctx.status = 400;
            await next();
            return;
          }

          try {
            // 创建临时WeChatAuth实例进行连接测试
            const testAuth = new WeChatAuth({
              ctx: ctx,
              authenticator: { options: { public: { wechatConfig: { appId, appSecret } } } },
            } as any);
            const result = await testAuth.testConnection(appId, appSecret);

            ctx.body = result;
            ctx.status = 200;
          } catch (error: any) {
            ctx.body = {
              success: false,
              message: error.message || '连接测试失败',
            };
            ctx.status = 500;
          }

          await next();
        },
      },
    });

    // 设置ACL权限，允许登录用户使用连接测试功能
    this.app.acl.allow('wechat', 'testConnection', 'loggedIn');
  }

  // 插件安装时的钩子
  async install(options?: InstallOptions) {
    try {
      this.app.logger.info('WeChat auth plugin installed', { plugin: namespace });
    } catch (error) {
      this.app.logger.error('Failed to install WeChat auth plugin', {
        plugin: namespace,
        error: error.message,
      });
      throw error;
    }
  }

  // 插件启用后的钩子
  async afterEnable() {
    try {
      this.app.logger.info('WeChat auth plugin enabled', { plugin: namespace });
    } catch (error) {
      this.app.logger.error('Failed to enable WeChat auth plugin', {
        plugin: namespace,
        error: error.message,
      });
    }
  }

  // 插件禁用后的钩子
  async afterDisable() {
    try {
      this.app.logger.info('WeChat auth plugin disabled', { plugin: namespace });
    } catch (error) {
      this.app.logger.error('Failed to disable WeChat auth plugin', {
        plugin: namespace,
        error: error.message,
      });
    }
  }

  // 插件移除时的钩子
  async remove() {
    try {
      this.app.logger.info('WeChat auth plugin removed', { plugin: namespace });
    } catch (error) {
      this.app.logger.error('Failed to remove WeChat auth plugin', {
        plugin: namespace,
        error: error.message,
      });
    }
  }
}

export default PluginAuthWeChatServer;
