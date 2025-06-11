/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const SYNC_MESSAGE_TYPE = {
  APP_RESTART: 'APP_RESTART',
  PLUGIN_ACTION: 'PLUGIN_ACTION',
  SYSTEM_MANAGEMENT_CONFIG_CHANGE: 'SYSTEM_MANAGEMENT_CONFIG_CHANGE',
};

export const APP_STATUS = {
  STARTED: 'STARTED',
  STOP: 'STOP',
};

export const CONSUME_MODE = {
  NONE: 'none',
  TASK: 'task',
  APP: 'app',
  BOTH: 'both',
} as const;

export const CONFIG_KEYS = {
  CONSUME_MODE: 'consumeMode',
  DISABLE_META_OP: 'disableMetaOp',
  WORKFLOW_TASK_DELAY: 'workflowTaskDelay',
  USE_QUEUE_FOR_CREATE_WORKFLOW: 'useQueueForCreateWorkflow',
  STOP_ASYNC_TASK: 'stopAsyncTask',
};

export const CUSTOM_CHANNEL = 'global.sync.custom';

export const SYSTEM_MANAGEMENT = 'systemManagement';
export const SYSTEM_MANAGEMENT_SNIPPET = 'systemManagement.setting';
export const SYSTEM_MANAGEMENT_ACTIONS = 'systemManagement:*';

// 事件
export const SYSTEM_MANAGEMENT_CONFIG_CHNAGE_EVENT = 'nocobase:systemManagement:configChange';
export const SYSTEM_MANAGEMENT_SUB_APP_START_EVENT = 'nocobase:systemManagement:sendSubAppStart';

const actions = ['create', 'update', 'destroy', 'updateOrCreate'];

// 禁用元数据操作配置，key为资源名称，value为禁用的操作名称，*表示禁用所有操作
export const disableMetaOpMap = new Map<string, string[] | string>([
  ['applications', actions],
  ['app', ['restart', 'clearCache']],
  ['pm', ['enable', 'disable', 'add', 'remove']],
  ['backupFiles', ['restore']],
  ['collections', ['setFields', ...actions]],
  ['collections.fields', actions],
  ['fields', actions],
  ['workflows', ['revision', ...actions]],
  ['flow_nodes', actions],
  ['workflows.nodes', actions],
]);
