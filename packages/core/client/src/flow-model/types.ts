import type { FlowDefinition, FlowContext } from '../flow-engine/types';
import type { Application } from '../application/Application';

// 深度可选类型工具 - 改进版本，支持数组和Record类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends Record<string, any>
    ? DeepPartial<T[P]>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

// 扩展FlowDefinition类型，添加partial标记用于部分覆盖
export interface ExtendedFlowDefinition extends DeepPartial<FlowDefinition> {
  /**
   * Whether this flow is a default flow that should be automatically executed
   */
  default?: boolean;
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

// FlowModel上下文类型
export type FlowUserContext = Partial<Omit<FlowContext, 'engine' | '$exit' | 'app'>>; 