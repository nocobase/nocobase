/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 微信用户信息集合
 *
 * 主要功能：
 * - 存储和管理从微信平台获取的用户个人信息
 * - 支持微信公众号、小程序等多种微信应用类型的用户数据统一管理
 * - 提供用户身份标识、基础资料、地理位置、关注状态等完整信息记录
 *
 * 数据关联：
 * - 与wechatAuth表建立多对一关系，关联具体的微信应用配置
 * - 与NocoBase系统用户表通过userId建立关联，支持用户账号体系整合
 *
 * 业务场景：
 * - 微信授权登录用户信息同步
 * - 用户画像分析和个性化服务
 * - 公众号粉丝管理和消息推送
 * - 用户行为统计和数据分析
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
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
      // 【系统字段】主键标识 - 微信用户记录的唯一标识符
      // 用于数据库内部关联和记录查找，由系统自动递增生成
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
        'x-decorator': 'FormItem',
        'x-validator': 'required',
        description: '{{t("ID of the user in the system")}}',
      },
      // 【关联字段】系统用户ID - 关联NocoBase内置用户表的标识符
      // 建立微信用户与系统用户的对应关系，支持统一账号管理
      // 该字段为必填项，确保每个微信用户都能关联到系统用户
    },
    {
      type: 'string',
      name: 'openId',
      interface: 'input',
      allowNull: false,
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("OpenID")}}',
        'x-component': 'Input',
        'x-validator': 'required',
        'x-decorator': 'FormItem',
        description: '{{t("WeChat OpenID, unique for each user in the application")}}',
      },
      // 【核心标识】微信OpenID - 用户在当前应用中的唯一标识符
      // 微信平台分配的用户标识，在同一应用内保证全局唯一性
      // 用于微信API调用和用户身份识别，是最重要的用户标识字段
      // 该字段唯一且必填，确保用户数据的准确性和完整性
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
        description: '{{t("WeChat UnionID, unique across all applications of the developer")}}',
      },
      // 【跨应用标识】微信UnionID - 开发者账号下的统一用户标识
      // 在同一个开发者的所有微信应用（公众号、小程序、移动应用）中保持唯一
      // 用于跨应用用户识别和用户数据合并，支持多应用间用户身份统一
      // 该字段为可选，某些情况下可能不会获得UnionID
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
      // 【关联字段】微信应用配置ID - 外键字段关联wechatAuth表
      // 标识该用户记录属于哪个微信应用配置，支持多应用隔离
      // 通过该字段可以获取微信应用的基础配置信息（appId、appSecret等）
      // 该字段为必填，确保每个用户都能关联到具体的微信应用配置
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
        description: '{{t("WeChat application this user is associated with")}}',
      },
      // 【关系字段】关联微信应用配置 - 多对一关系
      // 通过该字段可以访问用户所属的微信应用配置详情
      // 支持在用户管理界面中查看和编辑关联的微信应用信息
      // interface为m2o，表示这是多对一的关联类型
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
        description: '{{t("User nickname from WeChat")}}',
      },
      // 【用户资料】用户昵称 - 从微信获取的用户显示名称
      // 微信用户的昵称信息，可能包含特殊字符或表情符号
      // 用于用户界面显示和用户识别，提供友好的用户交互体验
      // 该字段为可选，某些用户可能未设置昵称或昵称不可获取
    },
    {
      type: 'string',
      name: 'avatar',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Avatar")}}',
        'x-component': 'Input',
        description: '{{t("URL of the user avatar from WeChat")}}',
      },
      // 【用户资料】用户头像 - 微信用户头像图片的URL地址
      // 存储从微信平台获取的头像图片链接，用于用户界面显示
      // 支持用户头像展示，提供个性化视觉体验
      // 该字段为可选，头像可能因为隐私设置或其他原因无法获取
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
            value: 'unknown',
          },
          {
            label: '{{t("Male")}}',
            value: 'male',
          },
          {
            label: '{{t("Female")}}',
            value: 'female',
          },
        ],
        description: '{{t("User gender from WeChat")}}',
      },
      // 【用户资料】用户性别 - 从微信获取的性别信息
      // 用于用户画像分析和个性化服务，支持性别分类统计
      // 提供三个选项：未知、男、女，满足不同的性别表示需求
      // 该字段为可选，微信用户可能未公开性别信息或性别设置
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
      // 【地理位置】用户城市 - 从微信用户资料中获取的城市信息
      // 用于地理位置分析、区域性服务提供和用户行为研究
      // 可以支持基于位置的个性化内容和营销活动
      // 该字段为可选，用户可能未授权获取地理位置或位置信息不可用
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
      // 【地理位置】用户省份 - 从微信用户资料中获取的省份信息
      // 与城市字段结合使用，提供完整的地理位置信息
      // 支持省级区域的数据统计和区域化服务策略制定
      // 该字段为可选，依赖于用户的地理位置授权设置
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
      // 【地理位置】用户国家 - 从微信用户资料中获取的国家信息
      // 提供用户的国家级地理位置信息，用于国际用户识别
      // 支持多语言界面和国际化服务的个性化处理
      // 该字段为可选，主要适用于国际用户或跨境应用场景
    },
    {
      type: 'string',
      name: 'language',
      interface: 'input',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Language")}}',
        'x-component': 'Input',
        description: '{{t("User language preference from WeChat")}}',
      },
      // 【用户偏好】语言偏好 - 从微信获取的语言设置信息
      // 用于多语言界面支持，提供用户友好的本地化体验
      // 可以根据用户的语言偏好自动选择合适的界面语言
      // 该字段为可选，依赖于微信平台提供的语言信息
    },
    {
      type: 'boolean',
      name: 'subscribed',
      interface: 'switch',
      allowNull: false,
      defaultValue: false,
      uiSchema: {
        type: 'boolean',
        title: '{{t("Subscribed")}}',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        description: '{{t("Whether the user has subscribed to the official account")}}',
      },
      // 【公众号状态】关注状态 - 标识用户是否已关注公众号
      // 对于公众号场景非常重要，用于判断是否可以向用户发送消息
      // 默认为false，新用户或未关注用户的状态为未关注
      // 该字段为必填，确保用户状态管理的准确性
    },
    {
      type: 'date',
      name: 'subscribeTime',
      interface: 'datetime',
      allowNull: true,
      uiSchema: {
        type: 'datetime',
        title: '{{t("Subscribe Time")}}',
        'x-component': 'DatePicker',
        'x-read-pretty': true,
        description: '{{t("When the user subscribed to the official account")}}',
      },
      // 【公众号状态】关注时间 - 用户关注公众号的时间戳
      // 用于用户生命周期分析、关注行为统计和精准营销
      // 可以分析用户的关注时间分布，优化内容推送策略
      // 该字段为可选，仅对已关注用户的有效，未关注用户该字段为空
    },
    {
      type: 'string',
      name: 'phone',
      interface: 'phone',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Phone Number")}}',
        'x-component': 'Input',
        description: '{{t("User phone number if provided")}}',
      },
      // 【联系方式】手机号码 - 用户提供的手机联系号码
      // 用于用户身份验证、账户安全和多渠道联系
      // 支持短信验证、手机号登录和紧急联系等业务场景
      // 该字段为可选，微信平台不一定提供手机号信息
    },
    {
      type: 'json',
      name: 'rawData',
      interface: 'object',
      allowNull: true,
      uiSchema: {
        type: 'object',
        title: '{{t("Raw WeChat Data")}}',
        'x-component': 'Input.JSON',
        description: '{{t("Complete raw data received from WeChat API")}}',
      },
      // 【数据备份】原始微信数据 - 完整存储从微信API获取的原始数据
      // 用于数据备份、调试和异常分析，确保数据完整性
      // 可以处理微信API返回的所有字段，包括未来新增的字段
      // 该字段为JSON类型，支持灵活的数据结构存储
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
      // 【状态控制】启用状态 - 控制用户账户是否可用
      // 用于账户管理，支持临时禁用恶意用户或维护期账户控制
      // 默认为true，表示用户账户正常使用状态
      // 该字段为必填，确保系统能够对用户账户进行灵活的状态管理
    },
  ],
});
