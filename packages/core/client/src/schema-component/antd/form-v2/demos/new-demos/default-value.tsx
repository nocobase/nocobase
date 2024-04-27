import { createForm } from '@formily/core';
import { getAppComponent } from '@nocobase/test/web';
import { useMemo } from 'react';

const useCustomFormProps = () => {
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          username: 'test',
          nickname: 'test',
        },
      }),
    [],
  );

  return {
    form,
  };
};

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'FormV2',
        'x-use-component-props': 'useCustomFormProps',
        properties: {
          username: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            title: 'Username',
            required: true,
          },
          nickname: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            title: 'Nickname',
          },
        },
      },
    },
  },
  appOptions: {
    scopes: {
      useCustomFormProps,
    },
  },
});

export default App;
