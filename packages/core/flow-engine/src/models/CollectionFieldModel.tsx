/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input } from 'antd';
import React from 'react';
import { CollectionField } from '../data-source';
import { FlowEngineContext } from '../flowContext';
import { DefaultStructure } from '../types';
import { escapeT } from '../utils';
import { FlowModel } from './flowModel';

export interface FieldSettingsInitParams {
  dataSourceKey: string;
  collectionName: string;
  fieldPath: string;
  associationPathName?: string;
}

export class CollectionFieldModel<T extends DefaultStructure = DefaultStructure> extends FlowModel<T> {
  static bindings = new Map();

  renderHiddenInConfig(): React.ReactNode | undefined {
    return <Input variant={'borderless'} value={this.context.t('Permission denied')} readOnly disabled />;
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

  static getBindingsByField(ctx: FlowEngineContext, collectionField: CollectionField) {
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

  static getDefaultBindingByField(ctx: FlowEngineContext, collectionField: CollectionField) {
    const interfaceName = collectionField.interface;

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
    if (!this.bindings.has(interfaceName)) {
      this.bindings.set(interfaceName, []);
    }

    // Add the mapping entry
    const bindings = this.bindings.get(interfaceName);
    bindings.push({
      modelName,
      isDefault: options.isDefault || false,
      defaultProps: options.defaultProps || null,
      when: options.when || (() => true),
    });

    // Update the map
    this.bindings.set(interfaceName, bindings);
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
