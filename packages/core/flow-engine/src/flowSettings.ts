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