/**
 * title: Upload
 */
import { FormItem } from '@formily/antd-v5';
import { APIClientProvider, SchemaComponent, SchemaComponentProvider, Upload } from '@nocobase/client';
import React from 'react';
import apiClient from './apiClient';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Upload.Attachment',
      'x-component-props': {
        action: 'attachments:create',
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
      'x-component': 'Upload.Attachment',
      'x-component-props': {
        // multiple: true,
      },
    },
  },
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider components={{ Upload, FormItem }}>
        <SchemaComponent schema={schema} />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
