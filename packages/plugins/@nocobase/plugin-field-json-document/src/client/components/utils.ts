/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { useRequest } from '@nocobase/client';
import { cloneDeep } from 'lodash';
import { uid } from '@formily/shared';
import { omit } from 'lodash';

interface IDefault {
  type: string;
  uiSchema?: ISchema;
  [key: string]: any;
}

export interface IField extends ISchema {
  group?: string;
  order?: number;
  default?: IDefault;
  operators?: any[];
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
  // NOTE: set to `true` means field could be used as a title field
  titleUsable?: boolean;
  [key: string]: any;
}

export const getAddFieldSchema = (schema: IField, compile) => {
  if (!schema) {
    return;
  }

  const properties = cloneDeep(schema.properties) as any;

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema?.default?.uiSchema);
    properties.defaultValue.required = false;
    properties['defaultValue']['title'] = compile('{{ t("Default value") }}');
    properties['defaultValue']['x-decorator'] = 'FormItem';
    properties['defaultValue']['x-reactions'] = [
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
    ];
  }
  const initialValue: any = {
    name: `f_${uid()}`,
    ...cloneDeep(schema.default),
    interface: schema.name,
  };
  if (initialValue.reverseField) {
    initialValue.reverseField.name = `f_${uid()}`;
  }
  // initialValue.uiSchema.title = schema.title;
  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-component-props': {
          getContainer: '{{ getContainer }}',
        },
        'x-decorator': 'Form',
        'x-decorator-props': {
          useValues(options) {
            return useRequest(
              () =>
                Promise.resolve({
                  data: initialValue,
                }),
              options,
            );
          },
        },
        title: `${compile('{{ t("Add field") }}')}`,
        properties: {
          summary: {
            type: 'void',
            'x-component': 'FieldSummary',
            'x-component-props': {
              schemaKey: schema.name,
            },
          },
          // @ts-ignore
          ...properties,
          description: {
            type: 'string',
            title: '{{t("Description")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
          },
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              action1: {
                title: '{{ t("Cancel") }}',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ cm.useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: '{{ useCreateJSONDocField }}',
                },
              },
            },
          },
        },
      },
    },
  };
};

export const getEditFieldSchema = (schema: IField, title: string, compile): ISchema => {
  if (!schema) {
    return;
  }
  const properties = cloneDeep(schema.properties) as any;
  if (properties?.name) {
    properties.name['x-disabled'] = true;
  }

  if (schema.hasDefaultValue === true) {
    properties['defaultValue'] = cloneDeep(schema.default.uiSchema) || {};
    properties.defaultValue.required = false;
    properties['defaultValue']['title'] = compile('{{ t("Default value") }}');
    properties['defaultValue']['x-decorator'] = 'FormItem';
    properties['defaultValue']['x-reactions'] = [
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
    ];
  }

  return {
    type: 'object',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Action.Drawer',
        'x-decorator': 'Form',
        'x-decorator-props': {
          useValues(options) {
            return useRequest(
              () =>
                Promise.resolve({
                  data: cloneDeep(omit(schema.default, ['uiSchema.rawTitle'])),
                }),
              options,
            );
          },
        },
        title: `${compile(title)} - ${compile('{{ t("Edit field") }}')}`,
        properties: {
          summary: {
            type: 'void',
            'x-component': 'FieldSummary',
            'x-component-props': {
              schemaKey: schema.name,
            },
          },
          // @ts-ignore
          ...properties,
          description: {
            type: 'string',
            title: '{{t("Description")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
          },
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              action1: {
                title: '{{ t("Cancel") }}',
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ cm.useCancelAction }}',
                },
              },
              action2: {
                title: '{{ t("Submit") }}',
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                  useAction: '{{ useEditJSONDocField }}',
                },
              },
            },
          },
        },
      },
    },
  };
};
