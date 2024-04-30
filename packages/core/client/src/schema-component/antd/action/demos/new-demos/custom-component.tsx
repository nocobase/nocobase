import { getAppComponent } from '@nocobase/test/web';
import { Button, Space } from 'antd';
import React from 'react';

const ComponentButton = (props) => {
  return <Button {...props}>Custom Component</Button>;
};

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-component': Space,
    properties: {
      test1: {
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          component: 'ComponentButton', // string type
        },
      },
      test2: {
        type: 'void',
        'x-component': 'Action',
        'x-component-props': {
          component: ComponentButton, // ComponentType type
        },
      },
    },
  },
  appOptions: {
    components: {
      ComponentButton, // register custom component
    },
  },
});

export default App;
