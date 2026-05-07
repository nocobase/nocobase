/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect, TextAreaWithContextSelector } from '@nocobase/client';
import { css } from '@emotion/css';
import { InputNumber } from 'antd';
import { generateNTemplate } from '../locale';
import { FlowJsonWithContextSelector } from './components/FlowJsonWithContextSelector';
import { RequestKeyField } from './components/RequestKeyField';
import { RolesSelect } from './components/RolesSelect';

export const customRequestUiSchema = {
  key: {
    type: 'string',
    title: generateNTemplate('Key'),
    'x-decorator': 'FormItem',
    'x-decorator-props': {
      style: {
        display: 'none',
      },
    },
    'x-component': RequestKeyField,
  },
  method: {
    type: 'string',
    title: generateNTemplate('HTTP method'),
    required: true,
    'x-decorator-props': {
      tooltip: generateNTemplate(
        'When the HTTP method is Post, Put or Patch, and this custom request inside the form, the request body will be automatically filled in with the form data',
      ),
    },
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      showSearch: false,
      allowClear: false,
      className: 'auto-width',
    },
    default: 'POST',
    enum: [
      { label: 'GET', value: 'GET' },
      { label: 'POST', value: 'POST' },
      { label: 'PUT', value: 'PUT' },
      { label: 'PATCH', value: 'PATCH' },
      { label: 'DELETE', value: 'DELETE' },
    ],
  },
  url: {
    type: 'string',
    title: generateNTemplate('URL'),
    required: true,
    'x-decorator': 'FormItem',
    'x-component': TextAreaWithContextSelector,
    'x-component-props': {
      placeholder: 'https://www.nocobase.com',
    },
  },
  headers: {
    type: 'array',
    'x-component': 'ArrayItems',
    'x-decorator': 'FormItem',
    title: generateNTemplate('Headers'),
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
              display: 'flex',
            },
            className: css`
              & > .ant-space-item:first-child {
                flex: 3;
              }
              & > .ant-space-item:nth-child(2) {
                flex-shrink: 0;
                flex: 5;
              }
              & > .ant-space-item:last-child {
                flex-shrink: 0;
                flex: 1;
              }
            `,
          },
          properties: {
            name: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: generateNTemplate('Name'),
              },
            },
            value: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': TextAreaWithContextSelector,
              'x-component-props': {
                rows: 1,
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
        title: generateNTemplate('Add request header'),
        'x-component': 'ArrayItems.Addition',
      },
    },
  },
  params: {
    type: 'array',
    'x-component': 'ArrayItems',
    'x-decorator': 'FormItem',
    title: generateNTemplate('Parameters'),
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
              display: 'flex',
            },
            className: css`
              & > .ant-space-item:first-child {
                flex: 3;
              }
              & > .ant-space-item:nth-child(2) {
                flex-shrink: 0;
                flex: 5;
              }
              & > .ant-space-item:last-child {
                flex-shrink: 0;
                flex: 1;
              }
            `,
          },
          properties: {
            name: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: generateNTemplate('Name'),
              },
            },
            value: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': TextAreaWithContextSelector,
              'x-component-props': {
                rows: 1,
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
        title: generateNTemplate('Add parameter'),
        'x-component': 'ArrayItems.Addition',
      },
    },
  },
  data: {
    type: 'string',
    title: generateNTemplate('Body'),
    'x-decorator': 'FormItem',
    'x-component': FlowJsonWithContextSelector,
    'x-component-props': {
      autoSize: {
        minRows: 10,
      },
      placeholder: generateNTemplate('Input request data'),
    },
    description: generateNTemplate('Only support standard JSON data'),
  },
  timeout: {
    type: 'number',
    title: generateNTemplate('Timeout config'),
    'x-decorator': 'FormItem',
    'x-component': InputNumber,
    'x-component-props': {
      min: 1,
      step: 1000,
      addonAfter: generateNTemplate('ms'),
      style: {
        width: '100%',
      },
    },
    default: 5000,
  },
  responseType: {
    type: 'string',
    title: generateNTemplate('Response type'),
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    default: 'json',
    enum: [
      { value: 'json', label: 'JSON' },
      { value: 'stream', label: generateNTemplate('Stream') },
    ],
  },
  roles: {
    type: 'array',
    title: generateNTemplate('Access control'),
    'x-decorator': 'FormItem',
    'x-decorator-props': {
      tooltip: generateNTemplate('If not set, all roles can access this request'),
    },
    'x-component': RolesSelect,
  },
};
