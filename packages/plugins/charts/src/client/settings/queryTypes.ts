import { ISchema } from '@formily/react';
import cloneDeep from 'lodash/cloneDeep';
import { NAMESPACE } from '../locale';
import { useCompile } from '@nocobase/client';

export type VariableOption = { key: string; value: string; label: string; children?: VariableOption[] };

const VariableTypes = [
  {
    title: `{{t("System variables", { ns: "${NAMESPACE}" })}}`,
    value: '$system',
    options: [
      {
        key: 'now',
        value: 'now',
        label: `{{t("Current time", { ns: "${NAMESPACE}" })}}`,
      },
    ],
  },
];

export function useChartsVariableOptions() {
  const compile = useCompile();
  const options = VariableTypes.map((item: any) => {
    const options = typeof item.options === 'function' ? item.options().filter(Boolean) : item.options;
    return {
      label: compile(item.title),
      value: item.value,
      key: item.value,
      children: compile(options),
      disabled: options && !options.length,
    };
  });
  return options;
}

export const json: ISchema = {
  type: 'object',
  properties: {
    data: {
      title: 'JSON',
      required: true,
      'x-component': 'Input.TextArea',
      'x-validator': { json5: true },
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
      'x-validator': {
        triggerType: 'onBlur',
        // validator: '{{validateSQL}}',
      },
      // 'x-reactions': (field: Field) => {
      //   const variables = field.query('.variables').value();
      //   const sqlTemplate = field.value;
      //   console.log(variables, sqlTemplate);
      //   if (Array.isArray(variables)) {
      //     console.log(variables);
      //   } else {
      //     field.setValidator((value) => {});
      //     //校验sqlTemplate
      //     // validateSQL(sqlTemplate);
      //   }
      // },
      'x-component-props': {
        autoSize: {
          maxRows: 20,
          minRows: 10,
        },
      },
    },
    variables: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Variables", { ns: "${NAMESPACE}" })}}`,
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              key: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Key",{ns:"${NAMESPACE}"})}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Variable.Input',
                'x-component-props': {
                  scope: useChartsVariableOptions,
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
          title: `{{t("Add variable", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
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
