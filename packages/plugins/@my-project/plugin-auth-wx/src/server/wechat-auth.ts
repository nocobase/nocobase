/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import { AuthModel } from '@nocobase/plugin-auth';
import Wechat from 'wechat';
import { namespace } from '../constants';

/**
 * 微信认证类
 * 继承自BaseAuth，处理微信OAuth 2.0认证逻辑
 * 主要负责微信授权流程、用户信息获取和用户注册/登录流程
 */
export class WeChatAuth extends BaseAuth {
  private wechatClient: any; // 微信API客户端实例
  private wechatConfig: any; // 微信配置信息

  /**
   * 构造函数
   * @param config 认证配置，包含上下文信息
   */
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      // 设置用户集合为系统中的users表
      userCollection: ctx.db.getCollection('users'),
    });

    // 获取微信配置
    const authenticator = this.authenticator as AuthModel;
    const wechatConfig = authenticator.options?.public?.wechatConfig || {};

    // 初始化微信客户端
    this.wechatClient = new Wechat(wechatConfig);

    // 保存微信配置以供后续使用
    this.wechatConfig = wechatConfig;
  }

  /**
   * 验证用户身份
   * 微信OAuth 2.0认证的核心方法，流程如下：
   * 1. 获取授权码（code）
   * 2. 通过code换取access_token
   * 3. 获取用户信息
   * 4. 处理用户查找/创建逻辑
   * @returns 验证通过的用户模型
   */
  async validate() {
    const ctx = this.ctx;
    let user: Model; // 声明用户变量，用于存储查找或创建的用户

    try {
      // 从请求参数中提取微信授权码
      const {
        values: { code, state },
      } = ctx.action.params;

      if (!code) {
        // 授权码缺失，抛出错误
        throw new Error(ctx.t('Authorization code is required', { ns: namespace }));
      }

      // 步骤1：通过授权码获取用户授权信息
      const authInfo = await this.getAuthInfo(code, state);

      // 步骤2：获取用户详细信息
      const userInfo = await this.getUserInfo(authInfo.openid);

      // 步骤3：处理用户查找和创建逻辑
      user = await this.handleUserProcess(userInfo);

      // 返回验证通过的用户对象
      return user;
    } catch (err) {
      // 捕获并记录任何错误
      ctx.log.error('WeChat OAuth authentication failed', { error: err, method: 'validate' });

      // 根据错误类型返回不同错误信息
      if (err.message.includes('invalid_grant') || err.message.includes('authorization_code')) {
        throw new Error(ctx.t('Invalid or expired authorization code', { ns: namespace }));
      } else if (err.message.includes('access_token')) {
        throw new Error(ctx.t('Failed to obtain access token', { ns: namespace }));
      } else {
        throw new Error(err.message);
      }
    }
  }

  /**
   * 获取微信授权信息
   * 通过授权码(code)获取access_token和openid
   * @param code 微信授权码
   * @param state 状态参数，用于防止CSRF攻击
   * @returns 授权信息，包含access_token和openid
   */
  private async getAuthInfo(code: string, state?: string) {
    try {
      // 使用指数退避的重试策略
      const maxRetries = 3;
      let lastError: any;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // 调用微信API获取授权信息
          const authInfo = await this.wechatClient.getAccessToken(code);

          // 验证授权信息完整性
          if (!authInfo || !authInfo.openid) {
            throw new Error('Invalid auth response from WeChat');
          }

          return authInfo;
        } catch (error) {
          lastError = error;

          // 如果是最后一次尝试，抛出错误
          if (attempt === maxRetries) {
            break;
          }

          // 检查错误类型，确定是否需要重试
          if (this.shouldRetry(error)) {
            // 指数退避延迟
            const delay = Math.pow(2, attempt - 1) * 1000;
            await this.delay(delay);
            continue;
          } else {
            // 不需要重试的错误，直接抛出
            throw error;
          }
        }
      }

      // 所有重试都失败，抛出最后的错误
      throw lastError;
    } catch (err) {
      throw new Error(`Failed to get auth info: ${err.message}`);
    }
  }

  /**
   * 获取用户详细信息
   * @param openid 微信用户唯一标识
   * @returns 用户详细信息
   */
  private async getUserInfo(openid: string) {
    try {
      // 获取用户详细信息（包含昵称、头像等）
      const userInfo = await this.wechatClient.getUser(openid);

      if (!userInfo || !userInfo.openid) {
        throw new Error('Invalid user info response from WeChat');
      }

      return userInfo;
    } catch (err) {
      throw new Error(`Failed to get user info: ${err.message}`);
    }
  }

  /**
   * 处理用户查找和创建逻辑
   * 根据微信用户信息查找现有用户或创建新用户
   * @param userInfo 微信用户信息
   * @returns 用户模型
   */
  private async handleUserProcess(userInfo: any) {
    const ctx = this.ctx;
    const authenticator = this.authenticator as AuthModel;

    try {
      // 步骤1：尝试根据微信openid查找现有用户
      let user = await this.userRepository.findOne({
        filter: { 'wechat.openid': userInfo.openid }, // 查找已绑定的微信用户
      });

      if (user) {
        // 找到现有微信用户，更新用户信息
        await user.update({
          nickname: userInfo.nickname || userInfo.openid, // 更新昵称
          avatar: userInfo.headimgurl, // 更新头像
          'wechat.openid': userInfo.openid,
          'wechat.unionid': userInfo.unionid,
          'wechat.nickname': userInfo.nickname,
          'wechat.avatar': userInfo.headimgurl,
          'wechat.lastLoginTime': new Date(),
        });
        return user;
      }

      // 步骤2：处理新用户或现有用户绑定逻辑
      const { autoSignup } = this.authenticator.options?.public || {};

      if (autoSignup) {
        // 自动注册模式：创建新用户
        user = await authenticator.findOrCreateUser(userInfo.openid, {
          nickname: userInfo.nickname || `微信用户_${userInfo.openid}`,
          avatar: userInfo.headimgurl,
          'wechat.openid': userInfo.openid,
          'wechat.unionid': userInfo.unionid,
          'wechat.nickname': userInfo.nickname,
          'wechat.avatar': userInfo.headimgurl,
          'wechat.firstLoginTime': new Date(),
          'wechat.lastLoginTime': new Date(),
        });
        return user;
      }

      // 非自动注册模式：查找现有用户
      user = await authenticator.findUser(userInfo.openid);
      if (!user) {
        // 用户不存在且未开启自动注册
        throw new Error(ctx.t('User not found, please register first or enable auto signup', { ns: namespace }));
      }

      return user;
    } catch (err) {
      throw new Error(`User process failed: ${err.message}`);
    }
  }

  /**
   * 判断错误是否应该重试
   * 根据错误类型确定是否采用重试策略
   * @param error 错误对象
   * @returns 是否应该重试
   */
  private shouldRetry(error: any): boolean {
    // 网络错误、服务器错误、频率限制等临时性错误应该重试
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
      'getaddrinfo ENOTFOUND',
      'timeout',
      'ECONNABORTED',
      'rate_limit_exceeded',
      'too_many_requests',
      '429',
      '500',
      '502',
      '503',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.status || error.code;

    return retryableErrors.some((retryable) => errorMessage.includes(retryable) || errorCode == retryable);
  }

  /**
   * 延迟函数，用于重试间隔
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 生成微信登录二维码
   * 用于PC端扫码登录
   * @param sceneId 场景ID
   * @returns 二维码信息
   */
  async generateQRCode(sceneId: string) {
    try {
      // 获取配置信息
      const config = this.getWechatConfig();
      const appId = config.appId || this.wechatConfig.appId;

      // 生成微信登录二维码链接
      const qrCodeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${encodeURIComponent(
        config.redirectUri || '',
      )}&response_type=code&scope=snsapi_login&state=${sceneId}#wechat_redirect`;

      return {
        qrCodeUrl,
        sceneId,
        expireTime: Date.now() + 300000, // 5分钟过期
      };
    } catch (err) {
      throw new Error(`Failed to generate QR code: ${err.message}`);
    }
  }

  /**
   * 获取微信配置信息
   * @returns 当前微信配置
   */
  getWechatConfig() {
    const authenticator = this.authenticator as AuthModel;
    return authenticator.options?.public?.wechatConfig || {};
  }

  /**
   * 测试微信API连接
   * 验证AppID和AppSecret是否有效
   * @param appId 微信应用ID
   * @param appSecret 微信应用密钥
   * @returns 连接测试结果
   */
  async testConnection(appId: string, appSecret: string) {
    try {
      // 构建微信API测试请求
      const testUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

      // 发起HTTP请求
      const response = await this.makeHttpRequest(testUrl);
      const data = typeof response === 'string' ? JSON.parse(response) : response;

      // 检查响应结果
      if (data.access_token) {
        return {
          success: true,
          message: '微信API连接正常，可以获取access_token',
          data: {
            access_token: data.access_token,
            expires_in: data.expires_in,
          },
        };
      } else {
        // 微信API返回错误
        const errorCode = data.errcode || data.error_code;
        const errorMsg = data.errmsg || data.error_message;

        return {
          success: false,
          message: `微信API错误: ${errorMsg} (错误码: ${errorCode})`,
          error: {
            code: errorCode,
            message: errorMsg,
          },
        };
      }
    } catch (error: any) {
      // 网络错误或其他异常
      return {
        success: false,
        message: `连接测试失败: ${error.message}`,
        error: {
          type: 'network_error',
          message: error.message,
        },
      };
    }
  }

  /**
   * 发起HTTP请求
   * @param url 请求URL
   * @returns 响应数据
   */
  private async makeHttpRequest(url: string): Promise<any> {
    try {
      // 使用fetch API进行HTTP请求
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NocoBase/WeChat-Auth-Plugin',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // 如果fetch失败，尝试使用Node.js的http模块
      return await this.fallbackHttpRequest(url);
    }
  }

  /**
   * 备用HTTP请求方法（Node.js环境）
   * @param url 请求URL
   * @returns 响应数据
   */
  private async fallbackHttpRequest(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const https = require('https');

      https
        .get(url, (res: any) => {
          let data = '';

          res.on('data', (chunk: any) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (error) {
              reject(new Error(`Failed to parse JSON response: ${data}`));
            }
          });
        })
        .on('error', (error: any) => {
          reject(error);
        });
    });
  }
}
