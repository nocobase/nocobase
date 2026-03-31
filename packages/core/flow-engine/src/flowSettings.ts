/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm, onFormValuesChange } from '@formily/core';
import { createSchemaField, FormProvider, ISchema } from '@formily/react';
import { define, observable, reaction } from '@formily/reactive';
import { Button, Collapse, Space, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';
import { DefaultSettingsIcon } from './components/settings/wrappers/contextual/DefaultSettingsIcon';
import { openStepSettingsDialog } from './components/settings/wrappers/contextual/StepSettingsDialog';
import { Emitter } from './emitter';
import { FlowRuntimeContext } from './flowContext';
import { FlowEngine, untracked } from '.';
import { FlowSettingsContextProvider, useFlowSettingsContext } from './hooks/useFlowSettingsContext';
import type { FlowModel } from './models';
import { ParamObject, StepSettingsDialogProps, ToolbarItemConfig } from './types';
import {
  compileUiSchema,
  FlowCancelSaveException,
  FlowExitException,
  getT,
  resolveDefaultParams,
  resolveStepUiSchema,
  resolveUiMode,
  setupRuntimeContextSteps,
  shouldHideStepInSettings,
} from './utils';
import { FlowExitAllException } from './utils/exceptions';
import { FlowStepContext } from './hooks/useFlowStep';
import { GLOBAL_EMBED_CONTAINER_ID, EMBED_REPLACING_DATA_KEY } from './views';

const Panel = Collapse.Panel;

/**
 * 打开流程设置的参数接口
 */
export interface FlowSettingsOpenOptions {
  /** 目标模型实例（必填） */
  model: FlowModel;
  /** 是否打开预设（preset）步骤的配置 */
  preset?: boolean;
  /** 指定打开的单个流程 key（优先级高于 flowKeys） */
  flowKey?: string;
  /** 指定同时打开的多个流程 key（当 flowKey 存在时忽略） */
  flowKeys?: string[];
  /** 指定打开的步骤 key（配合 flowKey 使用） */
  stepKey?: string;
  /** 弹窗展现形式（drawer 或 dialog） */
  uiMode?:
    | 'select'
    | 'switch'
    | 'dialog'
    | 'drawer'
    | 'embed'
    | {
        type?: 'dialog' | 'drawer' | 'embed' | 'select' | 'switch';
        props?: {
          title?: string;
          width?: number;
          target?: any;
          onOpen?: () => void;
          onClose?: () => void;
          /**
           * 自定义弹窗底部内容
           *
           * 支持三种形式：
           * 1. `React.ReactNode` - 直接替换整个底部内容
           * 2. `Function` - 函数式自定义，接收原始底部内容和按钮组件，返回新的内容
           * 3. `null` - 隐藏底部内容
           *
           * @example
           * ```typescript
           * // 1. 直接替换底部内容
           * footer: <div>Custom Footer</div>
           *
           * // 2. 函数式自定义 - 在原有按钮基础上添加内容
           * footer: (originNode, { OkBtn, CancelBtn }) => (
           *   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
           *     <span>Additional info</span>
           *     {originNode}
           *   </div>
           * )
           *
           * // 3. 函数式自定义 - 完全重新组合按钮
           * footer: (originNode, { OkBtn, CancelBtn }) => (
           *   <Space>
           *     <CancelBtn title="Close" />
           *     <Button type="link">Help</Button>
           *     <OkBtn title="Apply" />
           *   </Space>
           * )
           *
           * // 4. 隐藏底部
           * footer: null
           * ```
           */
          footer?:
            | React.ReactNode
            | ((originNode: React.ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) => React.ReactNode)
            | null;
          [key: string]: any;
        };
      };
  /** 点击取消按钮后触发的回调（关闭后调用） */
  onCancel?: () => void | Promise<void>;
  /** 配置保存成功后触发的回调 */
  onSaved?: () => void | Promise<void>;
}

export class FlowSettings {
  public components: Record<string, any> = {};
  public scopes: Record<string, any> = {};
  private antdComponentsLoaded = false;
  public enabled: boolean;
  #forceEnabled = false; // 强制启用状态，主要用于设计模式下的强制启用
  public toolbarItems: ToolbarItemConfig[] = [];
  #emitter: Emitter = new Emitter();

  constructor(engine: FlowEngine) {
    // 初始默认为 false，由 SchemaComponentProvider 根据实际设计模式状态同步设置
    this.enabled = false;
    engine.context.defineProperty('flowSettingsEnabled', {
      get: () => this.enabled,
      cache: false,
    });
    // 添加默认的配置项目
    this.addDefaultToolbarItems();

    define(this, {
      enabled: observable,
    });
  }

  on(event: 'beforeOpen', callback: (...args: any[]) => void) {
    this.#emitter.on(event, callback);
  }

  off(event: 'beforeOpen', callback: (...args: any[]) => void) {
    this.#emitter.off(event, callback);
  }

  /**
   * 添加默认的工具栏项目
   * @private
   */
  private addDefaultToolbarItems(): void {
    // 添加基础的配置菜单项目（原有的菜单功能）
    this.toolbarItems.push({
      key: 'settings-menu',
      component: DefaultSettingsIcon,
      sort: 0, // 默认为0，作为第一个添加的项目
    });
  }

  /**
   * 加载 FlowSettings 所需的资源。
   * @returns {Promise<void>}
   * @example
   * await flowSettings.load();
   */
  public async load(): Promise<void> {
    if (this.antdComponentsLoaded) {
      console.log('FlowSettings: Antd components already loaded, skipping...');
      return;
    }

    try {
      // 动态导入 Antd 组件
      const {
        ArrayBase,
        ArrayCards,
        ArrayCollapse,
        ArrayItems,
        ArrayTable,
        ArrayTabs,
        Cascader,
        Checkbox,
        DatePicker,
        Editable,
        Form,
        FormDialog,
        FormDrawer,
        FormButtonGroup,
        FormCollapse,
        FormGrid,
        FormItem,
        FormLayout,
        FormStep,
        FormTab,
        Input,
        NumberPicker,
        Password,
        PreviewText,
        Radio,
        Reset,
        Select,
        SelectTable,
        Space,
        Submit,
        Switch,
        TimePicker,
        Transfer,
        TreeSelect,
        Upload,
      } = await import('@formily/antd-v5');

      const { Button, Alert } = await import('antd');

      // 注册基础组件
      this.components.Form = Form;
      this.components.FormDialog = FormDialog;
      this.components.FormDrawer = FormDrawer;
      this.components.FormItem = FormItem;
      this.components.FormLayout = FormLayout;
      this.components.FormGrid = FormGrid;
      this.components.FormStep = FormStep;
      this.components.FormTab = FormTab;
      this.components.FormCollapse = FormCollapse;
      this.components.FormButtonGroup = FormButtonGroup;

      // 注册输入组件
      this.components.Input = Input;
      this.components.NumberPicker = NumberPicker;
      this.components.Password = Password;

      // 注册选择组件
      this.components.Select = Select;
      this.components.SelectTable = SelectTable;
      this.components.Cascader = Cascader;
      this.components.TreeSelect = TreeSelect;
      this.components.Transfer = Transfer;

      // 注册日期时间组件
      this.components.DatePicker = DatePicker;
      this.components.TimePicker = TimePicker;

      // 注册选择组件
      this.components.Checkbox = Checkbox;
      this.components.Radio = Radio;
      this.components.Switch = Switch;

      // 注册数组组件
      this.components.ArrayBase = ArrayBase;
      this.components.ArrayCards = ArrayCards;
      this.components.ArrayCollapse = ArrayCollapse;
      this.components.ArrayItems = ArrayItems;
      this.components.ArrayTable = ArrayTable;
      this.components.ArrayTabs = ArrayTabs;

      // 注册其他组件
      this.components.Upload = Upload;
      this.components.Space = Space;
      this.components.Editable = Editable;
      this.components.PreviewText = PreviewText;
      this.components.Alert = Alert;

      // 注册按钮组件
      this.components.Button = Button;
      this.components.Submit = Submit;
      this.components.Reset = Reset;

      this.antdComponentsLoaded = true;
      console.log('FlowSettings: Antd components loaded successfully');
    } catch (error) {
      console.error('FlowSettings: Failed to load Antd components:', error);
      throw error;
    }
  }

  /**
   * 添加组件到 FlowSettings 的组件注册表中。
   * 这些组件可以在 flow step 的 uiSchema 中使用。
   * @param {Record<string, any>} components 要添加的组件对象
   * @returns {void}
   * @example
   * flowSettings.registerComponents({ MyComponent, AnotherComponent });
   */
  public registerComponents(components: Record<string, any>): void {
    Object.keys(components).forEach((name) => {
      if (this.components[name]) {
        console.warn(`FlowSettings: Component with name '${name}' is already registered and will be overwritten.`);
      }
      this.components[name] = components[name];
    });
  }

  /**
   * 添加作用域到 FlowSettings 的作用域注册表中。
   * 这些作用域可以在 flow step 的 uiSchema 中使用。
   * @param {Record<string, any>} scopes 要添加的作用域对象
   * @returns {void}
   * @example
   * flowSettings.registerScopes({ useMyHook, myVariable, myFunction });
   */
  public registerScopes(scopes: Record<string, any>): void {
    Object.keys(scopes).forEach((name) => {
      if (this.scopes[name]) {
        console.warn(`FlowSettings: Scope with name '${name}' is already registered and will be overwritten.`);
      }
      this.scopes[name] = scopes[name];
    });
  }

  /**
   * 启用流程设置组件的显示
   * @example
   * flowSettings.enable();
   */
  public enable(): void {
    this.enabled = true;
  }

  public forceEnable() {
    this.#forceEnabled = true;
    this.enabled = true;
  }

  /**
   * 禁用流程设置组件的显示
   * @example
   * flowSettings.disable();
   */
  public disable(): void {
    if (this.#forceEnabled) {
      return;
    }
    this.enabled = false;
  }

  public forceDisable() {
    this.#forceEnabled = false;
    this.enabled = false;
  }

  /**
   * 添加扩展工具栏项目
   * @param {ToolbarItemConfig} config 项目配置
   * @example
   * // 添加一个复制图标组件
   * const CopyIcon = ({ model }) => {
   *   const handleCopy = () => {
   *     navigator.clipboard.writeText(model.uid);
   *   };
   *   return (
   *     <Tooltip title="复制">
   *       <CopyOutlined onClick={handleCopy} style={{ cursor: 'pointer', fontSize: 12 }} />
   *     </Tooltip>
   *   );
   * };
   *
   * flowSettings.addToolbarItem({
   *   key: 'copy',
   *   component: CopyIcon,
   *   sort: 10 // 数字越小越靠右
   * });
   *
   * // 添加下拉菜单项目组件
   * const MoreActionsIcon = ({ model }) => {
   *   const menuItems = [
   *     { key: 'action1', label: '操作1', onClick: () => console.log('操作1', model) },
   *     { key: 'action2', label: '操作2', onClick: () => console.log('操作2', model) }
   *   ];
   *   return (
   *     <Dropdown menu={{ items: menuItems }} trigger={['hover']}>
   *       <MoreOutlined style={{ cursor: 'pointer', fontSize: 12 }} />
   *     </Dropdown>
   *   );
   * };
   *
   * flowSettings.addToolbarItem({
   *   key: 'more-actions',
   *   component: MoreActionsIcon,
   *   visible: (model) => model.someCondition,
   *   sort: 20 // 数字越大越靠左
   * });
   */
  public addToolbarItem(config: ToolbarItemConfig): void {
    // 检查是否已存在相同 key 的项目
    const existingIndex = this.toolbarItems.findIndex((item) => item.key === config.key);
    if (existingIndex !== -1) {
      console.warn(`FlowSettings: Toolbar item with key '${config.key}' already exists and will be replaced.`);
      this.toolbarItems[existingIndex] = config;
    } else {
      this.toolbarItems.push(config);
    }

    // 按 sort 字段反向排序，sort 越小越靠右（先添加的在右边）
    this.toolbarItems.sort((a, b) => (b.sort || 0) - (a.sort || 0));
  }

  /**
   * 批量添加工具栏项目
   * @param {ToolbarItemConfig[]} configs 项目配置数组
   * @example
   * flowSettings.addToolbarItems([
   *   { key: 'copy', component: CopyIcon, sort: 10 },
   *   { key: 'edit', component: EditIcon, sort: 20 }
   * ]);
   */
  public addToolbarItems(configs: ToolbarItemConfig[]): void {
    configs.forEach((config) => this.addToolbarItem(config));
  }

  /**
   * 移除工具栏项目
   * @param {string} key 项目的唯一标识
   * @example
   * flowSettings.removeToolbarItem('copy');
   */
  public removeToolbarItem(key: string): void {
    const index = this.toolbarItems.findIndex((item) => item.key === key);
    if (index !== -1) {
      this.toolbarItems.splice(index, 1);
    }
  }

  /**
   * 获取所有工具栏项目配置
   * @returns {ToolbarItemConfig[]} 所有项目配置
   */
  public getToolbarItems(): ToolbarItemConfig[] {
    return [...this.toolbarItems];
  }

  /**
   * 清空所有工具栏项目
   * @example
   * flowSettings.clearToolbarItems();
   */
  public clearToolbarItems(): void {
    this.toolbarItems = [];
  }

  /**
   * 显示单个步骤的配置界面
   * @param {StepSettingsDialogProps} props 步骤设置对话框的属性
   * @returns {Promise<any>} 返回表单提交的值
   * @example
   * const result = await flowSettings.openStepSettingsDialog({
   *   model: myModel,
   *   flowKey: 'myFlow',
   *   stepKey: 'myStep',
   *   dialogWidth: 800,
   *   dialogTitle: '自定义标题'
   * });
   */
  public async openStepSettingsDialog(props: StepSettingsDialogProps): Promise<any> {
    return await openStepSettingsDialog(props);
  }

  /**
   * 渲染单个步骤的表单
   * @private
   * @param {any} uiSchema 步骤的 UI Schema
   * @param {any} initialValues 表单初始值（在此方法中不直接使用，而是通过 form 实例获取）
   * @param {any} flowEngine 流引擎实例，用于获取 scopes 和 components
   * @param {any} form 表单实例（从外部传入以便统一管理）
   * @returns {React.ReactElement} 渲染的表单元素
   */
  public renderStepForm({
    uiSchema,
    initialValues,
    flowEngine,
    form,
    onFormValuesChange,
    key,
  }: {
    uiSchema: any;
    initialValues: any;
    flowEngine: any;
    form?: any;
    onFormValuesChange?: (form: any) => void;
    key?: string;
  }): React.ReactElement {
    // 获取 scopes 和 components
    const scopes = {
      // 为 schema 表达式提供上下文能力（可在表达式中使用 useFlowSettingsContext 等）
      useFlowSettingsContext,
      ...(flowEngine?.flowSettings?.scopes || {}),
    } as Record<string, any>;

    // 包装为表单 schema（垂直布局），实际渲染时再进行 compile
    const formSchema = {
      type: 'object',
      properties: {
        layout: {
          type: 'void',
          'x-component': 'FormLayout',
          'x-component-props': { layout: 'vertical' },
          properties: uiSchema,
        },
      },
    } as ISchema;

    const compiledSchema = compileUiSchema(scopes, formSchema);
    const SchemaField = createSchemaField();

    return React.createElement(
      FormProviderWithForm,
      { form, initialValues, onFormValuesChange, key },
      React.createElement(SchemaField as any, {
        schema: compiledSchema,
        components: flowEngine?.flowSettings?.components || {},
        scope: scopes,
      }),
    );
  }

  /**
   * 打开流程设置入口（聚合渲染多个 flow 的可配置步骤）
   *
   * 行为约定：
   * - 必须提供 model 实例；用于解析 flow 定义、上下文与保存参数。
   * - 当同时提供 flowKey 与 flowKeys 时，以 flowKey 为准（只处理单个 flow）。
   * - 当提供 stepKey 时，应与某个 flowKey 组合使用；仅渲染该 flow 下命中的步骤。
   * - 当外部明确指定了 flowKey + stepKey 且仅匹配到一个步骤时，采用“单步直出”表单（不使用折叠面板）。
   * - 当未提供 stepKey，但最终仅匹配到一个步骤时，仍保持折叠面板的外观，以区别于上述“单步直出”样式。
   * - uiMode 控制展示容器：'dialog' 或 'drawer'，由 model.context.viewer 提供具体实现。
   *
   * 副作用：
   * - 打开对应的视图容器；提交时逐步校验与保存每个 step 的参数，调用 before/after hooks，并最终触发 model.save()。
   * - 通过 model.context.message 提示保存成功或错误信息。
   *
   * 参数：
   * - options.model: FlowModel 实例（必填）。
   * - options.preset?: 当为 true 时，仅渲染 flow 中标记了 preset=true 的步骤。
   * - options.flowKey?: 目标 flow 的 key。
   * - options.flowKeys?: 多个目标 flow 的 key 列表（当同时提供 flowKey 时被忽略）。
   * - options.stepKey?: 目标步骤的 key（通常与 flowKey 搭配使用）。
   * - options.uiMode?: 默认 'dialog'。
   * - options.onCancel?: 取消按钮点击后触发的回调（无参数）。
   * - options.onSaved?: 配置保存成功后触发的回调（无参数）。
   *
   * @param {FlowSettingsOpenOptions} options 打开选项
   * @returns {Promise<boolean>} 是否成功打开弹窗
   */
  public async open(options: FlowSettingsOpenOptions): Promise<boolean> {
    this.#emitter.emit('beforeOpen', options);
    const { model, flowKey, flowKeys, stepKey, uiMode = 'dialog', preset, onCancel, onSaved } = options;

    // 基础校验
    if (!model) {
      throw new Error('FlowSettings.open: model is required');
    }

    const t = getT(model);
    const message = model.context?.message;

    // 聚合渲染：准备需要处理的 flow 列表（flowKey 优先其余）
    const allFlowsMap = model.getFlows();
    const targetFlowKeys: string[] = (() => {
      if (flowKey) return [flowKey];
      if (Array.isArray(flowKeys) && flowKeys.length) return flowKeys;
      return Array.from(allFlowsMap.keys());
    })();

    // 收集可配置的步骤：仅包含具备 uiSchema 且未被 hideInSettings 的步骤
    type StepEntry = {
      flowKey: string;
      flowTitle: string;
      stepKey: string;
      stepTitle: string;
      mergedUiSchema: any; // 合并后的 UI Schema（未包装）
      initialValues: any;
      previousParams: any;
      beforeParamsSave?: Function;
      afterParamsSave?: Function;
      ctx: any; // FlowRuntimeContext
      uiMode: any; // UI 模式
    };

    const entries: StepEntry[] = [];

    // 确保 Formily 组件已就绪（SchemaField/控件/作用域等）
    await this.load();

    for (const fk of targetFlowKeys) {
      const flow = model.getFlow(fk);
      if (!flow) {
        // 忽略无效 flowKey，但记录日志
        console.warn(`FlowSettings.open: Flow with key '${fk}' not found`);
        continue;
      }

      // 遍历步骤，筛选有可配置 UI 的步骤
      for (const sk of Object.keys(flow.steps || {})) {
        // 如明确指定了 stepKey，则仅处理对应步骤
        if (stepKey && sk !== stepKey) continue;
        const step = (flow.steps as any)[sk];
        if (!preset && (!step || (await shouldHideStepInSettings(model, flow, step)))) continue;
        // 当指定仅打开预设步骤时，过滤掉未标记 preset 的步骤
        if (preset && !step.preset) continue;

        // 解析合并后的 uiSchema（包含 action 的 schema）
        const mergedUiSchema = await resolveStepUiSchema(model, flow, step);
        // 计算标题与 hooks
        let stepTitle: string = step.title;
        let beforeParamsSave = step.beforeParamsSave;
        let afterParamsSave = step.afterParamsSave;
        let actionDefaultParams: Record<string, any> = {};
        let uiMode = step.uiMode;
        if (step.use) {
          const action = model.getAction?.(step.use);
          if (action) {
            actionDefaultParams = action.defaultParams || {};
            stepTitle = stepTitle || action.title;
            beforeParamsSave = beforeParamsSave || action.beforeParamsSave;
            afterParamsSave = afterParamsSave || action.afterParamsSave;
            uiMode = action.uiMode;
          }
        }

        // 构建 settings 上下文
        const flowRuntimeContext = new FlowRuntimeContext(model, fk, 'settings');
        setupRuntimeContextSteps(flowRuntimeContext, flow.steps, model, fk);
        flowRuntimeContext.defineProperty('currentStep', { value: step });
        flowRuntimeContext.defineMethod('getStepFormValues', (flowKey: string, stepKey: string) => {
          return forms.get(keyOf({ flowKey, stepKey }))?.values;
        });

        // 解析默认值 + 当前参数
        const modelStepParams = model.getStepParams(fk, sk) || {};
        const resolvedDefaultParams = await resolveDefaultParams(step.defaultParams, flowRuntimeContext);
        const resolvedActionDefaults = await resolveDefaultParams(actionDefaultParams, flowRuntimeContext);
        const initialValues = {
          ...(resolvedActionDefaults || {}),
          ...(resolvedDefaultParams || {}),
          ...modelStepParams,
        };
        if (
          (!mergedUiSchema || Object.keys(mergedUiSchema).length === 0) &&
          !['select', 'switch'].includes(uiMode?.type || uiMode)
        ) {
          continue;
        }
        entries.push({
          flowKey: fk,
          flowTitle: t(flow.title) || fk,
          stepKey: sk,
          stepTitle: t(stepTitle) || sk,
          initialValues,
          previousParams: { ...(modelStepParams || {}) },
          mergedUiSchema, // 存储合并后的 UI Schema，在 renderStepForm 中进行包装
          beforeParamsSave,
          afterParamsSave,
          ctx: flowRuntimeContext,
          uiMode: step.uiMode || uiMode,
        });
      }
    }

    if (entries.length === 0) {
      if (!preset) {
        message?.info?.(t('This model has no configurable flow settings'));
      }
      return false;
    }

    // 渲染视图（对话框/抽屉）
    // 兼容新的 uiMode 定义：字符串或 { type, props }
    const viewer = model.context.viewer;
    // 解析 uiMode，支持函数式
    const resolvedUiMode =
      entries.length === 1 ? await resolveUiMode(entries[0].uiMode || uiMode, entries[0].ctx) : uiMode;
    const modeType = typeof resolvedUiMode === 'string' ? resolvedUiMode : resolvedUiMode.type || 'dialog';
    if (['select', 'switch'].includes(modeType)) {
      return;
    }
    const openView = viewer[modeType || 'dialog'].bind(viewer);
    const flowEngine = model.flowEngine;
    const scopes = {
      // 为 schema 表达式提供上下文能力（可在表达式中使用 useFlowSettingsContext 等）
      useFlowSettingsContext,
      ...(flowEngine?.flowSettings?.scopes || {}),
    } as Record<string, any>;

    let modeProps: Record<string, any> =
      typeof resolvedUiMode === 'object' && resolvedUiMode ? resolvedUiMode.props || {} : {};

    if (modeType === 'embed') {
      const target = document.querySelector<HTMLDivElement>(`#${GLOBAL_EMBED_CONTAINER_ID}`);
      const onOpen = modeProps.onOpen;
      const onClose = modeProps.onClose;

      modeProps = {
        target,
        styles: {
          body: {
            padding: flowEngine.context.themeToken?.padding,
          },
        },
        ...modeProps,
        onOpen() {
          if (target) {
            target.style.width = modeProps.width || '33.3%';
            target.style.maxWidth = modeProps.maxWidth || '800px';
            target.style.minWidth = modeProps.minWidth || '0px';
          }
          onOpen?.();
        },
        onClose() {
          if (target && target.dataset[EMBED_REPLACING_DATA_KEY] !== '1') {
            target.style.width = 'auto';
            target.style.maxWidth = 'none';
            target.style.minWidth = 'auto';
          }
          onClose?.();
        },
      };
    }

    // 将步骤分组到 flow 下，用于 Collapse 分组展示
    const grouped: Record<string, { title: string; steps: StepEntry[] }> = {};
    entries.forEach((e) => {
      if (!grouped[e.flowKey]) grouped[e.flowKey] = { title: e.flowTitle, steps: [] };
      grouped[e.flowKey].steps.push(e);
    });

    // 为每个步骤创建独立的表单实例，互不干扰
    const forms = new Map<string, ReturnType<typeof createForm>>();
    const keyOf = (e: { flowKey: string; stepKey: string }) => `${e.flowKey}::${e.stepKey}`;

    entries.forEach((e) => {
      const form = createForm({ initialValues: compileUiSchema(scopes, e.initialValues) });
      forms.set(keyOf(e), form);
    });

    // 判定是否存在多个 flow
    const flowKeysOrdered = Object.keys(grouped);
    const multipleFlows = flowKeysOrdered.length > 1;

    const getTitle = () => {
      // 情况 A：明确指定了 flowKey + stepKey 且唯一匹配 => 返回 step 标题
      if (flowKey && stepKey && entries.length === 1) {
        return entries[0].stepTitle;
      }

      if (!multipleFlows && entries.length > 0) {
        // 情况 B：只有一个flow且未指定stepKey => 返回第一个步骤标题
        return entries[0].stepTitle;
      }

      // 情况 C：多 flow 分组渲染 => 返回空标题
      return '';
    };

    const dispose = { value: () => {} };
    // 支持 uiMode 函数中使用响应式对象
    const autoUpdateViewProps = (step, currentDialog) => {
      dispose.value = reaction(
        () => {
          return resolveUiMode(step.uiMode || uiMode, step.ctx);
        },
        (newValue) => {
          newValue
            .then((newUiMode: any) => {
              if (_.isPlainObject(newUiMode?.props)) {
                currentDialog.update(newUiMode.props);
              }
            })
            .catch((error) => {
              console.warn('Error resolving uiMode:', error);
            });
        },
      );
    };

    const baseViewInputArgs = model.context.view?.inputArgs || {};
    const navigation = model.context.view?.navigation;
    const inputArgs = {
      ...baseViewInputArgs,
      ...(navigation ? { navigation } : {}),
      ...(modeProps?.inputArgs || {}),
    };

    openView({
      // 默认标题与宽度可被传入的 props 覆盖
      title: modeProps.title || getTitle(),
      width: modeProps.width ?? 600,
      destroyOnClose: true,
      onClose: () => dispose.value(),
      zIndex: 5000,
      // 允许透传其它 props（如 maskClosable、footer 等），但确保 content 由我们接管
      ...modeProps,
      // 统一构造 settings 弹窗的 inputArgs（集合/记录/父导航/关联）
      inputArgs,
      content: (currentView, viewCtx) => {
        viewCtx?.defineMethod('getStepFormValues', (flowKey: string, stepKey: string) => {
          return forms.get(keyOf({ flowKey, stepKey }))?.values;
        });
        // 渲染单个 step 表单（无 JSX）：FormProvider + SchemaField
        const renderStepForm = (entry: StepEntry) => {
          const form = forms.get(keyOf(entry));
          if (!form) return null;

          entry.ctx.view = currentView;

          return React.createElement(
            FlowSettingsContextProvider as any,
            { value: entry.ctx },
            React.createElement(
              FlowStepContext.Provider,
              {
                value: {
                  params: untracked(() => ({ ...entry.initialValues, ...form.values })),
                  path: `${model.uid}_${entry.flowKey}_${entry.stepKey}`,
                },
              },
              this.renderStepForm({
                uiSchema: entry.mergedUiSchema,
                initialValues: entry.initialValues,
                flowEngine,
                form,
              }),
            ),
          );
        };

        const renderStepPanels = (steps: StepEntry[]) =>
          steps.map((s) => React.createElement(Panel, { header: s.stepTitle, key: keyOf(s) }, renderStepForm(s)));

        // 生成 Tabs 的 items，每个 flow 一个 Tab，内容为其步骤的折叠面板（如果只有一个步骤，会显示成表单）
        const toFlowTabItem = (fk: string) => {
          const group = grouped[fk];
          return {
            key: fk,
            label: t(group.title) || fk,
            children:
              group.steps.length > 1
                ? React.createElement(
                    Collapse,
                    { defaultActiveKey: group.steps.map((s) => keyOf(s)) },
                    ...renderStepPanels(group.steps),
                  )
                : renderStepForm(group.steps[0]),
          };
        };

        const renderStepsContainer = (): React.ReactNode => {
          // 情况 A：明确指定了 flowKey + stepKey 且唯一匹配 => 直出单步表单（不使用折叠面板）
          if (flowKey && stepKey && entries.length === 1) {
            const step = entries[0];
            autoUpdateViewProps(step, currentView);
            return renderStepForm(step);
          }

          if (!multipleFlows) {
            const step = entries[0];
            autoUpdateViewProps(step, currentView);
            // 情况 B：未提供 stepKey 且仅有一个步骤 => 仍保持折叠面板外观（与情况 A 一致）
            return renderStepForm(entries[0]);
          }

          // 情况 C：多 flow 分组渲染 => 使用 Tabs（每个 flow 一个 Tab）
          const items = flowKeysOrdered.map((fk) => toFlowTabItem(fk));
          const defaultActiveKey = flowKey && grouped[flowKey] ? flowKey : flowKeysOrdered[0];
          return React.createElement(Tabs as any, { items, defaultActiveKey });
        };

        const onSaveAll = async () => {
          try {
            // 逐步提交并保存
            // 顺序：submit -> setStepParams -> beforeParamsSave -> model.save -> afterParamsSave
            for (const e of entries) {
              const form = forms.get(keyOf(e));
              if (!form) continue;
              await form.submit();
              const currentValues = form.values;
              model.setStepParams(e.flowKey, e.stepKey, currentValues as ParamObject);

              if (typeof e.beforeParamsSave === 'function') {
                await e.beforeParamsSave(e.ctx, currentValues, e.previousParams);
              }
            }

            await model.saveStepParams();
            message?.success?.(t('Configuration saved'));

            for (const e of entries) {
              const form = forms.get(keyOf(e));
              if (!form) continue;
              const currentValues = form.values;
              if (typeof e.afterParamsSave === 'function') {
                await e.afterParamsSave(e.ctx, currentValues, e.previousParams);
              }
            }

            currentView.close();

            // 配置变更后立即刷新 beforeRender，避免命中旧缓存导致界面不更新
            model.invalidateFlowCache('beforeRender', true);
            await model.rerender();

            // 触发保存成功回调
            try {
              await onSaved?.();
            } catch (cbErr) {
              console.error('FlowSettings.open: onSaved callback error', cbErr);
            }
          } catch (err) {
            if (err instanceof FlowCancelSaveException) {
              return;
            }
            if (err instanceof FlowExitException || err instanceof FlowExitAllException) {
              currentView.close();
              return;
            }
            console.error('FlowSettings.open: save error', err);
            message?.error?.(t('Error saving configuration, please check console'));
          }
        };

        currentView.submit = onSaveAll;

        const stepsEl = renderStepsContainer();
        const Cancel = (props: { title?: string }) => {
          return React.createElement(
            Button,
            {
              onClick: async () => {
                currentView.close();
                try {
                  await onCancel?.();
                } catch (cbErr) {
                  console.error('FlowSettings.open: onCancel callback error', cbErr);
                }
              },
            },
            props.title || t('Cancel'),
          );
        };
        const Save = (props: { title?: string }) => {
          return React.createElement(Button, { type: 'primary', onClick: onSaveAll }, props.title || t('Save'));
        };

        let footerButtons = React.createElement(
          Space,
          { align: 'end' },
          React.createElement(Cancel),
          React.createElement(Save),
        );

        if (modeProps.footer) {
          footerButtons = _.isFunction(modeProps.footer)
            ? modeProps.footer(footerButtons, {
                OkBtn: Save,
                CancelBtn: Cancel,
              })
            : modeProps.footer;
        }

        if (modeProps.footer === null) {
          footerButtons = null;
        }

        let footerEl;
        if (currentView.Footer) {
          footerEl = React.createElement(currentView.Footer, null, footerButtons);
        }

        return React.createElement(React.Fragment, null, stepsEl, footerEl);
      },
    });

    return true;
  }

  // =============================
  // Dynamic flows editor (disabled)
  // Kept as comments to preserve context
  // =============================
  /*
  public async openDynamicFlowsEditor(
    options: Pick<FlowSettingsOpenOptions, 'model' | 'uiMode' | 'onCancel'> & {
      onSaved?: (flows: FlowDefinition[]) => void | Promise<void>;
    },
  ) {
    const { model, uiMode = 'dialog', onCancel, onSaved } = options;
    const t = getT(model);
    const message = model.context?.message;

    // 构造响应式 value（深度可变）
    const base = model.getDynamicFlows() || [];
    const reactiveFlows = observable(JSON.parse(JSON.stringify(base)));

    // 打开视图
    const viewer = (model as any).context.viewer;
    const modeType: 'dialog' | 'drawer' = typeof uiMode === 'string' ? uiMode : uiMode.type;
    const modeProps: Record<string, any> = typeof uiMode === 'object' && uiMode ? uiMode.props || {} : {};
    const openView = viewer[modeType].bind(viewer);

    openView({
      title: modeProps.title,
      width: modeProps.width ?? 800,
      destroyOnClose: true,
      ...modeProps,
      content: (currentDialog) => {
        const editorEl = React.createElement(DynamicFlowsEditor as any, { value: reactiveFlows, model });

        const onSubmit = async () => {
          try {
            const plain = JSON.parse(JSON.stringify(reactiveFlows));
            (model as any).setDynamicFlows(plain as FlowDefinition[]);
            await (model as any).saveDynamicFlows();
            message?.success?.(t('Configuration saved'));
            currentDialog.close();
            try {
              await onSaved?.(plain);
            } catch (cbErr) {
              console.error('FlowSettings.openDynamicFlowsEditor: onSaved callback error', cbErr);
            }
          } catch (err) {
            console.error('FlowSettings.openDynamicFlowsEditor: save error', err);
            message?.error?.(t('Error saving configuration, please check console'));
          }
        };

        const footer = React.createElement(
          currentDialog.Footer,
          null,
          React.createElement(
            Space,
            { align: 'end' },
            React.createElement(
              Button,
              {
                onClick: async () => {
                  currentDialog.close();
                  try {
                    await onCancel?.();
                  } catch (cbErr) {
                    console.error('FlowSettings.openDynamicFlowsEditor: onCancel callback error', cbErr);
                  }
                },
              },
              t('Cancel'),
            ),
            React.createElement(Button, { type: 'primary', onClick: onSubmit }, t('OK')),
          ),
        );

        return React.createElement(React.Fragment, null, editorEl, footer);
      },
    });
  }
  */
}

function FormProviderWithForm({
  children,
  form,
  initialValues,
  onFormValuesChange: _onFormValuesChange,
}: {
  children?: React.ReactNode;
  form?: any;
  initialValues?: Record<string, any>;
  onFormValuesChange?: (form: any) => void;
}) {
  const formInstanceRef = React.useRef<any>(form);

  if (!formInstanceRef.current) {
    formInstanceRef.current = createForm({
      initialValues,
      effects() {
        onFormValuesChange(_onFormValuesChange);
      },
    });
  }

  return React.createElement(FormProvider as any, { form: formInstanceRef.current }, children);
}
