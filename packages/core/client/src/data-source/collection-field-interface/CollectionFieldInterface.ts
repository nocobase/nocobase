/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { cloneDeep, capitalize, set } from 'lodash';
import type { CollectionFieldOptions } from '../collection';
import { CollectionFieldInterfaceManager } from './CollectionFieldInterfaceManager';
import { defaultProps } from '../../collection-manager/interfaces/properties';
import { tval } from '@nocobase/utils/client';
import type { DefaultOptionType as CascaderOptionType } from 'antd/lib/cascader';
import _ from 'lodash';
export type CollectionFieldInterfaceFactory = new (
  collectionFieldInterfaceManager: CollectionFieldInterfaceManager,
) => CollectionFieldInterface;

export interface CollectionFieldInterfaceComponentOption {
  label: string;
  value: string;
  useVisible?: () => boolean;
  useProps?: () => any;
}

type FieldInterfaceName = string;
type FieldTypeName = string;
type FieldDataType = string;
export interface AvailableFieldOptions {
  all: {
    [key: FieldInterfaceName]: {
      [key: FieldTypeName]: FieldDataType[];
    };
  };
  available: {
    [key: FieldInterfaceName]: {
      [key: FieldTypeName]: {
        [key: FieldDataType]: FieldDataType[];
      };
    };
  };
}

export abstract class CollectionFieldInterface {
  constructor(public collectionFieldInterfaceManager: CollectionFieldInterfaceManager) {}
  name: string;
  group: string;
  title?: string;
  description?: string;
  order?: number;
  availableOptions?: AvailableFieldOptions;
  default?: {
    type: string;
    uiSchema?: ISchema;
    [key: string]: any;
  };
  sortable?: boolean;
  availableTypes?: string[];
  supportDataSourceType?: string[];
  notSupportDataSourceType?: string[];
  hasDefaultValue?: boolean;
  componentOptions?: CollectionFieldInterfaceComponentOption[];
  isAssociation?: boolean;
  operators?: any[];
  properties?: any;
  /**
   * - 如果该值为空，则在 Filter 组件中该字段会被过滤掉
   * - 如果该值为空，则不会在变量列表中看到该字段
   */
  filterable?: {
    /**
     * 字段所支持的操作符，会在 Filter 组件中显示，比如设置 `数据范围` 的时候可以看见
     */
    operators?: any[];
    /**
     * 为当前字段添加子选项，这个子选项会在 Filter 组件中显示，比如设置 `数据范围` 的时候可以看见
     */
    children?: any[];
    [key: string]: any;
  };
  titleUsable?: boolean;
  validateSchema?(fieldSchema: ISchema): Record<string, ISchema>;
  usePathOptions?(field: CollectionFieldOptions): any;
  schemaInitialize?(schema: ISchema, data: any): void;
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
  getConfigureFormProperties() {
    const defaultValueProps = this.hasDefaultValue ? this.getDefaultValueProperty() : {};
    return {
      ...cloneDeep({ ...defaultProps, ...this?.properties }),
      ...defaultValueProps,
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

  addOperator(operatorOption: any) {
    set(this, 'filterable.operators', [...(this.filterable.operators || [])]);

    if (this.filterable.operators.find((item) => item.value === operatorOption.value)) {
      return;
    }

    this.filterable.operators.push(operatorOption);
  }

  getAllAvailableTypes(): string[] {
    if (!this.availableOptions?.all || !this.name) {
      return [];
    }

    const interfaceOptions = this.availableOptions.all[this.name];
    if (!interfaceOptions) {
      return [];
    }

    const allTypes: string[] = [];
    Object.values(interfaceOptions).forEach((typeArray) => {
      if (Array.isArray(typeArray)) {
        allTypes.push(...typeArray);
      }
    });

    return [...new Set(allTypes)];
  }

  getAvailableOptions(options: {
    currentValue: [FieldInterfaceName, ...FieldTypeName[], FieldDataType];
    interfaces: Record<string, CollectionFieldInterface>;
    compile: (v: string) => string;
  }): CascaderOptionType[] {
    const { currentValue, interfaces, compile } = options;
    const dataType = currentValue[currentValue.length - 1];
    const allAvailableOptions = this.availableOptions?.all || {};
    const availableOptions = this.availableOptions?.available || {};

    const result = this.buildTree({
      all: allAvailableOptions,
      available: availableOptions,
      dataType,
      interfaceMap: interfaces,
      compile,
    });
    return result;
  }

  private buildTree(options: {
    all;
    available;
    dataType;
    compile: (v: string) => string;
    interfaceMap?: Record<string, CollectionFieldInterface>;
  }) {
    const { all, available, dataType, compile, interfaceMap } = options;
    if (Array.isArray(all)) {
      const allowed = Array.isArray(available?.[dataType]) ? available[dataType] : [];
      return all.map((item) => ({
        label: item,
        value: item,
        disabled: !allowed.includes(item),
      }));
    }

    return Object.entries(all).map(([key, value]) => {
      const next = available?.[key];
      const children = this.buildTree({ all: value, available: next, dataType, compile });
      const disabled = Array.isArray(value) ? children.every((child) => child.disabled) : !next;
      const label = interfaceMap ? compile(interfaceMap[key]?.title) : key;
      return {
        label,
        value: key,
        disabled,
        children,
      };
    });
  }

  // validateFieldType<T extends AvailableFieldOptions>(value: string): keyof T {
  //   const fieldTypes = this.availableOptions[this.name];
  //   if (!(value in Object.keys(fieldTypes))) {
  //     throw new Error(`Field type "${value}" is not supported by interface "${this.name}".`);
  //   }

  //   return value;
  // }

  validateFieldDataType(fieldType: string, value: string) {
    const fieldTypes = this.availableOptions[this.name];
    if (!fieldTypes || !Array.isArray(fieldTypes)) {
      throw new Error(`Field type "${value}" is not supported by interface "${this.name}".`);
    }
    const dataTypes = Object.keys(fieldTypes).find((x) => x === fieldType);
    if (!dataTypes || !Array.isArray(dataTypes)) {
      throw new Error(`Field type "${dataTypes}" is not supported by interface "${this.name}".`);
    }
    const newValue = dataTypes.find((x) => x === value);
    newValue;

    return value;
  }
}
