import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'boolean',
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'RemoteSelect',
        'x-component-props': {
          fieldNames: {
            label: 'title',
            value: 'id',
          },
          service: {
            resource: 'posts',
            action: 'list',
          },
          manual: false,
        },
      },
    },
  },
  apis: {
    'posts:list': {
      data: [
        {
          id: 1,
          title: 'title1',
        },
        {
          id: 2,
          title: 'title2',
        },
      ],
    },
  },
  delayResponse: 300,
});

export default App;
