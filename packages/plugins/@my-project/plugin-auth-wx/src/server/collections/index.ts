/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 微信授权插件的集合导出模块
// 用于集中导出所有微信授权相关的数据集合定义
// 支持在插件主文件中统一引入和注册这些数据结构

// 导出微信授权配置集合
// 定义微信应用的基础配置信息，包括accessToken、jsapiTicket等缓存数据
export { default as wechatAuth } from './wechatAuth';

// 导出微信用户信息集合
// 存储微信平台获取的用户个人信息，包括openId、unionId、昵称、头像等数据
export { default as wechatUsers } from './wechatUsers';

// 导出二维码登录会话集合
// 管理微信二维码登录的会话生命周期，包括扫码、确认、过期等状态跟踪
export { default as qrSessions } from './qrSessions';
