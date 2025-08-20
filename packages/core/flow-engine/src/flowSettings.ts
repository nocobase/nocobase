/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import React from 'react';
import { Collapse, Space, Button, Tabs } from 'antd';
import { DefaultSettingsIcon } from './components/settings/wrappers/contextual/DefaultSettingsIcon';
import { openStepSettingsDialog } from './components/settings/wrappers/contextual/StepSettingsDialog';
import { StepSettingsDialogProps, ToolbarItemConfig } from './types';
import type { FlowModel } from './models';
import { FlowRuntimeContext } from './flowContext';
import { compileUiSchema, getT, resolveDefaultParams, resolveStepUiSchema, setupRuntimeContextSteps } from './utils';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider, ISchema } from '@formily/react';
import { FlowSettingsContextProvider, useFlowSettingsContext } from './hooks/useFlowSettingsContext';

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
    | 'dialog'
    | 'drawer'
    | { type: 'dialog' | 'drawer'; props?: { title: string; width: number; [key: string]: any } };
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

  constructor() {
    // 初始默认为 false，由 SchemaComponentProvider 根据实际设计模式状态同步设置
    this.enabled = false;

    // 添加默认的配置项目
    this.addDefaultToolbarItems();

    define(this, {
      enabled: observable,
    });
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

      // 单独导入 Button 组件
      const { Button } = await import('antd');

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
    this.#forceEnabled = true;
    this.enabled = true;
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
   * - options.uiMode?: 'dialog' | 'drawer' ｜ { type: 'dialog' | 'drawer'; props?: { title: string; width: number; [key: string]: any } }，默认 'dialog'。
   * - options.onCancel?: 取消按钮点击后触发的回调（无参数）。
   * - options.onSaved?: 配置保存成功后触发的回调（无参数）。
   *
   * @param {FlowSettingsOpenOptions} options 打开选项
   * @returns {Promise<boolean>} 是否成功打开弹窗
   */
  public async open(options: FlowSettingsOpenOptions): Promise<boolean> {
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
      formSchema: any; // ISchema 片段（已包装）
      initialValues: any;
      previousParams: any;
      beforeParamsSave?: Function;
      afterParamsSave?: Function;
      ctx: any; // FlowRuntimeContext
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
        if (!step || step.hideInSettings) continue;
        // 当指定仅打开预设步骤时，过滤掉未标记 preset 的步骤
        if (preset && !step.preset) continue;

        // 解析合并后的 uiSchema（包含 action 的 schema）
        const mergedUiSchema = await resolveStepUiSchema(model, flow, step);
        if (!mergedUiSchema || Object.keys(mergedUiSchema).length === 0) continue;

        // 计算标题与 hooks
        let stepTitle: string = step.title;
        let beforeParamsSave = step.beforeParamsSave;
        let afterParamsSave = step.afterParamsSave;
        let actionDefaultParams: Record<string, any> = {};
        if (step.use) {
          const action = (model as any).flowEngine?.getAction?.(step.use);
          if (action) {
            actionDefaultParams = action.defaultParams || {};
            stepTitle = stepTitle || action.title;
            beforeParamsSave = beforeParamsSave || action.beforeParamsSave;
            afterParamsSave = afterParamsSave || action.afterParamsSave;
          }
        }

        // 构建 settings 上下文
        const flowRuntimeContext = new FlowRuntimeContext(model as any, fk, 'settings');
        setupRuntimeContextSteps(flowRuntimeContext as any, flow as any, model as any, fk);
        flowRuntimeContext.defineProperty('currentStep', { value: step });

        // 解析默认值 + 当前参数
        const modelStepParams = (model as any).getStepParams(fk, sk) || {};
        const resolvedDefaultParams = await resolveDefaultParams(step.defaultParams, flowRuntimeContext as any);
        const resolvedActionDefaults = await resolveDefaultParams(actionDefaultParams, flowRuntimeContext as any);
        const initialValues = {
          ...(resolvedActionDefaults || {}),
          ...(resolvedDefaultParams || {}),
          ...modelStepParams,
        };

        // 包装为表单 schema（垂直布局），实际渲染时再进行 compile
        const formSchema = {
          type: 'object',
          properties: {
            layout: {
              type: 'void',
              'x-component': 'FormLayout',
              'x-component-props': { layout: 'vertical' },
              properties: mergedUiSchema,
            },
          },
        } as ISchema;

        entries.push({
          flowKey: fk,
          flowTitle: flow.title || fk,
          stepKey: sk,
          stepTitle: t(stepTitle) || sk,
          initialValues,
          previousParams: { ...(modelStepParams || {}) },
          formSchema,
          beforeParamsSave,
          afterParamsSave,
          ctx: flowRuntimeContext,
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
    const SchemaField = createSchemaField();
    // 兼容新的 uiMode 定义：字符串或 { type, props }
    const viewer = (model as any).context.viewer;
    const modeType: 'dialog' | 'drawer' = typeof uiMode === 'string' ? uiMode : uiMode.type;
    const modeProps: Record<string, any> = typeof uiMode === 'object' && uiMode ? uiMode.props || {} : {};
    const openView = viewer[modeType].bind(viewer);
    const flowEngine = (model as any).flowEngine;
    const scopes = {
      // 为 schema 表达式提供上下文能力（可在表达式中使用 useFlowSettingsContext 等）
      useFlowSettingsContext,
      ...(flowEngine?.flowSettings?.scopes || {}),
    } as Record<string, any>;

    // 将步骤分组到 flow 下，用于 Collapse 分组展示
    const grouped: Record<string, { title: string; steps: StepEntry[] }> = {};
    entries.forEach((e) => {
      if (!grouped[e.flowKey]) grouped[e.flowKey] = { title: e.flowTitle, steps: [] };
      grouped[e.flowKey].steps.push(e);
    });

    // 为每个步骤创建独立的表单实例，互不干扰
    const forms = new Map<string, ReturnType<typeof createForm>>();
    const keyOf = (e: StepEntry) => `${e.flowKey}::${e.stepKey}`;

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

      if (!multipleFlows) {
        const onlyFlow = grouped[flowKeysOrdered[0]];
        // 情况 B：未提供 stepKey 且仅有一个步骤 => 返回 flow 标题
        return onlyFlow.title;
      }

      // 情况 C：多 flow 分组渲染 => 返回空标题
      return '';
    };

    openView({
      // 默认标题与宽度可被传入的 props 覆盖
      title: modeProps.title || getTitle(),
      width: modeProps.width ?? 800,
      destroyOnClose: true,
      // 允许透传其它 props（如 maskClosable、footer 等），但确保 content 由我们接管
      ...modeProps,
      content: (currentDialog) => {
        // 渲染单个 step 表单（无 JSX）：FormProvider + FlowSettingsContextProvider + SchemaField
        const renderStepForm = (entry: StepEntry) => {
          const form = forms.get(keyOf(entry));
          if (!form) return null;
          const compiledSchema = compileUiSchema(scopes, entry.formSchema);
          return React.createElement(
            FormProvider as any,
            { form },
            React.createElement(
              FlowSettingsContextProvider as any,
              { value: entry.ctx },
              React.createElement(SchemaField as any, {
                schema: compiledSchema,
                components: flowEngine?.flowSettings?.components || {},
                scope: scopes,
              }),
            ),
          );
        };

        const renderStepPanels = (steps: StepEntry[]) =>
          steps.map((s) => React.createElement(Panel, { header: s.stepTitle, key: keyOf(s) }, renderStepForm(s)));

        // 生成 Tabs 的 items，每个 flow 一个 Tab，内容为其步骤的折叠面板
        const toFlowTabItem = (fk: string) => {
          const group = grouped[fk];
          return {
            key: fk,
            label: t(group.title) || fk,
            children: React.createElement(
              Collapse,
              { defaultActiveKey: group.steps.map((s) => keyOf(s)) },
              ...renderStepPanels(group.steps),
            ),
          };
        };

        const renderStepsContainer = (): React.ReactNode => {
          // 情况 A：明确指定了 flowKey + stepKey 且唯一匹配 => 直出单步表单（不使用折叠面板）
          if (flowKey && stepKey && entries.length === 1) {
            return renderStepForm(entries[0]);
          }

          if (!multipleFlows) {
            const onlyFlow = grouped[flowKeysOrdered[0]];
            // 情况 B：未提供 stepKey 且仅有一个步骤 => 仍保持折叠面板外观（与情况 A 区分）
            return React.createElement(
              Collapse,
              { defaultActiveKey: onlyFlow.steps.map((s) => keyOf(s)) },
              ...renderStepPanels(onlyFlow.steps),
            );
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
              (model as any).setStepParams(e.flowKey, e.stepKey, currentValues);

              if (typeof e.beforeParamsSave === 'function') {
                await e.beforeParamsSave(e.ctx, currentValues, e.previousParams);
              }
            }

            await (model as any).save();
            message?.success?.(t('Configuration saved'));

            for (const e of entries) {
              const form = forms.get(keyOf(e));
              if (!form) continue;
              const currentValues = form.values;
              if (typeof e.afterParamsSave === 'function') {
                await e.afterParamsSave(e.ctx, currentValues, e.previousParams);
              }
            }

            currentDialog.close();

            // 触发保存成功回调
            try {
              await onSaved?.();
            } catch (cbErr) {
              console.error('FlowSettings.open: onSaved callback error', cbErr);
            }
          } catch (err) {
            console.error('FlowSettings.open: save error', err);
            message?.error?.(t('Error saving configuration, please check console'));
          }
        };

        const stepsEl = renderStepsContainer();
        const footerButtons = React.createElement(
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
                  console.error('FlowSettings.open: onCancel callback error', cbErr);
                }
              },
            },
            t('Cancel'),
          ),
          React.createElement(Button, { type: 'primary', onClick: onSaveAll }, t('OK')),
        );

        const footerEl = React.createElement(currentDialog.Footer, null, footerButtons);

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
