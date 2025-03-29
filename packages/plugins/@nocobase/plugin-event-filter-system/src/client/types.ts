/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';

// Filter System Types
export type FilterFunction = (currentValue: any, ...contextArgs: any[]) => any | Promise<any>;

export interface FilterOptions {
  priority?: number; // Higher numbers run later
}

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
    uischema?: ISchema;
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
  results: Record<string, any>;
}

export interface EventListenerOptions {
  priority?: number; // 监听器优先级，数值越大优先级越高，默认为 0
  once?: boolean; // 是否只执行一次，默认为 false
  blocking?: boolean; // 是否为阻塞监听器，默认false
  uischema?: ISchema; // Json Schema，主要用于精准触发事件
  filter?: (ctx: EventContext, options: EventListenerOptions) => boolean; // 过滤函数
}

export type EventListener = (context: EventContext) => void | Promise<void>;

export type Unsubscriber = () => void;
