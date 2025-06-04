import React, { useMemo } from 'react';
import { useField, observer, ISchema } from '@formily/react';
import { FilterActionProps, useRequest, SchemaComponent, Plugin } from '@nocobase/client';
import { ArrayCollapse, FormLayout } from '@formily/antd-v5';
import { css } from '@emotion/css';

import { mockApp } from '@nocobase/client/demo-utils';

const ShowFilterData = observer(({ children }) => {
  const field = useField<any>();
  return (
    <>
      <pre>{JSON.stringify(field.value, null, 2)}</pre>
      {children}
    </>
  );
});

const useFilterActionProps = (): FilterActionProps => {
  const field = useField<any>();
  const { run } = useRequest({ url: 'test' }, { manual: true });

  return {
    onSubmit: async (values) => {
      console.log('onSubmit', values);

      // request api
      run(values);

      field.setValue(values);
    },
    onReset: (values) => {
      console.log('onReset', values);
    },
  };
};

const schema = {
  type: 'object',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  properties: {
    rules: {
      type: 'array',
      default: [{}],
      'x-component': 'ArrayCollapse',
      'x-decorator': 'FormItem',
      'x-component-props': {
        accordion: true,
      },
      items: {
        type: 'object',
        'x-component': 'ArrayCollapse.CollapsePanel',
        'x-component-props': {
          // extra: 'linkage rule',
        },
        properties: {
          layout: {
            type: 'void',
            'x-component': 'FormLayout',
            'x-component-props': {
              labelStyle: {
                marginTop: '6px',
              },
              labelCol: 8,
              wrapperCol: 16,
            },
            properties: {
              conditions: {
                'x-component': 'h4',
                'x-content': '{{ t("Condition") }}',
              },
              condition: {
                'x-component': 'LinkageFilter',
                'x-use-component-props': () => {
                  return {
                    // options,
                    className: css`
                      position: relative;
                      width: 100%;
                      margin-left: 10px;
                    `,
                  };
                },
              },
            },
          },
          remove: {
            type: 'void',
            'x-component': 'ArrayCollapse.Remove',
          },
          moveUp: {
            type: 'void',
            'x-component': 'ArrayCollapse.MoveUp',
          },
          moveDown: {
            type: 'void',
            'x-component': 'ArrayCollapse.MoveDown',
          },
          copy: {
            type: 'void',
            'x-component': 'ArrayCollapse.Copy',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: '{{ t("Add linkage rule") }}',
          'x-component': 'ArrayCollapse.Addition',
          'x-reactions': {
            dependencies: ['rules'],
            fulfill: {
              state: {
                // disabled: '{{$deps[0].length >= 3}}',
              },
            },
          },
        },
      },
    },
  },
};

const Demo = () => {
  return (
    <SchemaComponent
      schema={schema}
      components={{ ShowFilterData, ArrayCollapse, FormLayout }}
      scope={{ useFilterActionProps }}
    />
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  apis: {
    test: { data: { data: 'ok' } },
  },
});

export default app.getRootComponent();
