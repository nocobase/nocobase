import { ISchema } from '@formily/react';
import cloneDeep from 'lodash/cloneDeep';

const validateJSON = {
  validator: `{{(value, rule)=> {
    if (!value) {
      return '';
    }
    try {
      const val = JSON5.parse(value);
      if(!isNaN(val)) {
        return false;
      }
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }}}`,
  message: '{{t("Invalid JSON format")}}',
};
export const json: ISchema = {
  type: 'object',
  properties: {
    data: {
      title: 'JSON',
      required: true,
      'x-component': 'Input.TextArea',
      'x-validator': validateJSON,
      'x-component-props': {
        autoSize: {
          maxRows: 20,
          minRows: 10,
        },
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
        },
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
