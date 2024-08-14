/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { cloneDeep } from 'lodash';
import type { CollectionFieldOptions } from '../collection';
import { CollectionFieldInterfaceManager } from './CollectionFieldInterfaceManager';
import { defaultProps } from '../../collection-manager/interfaces/properties';
export type CollectionFieldInterfaceFactory = new (
  collectionFieldInterfaceManager: CollectionFieldInterfaceManager,
) => CollectionFieldInterface;

export interface CollectionFieldInterfaceComponentOption {
  label: string;
  value: string;
  useVisible?: () => boolean;
  useProps?: () => any;
}

export abstract class CollectionFieldInterface {
  constructor(public collectionFieldInterfaceManager: CollectionFieldInterfaceManager) {}
  name: string;
  group: string;
  title?: string;
  description?: string;
  order?: number;
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
        this.componentOptions = [
          {
            label: xComponent.split('.').pop(),
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
            ],
            fulfill: {
              state: {
                componentProps: {
                  gmt: '{{$deps[0]}}',
                  showTime: '{{$deps[1]}}',
                  dateFormat: '{{$deps[2]}}',
                  timeFormat: '{{$deps[3]}}',
                },
              },
            },
          },
          {
            dependencies: ['primaryKey', 'unique', 'autoIncrement'],
            when: '{{$deps[0]||$deps[1]||$deps[2]}}',
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
}
