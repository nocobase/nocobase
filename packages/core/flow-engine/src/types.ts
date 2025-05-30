/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import type { FlowEngine } from './flowEngine';
import type { FlowModel } from './models';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends Record<string, any>
      ? DeepPartial<T[P]>
      : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

/**
 * Defines a flow with generic model type support.
 */
export interface FlowDefinition<TModel extends FlowModel = FlowModel> {
  key: string; // Unique identifier for the flow
  title?: string;
  /**
   * Whether this flow is a default flow that should be automatically executed
   */
  autoApply?: boolean;
  /**
   * Sort order for flow execution, lower numbers execute first
   * Defaults to 0, can be negative
   */
  sort?: number;
  /**
   * Optional configuration to allow this flow to be triggered by `dispatchEvent`.
   */
  on?: {
    eventName: string;
  };
  steps: Record<string, StepDefinition<TModel>>;
}

// 扩展FlowDefinition类型，添加partial标记用于部分覆盖
export interface ExtendedFlowDefinition extends DeepPartial<FlowDefinition> {
  /**
   * Whether this flow is a default flow that should be automatically executed
   */
  autoApply?: boolean;
  /**
   * Sort order for flow execution, lower numbers execute first
   * Defaults to 0, can be negative
   */
  sort?: number;
  /**
   * 当设置为true时，表示这是对现有流程的部分覆盖，而不是完全替换
   * 如果父类中不存在同名流程，此标记将被忽略
   */
  patch?: boolean;
}

export interface IModelComponentProps {
  [key: string]: any;
}

// 定义只读版本的props类型
export type ReadonlyModelProps = Readonly<IModelComponentProps>;

/**
 * Context object passed to handlers during flow execution.
 */
export interface FlowContext {
  engine: FlowEngine; // Instance of the FlowEngine
  event?: any; // Information about the triggering event, if applicable
  $exit: () => void;
  [key: string]: any; // Allow for additional custom context data
}

// FlowModel上下文类型
export type FlowUserContext = Partial<Omit<FlowContext, 'engine' | '$exit' | 'app'>>;

/**
 * Constructor for model classes.
 */
export type ModelConstructor<T extends FlowModel = FlowModel> = new (options: {
  uid: string;
  props?: IModelComponentProps;
  stepParams?: StepParams;
  [key: string]: any; // Allow additional options
}) => T;

/**
 * Defines a reusable action with generic model type support.
 */
export interface ActionDefinition<TModel extends FlowModel = FlowModel> {
  name: string; // Unique identifier for the action
  title?: string;
  handler: (ctx: FlowContext, model: TModel, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema>;
  defaultParams?: Record<string, any>;
}

/**
 * Base interface for a step definition with generic model type support.
 */
interface BaseStepDefinition<TModel extends FlowModel = FlowModel> {
  title?: string;
  isAwait?: boolean; // Whether to await the handler, defaults to true
}

/**
 * Step that uses a registered Action with generic model type support.
 */
export interface ActionStepDefinition<TModel extends FlowModel = FlowModel> extends BaseStepDefinition<TModel> {
  use: string; // Name of the registered ActionDefinition
  uiSchema?: Record<string, ISchema>; // Optional: overrides uiSchema from ActionDefinition
  defaultParams?: Record<string, any>; // Optional: overrides/extends defaultParams from ActionDefinition
  // Cannot have its own handler
  handler?: undefined;
}

/**
 * Step that defines its handler inline with generic model type support.
 */
export interface InlineStepDefinition<TModel extends FlowModel = FlowModel> extends BaseStepDefinition<TModel> {
  handler: (ctx: FlowContext, model: TModel, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema>; // Optional: uiSchema for this inline step
  defaultParams?: Record<string, any>; // Optional: defaultParams for this inline step
  // Cannot use a registered action
  use?: undefined;
}

export type StepDefinition<TModel extends FlowModel = FlowModel> =
  | ActionStepDefinition<TModel>
  | InlineStepDefinition<TModel>;

/**
 * User context for hooks - omitting internal engine properties
 */
export type UserContext = Partial<Omit<FlowContext, 'engine' | '$exit'>>;

/**
 * Action options for registering actions with generic model type support
 */
export interface ActionOptions<TModel extends FlowModel = FlowModel, P = any, R = any> {
  handler: (ctx: any, model: TModel, params: P) => Promise<R> | R;
  uiSchema?: Record<string, any>;
  defaultParams?: Partial<P>;
}

/**
 * Steps parameters structure for flow models
 *
 * @example
 * ```typescript
 * const stepParams: StepParams = {
 *   'flow1': {
 *     'step1': {
 *       'param1': 'value1',
 *       'param2': 'value2'
 *     },
 *     'step2': {
 *       'param3': 'value3'
 *     }
 *   },
 *   'flow2': {
 *     'step1': {
 *       'param1': 'value1'
 *     }
 *   }
 * }
 * ```
 */
export type StepParams = {
  [flowKey: string]: {
    [stepKey: string]: {
      [paramKey: string]: any;
    };
  };
};

/**
 * 已注册模型的类名
 */
export type RegisteredModelClassName = string;

/**
 * Options for creating a model instance
 */
export interface CreateModelOptions {
  uid?: string;
  use: RegisteredModelClassName;
  props?: IModelComponentProps;
  stepParams?: StepParams;
  [key: string]: any; // 允许额外的自定义选项
  // app?: Application; // Application 依赖已移除
}
