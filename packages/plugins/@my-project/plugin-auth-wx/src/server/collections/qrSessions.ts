/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 二维码登录会话集合
 * 用于管理微信二维码登录的会话生命周期，包括会话创建、扫码、确认、过期等状态
 * 支持Web端扫码登录的完整流程跟踪和安全控制
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'qrSessions',
  fields: [
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
      // 主键字段 - 二维码会话记录唯一标识符
    },
    {
      type: 'string',
      name: 'sessionId',
      interface: 'input',
      allowNull: false,
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Session ID")}}',
        'x-component': 'Input',
        'x-validator': 'required',
        'x-decorator': 'FormItem',
        description: '{{t("Unique session identifier for QR code login")}}',
      },
      // 会话唯一标识符 - 用于标识每个二维码登录会话，保证全局唯一性
    },
    {
      type: 'bigInt',
      name: 'wechatAuthId',
      interface: 'integer',
      allowNull: false,
      uiSchema: {
        type: 'number',
        title: '{{t("WeChat Auth ID")}}',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem',
        'x-validator': 'required',
        description: '{{t("Reference to the WeChat application configuration")}}',
      },
      // 微信应用配置ID - 关联wechatAuth配置表的外键字段
    },
    {
      type: 'belongsTo',
      name: 'wechatAuth',
      target: 'wechatAuth',
      targetKey: 'id',
      foreignKey: 'wechatAuthId',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '{{t("WeChat Application")}}',
        'x-component': 'AssociationField',
        'x-decorator': 'FormItem',
        description: '{{t("WeChat application configuration for this session")}}',
      },
      // 关联微信应用配置 - 多对一关系，表明会话属于哪个微信应用
    },
    {
      type: 'string',
      name: 'qrCode',
      interface: 'textarea',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("QR Code Data")}}',
        'x-component': 'Input.TextArea',
        'x-validator': 'required',
        'x-decorator': 'FormItem',
        description: '{{t("Base64 encoded QR code image data or URL")}}',
      },
      // 二维码数据 - 存储二维码的Base64编码数据或URL地址
    },
    {
      type: 'string',
      name: 'status',
      interface: 'select',
      allowNull: false,
      defaultValue: 'pending',
      uiSchema: {
        type: 'string',
        title: '{{t("Status")}}',
        'x-component': 'Select',
        enum: [
          {
            label: '{{t("Pending")}}',
            value: 'pending',
          },
          {
            label: '{{t("Scanned")}}',
            value: 'scanned',
          },
          {
            label: '{{t("Confirmed")}}',
            value: 'confirmed',
          },
          {
            label: '{{t("Expired")}}',
            value: 'expired',
          },
          {
            label: '{{t("Cancelled")}}',
            value: 'cancelled',
          },
          {
            label: '{{t("Failed")}}',
            value: 'failed',
          },
        ],
        description: '{{t("Current status of the QR code session")}}',
      },
      // 会话状态 - 跟踪二维码登录的当前状态：待扫描、已扫描、已确认、已过期、已取消、失败
    },
    {
      type: 'string',
      name: 'userAgent',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("User Agent")}}',
        'x-component': 'Input',
        'x-read-pretty': true,
        description: '{{t("Browser user agent string for the login request")}}',
      },
      // 用户代理字符串 - 记录发起登录请求的浏览器用户代理信息，用于调试和统计
    },
    {
      type: 'string',
      name: 'clientIp',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Client IP")}}',
        'x-component': 'Input',
        'x-read-pretty': true,
        description: '{{t("IP address of the client making the login request")}}',
      },
      // 客户端IP地址 - 记录发起登录请求的客户端IP地址，用于安全审计和地理定位
    },
    {
      type: 'string',
      name: 'sceneId',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Scene ID")}}',
        'x-component': 'Input',
        description: '{{t("WeChat QR code scene ID")}}',
      },
      // 微信场景值ID - 微信二维码的场景值ID，用于区分不同的二维码场景
    },
    {
      type: 'string',
      name: 'sceneStr',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Scene String")}}',
        'x-component': 'Input',
        description: '{{t("WeChat QR code scene string")}}',
      },
      // 微信场景值字符串 - 微信二维码的场景字符串，提供更灵活的场景标识
    },
    {
      type: 'string',
      name: 'ticket',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("QR Ticket")}}',
        'x-component': 'Input',
        description: '{{t("WeChat QR code ticket")}}',
      },
      // 微信二维码票据 - 微信返回的QR code ticket，用于后续的票据验证
    },
    {
      type: 'string',
      name: 'wechatUserId',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("WeChat User ID")}}',
        'x-component': 'Input',
        description: '{{t("WeChat OpenID of the user who scanned the QR code")}}',
      },
      // 微信用户ID - 扫码用户的OpenID，用于标识具体是哪个微信用户扫码
    },
    {
      type: 'string',
      name: 'wechatNickname',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("WeChat Nickname")}}',
        'x-component': 'Input',
        description: '{{t("Nickname of the user who scanned the QR code")}}',
      },
      // 微信用户昵称 - 扫码用户的微信昵称，用于展示和确认
    },
    {
      type: 'string',
      name: 'wechatAvatar',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("WeChat Avatar")}}',
        'x-component': 'Input',
        description: '{{t("Avatar URL of the user who scanned the QR code")}}',
      },
      // 微信用户头像 - 扫码用户的微信头像URL，用于用户确认界面显示
    },
    {
      type: 'bigInt',
      name: 'userId',
      interface: 'integer',
      allowNull: true,
      uiSchema: {
        type: 'number',
        title: '{{t("System User ID")}}',
        'x-component': 'InputNumber',
        description: '{{t("ID of the user in the system after successful login")}}',
      },
      // 系统用户ID - 登录成功后对应的NocoBase系统用户标识符
    },
    {
      type: 'date',
      name: 'scannedAt',
      interface: 'datetime',
      allowNull: true,
      uiSchema: {
        type: 'datetime',
        title: '{{t("Scanned At")}}',
        'x-component': 'DatePicker',
        'x-read-pretty': true,
        description: '{{t("When the QR code was scanned by a user")}}',
      },
      // 扫码时间 - 用户扫描二维码的时间戳，用于跟踪登录流程进度
    },
    {
      type: 'date',
      name: 'confirmedAt',
      interface: 'datetime',
      allowNull: true,
      uiSchema: {
        type: 'datetime',
        title: '{{t("Confirmed At")}}',
        'x-component': 'DatePicker',
        'x-read-pretty': true,
        description: '{{t("When the login was confirmed by the user")}}',
      },
      // 确认时间 - 用户确认登录的时间戳，标志着登录流程成功完成
    },
    {
      type: 'date',
      name: 'expiresAt',
      interface: 'datetime',
      allowNull: false,
      uiSchema: {
        type: 'datetime',
        title: '{{t("Expires At")}}',
        'x-component': 'DatePicker',
        'x-validator': 'required',
        'x-decorator': 'FormItem',
        description: '{{t("When this QR code session will expire")}}',
      },
      // 过期时间 - 二维码会话的过期时间，用于自动清理过期的登录会话
    },
    {
      type: 'json',
      name: 'additionalData',
      interface: 'object',
      allowNull: true,
      uiSchema: {
        type: 'object',
        title: '{{t("Additional Data")}}',
        'x-component': 'Input.JSON',
        description: '{{t("Additional session data in JSON format")}}',
      },
      // 额外数据 - 存储会话相关的额外JSON数据，用于扩展功能和调试
    },
  ],
});
