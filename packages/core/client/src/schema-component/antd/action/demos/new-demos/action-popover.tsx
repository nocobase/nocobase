import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        'x-component': 'Action',
        'x-component-props': {
          type: 'primary',
          popover: true,
        },
        type: 'void',
        title: 'Open',
        properties: {
          popover: {
            type: 'void',
            'x-component': 'Action.Popover',
            properties: {
              hello: {
                type: 'void',
                'x-content': 'Hello',
              },
            },
          },
        },
      },
    },
  },
});

export default App;
