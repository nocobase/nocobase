/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RenderResult } from '@testing-library/react';
import type { Application, DataSourceOptions, Plugin } from '@nocobase/client';
import type { FlowModel } from '@nocobase/flow-engine';

export type HarnessDataSourceConfig = Partial<Omit<DataSourceOptions, 'key'>> & { key?: string };

/**
 * stepParams 类型定义
 * 用于配置 FlowModel 的各个步骤参数
 */
export type StepParams = Record<string, Record<string, any>>;

/**
 * 区块类型枚举
 */
export type BlockType =
  | 'Table'
  | 'Form(Add new)'
  | 'Form(Edit)'
  | 'Details'
  | 'List'
  | 'Grid Card'
  | 'Chart'
  | 'Filter form'
  | 'JS block'
  | 'Iframe'
  | 'Action panel';

/**
 * 字段配置
 */
export interface FieldConfig {
  name: string;
  stepParams?: StepParams;
  [key: string]: any;
}

/**
 * 列配置
 */
export interface ColumnConfig {
  name: string;
  stepParams?: StepParams;
  [key: string]: any;
}

/**
 * 操作按钮配置
 */
export interface ActionConfig {
  type: string;
  stepParams?: StepParams;
  [key: string]: any;
}

/**
 * 区块配置
 */
export interface BlockConfig {
  // 简化写法 - 使用预定义类型
  type?: BlockType;
  collection?: string;
  recordId?: number | string;

  // 完全自定义 - 直接指定 Model
  use?: string;
  uid?: string;

  // stepParams - 核心配置
  stepParams?: StepParams;

  // 子模型配置
  fields?: (string | FieldConfig)[];
  columns?: (string | ColumnConfig)[];
  actions?: (string | ActionConfig)[];
  rowActions?: (string | ActionConfig)[];

  // 任意其他属性（会被转换为 stepParams）
  [key: string]: any;
}

/**
 * Tab 配置
 */
export interface TabConfig {
  title: string;
  key?: string;
  icon?: string;
  stepParams?: StepParams;
  blocks: BlockConfig[];
}

/**
 * API Mock 配置
 */
export interface ApiMockConfig {
  url: string | RegExp;
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  response: any;
  delay?: number;
}

/**
 * 页面测试工具配置
 */
export interface PageTestHarnessConfig {
  // 页面级别的 stepParams
  stepParams?: StepParams;

  // 标签页配置
  tabs?: TabConfig[];

  // 直接配置区块（不使用 tabs）
  blocks?: (BlockConfig | string)[];

  // 模拟数据
  data?: Record<string, any[]>;

  // 数据源配置
  dataSources?: Record<string, HarnessDataSourceConfig>;

  // 自定义区块类型
  customBlocks?: Record<string, typeof FlowModel>;

  // API Mock 配置
  apiMocks?: ApiMockConfig[];

  // 插件配置
  plugins?: (typeof Plugin)[];

  // FlowEngine 配置
  flowEngine?: {
    models?: Record<string, typeof FlowModel>;
    actions?: any[];
  };

  // 页面标题
  pageTitle?: string;

  // 页面配置
  pageConfig?: {
    hidePageTitle?: boolean;
    enablePageTabs?: boolean;
    disablePageHeader?: boolean;
  };
}

/**
 * 规范化后的页面配置
 */
export interface NormalizedPageSpec {
  rootPageModelConfig: any;
  collections: any[];
  dataSources: Record<string, HarnessDataSourceConfig>;
  apiMocks: ApiMockConfig[];
  plugins: (typeof Plugin)[];
}

/**
 * 渲染钩子
 */
export interface RenderHooks {
  beforeRender?: () => void | Promise<void>;
  afterRender?: () => void | Promise<void>;
}

/**
 * 页面测试工具接口
 */
export interface IPageTestHarness {
  /**
   * 设置根页面模型
   */
  setRootPageModel(model: any): void;

  /**
   * 渲染应用
   */
  render(hooks?: RenderHooks): Promise<RenderResult>;

  /**
   * 获取 Application 实例
   */
  getApp(): Application;

  /**
   * 获取根页面模型
   */
  getRootPageModel(): any;

  /**
   * 根据 key 或 title 获取 Tab 模型
   */
  getTabModel(keyOrTitle: string): any;

  /**
   * 查找区块
   */
  findBlock(predicate: ((model: FlowModel) => boolean) | string): FlowModel | undefined;

  /**
   * 打开指定的 Tab
   */
  openTab(key: string): Promise<void>;

  /**
   * 等待 Tab 可用
   */
  waitForTab(key: string): Promise<void>;

  /**
   * 在模型上分发流
   */
  dispatchFlow(modelUid: string, flowKey: string, params?: Record<string, any>): Promise<any>;

  /**
   * 触发区块上的操作
   */
  press(action: { blockKey: string; action: string }): Promise<void>;

  /**
   * 清理资源
   */
  cleanup(): Promise<void>;

  /**
   * 调试辅助
   */
  debug(): any;
}
