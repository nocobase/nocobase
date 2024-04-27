import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test: {
        type: 'array', // 数组类型
        title: 'Test',
        'x-decorator': 'FormItem',
        'x-component': 'AssociationSelect',
        'x-component-props': {
          multiple: true, // 多选
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
