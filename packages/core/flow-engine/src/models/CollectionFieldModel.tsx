/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, Form, Tooltip } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionField } from '../data-source';
import { FlowEngineContext } from '../flowContext';
import { useFlowModel } from '../hooks';
import { DefaultStructure } from '../types';
import { escapeT } from '../utils';
import { FlowModel } from './flowModel';
import { FormItem } from '../components/FormItem';

export function FieldPlaceholder({ title }) {
  const { t } = useTranslation();
  return (
    <FormItem label={title} showLabel={true}>
      <Card
        size="small"
        styles={{
          body: {
            color: 'rgba(0,0,0,0.45)',
          },
        }}
      >
        {t(
          'This field has been hidden and you cannot view it (this content is only visible when the UI Editor is activated).',
        )}
      </Card>
    </FormItem>
  );
}

export function FieldDeletePlaceholder() {
  const { t } = useTranslation();
  const model: any = useFlowModel();
  const blockModel = model.context.blockModel;
  const dataSource = blockModel.collection?.dataSource;
  const collection = blockModel.collection;
  const name = model.fieldPath;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = dataSource ? `${t(dataSource.displayName || dataSource.key)} > ` : '';
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} > ` : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, []);
  return (
    <Form.Item>
      <div
        style={{
          color: 'rgba(0,0,0,0.45)',
        }}
      >
        {t(`The {{type}} "{{name}}" may have been deleted. Please remove this {{blockType}}.`, {
          type: t('Field'),
          name: nameValue,
          blockType: t('Field'),
        }).replaceAll('&gt;', '>')}
      </div>
    </Form.Item>
  );
}

function FieldWithoutPermissionPlaceholder() {
  const { t } = useTranslation();
  const model: any = useFlowModel();
  const blockModel = model.context.blockModel;
  const collection = model.context.collectionField?.collection || blockModel.collection;
  const dataSource = collection.dataSource;
  const name = model.context.collectionField?.name || model.fieldPath;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} > ` : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, []);
  const { actionName } = model.forbidden;
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for field "{{name}}"`,
      {
        name: nameValue,
        actionName: t(_.capitalize(actionName)),
      },
    ).replaceAll('&gt;', '>');
  }, [nameValue, t]);

  return (
    <Tooltip title={messageValue}>
      <FormItem showLabel={true} label={model.context.collectionField.title || name} style={{ opacity: '0.4' }}>
        <LockOutlined />
      </FormItem>
    </Tooltip>
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

const defaultWhen = () => true;

export class CollectionFieldModel<T extends DefaultStructure = DefaultStructure> extends FlowModel<T> {
  private static _bindings = new Map();

  renderHiddenInConfig(): React.ReactNode | undefined {
    if (this.forbidden) {
      return <FieldWithoutPermissionPlaceholder />;
    }
    return (
      <Tooltip title={this.context.t('The field is hidden and only visible when the UI Editor is active')}>
        <div style={{ opacity: 0.3 }}>{this.renderOriginal.call(this)}</div>
      </Tooltip>
    );
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
    if (this.context.blockModel) {
      this.context.blockModel.addAppends(this.fieldPath);
      this.context.blockModel.addAppends(this.associationPathName);
    }
  }

  getFieldSettingsInitParams(): FieldSettingsInitParams {
    return this.getStepParams('fieldSettings', 'init') || {};
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

  async afterAddAsSubModel() {
    if (this.context.resource) {
      await this.context.resource.refresh();
    }
  }

  static getBindingsByField(ctx: FlowEngineContext, collectionField: CollectionField): BindingOptions[] {
    if (!collectionField) {
      return;
    }
    const interfaceName = collectionField.interface;

    // Check if the interface exists in the map
    if (!this.bindings.has(interfaceName)) {
      return [];
    }

    // Filter the mappings based on the `when` condition
    const bindings = this.bindings.get(interfaceName).sort((a, b) => a.order - b.order);
    return bindings.filter(
      (binding) => ctx.engine.getModelClass(binding.modelName) && binding.when(ctx, collectionField),
    );
  }

  static getDefaultBindingByField(
    ctx: FlowEngineContext,
    collectionField: CollectionField,
    options: {
      useStrict?: boolean;
      fallbackToTargetTitleField?: boolean;
      targetCollectionTitleField?: CollectionField;
    } = {},
  ): BindingOptions | null {
    if (options.fallbackToTargetTitleField) {
      const binding = this.getDefaultBindingByField(ctx, collectionField, { useStrict: true });
      if (!binding) {
        if (
          (collectionField.isAssociationField() && options?.targetCollectionTitleField) ||
          collectionField.targetCollectionTitleField
        ) {
          return this.getDefaultBindingByField(
            ctx,
            options?.targetCollectionTitleField || collectionField.targetCollectionTitleField,
          );
        }
      }
      return binding;
    }
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
    const defaultBindings = bindings.filter(
      (binding) =>
        binding.isDefault && ctx.engine.getModelClass(binding.modelName) && binding.when(ctx, collectionField),
    );
    if (defaultBindings.length === 1) {
      return defaultBindings[0];
    }
    if (defaultBindings.length > 0) {
      let defaultBinding = null;
      defaultBinding = defaultBindings.find((binding) => binding.when !== defaultWhen);
      if (defaultBinding) {
        return defaultBinding;
      }
      defaultBinding = defaultBindings.find((binding) => binding.when === defaultWhen);
      if (defaultBinding) {
        return defaultBinding;
      }
    }
    if (options.useStrict) {
      return null;
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
      order?: number;
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
      when: options.when || defaultWhen,
      order: options.order,
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

  renderItem() {
    return null;
  }
  render() {
    if (!this.collectionField) {
      return <FieldDeletePlaceholder />;
    }
    return this.renderItem();
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
