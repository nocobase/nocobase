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
        'x-decorator': 'FormItem',
        'x-component': 'AssociationSelect',
        'x-component-props': {
          service: {
            resource: 'roles', // roles 表
            action: 'list', // 列表接口
          },
          fieldNames: {
            label: 'title', // 显示的字段
            value: 'name', // 值字段
          },
        },
      },
    },
  },
  delayResponse: 500,
});

export default App;
