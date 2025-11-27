/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class WeChatAuthCollectionsMigration extends Migration {
  appVersion = '>=1.0.0';

  async up() {
    // 获取数据库实例
    const db = this.context.db;

    // 创建 wechatAuth 集合
    await db.collection({
      name: 'wechatAuth',
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
        },
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
        {
          type: 'boolean',
          name: 'enabled',
          interface: 'switch',
          allowNull: false,
          defaultValue: true,
          uiSchema: {
            type: 'boolean',
            title: '{{t("Enabled")}}',
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
          },
        },
        {
          type: 'json',
          name: 'securitySettings',
          interface: 'object',
          allowNull: true,
          uiSchema: {
            type: 'object',
            title: '{{t("Security Settings")}}',
            'x-component': 'Input.JSON',
            description: '{{t("Additional security configuration parameters")}}',
          },
        },
        {
          type: 'text',
          name: 'description',
          interface: 'textarea',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Description")}}',
            'x-component': 'Input.TextArea',
            description: '{{t("Description of this WeChat application configuration")}}',
          },
        },
      ],
    });

    // 创建 wechatUsers 集合
    await db.collection({
      name: 'wechatUsers',
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
        },
        {
          type: 'bigInt',
          name: 'userId',
          interface: 'integer',
          allowNull: false,
          uiSchema: {
            type: 'number',
            title: '{{t("User ID")}}',
            'x-component': 'InputNumber',
            'x-validator': 'required',
            'x-decorator': 'FormItem',
          },
        },
        {
          type: 'string',
          name: 'openId',
          interface: 'input',
          allowNull: false,
          uiSchema: {
            type: 'string',
            title: '{{t("OpenID")}}',
            'x-component': 'Input',
            'x-validator': 'required',
            'x-decorator': 'FormItem',
            description: '{{t("WeChat OpenID for the user in this app")}}',
          },
        },
        {
          type: 'string',
          name: 'unionId',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("UnionID")}}',
            'x-component': 'Input',
            description: '{{t("WeChat UnionID, unique across all WeChat applications")}}',
          },
        },
        {
          type: 'bigInt',
          name: 'wechatAuthId',
          interface: 'integer',
          allowNull: false,
          uiSchema: {
            type: 'number',
            title: '{{t("WeChat Auth Config ID")}}',
            'x-component': 'InputNumber',
            'x-validator': 'required',
            'x-decorator': 'FormItem',
          },
        },
        {
          type: 'string',
          name: 'nickname',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Nickname")}}',
            'x-component': 'Input',
            description: '{{t("WeChat nickname (may change over time)")}}',
          },
        },
        {
          type: 'string',
          name: 'avatar',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Avatar URL")}}',
            'x-component': 'Input',
            description: '{{t("URL to the user\'s WeChat avatar image")}}',
          },
        },
        {
          type: 'string',
          name: 'gender',
          interface: 'select',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Gender")}}',
            'x-component': 'Select',
            enum: [
              {
                label: '{{t("Unknown")}}',
                value: '0',
              },
              {
                label: '{{t("Male")}}',
                value: '1',
              },
              {
                label: '{{t("Female")}}',
                value: '2',
              },
            ],
            description: '{{t("User gender from WeChat profile")}}',
          },
        },
        {
          type: 'string',
          name: 'city',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("City")}}',
            'x-component': 'Input',
            description: '{{t("User city from WeChat profile")}}',
          },
        },
        {
          type: 'string',
          name: 'province',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Province")}}',
            'x-component': 'Input',
            description: '{{t("User province from WeChat profile")}}',
          },
        },
        {
          type: 'string',
          name: 'country',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Country")}}',
            'x-component': 'Input',
            description: '{{t("User country from WeChat profile")}}',
          },
        },
        {
          type: 'string',
          name: 'phone',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Phone Number")}}',
            'x-component': 'Input',
            description: '{{t("Phone number if bound to WeChat account")}}',
          },
        },
        {
          type: 'json',
          name: 'wechatInfo',
          interface: 'object',
          allowNull: true,
          uiSchema: {
            type: 'object',
            title: '{{t("Additional WeChat Info")}}',
            'x-component': 'Input.JSON',
            'x-read-pretty': true,
            description: '{{t("Additional WeChat user information in JSON format")}}',
          },
        },
        {
          type: 'date',
          name: 'lastLoginAt',
          interface: 'datetime',
          allowNull: true,
          uiSchema: {
            type: 'datetime',
            title: '{{t("Last Login At")}}',
            'x-component': 'DatePicker',
            'x-read-pretty': true,
            description: '{{t("Timestamp of the last successful login via WeChat")}}',
          },
        },
        {
          type: 'date',
          name: 'infoUpdatedAt',
          interface: 'datetime',
          allowNull: true,
          uiSchema: {
            type: 'datetime',
            title: '{{t("Info Updated At")}}',
            'x-component': 'DatePicker',
            'x-read-pretty': true,
            description: '{{t("When the WeChat user information was last updated")}}',
          },
        },
        {
          type: 'string',
          name: 'status',
          interface: 'select',
          allowNull: false,
          defaultValue: 'active',
          uiSchema: {
            type: 'string',
            title: '{{t("Status")}}',
            'x-component': 'Select',
            enum: [
              {
                label: '{{t("Active")}}',
                value: 'active',
              },
              {
                label: '{{t("Blocked")}}',
                value: 'blocked',
              },
              {
                label: '{{t("Suspended")}}',
                value: 'suspended',
              },
            ],
            description: '{{t("Status of the WeChat user binding")}}',
          },
        },
        {
          type: 'boolean',
          name: 'isPrimary',
          interface: 'switch',
          allowNull: false,
          defaultValue: false,
          uiSchema: {
            type: 'boolean',
            title: '{{t("Is Primary WeChat Account")}}',
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
            description: '{{t("Whether this is the primary WeChat account for the user")}}',
          },
        },
      ],
    });

    // 创建 qrSessions 集合
    await db.collection({
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
            description: '{{t("Unique session identifier for the QR code")}}',
          },
        },
        {
          type: 'bigInt',
          name: 'wechatAuthId',
          interface: 'integer',
          allowNull: false,
          uiSchema: {
            type: 'number',
            title: '{{t("WeChat Auth Config ID")}}',
            'x-component': 'InputNumber',
            'x-validator': 'required',
            'x-decorator': 'FormItem',
          },
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
            description: '{{t("QR code content data (URL or base64 encoded image data)")}}',
          },
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
            'x-decorator': 'FormItem',
            enum: [
              {
                label: '{{t("Pending Scan")}}',
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
                label: '{{t("Error")}}',
                value: 'error',
              },
            ],
            description: '{{t("Current status of the QR code session")}}',
          },
        },
        {
          type: 'bigInt',
          name: 'userId',
          interface: 'integer',
          allowNull: true,
          uiSchema: {
            type: 'number',
            title: '{{t("User ID")}}',
            'x-component': 'InputNumber',
            description: '{{t("User ID after successful login (if any)")}}',
          },
        },
        {
          type: 'string',
          name: 'openId',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("WeChat OpenID")}}',
            'x-component': 'Input',
            description: '{{t("WeChat OpenID of the user who scanned the QR code")}}',
          },
        },
        {
          type: 'string',
          name: 'nickname',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Nickname")}}',
            'x-component': 'Input',
            description: '{{t("WeChat nickname of the user who scanned the QR code")}}',
          },
        },
        {
          type: 'string',
          name: 'avatar',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Avatar URL")}}',
            'x-component': 'Input',
            description: '{{t("Avatar URL of the user who scanned the QR code")}}',
          },
        },
        {
          type: 'date',
          name: 'createdAt',
          interface: 'datetime',
          allowNull: false,
          defaultValue: new Date(),
          uiSchema: {
            type: 'datetime',
            title: '{{t("Created At")}}',
            'x-component': 'DatePicker',
            'x-read-pretty': true,
          },
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
            description: '{{t("When this QR code session will expire (typically 5-10 minutes)}}',
          },
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
            description: '{{t("When the QR code was scanned by the user")}}',
          },
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
        },
        {
          type: 'string',
          name: 'ipAddress',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("IP Address")}}',
            'x-component': 'Input',
            description: '{{t("IP address of the device that created this session")}}',
          },
        },
        {
          type: 'string',
          name: 'userAgent',
          interface: 'textarea',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("User Agent")}}',
            'x-component': 'Input.TextArea',
            'x-read-pretty': true,
            description: '{{t("User agent of the device that created this session")}}',
          },
        },
        {
          type: 'string',
          name: 'sceneId',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("WeChat Scene ID")}}',
            'x-component': 'Input',
            description: '{{t("WeChat scene ID for this QR code session")}}',
          },
        },
        {
          type: 'string',
          name: 'sceneStr',
          interface: 'input',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("WeChat Scene String")}}',
            'x-component': 'Input',
            description: '{{t("WeChat scene string for this QR code session")}}',
          },
        },
        {
          type: 'json',
          name: 'context',
          interface: 'object',
          allowNull: true,
          uiSchema: {
            type: 'object',
            title: '{{t("Session Context")}}',
            'x-component': 'Input.JSON',
            'x-read-pretty': true,
            description: '{{t("Additional context information for this session")}}',
          },
        },
        {
          type: 'text',
          name: 'errorMessage',
          interface: 'textarea',
          allowNull: true,
          uiSchema: {
            type: 'string',
            title: '{{t("Error Message")}}',
            'x-component': 'Input.TextArea',
            'x-read-pretty': true,
            description: '{{t("Error message if the session failed (if any)")}}',
          },
        },
      ],
    });

    // 在集合字段定义中直接创建索引
    // wechatUsers 和 qrSessions 集合的索引已在字段定义中配置
  }

  async down() {
    // 回滚操作：删除创建的集合
    const db = this.context.db;

    try {
      // 删除集合（注意删除顺序：先删除有外键依赖的）
      await db.removeCollection('qrSessions');
      await db.removeCollection('wechatUsers');
      await db.removeCollection('wechatAuth');
    } catch (err) {
      console.error('Error dropping WeChat auth collections:', err);
    }
  }
}
