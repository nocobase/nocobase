/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import { SubModelItemsType } from './components';
import { FlowModelContext, FlowRuntimeContext, FlowSettingsContext } from './flowContext';
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
  /**
   * Unique identifier for the flow.
   * 建议采用统一的 xxxSettings 风格命名，例如：
   * - pageSettings
   * - tableSettings
   * - cardSettings
   * - formSettings
   * - detailsSettings
   * - buttonSettings
   * - popupSettings
   * - deleteSettings
   * - datetimeSettings
   * - numberSettings
   * 这样命名便于识别和维护，建议全局统一。
   * @example
   * 'pageSettings'
   * 'tableSettings'
   * 'deleteSettings'
   */
  key: string;

  /**
   * 人类可读的流标题，建议与 key 保持一致风格，采用 Xxx settings 命名，例如：
   * - Page settings
   * - Table settings
   * - Card settings
   * - Form settings
   * - Details settings
   * - Button settings
   * - Popup settings
   * - Delete settings
   * - Datetime settings
   * - Number settings
   * 这样命名更清晰易懂，便于界面展示和团队协作。
   * @example
   * 'Page settings'
   * 'Table settings'
   * 'Delete settings'
   */
  title?: string;

  /**
   * Whether this flow should be executed manually only (prevents auto-execution)
   * Flows without 'on' property are auto-executed by default unless manual: true
   */
  manual?: boolean;

  /**
   * Sort order for flow execution, lower numbers execute first
   * Defaults to 0, can be negative
   */
  sort?: number;

  /**
   * Optional configuration to allow this flow to be triggered by `dispatchEvent`。
   * 支持字符串或对象形式：
   * - 字符串：直接指定事件名（如 'click'、'submit' 等），推荐与主流事件命名保持一致。
   * - 对象：可扩展更多事件配置，目前支持 { eventName, handler }
   *   - eventName: 事件名，推荐使用 'click' | 'submit' | 'change' | 'delete' | 'open' | 'close' 等主流命名
   *   - handler: 事件触发时的自定义处理函数（可选，若不指定则默认执行 flow 的 steps）
   *
   * @example
   * // 字符串形式，仅指定事件名
   * on: 'click'
   *
   * // 对象形式，指定事件名和自定义处理函数
   * on: {
   *   eventName: 'click',
   *   handler: (ctx, params) => {
   *     // 自定义事件处理逻辑
   *     ctx.logger.info('Custom click event triggered');
   *   }
   * }
   *
   * // 推荐事件名
   * 'click' | 'submit' | 'change' | 'delete' | 'open' | 'close' 等
   */
  on?:
    | string
    | {
        eventName: string;
        handler?: (ctx: FlowRuntimeContext<TModel>, params: Record<string, any>) => void | Promise<void>;
      };

  steps: Record<string, StepDefinition<TModel>>;
}

// 扩展FlowDefinition类型，添加partial标记用于部分覆盖
export interface ExtendedFlowDefinition extends DeepPartial<FlowDefinition> {
  /**
   * Whether this flow should be executed manually only (prevents auto-execution)
   * Flows without 'on' property are auto-executed by default unless manual: true
   */
  manual?: boolean;
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

export type CreateSubModelOptions = CreateModelOptions | FlowModel;

/**
 * Constructor for model classes.
 */
export type ModelConstructor<T extends FlowModel = FlowModel> = (new (
  options: FlowModelOptions & {
    uid: string;
    props?: IModelComponentProps;
    stepParams?: StepParams;
    meta?: FlowModelMeta;
    subModels?: Record<string, CreateSubModelOptions | CreateSubModelOptions[]>;
    [key: string]: any; // Allow additional options
  },
) => T) & {
  meta?: FlowModelMeta;
};

/**
 * Defines a reusable action with generic model type support.
 */
export interface ActionDefinition<TModel extends FlowModel = FlowModel> {
  name: string; // Unique identifier for the action
  title?: string;
  handler: (ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any;
  uiSchema?:
    | Record<string, ISchema>
    | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?:
    | Record<string, any>
    | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: FlowRuntimeContext<TModel>) => boolean | Promise<boolean>);
}

export type StepUIMode =
  | 'dialog'
  | 'drawer'
  // | 'switch'
  // | 'select'
  | { type: 'dialog'; props?: Record<string, any> }
  | { type: 'drawer'; props?: Record<string, any> };
// | { type: 'switch'; props?: Record<string, any> }
// | { type: 'select'; props?: Record<string, any> }

/**
 * Step definition with unified support for both registered actions and inline handlers
 * Extends ActionDefinition but makes some properties optional and adds step-specific properties
 */
export interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel>, 'name'>> {
  // Step-specific properties
  isAwait?: boolean; // Whether to await the handler, defaults to true
  use?: string; // Name of the registered ActionDefinition to use as base

  // Step configuration
  // `preset: true` 的 step params 需要在创建时填写，没有标记的可以创建模型后再填写。
  preset?: boolean;
  paramsRequired?: boolean; // Optional: whether the step params are required, will open the config dialog before adding the model
  hideInSettings?: boolean; // Optional: whether to hide the step in the settings menu
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}

/**
 * Action options for registering actions with generic model type support
 */
export interface ActionOptions<TModel extends FlowModel = FlowModel, P = any, R = any> {
  name: string; // Unique identifier for the action
  handler: (ctx: FlowRuntimeContext<TModel>, params: P) => Promise<R> | R;
  uiSchema?:
    | Record<string, ISchema>
    | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Partial<P> | ((ctx: FlowRuntimeContext<TModel>) => Partial<P> | Promise<Partial<P>>);
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

export type ParamObject = {
  [key: string]: unknown;
  [key: number]: never;
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
  delegateToParent?: boolean;
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
  mode?: 'dialog' | 'drawer'; // 设置模式，默认为'dialog'
  ctx?: FlowRuntimeContext;
  uiModeProps?: Record<string, any>;
  cleanup?: () => void;
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
  ctx?: FlowRuntimeContext;
  uiModeProps?: Record<string, any>;
  cleanup?: () => void;
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
  props?: IModelComponentProps; // 组件属性
  stepParams?: StepParams;
  subModels?: Structure['subModels'];
  flowEngine?: FlowEngine;
  parentId?: string;
  delegateToParent?: boolean;
  subKey?: string;
  subType?: 'object' | 'array';
  sortIndex?: number;
}

export interface FlowModelMeta {
  title?: string;
  key?: string;
  label?: string;
  group?: string;
  requiresDataSource?: boolean; // 是否需要数据源
  /**
   * 默认选项配置，支持静态对象或动态函数形式
   *
   * 当为静态对象时，将直接使用该配置作为默认值
   * 当为函数时，将在创建菜单项时调用，可根据父模型上下文动态生成配置
   *
   * @example
   * // 静态配置
   * defaultOptions: { someProperty: 'value' }
   *
   * // 动态配置
   * defaultOptions: (ctx) => {
   *   return {
   *     someProperty: ctx.model.someData ? 'valueA' : 'valueB'
   *   };
   * }
   */
  createModelOptions?:
    | Record<string, any>
    | ((ctx: FlowModelContext, item?: any) => Record<string, any> | Promise<Record<string, any>>);
  defaultOptions?:
    | Record<string, any>
    | ((ctx: FlowModelContext) => Record<string, any> | Promise<Record<string, any>>);
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
  /**
   * 子菜单项定义，支持创建多层嵌套的层级菜单结构
   *
   * 当定义了 children 时，该模型本身不会直接出现在菜单中，
   * 而是显示为一个包含子菜单项的分组。每个子项都可以再有自己的 children，
   * 形成无限层级的嵌套结构。
   *
   * 对于数据区块类型，系统会自动为每个叶子节点生成数据源和数据表的选择菜单。
   * 对于普通区块和动作，叶子节点将直接作为可选择的菜单项。
   *
   * 支持静态数组和函数形式：
   * - 静态数组：直接定义固定的子项列表
   * - 函数形式：可根据父模型动态生成子项，支持同步和异步函数
   *
   * @example
   * // 静态配置
   * children: [
   *   {
   *     title: 'Basic Blocks',
   *     children: [
   *       { title: 'Table', defaultOptions: { use: 'TableModel' } },
   *       { title: 'Form', defaultOptions: { use: 'FormModel' } }
   *     ]
   *   }
   * ]
   *
   * // 动态配置
   * children: (ctx) => {
   *   const hasPermission = ctx.model.checkPermission('advanced');
   *   return [
   *     { title: 'Basic Table', defaultOptions: { use: 'TableModel' } },
   *     ...(hasPermission ? [{ title: 'Advanced Chart', defaultOptions: { use: 'ChartModel' } }] : [])
   *   ];
   * }
   */
  children?: false | SubModelItemsType;
  /**
   * 切换检测器函数，用于判断该模型是否已存在
   * 主要用于支持切换式的 UI 交互
   */
  toggleDetector?: (ctx: FlowModelContext) => boolean | Promise<boolean>;
  /**
   * 自定义移除函数，用于处理该项的删除逻辑
   */
  customRemove?: (ctx: FlowModelContext, item: any) => Promise<void>;
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

export interface ApplyFlowCacheEntry {
  status: 'pending' | 'resolved' | 'rejected';
  promise: Promise<any>;
  data?: any;
  error?: any;
}
