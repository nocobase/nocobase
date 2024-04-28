import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'string',
        title: 'Test',
        default: 'admin',
        'x-decorator': 'FormItem',
        'x-component': 'AssociationSelect',
        'x-pattern': 'readPretty',
        'x-component-props': {
          service: {
            resource: 'roles',
            action: 'list',
          },
          fieldNames: {
            label: 'title',
            value: 'name',
          },
        },
      },
    },
  },
  delayResponse: 500,
});

export default App;
