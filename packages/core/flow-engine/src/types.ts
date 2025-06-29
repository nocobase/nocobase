/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import { APIClient } from '@nocobase/sdk';
import type { FlowEngine } from './flowEngine';
import type { FlowModel } from './models';
import { ReactView } from './ReactView';

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
  reactView: ReactView;
  stepResults: Record<string, any>; // Results from previous steps
  shared: Record<string, any>; // Shared data within the flow (read/write)
  globals: Record<string, any> & {
    flowEngine: FlowEngine;
    app: any;
    api: APIClient;
  };
  extra: Record<string, any>; // Extra context passed to applyFlow (read-only)
  model: TModel; // Current model instance with specific type
  app: any; // Application instance (required)
}

export type CreateSubModelOptions = CreateModelOptions | FlowModel;

/**
 * Constructor for model classes.
 */
export type ModelConstructor<T extends FlowModel = FlowModel> = new (
  options: FlowModelOptions & {
    uid: string;
    props?: IModelComponentProps;
    stepParams?: StepParams;
    meta?: FlowModelMeta;
    subModels?: Record<string, CreateSubModelOptions | CreateSubModelOptions[]>;
    [key: string]: any; // Allow additional options
  },
) => T;

/**
 * Defines a reusable action with generic model type support.
 */
export interface ActionDefinition<TModel extends FlowModel = FlowModel> {
  name: string; // Unique identifier for the action
  title?: string;
  handler: (ctx: FlowContext<TModel>, params: any) => Promise<any> | any;
  uiSchema?:
    | Record<string, ISchema>
    | ((ctx: ParamsContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?:
    | Record<string, any>
    | ((ctx: ParamsContext<TModel>) => Record<string, any> | Promise<Record<string, any>>);
}

/**
 * Step definition with unified support for both registered actions and inline handlers
 */
export interface StepDefinition<TModel extends FlowModel = FlowModel> {
  // Basic step properties
  title?: string;
  isAwait?: boolean; // Whether to await the handler, defaults to true
  // Action reference (optional)
  use?: string; // Name of the registered ActionDefinition to use as base

  // Handler (optional, but required if 'use' is not provided)
  handler?: (ctx: FlowContext<TModel>, params: any) => Promise<any> | any;

  // UI and params configuration
  uiSchema?:
    | Record<string, ISchema>
    | ((ctx: ParamsContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>); // Optional: overrides uiSchema from ActionDefinition if 'use' is provided
  defaultParams?:
    | Record<string, any>
    | ((ctx: ParamsContext<TModel>) => Record<string, any> | Promise<Record<string, any>>); // Optional: overrides/extends defaultParams from ActionDefinition if 'use' is provided

  // Step configuration
  paramsRequired?: boolean; // Optional: whether the step params are required, will open the config dialog before adding the model
  hideInSettings?: boolean; // Optional: whether to hide the step in the settings menu
  settingMode?: 'dialog' | 'drawer'; // Optional: whether to open settings in dialog or drawer mode, defaults to 'dialog'
}

/**
 * Extra context for flow execution - represents the data that will appear in ctx.extra
 * This is the type for data passed to applyFlow that becomes ctx.extra
 */
export type FlowExtraContext = Record<string, any>;

/**
 * 参数解析上下文类型，用于 settings 等场景
 */
export interface ParamsContext<TModel extends FlowModel = FlowModel> {
  model: TModel;
  globals: Record<string, any>;
  shared?: Record<string, any>;
  extra?: Record<string, any>; // Extra context passed to applyFlow
  app: any;
}

/**
 * Action options for registering actions with generic model type support
 */
export interface ActionOptions<TModel extends FlowModel = FlowModel, P = any, R = any> {
  handler: (ctx: FlowContext<TModel>, params: P) => Promise<R> | R;
  uiSchema?:
    | Record<string, ISchema>
    | ((ctx: ParamsContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Partial<P> | ((ctx: ParamsContext<TModel>) => Partial<P> | Promise<Partial<P>>);
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
  findOne(query: Record<string, any>): Promise<Record<string, any> | null>;
  save(model: T): Promise<Record<string, any>>;
  destroy(uid: string): Promise<boolean>;
  move(sourceId: string, targetId: string, position: 'before' | 'after'): Promise<void>;
}

/**
 * 步骤设置对话框的属性接口
 */
export interface StepSettingsDialogProps {
  model: FlowModel;
  flowKey: string;
  stepKey: string;
  dialogWidth?: number | string;
  dialogTitle?: string;
}

/**
 * 步骤设置抽屉的属性接口
 */
export interface StepSettingsDrawerProps {
  model: FlowModel;
  flowKey: string;
  stepKey: string;
  drawerWidth?: number | string;
  drawerTitle?: string;
}

/**
 * 统一的步骤设置属性接口
 */
export interface StepSettingsProps {
  model: FlowModel;
  flowKey: string;
  stepKey: string;
  width?: number | string;
  title?: string;
}

/**
 * 分步表单对话框的属性接口
 */
export interface RequiredConfigStepFormDialogProps {
  model: FlowModel;
  dialogWidth?: number | string;
  dialogTitle?: string;
}

export type SubModelValue<TModel extends FlowModel = FlowModel> = TModel | TModel[];

export interface DefaultStructure {
  parent?: FlowModel;
  subModels?: Record<string, FlowModel | FlowModel[]>;
}

/**
 * 提取Structure中parent的类型，如果没有定义则使用FlowModel | null
 */
export type ParentFlowModel<Structure> = Structure extends { parent: infer P } ? P : FlowModel | null;

/**
 * Options for FlowModel constructor
 */
export interface FlowModelOptions<Structure extends { parent?: FlowModel; subModels?: any } = DefaultStructure> {
  uid?: string;
  use?: string;
  async?: boolean; // 是否异步加载模型
  props?: IModelComponentProps;
  stepParams?: StepParams;
  subModels?: Structure['subModels'];
  flowEngine?: FlowEngine;
  parentId?: string;
  subKey?: string;
  subType?: 'object' | 'array';
  sortIndex?: number;
}

export interface FlowModelMeta {
  title?: string;
  group?: string;
  requiresDataSource?: boolean; // 是否需要数据源
  defaultOptions?: Record<string, any>;
  icon?: string;
  // uniqueSub?: boolean;
  /**
   * 排序权重，数字越小排序越靠前，用于控制显示顺序和默认选择
   * 排序最靠前的将作为默认选择
   * @default 0
   */
  sort?: number;
  /**
   * 是否在菜单中隐藏该模型类
   * @default false
   */
  hide?: boolean;
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

/**
 * 工具栏项目配置接口
 */
export interface ToolbarItemConfig {
  /** 项目的唯一标识 */
  key: string;
  /** 项目组件，接收 model 作为 props，内部处理所有逻辑 */
  component: React.ComponentType<{ model: FlowModel; [key: string]: any }>;
  /** 是否显示项目的条件函数 */
  visible?: (model: FlowModel) => boolean;
  /** 排序权重，数字越小越靠右（先添加的在右边） */
  sort?: number;
}
