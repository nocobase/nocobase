/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const PluginName = 'event';
export const SchemaSettingsKey = 'x-event-settings';
export const SchemaDefinitionsKey = 'x-event-definitions';
export const EventParamKey = '$eventParams';
export const StateParamKey = '_state';
export const SystemParamKey = '_system';
export interface EventParam {
  name?: string; // 在item 情况下没有name https://json-schema.org/understanding-json-schema/reference/array
  title?: string;
  description?: string;
  type: string;
  properties?: {
    [key: string]: EventParam;
  };
  items?: EventParam;
  interface?: string;
  uiSchema?: any;
}

/** 事件动作 */
export interface EventAction {
  /** 动作名称 英文，全局唯一 */
  name: string;
  /** 动作标题 */
  title: string;
  /** 动作描述 */
  description?: string;
  /** 动作参数 */
  params?: EventParam[];
  /** 动作返回值 */
  return?: EventParam;
  /** 动作执行函数 */
  fn: (params?: any) => void;
}

/** 具体事件定义 */
export interface EventEvent {
  /** 事件名称 英文，全局唯一 */
  name: string;
  /** 事件标题 */
  title: string;
  /** 事件描述 */
  description?: string;
  /** 事件参数, 可以配置多个参数 */
  params?: EventParam[];
}

/** 事件模块定义 */
export interface EventDefinition {
  /** 定义名称 英文，全局唯一 */
  name: string;
  /** 定义所属页面uid, 系统级别定义该字段为 'app' */
  pageUid?: string;
  /** 定义所属区块uid，系统级别定义该字段为空 */
  blockUid?: string;
  /** 定义标题 */
  title: string;
  /** 定义描述 */
  description?: string;
  /** 事件 */
  events?: EventEvent[];
  /** 动作 */
  actions?: EventAction[];
  /** 区块内暴露的数据 */
  states?: {
    [key: string]: EventParam;
  };
}

/** 事件设置 */
export interface EventSetting {
  event: {
    definition: string;
    event: string;
    pageUid?: string;
    blockUid?: string;
  };
  rules?: Array<{
    condition: string;
    actions: Array<EventActionSetting>;
  }>;
  /** 标识同一类型组件的不同实例 */
  // uid?: string;
}
export interface EventActionSetting {
  action: {
    definition: string;
    action: string;
    pageUid?: string;
    blockUid?: string;
  };
  params?: Array<EventActionSettingParams>;
}
export interface EventActionSettingParams {
  name: string;
  value: string;
}
