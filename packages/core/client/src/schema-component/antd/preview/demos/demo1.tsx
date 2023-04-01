/**
 * title: Preview
 */
import { FormItem } from '@formily/antd';
import { APIClientProvider, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';
import Preview from '../Preview';
import apiClient from './apiClient';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Preview.Selector',
      'x-component-props': {
        action: 'attachments:upload',
        // multiple: true,
      },
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      type: 'string',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Preview.Selector',
      'x-component-props': {
        // multiple: true,
      },
    },
  },
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider components={{ Preview, FormItem }}>
        <SchemaComponent schema={schema} />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
