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

interface IEventParam {
  name: string;
  title: string;
  description: string;
  type: string;
}

/** 事件动作 */
export interface EventAction {
  name: string;
  title: string;
  description?: string;
  params?: IEventParam[];
  fn: (params?: any) => void;
}

/** 事件事件 */
export interface EventEvent {
  name: string;
  title: string;
  uid?: string;
  description?: string;
  params?: IEventParam[];
}

/** 事件定义 */
export interface EventDefinition {
  name: string;
  /** 标识同一类型组件的不同实例 */
  uid?: string;
  title: string;
  description?: string;
  events?: EventEvent[];
  states?: IEventParam[];
  actions?: EventAction[];
}

/** 事件设置 */
export interface EventSetting {
  event: string;
  /** 标识同一类型组件的不同实例 */
  uid?: string;
  condition: string;
  actions: string[];
}
