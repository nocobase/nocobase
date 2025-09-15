/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, Form } from 'antd';
import _ from 'lodash';
import React from 'react';
import { CollectionField } from '../data-source';
import { FlowEngineContext } from '../flowContext';
import { DefaultStructure } from '../types';
import { escapeT } from '../utils';
import { FlowModel } from './flowModel';

export function FieldPlaceholder() {
  return (
    <Form.Item>
      <Card
        size="small"
        styles={{
          body: {
            color: 'rgba(0,0,0,0.45)',
          },
        }}
      >
        该字段已被隐藏，你无法查看（该内容仅在激活 UI Editor 时显示）。
      </Card>
    </Form.Item>
  );
}

export interface FieldSettingsInitParams {
  dataSourceKey: string;
  collectionName: string;
  fieldPath: string;
  associationPathName?: string;
}

export interface BindingOptions {
  modelName: string;
  isDefault: boolean;
  defaultProps: object | ((ctx: FlowEngineContext, fieldInstance: CollectionField) => object) | null;
  when: (ctx: FlowEngineContext, fieldInstance: CollectionField) => boolean;
}

export class CollectionFieldModel<T extends DefaultStructure = DefaultStructure> extends FlowModel<T> {
  private static _bindings = new Map();

  renderHiddenInConfig(): React.ReactNode | undefined {
    return <FieldPlaceholder />;
  }

  get title() {
    return undefined;
  }

  onInit(options: any): void {
    this.context.defineProperty('collectionField', {
      get: () => {
        const params = this.getFieldSettingsInitParams();
        const collectionField = this.context.dataSourceManager.getCollectionField(
          `${params.dataSourceKey}.${params.collectionName}.${params.fieldPath}`,
        ) as CollectionField;
        return collectionField;
      },
      cache: false,
    });
    this.context.defineProperty('fieldPath', {
      get: () => {
        return this.fieldPath;
      },
    });
    this.context.blockModel.addAppends(this.fieldPath);
    this.context.blockModel.addAppends(this.associationPathName);
  }

  getFieldSettingsInitParams(): FieldSettingsInitParams {
    return this.getStepParams('fieldSettings', 'init');
  }

  get fieldPath(): string {
    return this.getFieldSettingsInitParams().fieldPath;
  }

  get associationPathName(): string {
    return this.getFieldSettingsInitParams().associationPathName;
  }

  get collectionField() {
    return this.context.collectionField as CollectionField;
  }

  static getBindingsByField(ctx: FlowEngineContext, collectionField: CollectionField): BindingOptions[] {
    const interfaceName = collectionField.interface;

    // Check if the interface exists in the map
    if (!this.bindings.has(interfaceName)) {
      return [];
    }

    // Filter the mappings based on the `when` condition
    const bindings = this.bindings.get(interfaceName);
    return bindings.filter(
      (binding) => ctx.engine.getModelClass(binding.modelName) && binding.when(ctx, collectionField),
    );
  }

  static getDefaultBindingByField(ctx: FlowEngineContext, collectionField: CollectionField): BindingOptions | null {
    const interfaceName = collectionField.interface;
    if (!interfaceName) {
      return null;
    }

    // Check if the interface exists in the map
    if (!this.bindings.has(interfaceName)) {
      return null;
    }
    // Find the default mapping
    const bindings = this.bindings.get(interfaceName);
    const defaultBinding = bindings.find(
      (binding) =>
        binding.isDefault && ctx.engine.getModelClass(binding.modelName) && binding.when(ctx, collectionField),
    );
    if (defaultBinding) {
      return defaultBinding;
    }
    return bindings.find(
      (binding) => ctx.engine.getModelClass(binding.modelName) && binding.when(ctx, collectionField),
    );
  }

  static bindModelToInterface(
    modelName: string,
    interfaceName: string | string[],
    options: {
      isDefault?: boolean;
      defaultProps?: object | ((ctx: FlowEngineContext, fieldInstance: CollectionField) => object);
      when?: (ctx: FlowEngineContext, fieldInstance: CollectionField) => boolean;
    } = {},
  ) {
    if (Array.isArray(interfaceName)) {
      interfaceName.forEach((name) => this.bindModelToInterface(modelName, name, options));
      return;
    }
    // Ensure the interface entry exists in the map
    if (!this.currentBindings.has(interfaceName)) {
      this.currentBindings.set(interfaceName, []);
    }

    // Add the mapping entry
    const bindings = this.currentBindings.get(interfaceName);
    bindings.push({
      modelName,
      isDefault: options.isDefault || false,
      defaultProps: options.defaultProps || null,
      when: options.when || (() => true),
    });

    // Update the map
    this.currentBindings.set(interfaceName, bindings);
  }

  private static get currentBindings() {
    if (!Object.prototype.hasOwnProperty.call(this, '_bindings') || !this._bindings) {
      this._bindings = new Map();
    }
    return this._bindings;
  }

  static getAllParentClasses(): any[] {
    const parentClasses = [];
    let currentClass: any = this;

    while (currentClass && currentClass !== Object) {
      currentClass = Object.getPrototypeOf(currentClass);
      if (currentClass?.currentBindings) {
        parentClasses.push(currentClass);
      }
    }

    return parentClasses;
  }

  static get bindings() {
    const allBindings = new Map();

    // 获取当前类及其所有父类
    const allParentClasses = this.getAllParentClasses();

    // 遍历所有父类的绑定
    for (const parentClass of allParentClasses) {
      for (const [interfaceName, binding] of parentClass.currentBindings) {
        if (!allBindings.has(interfaceName)) {
          allBindings.set(interfaceName, []);
        }
        allBindings.get(interfaceName).unshift(...binding);
      }
    }

    // 合并当前类的绑定
    for (const [interfaceName, binding] of this.currentBindings) {
      if (!allBindings.has(interfaceName)) {
        allBindings.set(interfaceName, []);
      }
      allBindings.get(interfaceName).unshift(...binding);
    }

    return allBindings;
  }
}

CollectionFieldModel.registerFlow({
  key: 'fieldSettings',
  title: escapeT('Field settings'),
  steps: {
    init: {
      handler(ctx, params) {
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!dataSourceKey) {
          throw new Error('dataSourceKey is a required parameter');
        }
        if (!collectionName) {
          throw new Error('collectionName is a required parameter');
        }
        if (!fieldPath) {
          throw new Error('fieldPath is a required parameter');
        }
      },
    },
  },
});
