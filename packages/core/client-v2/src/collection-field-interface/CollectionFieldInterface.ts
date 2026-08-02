/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { tval } from '@nocobase/utils/client';
import { capitalize, cloneDeep, set } from 'lodash';
import type { ComponentType, ReactNode } from 'react';

import {
  normalizeFilterableOperators,
  type FieldFilterable,
  type FieldFilterOperator,
} from '../collection-manager/filter-operators';
import type { FieldConfigureItem } from '../collection-manager/field-configure';
import { defaultProps } from '../collection-manager/interfaces/properties';
import { CollectionFieldInterfaceManager } from './CollectionFieldInterfaceManager';
export type CollectionFieldInterfaceFactory = new (
  collectionFieldInterfaceManager: CollectionFieldInterfaceManager,
) => CollectionFieldInterface;

export interface CollectionFieldInterfaceComponentOption {
  label: string;
  value: string;
  useVisible?: () => boolean;
  useProps?: () => any;
}

export type FieldConfigureFormMode = 'create' | 'edit';

export interface FieldConfigureContext {
  mode: FieldConfigureFormMode;
  fieldInterface: CollectionFieldInterface | FieldInterfaceConfigure;
  collection?: Record<string, any>;
  field?: Record<string, any>;
  disabledJSONB?: boolean;
  createOnly?: boolean;
  editMainOnly?: boolean;
}

export type FieldConfigureFormProps = FieldConfigureContext;

export interface FieldConfigurePropertyComponentProps extends FieldConfigureContext {
  name: string;
  namePath: Array<string | number>;
  schema: Record<string, any>;
  form?: any;
  disabled?: boolean;
  collections?: Array<Record<string, any>>;
  context: Record<string, boolean>;
  title?: ReactNode;
  tooltip?: ReactNode;
  componentProps?: Record<string, any>;
}

export interface FieldInterfaceConfigure {
  name?: string;
  title?: ReactNode;
  group?: string;
  order?: number;
  default?: Record<string, any>;
  titleUsable?: boolean;
  isAssociation?: boolean;
  supportDataSourceType?: string[];
  notSupportDataSourceType?: string[];
  properties?: Record<string, any>;
  items?: FieldConfigureItem[];
  getConfigureFormProperties?: (collectionInfo?: Record<string, any>) => Record<string, any>;
  components?: Record<string, ComponentType<FieldConfigurePropertyComponentProps>>;
  initialize?: (values: Record<string, any>, context?: FieldConfigureContext) => void;
  ConfigureForm?: ComponentType<FieldConfigureFormProps>;
  Component?: ComponentType<FieldConfigureFormProps>;
  normalizeValues?: (values: Record<string, any>, context: FieldConfigureContext) => Record<string, any>;
  normalize?: (values: Record<string, any>, context: FieldConfigureContext) => Record<string, any>;
  validate?: (values: Record<string, any>, context: FieldConfigureContext) => Promise<void> | void;
}

export abstract class CollectionFieldInterface {
  constructor(public collectionFieldInterfaceManager: CollectionFieldInterfaceManager) {}
  name: string;
  group: string;
  title?: string;
  description?: string;
  primaryKeyDescription?: string;
  order?: number;
  default?: {
    type: string;
    uiSchema?: ISchema;
    [key: string]: any;
  };
  sortable?: boolean;
  availableTypes?: string[];
  type?: string;
  supportDataSourceType?: string[];
  notSupportDataSourceType?: string[];
  hasDefaultValue?: boolean;
  componentOptions?: CollectionFieldInterfaceComponentOption[];
  isAssociation?: boolean;
  operators?: FieldFilterOperator[];
  properties?: any;
  validationType?: string;
  availableValidationOptions: string[] = [];
  configure?: FieldInterfaceConfigure;
  excludeValidationOptions?: string[];
  /**
   * - 如果该值为空，则在 Filter 组件中该字段会被过滤掉
   * - 如果该值为空，则不会在变量列表中看到该字段
   */
  filterable?: FieldFilterable;
  titleUsable?: boolean;
  usePathOptions?(field: any): any;
  hidden?: boolean;
  creatable?: boolean;

  addComponentOption(componentOption: CollectionFieldInterfaceComponentOption) {
    if (!this.componentOptions) {
      this.componentOptions = [];
      const xComponent = this.default?.uiSchema?.['x-component'];
      const componentProps = this.default?.uiSchema?.['x-component-props'];
      if (xComponent) {
        const schemaType = this.default?.uiSchema?.type || 'string';
        const label = tval(xComponent.startsWith('Input') ? capitalize(schemaType) : xComponent.split('.').pop());
        this.componentOptions = [
          {
            label,
            value: xComponent,
            useProps() {
              return componentProps || {};
            },
          },
        ];
      }
    }
    this.componentOptions.push(componentOption);
  }
  getConfigureFormProperties(collectionInfo?: any): Record<string, ISchema> {
    const configuredProperties =
      this.configure?.getConfigureFormProperties?.(collectionInfo) || this.configure?.properties || {};
    const defaultValueProps = this.hasDefaultValue ? this.getDefaultValueProperty() : {};
    const isViewCollection = collectionInfo?.view;
    const isSqlCollection = collectionInfo?.template === 'sql' || collectionInfo?.sql;
    const availableValidationOptions = [...new Set([...this.availableValidationOptions, 'required'])];
    const validationProps =
      !isViewCollection && !isSqlCollection && this.validationType
        ? {
            validation: {
              title: '{{ t("Validation") }}',
              required: false,
              'x-decorator': 'FormItem',
              'x-component': 'FieldValidation',
              'x-component-props': {
                type: this.validationType,
                availableValidationOptions,
                excludeValidationOptions: [...new Set(this.excludeValidationOptions)],
                isAssociation: this.isAssociation,
              },
            },
          }
        : {};
    return {
      ...cloneDeep({ ...defaultProps, ...this?.properties, ...configuredProperties }),
      ...defaultValueProps,
      ...validationProps,
    };
  }
  getDefaultValueProperty() {
    return {
      defaultValue: {
        ...cloneDeep(this?.default?.uiSchema),
        ...this?.properties?.uiSchema,
        required: false,
        title: '{{ t("Default value") }}',
        'x-decorator': 'FormItem',
      },
    };
  }

  addOperator(operatorOption: FieldFilterOperator) {
    if (!this.filterable) {
      set(this, 'filterable', {});
    }

    const operatorOverrides = Array.isArray(this.filterable.operatorOverrides)
      ? [...this.filterable.operatorOverrides]
      : [];

    const existingIndex = operatorOverrides.findIndex((item) => item.value === operatorOption.value);
    if (existingIndex !== -1) {
      operatorOverrides[existingIndex] = operatorOption;
    } else {
      operatorOverrides.push(operatorOption);
    }

    set(this, 'filterable.operatorOverrides', operatorOverrides);
    normalizeFilterableOperators(this.filterable);
  }
}
