import React from 'react';
import { useField, observer } from '@formily/react';
import { FilterActionProps, useRequest } from '@nocobase/client';

import { getAppComponent } from '@nocobase/test/web';

import { filterOptions } from './options';

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
    options: filterOptions,
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

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        name: 'filter',
        type: 'object',
        enum: filterOptions,
        title: 'Filter',
        'x-decorator': 'ShowFilterData',
        'x-component': 'Filter.Action',
        'x-use-component-props': useFilterActionProps,
      },
    },
  },
  appOptions: {
    components: {
      ShowFilterData,
    },
    scopes: {
      useFilterActionProps,
    },
  },
  apis: {
    test: { data: { data: 'ok' } },
  },
});

export default App;
