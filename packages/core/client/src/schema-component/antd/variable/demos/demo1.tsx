import { createForm } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import { AntdSchemaComponentProvider, Plugin, SchemaComponent, VariableEvaluateProvider } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { createJSONTemplateParser } from '@nocobase/json-template-parser';
import PluginVariableFiltersClient from '@nocobase/plugin-variable-helpers/client';
import { dayjs } from '@nocobase/utils/client';
import React, { useEffect, useState } from 'react';

const parser = createJSONTemplateParser();
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 30, 60, 90];
const scope = [
  { label: 'v1', value: 'v1' },
  {
    label: 'Date',
    value: '$nDate',
    type: 'date',
    children: [
      { label: 'Now', value: 'now', type: 'date' },
      {
        label: 'before',
        value: 'before',
        type: 'date',
        children: numbers.map((number) => ({
          label: `${number}`,
          value: `${number}`,
          children: [
            {
              label: 'days',
              value: 'day',
              type: 'date',
              helpers: [
                {
                  name: 'date_format',
                  args: ['YYYY-MM-DD'],
                },
              ],
              showLastHelper: true,
            },
            {
              label: 'weeks',
              value: 'week',
              type: 'date',
              helpers: [
                {
                  name: 'date_format',
                  args: ['YYYY-MM-DD'],
                },
              ],
              showLastHelper: true,
            },
            {
              label: 'months',
              value: 'month',
              type: 'date',
              helpers: [
                {
                  name: 'date_format',
                  args: ['YYYY-MM-DD'],
                },
              ],
              showLastHelper: true,
            },
            {
              label: 'years',
              value: 'year',
              type: 'date',
              helpers: [
                {
                  name: 'date_format',
                  args: ['YYYY-MM-DD'],
                },
              ],
              showLastHelper: true,
            },
          ],
        })),
      },
      {
        label: 'after',
        value: 'after',
        type: 'date',
        children: numbers.map((number) => ({
          label: `${number}`,
          value: `${number}`,
          children: [
            { label: 'days', value: 'day', type: 'date' },
            { label: 'weeks', value: 'week', type: 'date' },
            { label: 'months', value: 'month', type: 'date' },
            { label: 'years', value: 'year', type: 'date' },
          ],
        })),
      },
    ],
  },
];

const useFormBlockProps = () => {
  return {
    form: createForm({
      initialValues: {},
    }),
  };
};

const schema = {
  type: 'object',
  'x-component': 'FormV2',
  'x-use-component-props': 'useFormBlockProps',
  properties: {
    input: {
      type: 'string',
      title: `输入项`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
      },
    },
    output: {
      type: 'void',
      title: `模板`,
      'x-decorator': 'FormItem',
      'x-component': 'OutPut',
    },
    result: {
      type: 'void',
      title: `值`,
      'x-decorator': 'FormItem',
      'x-component': 'Result',
    },
  },
};

const OutPut = observer(() => {
  const form = useForm();
  return <div>{form.values.input}</div>;
});

const Result = observer(() => {
  const form = useForm();
  const [value, setValue] = useState<string>('');
  useEffect(() => {
    if (!form.values.input) {
      return;
    }
    parser
      .render(form.values.input, { $nDate: dateScopeFn }, {})
      .then((result) => {
        setValue(result);
      })
      .catch((error) => {
        throw error;
      });
  }, [form.values.input]);
  return <div>{value.toString()}</div>;
});

const dateScopeFn = ({ fields, data, context }) => {
  return {
    getValue: ({ field, keys }) => {
      const path = field.split('.');
      if (path[0] === 'now') {
        return dayjs();
      } else if (path[0] === 'before') {
        return dayjs().subtract(parseInt(path[1]), path[2]);
      } else if (path[0] === 'after') {
        return dayjs().add(parseInt(path[1]), path[2]);
      }
      return null;
    },
  };
};
const Demo = () => {
  return (
    <AntdSchemaComponentProvider>
      <VariableEvaluateProvider data={{ $nDate: dateScopeFn }} context={{}}>
        <SchemaComponent schema={schema} scope={{ useFormBlockProps }} components={{ OutPut, Result }} />
      </VariableEvaluateProvider>
    </AntdSchemaComponentProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({ plugins: [DemoPlugin, PluginVariableFiltersClient] });

export default app.getRootComponent();
