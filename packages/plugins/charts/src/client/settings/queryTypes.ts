import { ISchema } from '@formily/react';
import cloneDeep from 'lodash/cloneDeep';

export const json: ISchema = {
  type: 'object',
  properties: {
    data: {
      title: 'JSON',
      required: true,
      'x-component': 'Input.JSON',
      'x-component-props': {
        autoSize: {
          maxRows: 20,
          minRows: 10,
        }
      },
      'x-decorator': 'FormItem',
    },
  },
};

export const sql: ISchema = {
  type: 'object',
  properties: {
    sql: {
      title: 'SQL',
      required: true,
      'x-component': 'Input.TextArea',
      'x-decorator': 'FormItem',
      'x-component-props': {
        autoSize: {
          maxRows: 20,
          minRows: 10,
        }
      },
    },
  },
};

export const api: ISchema = {
  type: 'object',
  properties: {
    api: {
      title: 'API',
      required: true,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
    },
  },
};

const types = {
  json,
  sql,
  api,
};

export const getQueryTypeSchema = (type) => {
  return cloneDeep(types[type]);
};
