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
  resolveFilterOperators,
  type FieldFilterable,
  type FieldFilterOperator,
} from '../collection-manager/filter-operators';
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
  validateSchema?(fieldSchema: ISchema): Record<string, ISchema>;
  usePathOptions?(field: any): any;
  hidden?: boolean;

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
        'x-reactions': [
          {
            dependencies: [
              'uiSchema.x-component-props.gmt',
              'uiSchema.x-component-props.showTime',
              'uiSchema.x-component-props.dateFormat',
              'uiSchema.x-component-props.timeFormat',
              'uiSchema.x-component-props.picker',
              'uiSchema.x-component-props.format',
            ],
            fulfill: {
              state: {
                componentProps: {
                  gmt: '{{$deps[0]}}',
                  showTime: '{{$deps[1]}}',
                  dateFormat: '{{$deps[2]}}',
                  timeFormat: '{{$deps[3]}}',
                  picker: '{{$deps[4]}}',
                  format: '{{$deps[5]}}',
                },
              },
            },
          },
          {
            // 当 picker 改变时，清空 defaultValue
            dependencies: ['uiSchema.x-component-props.picker'],
            fulfill: {
              state: {
                value: null,
              },
            },
          },
          {
            dependencies: ['primaryKey', 'unique', 'autoIncrement', 'defaultToCurrentTime'],
            when: '{{$deps[0]||$deps[1]||$deps[2]||$deps[3]}}',
            fulfill: {
              state: {
                hidden: true,
                value: null,
              },
            },
            otherwise: {
              state: {
                hidden: false,
              },
            },
          },
          {
            dependencies: ['uiSchema.enum'],
            fulfill: {
              state: {
                dataSource: '{{$deps[0]}}',
              },
            },
          },
        ],
      },
    };
  }

  addOperator(operatorOption: FieldFilterOperator) {
    normalizeFilterableOperators(this.filterable);
    const operators = [...resolveFilterOperators(this.filterable?.operators)];
    set(this, 'filterable.operators', operators);

    if (operators.find((item) => item.value === operatorOption.value)) {
      return;
    }

    operators.push(operatorOption);
  }
}
