/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';

// Event System Types
export interface EventContext<T = any> {
  source?: {
    id?: string;
    type?: string;
    [key: string]: any;
  };
  target?: {
    id?: string;
    type?: string;
    [key: string]: any;
  };
  meta?: {
    timestamp?: number;
    userId?: string;
    event?: string | string[]; // 事件名称， 一个事件是可以触发多个eventflow的，与filterflow不同
    [key: string]: any;
    // params?: Record<string, Record<string, any>>;
    eventParams?: {
      flow?: string;
      params?: Record<string, Record<string, any>>;
    }[];
    actionParams?: {
      flow?: string;
      event?: string;
      params?: Record<string, Record<string, any>>;
    }[];
  };
  payload?: T;
  results?: Record<string, any>;
}
export interface EventListenerOptions {
  id?: string;
  sort?: number;
  once?: boolean;
  blocking?: boolean;
  condition?: (ctx: EventContext, options: EventListenerOptions) => boolean;
}
export type EventListener = (context: EventContext) => void | Promise<void>;
export type Unsubscriber = () => void;

// EventFlow Types
export type EventFlowEventHandler = (params: Record<string, any>, context: any) => Promise<any>;
export type EventFlowActionHandler = (params: Record<string, any>, context: any) => Promise<any>;
export type EventFlowEventGroupOptions = {
  name: string;
  title: string;
  sort?: number;
  event?: string;
};
export type EventFlowEventOptions = {
  name: string;
  title: string;
  description?: string;
  group: string;
  sort?: number;
  uiSchema: Record<string, ISchema>;
  handler?: EventFlowEventHandler;
};
export type EventFlowActionGroupOptions = {
  name: string;
  title: string;
  sort?: number;
  event?: string;
};
export type EventFlowActionOptions = {
  name: string;
  title: string;
  description?: string;
  group: string;
  sort?: number;
  uiSchema: Record<string, ISchema>;
  handler: EventFlowActionHandler;
};
export type EventFlowStepOptions = {
  key?: string;
  action: string;
  title?: string;
  condition?: string;
  isAwait?: boolean;
};
export type EventFlowOnOptions = {
  event?: string;
  title?: string;
  condition?: string;
};
export type EventFlowOptions = {
  sort?: number;
  isAwait?: boolean;
  key?: string;
  title?: string;
  on?: EventFlowOnOptions;
  steps?: EventFlowStepOptions[];
};
