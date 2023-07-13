/**
 * title: Preview
 */
import { FormItem } from '@formily/antd-v5';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';
import Preview from '../Preview';

const defaultValue = [
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
  {
    id: 7,
    title: '简历',
    filename: 'd9f6ad6669902a9a8a1229d9f362235a.docx',
    extname: '.docx',
    size: null,
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    path: '',
    meta: {},
    url: 'https://nocobase.oss-cn-beijing.aliyuncs.com/d9f6ad6669902a9a8a1229d9f362235a.docx',
    created_at: '2021-09-12T01:22:06.229Z',
    updated_at: '2021-09-12T01:22:06.229Z',
    created_by_id: null,
    updated_by_id: 1,
    storage_id: 2,
    t_jh7a28dsfzi: {
      createdAt: '2021-09-12T01:22:07.886Z',
      updatedAt: '2021-09-12T01:22:07.886Z',
      f_xg3mysbjfra: 1,
      f_gc7ppj0b7n1: 7,
    },
  },
];

const schema = {
  type: 'object',
  properties: {
    read: {
      type: 'object',
      title: `阅读模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Preview',
      default: defaultValue,
    },
    read2: {
      type: 'object',
      title: `小图预览`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Preview',
      'x-component-props': {
        size: 'small',
      },
      default: defaultValue,
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Preview, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
