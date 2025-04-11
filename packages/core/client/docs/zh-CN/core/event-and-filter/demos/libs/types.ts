/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import { Resource } from '@nocobase/resourcer';
import { ComponentProps } from 'react';

export type UnregisterFunction = () => void;

// Event System Types
export interface EventContext<T = any> {
  // 事件源 (dispatchEvent调用者) 信息
  source?: {
    id?: string;
    type?: string; // 'user-interaction', 'system', 'workflow'
    [key: string]: any;
  };

  // 用于指定接收者信息, 主要用于精准触发事件
  target?: {
    id?: string;
  };

  // 事件相关数据
  payload?: T;

  // 元数据
  meta?: {
    timestamp?: number;
    userId?: string;
    event?: string | string[];
    [key: string]: any;
  };

  // 用于收集事件监听器的输出结果
  results?: Record<string, any>;
}

export interface EventListenerOptions {
  id?: string; // 监听器唯一标识
  sort?: number; // 数值越大运行越靠后，默认为 0
  once?: boolean; // 是否只执行一次，默认为 false
  blocking?: boolean; // 是否为阻塞监听器，默认false
  condition?: (ctx: EventContext, options: EventListenerOptions) => boolean; // 运行条件
}

export type EventListener = (context: EventContext) => void | Promise<void>;

export type Unsubscriber = () => void;

export type LinkageRuleItem = {
  actions: Array<{
    operator: string;
    targetFields: string[];
    value: {
      mode: string;
      value: string;
    };
  }>;
  condition: {
    [type in '$and' | '$or']: Array<{
      [field: string]: Record<string, string>;
    }>;
  };
};

export type LinkageRuleSettings = {
  fields: Record<string, LinkageRuleItem>;
  actions: Record<string, LinkageRuleItem>;
  recordActions: Record<string, LinkageRuleItem>;
};

export type FieldSettings = Record<string, {}>;

export type ActionSettings = Record<string, {}>;

export type BlockSettings = {
  linkageRules: Record<string, LinkageRuleSettings>;
  fields: Record<string, FieldSettings>;
  actions: Record<string, ActionSettings>;
  recordActions: Record<string, ActionSettings>;
};

export type FilterContext = {
  settings?: BlockSettings;
  resource?: Resource;
  props?: ComponentProps<any>;
  resourceParams?: {
    page?: number;
    pageSize?: number;
  };
  _cancel?: boolean;
  errors?: Array<{
    stepKey: string;
    filterName: string;
    error: Error;
  }>;
};

export type ApplyFilterOptions = {
  input?: any;
  props?: ComponentProps<any>;
};

// FilterFlowManager Types
export type FilterHandler = (
  currentValue: any,
  params: Record<string, any>,
  context: FilterContext,
) => any | Promise<any>;

/**
 * 可注册的 Filter 配置
 */
export interface FilterOptions {
  name: string; // 唯一标识符
  title: string; // 显示名称
  description?: string; // 描述
  group?: string; // 所属分组
  sort?: number; // 排序
  uiSchema: ISchema; // 参数配置的 UI Schema
  handler: FilterHandler; // 实际的过滤处理函数
}

export interface FilterGroupOptions {
  name: string;
  title: string;
  sort: number;
}

export interface FilterFlowStepOptions {
  key?: string;
  filterName: string;
  title?: string;
  params?: Record<string, any>;
  condition?: string;
}

export interface FilterFlowOptions {
  name: string;
  title: string;
  steps: FilterFlowStepOptions[];
}
