/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class FlowSettings {
  public components: Record<string, any> = {};
  public scopes: Record<string, any> = {};
  private antdComponentsLoaded = false;

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
}
