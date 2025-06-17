/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useState } from 'react';
import { onFieldValueChange } from '@formily/core';
import { uid } from '@formily/shared';
import { useForm, useField, useFormEffects } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';
import { GlobalOutlined } from '@ant-design/icons';

import { SchemaComponent, css } from '@nocobase/client';
import {
  Instruction,
  WorkflowVariableJSON,
  WorkflowVariableRawTextArea,
  WorkflowVariableTextArea,
  defaultFieldNames,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE, useLang } from '../locale';

const BodySchema = {
  'application/json': {
    type: 'void',
    properties: {
      data: {
        type: 'object',
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component': 'WorkflowVariableJSON',
        'x-component-props': {
          changeOnSelect: true,
          autoSize: {
            minRows: 10,
          },
          placeholder: `{{t("Input request data", { ns: "${NAMESPACE}" })}}`,
        },
      },
    },
  },
  'application/x-www-form-urlencoded': {
    type: 'void',
    properties: {
      data: {
        type: 'array',
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component': 'ArrayItems',
        items: {
          type: 'object',
          properties: {
            space: {
              type: 'void',
              'x-component': 'Space',
              properties: {
                name: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: `{{t("Name")}}`,
                  },
                },
                value: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'WorkflowVariableTextArea',
                  'x-component-props': {
                    useTypedConstant: true,
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
          },
        },
        properties: {
          add: {
            type: 'void',
            title: `{{t("Add key-value pairs", { ns: "${NAMESPACE}" })}}`,
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
    },
  },
  'application/xml': {
    type: 'void',
    properties: {
      data: {
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'WorkflowVariableRawTextArea',
        'x-component-props': {
          placeholder: '<?xml version="1.0" encoding="UTF-8"?>',
          autoSize: {
            minRows: 10,
          },
          className: css`
            font-size: 80%;
            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
          `,
        },
      },
    },
  },
  'multipart/form-data': {
    type: 'void',
    properties: {
      data: {
        type: 'array',
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component': 'ArrayItems',
        items: {
          type: 'object',
          properties: {
            space: {
              type: 'void',
              'x-component': 'Space',
              properties: {
                name: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: `{{t("Name")}}`,
                  },
                },
                valueType: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Select',
                  'x-component-props': {
                    allowClear: false,
                  },
                  enum: [
                    { value: 'text', label: 'Text' },
                    { value: 'file', label: 'File' },
                  ],
                  default: 'text',
                },
                text: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'WorkflowVariableTextArea',
                  'x-component-props': {
                    useTypedConstant: true,
                  },
                  'x-reactions': [
                    {
                      dependencies: ['.valueType'],
                      fulfill: {
                        state: {
                          visible: '{{ $deps[0]==="text" }}',
                        },
                      },
                    },
                  ],
                },
                file: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'WorkflowVariableTextArea',
                  'x-component-props': {
                    useTypedConstant: true,
                    variableOptions: {
                      types: [{ type: 'reference', options: { collection: '*', entity: true } }],
                    },
                  },
                  'x-reactions': [
                    {
                      dependencies: ['.valueType'],
                      fulfill: {
                        state: {
                          visible: '{{ $deps[0]==="file" }}',
                        },
                      },
                    },
                  ],
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
          },
        },
        properties: {
          add: {
            type: 'void',
            title: `{{t("Add key-value pairs", { ns: "${NAMESPACE}" })}}`,
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
    },
  },
  'text/plain': {
    type: 'void',
    properties: {
      data: {
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'WorkflowVariableRawTextArea',
        'x-component-props': {
          autoSize: {
            minRows: 10,
          },
          className: css`
            font-size: 80%;
            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
          `,
        },
      },
    },
  },
};

function BodyComponent(props) {
  const f = useField();
  const { values, setValuesIn, clearFormGraph } = useForm();
  const { contentType } = values;
  const [schema, setSchema] = useState(BodySchema[contentType]);

  useFormEffects(() => {
    onFieldValueChange('contentType', (field) => {
      clearFormGraph(`${f.address}.*`);
      setSchema({ ...BodySchema[field.value], name: uid() });
      setValuesIn('data', null);
    });
  });

  return <SchemaComponent basePath={f.address} schema={schema} onlyRenderProperties />;
}

export default class extends Instruction {
  title = `{{t("HTTP request", { ns: "${NAMESPACE}" })}}`;
  type = 'request';
  group = 'extended';
  description = `{{t("Send HTTP request to a URL. You can use the variables in the upstream nodes as request headers, parameters and request body.", { ns: "${NAMESPACE}" })}}`;
  icon = (<GlobalOutlined />);
  fieldset = {
    method: {
      type: 'string',
      required: true,
      title: `{{t("HTTP method", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        showSearch: false,
        allowClear: false,
        className: 'auto-width',
      },
      enum: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
      ],
      default: 'POST',
    },
    url: {
      type: 'string',
      required: true,
      title: `{{t("URL", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'WorkflowVariableTextArea',
      'x-component-props': {
        placeholder: 'https://www.nocobase.com',
      },
    },
    contentType: {
      type: 'string',
      title: `{{t("Content-Type", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        allowClear: false,
      },
      enum: [
        { label: 'application/json', value: 'application/json' },
        { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
        { label: 'application/xml', value: 'application/xml' },
        { label: 'multipart/form-data', value: 'multipart/form-data' },
        { label: 'text/plain', value: 'text/plain' },
      ],
      default: 'application/json',
    },
    headers: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Headers", { ns: "${NAMESPACE}" })}}`,
      description: `{{t('"Content-Type" will be ignored from headers.', { ns: "${NAMESPACE}" })}}`,
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            'x-component-props': {
              style: {
                flexWrap: 'nowrap',
                maxWidth: '100%',
              },
              className: css`
                & > .ant-space-item:first-child,
                & > .ant-space-item:last-child {
                  flex-shrink: 0;
                }
              `,
            },
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Name")}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'WorkflowVariableTextArea',
                'x-component-props': {
                  useTypedConstant: true,
                  placeholder: `{{t("Value")}}`,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add request header", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    params: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Parameters", { ns: "${NAMESPACE}" })}}`,
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            'x-component-props': {
              style: {
                flexWrap: 'nowrap',
                maxWidth: '100%',
              },
              className: css`
                & > .ant-space-item:first-child,
                & > .ant-space-item:last-child {
                  flex-shrink: 0;
                }
              `,
            },
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Name")}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'WorkflowVariableTextArea',
                'x-component-props': {
                  useTypedConstant: true,
                  placeholder: `{{t("Value")}}`,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add parameter", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    data: {
      type: 'void',
      title: `{{t("Body", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'BodyComponent',
      // 'x-component-props': {
      //   changeOnSelect: true,
      //   autoSize: {
      //     minRows: 10,
      //   },
      //   placeholder: `{{t("Input request data", { ns: "${NAMESPACE}" })}}`,
      // },
      // description: `{{t("Only support standard JSON data", { ns: "${NAMESPACE}" })}}`,
    },
    timeout: {
      type: 'number',
      title: `{{t("Timeout config", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'InputNumber',
      'x-component-props': {
        addonAfter: `{{t("ms", { ns: "${NAMESPACE}" })}}`,
        min: 1,
        step: 1000,
        defaultValue: 5000,
      },
    },
    ignoreFail: {
      type: 'boolean',
      'x-content': `{{t("Ignore failed request and continue workflow", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  };
  components = {
    ArrayItems,
    BodyComponent,
    WorkflowVariableJSON,
    WorkflowVariableTextArea,
    WorkflowVariableRawTextArea,
  };
  useVariables({ key, title, config }, { types }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const statusCodeLabel = useLang('Status code');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const dataLabel = useLang('Data');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const headersLabel = useLang('Response headers');
    return {
      [defaultFieldNames.value]: key,
      [defaultFieldNames.label]: title,
      [defaultFieldNames.children]: config.onlyData
        ? null
        : [
            {
              [defaultFieldNames.value]: 'status',
              [defaultFieldNames.label]: statusCodeLabel,
            },
            {
              [defaultFieldNames.value]: 'data',
              [defaultFieldNames.label]: dataLabel,
            },
            {
              [defaultFieldNames.value]: 'headers',
              [defaultFieldNames.label]: headersLabel,
            },
          ],
    };
  }
  testable = true;
}
