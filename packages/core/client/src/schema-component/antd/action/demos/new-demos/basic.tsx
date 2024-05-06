import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          ghost: true, // ButtonProps
          type: 'dashed', // ButtonProps
          danger: true, // ButtonProps
          title: 'Open', // title
        },
        // title: 'Open', // It's also possible here
      },
    },
  },
});

export default App;
