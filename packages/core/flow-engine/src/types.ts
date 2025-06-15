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

/**
 * 工具类型：如果 T 是数组类型，则提取数组元素类型；否则返回 T 本身
 * @template T 要检查的类型
 * @example
 * ```typescript
 * type Test1 = ArrayElementType<string[]>; // string
 * type Test2 = ArrayElementType<number[]>; // number
 * type Test3 = ArrayElementType<string>;   // string
 * type Test4 = ArrayElementType<{ id: number }[]>; // { id: number }
 * type Test5 = ArrayElementType<{ id: number }>;   // { id: number }
 * ```
 */
export type ArrayElementType<T> = T extends (infer U)[] ? U : T;

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
  auto?: boolean;
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
  auto?: boolean;
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
export interface FlowContext<TModel extends FlowModel = FlowModel> {
  exit: () => void; // Terminate the entire flow execution
  logger: {
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
  };
  stepResults: Record<string, any>; // Results from previous steps
  shared: Record<string, any>; // Shared data within the flow (read/write)
  globals: Record<string, any>; // Global context data (read-only)
  extra: Record<string, any>; // Extra context passed to applyFlow (read-only)
  model: TModel; // Current model instance with specific type
  app: any; // Application instance (required)
}

export type CreateSubModelOptions = CreateModelOptions | FlowModel;

/**
 * Constructor for model classes.
 */
export type ModelConstructor<T extends FlowModel = FlowModel> = new (options: {
  uid: string;
  props?: IModelComponentProps;
  stepParams?: StepParams;
  meta?: FlowModelMeta;
  subModels?: Record<string, CreateSubModelOptions | CreateSubModelOptions[]>;
  [key: string]: any; // Allow additional options
}) => T;

/**
 * Defines a reusable action with generic model type support.
 */
export interface ActionDefinition<TModel extends FlowModel = FlowModel> {
  name: string; // Unique identifier for the action
  title?: string;
  handler: (ctx: FlowContext<TModel>, params: any) => Promise<any> | any;
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
  paramsRequired?: boolean; // Optional: whether the step params are required, will open the config dialog before adding the model
  hideInSettings?: boolean; // Optional: whether to hide the step in the settings menu
  // Cannot have its own handler
  handler?: undefined;
}

/**
 * Step that defines its handler inline with generic model type support.
 */
export interface InlineStepDefinition<TModel extends FlowModel = FlowModel> extends BaseStepDefinition<TModel> {
  handler: (ctx: FlowContext<TModel>, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema>; // Optional: uiSchema for this inline step
  defaultParams?: Record<string, any>; // Optional: defaultParams for this inline step
  paramsRequired?: boolean; // Optional: whether the step params are required, will open the config dialog before adding the model
  hideInSettings?: boolean; // Optional: whether to hide the step in the settings menu
  // Cannot use a registered action
  use?: undefined;
}

export type StepDefinition<TModel extends FlowModel = FlowModel> =
  | ActionStepDefinition<TModel>
  | InlineStepDefinition<TModel>;

/**
 * Extra context for flow execution - represents the data that will appear in ctx.extra
 * This is the type for data passed to applyFlow that becomes ctx.extra
 */
export type FlowExtraContext = Record<string, any>;

/**
 * Action options for registering actions with generic model type support
 */
export interface ActionOptions<TModel extends FlowModel = FlowModel, P = any, R = any> {
  handler: (ctx: FlowContext<TModel>, params: P) => Promise<R> | R;
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
  use: RegisteredModelClassName | ModelConstructor;
  props?: IModelComponentProps;
  stepParams?: StepParams;
  subModels?: Record<string, CreateSubModelOptions | CreateSubModelOptions[]>;
  parentId?: string;
  subKey?: string;
  subType?: 'object' | 'array';
  sortIndex?: number; // 排序索引
  [key: string]: any; // 允许额外的自定义选项
}
export interface IFlowModelRepository<T extends FlowModel = FlowModel> {
  load(uid: string): Promise<Record<string, any> | null>;
  save(model: T): Promise<Record<string, any>>;
  destroy(uid: string): Promise<boolean>;
}

/**
 * 步骤设置对话框的属性接口
 */
export interface StepSettingsDialogProps {
  model: any;
  flowKey: string;
  stepKey: string;
  dialogWidth?: number | string;
  dialogTitle?: string;
}

/**
 * 分步表单对话框的属性接口
 */
export interface RequiredConfigStepFormDialogProps {
  model: any;
  dialogWidth?: number | string;
  dialogTitle?: string;
}

export type SubModelValue<TModel extends FlowModel = FlowModel> = TModel | TModel[];

export interface DefaultStructure {
  parent?: any,
  subModels?: Record<string, FlowModel | FlowModel[]>
}

/**
 * Options for FlowModel constructor
 */
export interface FlowModelOptions<Structure extends {parent?: any, subModels?: any} = DefaultStructure> {
  uid: string;
  props?: IModelComponentProps;
  stepParams?: Record<string, any>;
  subModels?: Structure['subModels'];
  flowEngine: FlowEngine;
  parentId?: string;
  subKey?: string;
  subType?: 'object' | 'array';
  sortIndex?: number;
}

export interface FlowModelMeta {
  title: string;
  group?: string;
  defaultOptions?: Record<string, any>;
  icon?: string;
  // uniqueSub?: boolean;
  /**
   * 排序权重，数字越小排序越靠前，用于控制显示顺序和默认选择
   * 排序最靠前的将作为默认选择
   * @default 0
   */
  sort?: number;
}

/**
 * 字段 FlowModel 的专用元数据接口
 * 继承自 FlowModelMeta，添加了字段接口相关的属性
 */
export interface FieldFlowModelMeta extends FlowModelMeta {
  /**
   * 支持的字段接口组列表，基于 CollectionFieldInterface 的 group 属性
   * 如：['basic', 'choices', 'relation'] 等
   * 如果不指定，则支持所有接口（向后兼容）
   */
  supportedInterfaceGroups?: string[];
  /**
   * 支持的具体接口列表（可选，用于更精确的控制）
   * 如：['input', 'textarea', 'select'] 等
   */
  supportedInterfaces?: string[];
}

export type { ForkFlowModel } from './models';
