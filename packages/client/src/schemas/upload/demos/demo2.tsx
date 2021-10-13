import React from 'react';
import { SchemaRenderer } from '../../';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'object',
      title: `编辑模式`,
      default: [
        {
          id: 45,
          title: 's33766399',
          name: 's33766399',
          filename: 'cd48dc833ab01aa3959ac39309fc39de.jpg',
          extname: '.jpg',
          size: null,
          mimetype: 'image/jpeg',
          path: '',
          meta: {},
          status: 'uploading',
          percent: 60,
          url: 'https://nocobase.oss-cn-beijing.aliyuncs.com/cd48dc833ab01aa3959ac39309fc39de.jpg',
          created_at: '2021-08-13T15:00:17.423Z',
          updated_at: '2021-08-13T15:00:17.423Z',
          created_by_id: null,
          updated_by_id: null,
          storage_id: 2,
        },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Upload.Attachment',
      'x-component-props': {
        multiple: true,
      },
      'x-reactions': [
        {
          target: 'read',
          fulfill: {
            state: {
              value: '{{$self.value}}',
            },
          },
        },
        {
          target: 'read2',
          fulfill: {
            state: {
              value: '{{$self.value}}',
            },
          },
        },
      ],
    },
    read: {
      type: 'object',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Upload.Attachment',
      'x-component-props': {
        multiple: true,
      },
    },
    read2: {
      type: 'object',
      title: `小图预览`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Upload.Attachment',
      'x-component-props': {
        multiple: true,
        size: 'small',
      },
    },
  },
};

export default () => {
  return <SchemaRenderer debug schema={schema} />;
};
