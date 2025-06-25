/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import { openStepSettingsDialog } from './components/settings/wrappers/contextual/StepSettingsDialog';
import { StepSettingsDialogProps, ToolbarItemConfig } from './types';
import { DefaultSettingsIcon } from './components/settings/wrappers/contextual/DefaultSettingsIcon';

export class FlowSettings {
  public components: Record<string, any> = {};
  public scopes: Record<string, any> = {};
  private antdComponentsLoaded = false;
  public enabled: boolean;
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

  /**
   * 禁用流程设置组件的显示
   * @example
   * flowSettings.disable();
   */
  public disable(): void {
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
}
