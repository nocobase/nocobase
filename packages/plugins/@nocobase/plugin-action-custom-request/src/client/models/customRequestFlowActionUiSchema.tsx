/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { RemoteSelect, TextAreaWithContextSelector } from '@nocobase/client';
import { useFlowContext } from '@nocobase/flow-engine';
import { css } from '@emotion/css';
import { Input, InputNumber } from 'antd';
import React from 'react';
import { generateNTemplate } from '../locale';
import { FlowJsonWithContextSelector } from './FlowJsonWithContextSelector';
import { makeRequestKey } from './utils';

const requestConfigInFlight = new Map<string, Promise<any>>();

const RolesSelect = (props: { value?: string[]; onChange?: (value: string[]) => void }) => {
  const { value = [], onChange } = props;

  const toRoleNames = (next: any): string[] => {
    if (!Array.isArray(next)) {
      return [];
    }
    return next
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object') {
          return item?.name || item?.value || item?.roleName;
        }
      })
      .filter(Boolean);
  };

  return (
    <RemoteSelect
      mode="multiple"
      manual={false}
      value={value}
      service={{
        resource: 'roles',
      }}
      fieldNames={{
        label: 'title',
        value: 'name',
      }}
      allowClear
      onChange={(next) => onChange?.(toRoleNames(next))}
    />
  );
};

const RequestKeyField = (props: { value?: string; onChange?: (value: string) => void }) => {
  const { value, onChange } = props;
  const ctx = useFlowContext();
  const form = useForm();
  const loadedKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!value) {
      onChange?.(makeRequestKey());
    }
  }, [value, onChange]);

  React.useEffect(() => {
    if (!value || loadedKeyRef.current === value) {
      return;
    }

    let mounted = true;
    (async () => {
      try {
        let pending = requestConfigInFlight.get(value);
        if (!pending) {
          pending = ctx
            .request({
              url: `/customRequests:get/${value}`,
              method: 'GET',
              params: {
                appends: ['roles'],
              },
            })
            .finally(() => {
              requestConfigInFlight.delete(value);
            });
          requestConfigInFlight.set(value, pending);
        }

        const response = await pending;
        const record = response?.data?.data;
        const options = record?.options || {};
        const roles = Array.isArray(record?.roles) ? record.roles.map((item) => item?.name).filter(Boolean) : [];

        if (!mounted) {
          return;
        }

        const data =
          typeof options?.data === 'undefined' || options?.data === null
            ? undefined
            : typeof options?.data === 'string'
              ? options.data
              : JSON.stringify(options.data, null, 2);
        form.setValues({
          method: options?.method || form.values?.method || 'POST',
          url: options?.url || form.values?.url,
          headers: Array.isArray(options?.headers) ? options.headers : [],
          params: Array.isArray(options?.params) ? options.params : [],
          data,
          timeout: options?.timeout || form.values?.timeout || 5000,
          responseType: options?.responseType || form.values?.responseType || 'json',
          roles,
        });
        loadedKeyRef.current = value;
      } catch (error) {
        // ignore - this key may not have existing config yet
      }
    })();

    return () => {
      mounted = false;
    };
  }, [value, ctx, form]);

  return <Input value={value} disabled />;
};

export const customRequestFlowActionUiSchema = {
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
