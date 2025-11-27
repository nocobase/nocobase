/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 微信授权配置集合
 * 用于存储和管理微信应用的各种授权配置信息，包括Access Token、JSAPI票据等缓存数据
 * 支持公众号、小程序、Web应用和移动应用等多种微信应用类型
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'wechatAuth',
  fields: [
    /**
     * 主键字段 - 微信授权配置唯一标识符
     * 系统自动生成的递增ID，用于唯一标识每个微信授权配置记录
     */
    {
      type: 'bigInt',
      name: 'id',
      interface: 'integer',
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      uiSchema: {
        type: 'number',
        title: '{{t("ID")}}',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      },
    },
    /**
     * 配置名称 - 用户可读的配置标识
     * 用于区分不同的微信授权配置，建议使用描述性的名称
     */
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Name")}}',
        'x-component': 'Input',
        'x-validator': 'required',
      },
    },
    /**
     * 微信应用ID - 微信应用的唯一标识
     * 从微信开放平台获取，对应不同类型应用有特定的AppID格式
     * 用于构建微信授权URL和API调用请求头
     */
    {
      type: 'string',
      name: 'appId',
      interface: 'input',
      allowNull: false,
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("WeChat AppID")}}',
        'x-component': 'Input',
        'x-validator': 'required',
        'x-decorator': 'FormItem',
        description: '{{t("WeChat application ID, unique identifier for the app")}}',
      },
    },
    /**
     * 微信应用密钥 - 用于获取Access Token的密钥
     * 高度敏感的凭证信息，需要加密存储
     * 用于服务器端API调用时的身份验证
     */
    {
      type: 'string',
      name: 'appSecret',
      interface: 'password',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("WeChat AppSecret")}}',
        'x-component': 'Password',
        'x-validator': 'required',
        'x-decorator': 'FormItem',
        description: '{{t("WeChat application secret key, keep it confidential")}}',
      },
    },
    /**
     * 应用类型 - 微信应用的业务类型
     * 支持公众号、小程序、Web应用和移动应用四种主要类型
     * 不同类型在授权流程和API调用上有所差异
     */
    {
      type: 'string',
      name: 'appType',
      interface: 'select',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Application Type")}}',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        'x-validator': 'required',
        enum: [
          {
            label: '{{t("Official Account")}}',
            value: 'official_account',
          },
          {
            label: '{{t("Mini Program")}}',
            value: 'mini_program',
          },
          {
            label: '{{t("Web Application")}}',
            value: 'web_app',
          },
          {
            label: '{{t("Mobile Application")}}',
            value: 'mobile_app',
          },
        ],
        description: '{{t("Type of WeChat application")}}',
      },
    },
    /**
     * 缓存访问令牌 - 用于API调用的认证凭证
     * 从微信服务器获取的Access Token，7200秒有效期
     * 系统会自动刷新过期令牌
     */
    {
      type: 'string',
      name: 'accessToken',
      interface: 'textarea',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Access Token")}}',
        'x-component': 'Input.TextArea',
        'x-read-pretty': true,
        description: '{{t("Cached WeChat access token")}}',
      },
    },
    /**
     * 访问令牌过期时间 - 用于令牌自动刷新
     * 与Access Token配套使用，在过期前自动重新获取
     * 确保API调用的连续性和稳定性
     */
    {
      type: 'date',
      name: 'accessTokenExpiresAt',
      interface: 'datetime',
      allowNull: true,
      uiSchema: {
        type: 'datetime',
        title: '{{t("Access Token Expires At")}}',
        'x-component': 'DatePicker',
        'x-read-pretty': true,
        description: '{{t("When the access token will expire")}}',
      },
    },
    /**
     * JSAPI票据 - 用于微信JS-SDK调用的票据
     * 获取用户信息、分享等前端功能所需的凭证
     * 与Access Token关联，同样有有效期限制
     */
    {
      type: 'string',
      name: 'jsapiTicket',
      interface: 'textarea',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("JSAPI Ticket")}}',
        'x-component': 'Input.TextArea',
        'x-read-pretty': true,
        description: '{{t("Cached JSAPI ticket for WeChat API calls")}}',
      },
    },
    /**
     * JSAPI票据过期时间 - 票据自动刷新时间点
     * 在票据即将过期时自动重新获取
     * 保障前端微信功能正常运作
     */
    {
      type: 'date',
      name: 'jsapiTicketExpiresAt',
      interface: 'datetime',
      allowNull: true,
      uiSchema: {
        type: 'datetime',
        title: '{{t("JSAPI Ticket Expires At")}}',
        'x-component': 'DatePicker',
        'x-read-pretty': true,
        description: '{{t("When the JSAPI ticket will expire")}}',
      },
    },
    /**
     * 服务器验证令牌 - 微信服务器配置验证凭证
     * 用于验证微信公众号服务器地址的有效性
     * 在接收微信推送消息时进行安全验证
     */
    {
      type: 'string',
      name: 'serverToken',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Server Token")}}',
        'x-component': 'Input',
        description: '{{t("Server verification token for WeChat server configuration")}}',
      },
    },
    /**
     * 二维码场景ID - 微信登录场景标识
     * 用于生成带场景值的二维码登录链接
     * 帮助系统区分不同的登录场景和来源
     */
    {
      type: 'string',
      name: 'qrSceneId',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("QR Scene ID")}}',
        'x-component': 'Input',
        description: '{{t("Scene ID for QR code login sessions")}}',
      },
    },
    /**
     * 二维码场景字符串 - 场景描述信息
     * 与场景ID配合使用，提供更丰富的场景描述
     * 可用于标识特定的用户群体或功能模块
     */
    {
      type: 'string',
      name: 'qrSceneStr',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("QR Scene String")}}',
        'x-component': 'Input',
        description: '{{t("Scene string for QR code login sessions")}}',
      },
    },
    /**
     * OAuth授权范围 - 用户授权权限范围
     * 控制应用可以访问的用户信息范围
     * 例如：snsapi_userinfo（获取用户基本信息）
     */
    {
      type: 'string',
      name: 'scope',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("OAuth Scope")}}',
        'x-component': 'Input',
        description: '{{t("WeChat OAuth scope, e.g. snsapi_userinfo")}}',
      },
    },
    /**
     * 关联微信用户表 - 一个配置对应多个用户记录
     * hasMany关系：通过wechatAuthId外键关联wechatUsers表
     * 实现一个微信应用配置管理多个用户账户的功能
     */
    {
      type: 'hasMany',
      name: 'users',
      target: 'wechatUsers',
      sourceKey: 'id',
      foreignKey: 'wechatAuthId',
      interface: 'o2m',
      uiSchema: {
        type: 'array',
        title: '{{t("WeChat Users")}}',
        'x-component': 'AssociationField',
        'x-decorator': 'FormItem',
        description: '{{t("Users associated with this WeChat application")}}',
      },
    },
    /**
     * 关联二维码会话表 - 一个配置对应多个登录会话
     * hasMany关系：通过wechatAuthId外键关联qrSessions表
     * 管理该微信应用创建的所有二维码登录会话
     */
    {
      type: 'hasMany',
      name: 'qrSessions',
      target: 'qrSessions',
      sourceKey: 'id',
      foreignKey: 'wechatAuthId',
      interface: 'o2m',
      uiSchema: {
        type: 'array',
        title: '{{t("QR Code Sessions")}}',
        'x-component': 'AssociationField',
        'x-decorator': 'FormItem',
        description: '{{t("QR code sessions created with this application")}}',
      },
    },
  ],
});
