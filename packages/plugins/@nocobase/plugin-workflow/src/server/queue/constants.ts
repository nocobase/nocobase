/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 系统管理配置变更事件,本来应该从系统管理插件中导入，避免插件的依赖，所以直接定义
export const SYSTEM_MANAGEMENT_CONFIG_CHNAGE_EVENT = 'nocobase:systemManagement:configChange';
export const SYSTEM_MANAGEMENT_SUB_APP_START_EVENT = 'nocobase:systemManagement:sendSubAppStart';
