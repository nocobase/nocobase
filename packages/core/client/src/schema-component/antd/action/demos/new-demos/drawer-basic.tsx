import { getAppComponent } from '@nocobase/test/web';
import { Space } from 'antd';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-component': Space,
    properties: {
      test: {
        type: 'void',
        'x-component': 'Action',
        title: 'Open Drawer',
        properties: {
          drawer: {
            type: 'void',
            'x-component': 'Action.Drawer',
            title: 'Drawer Title',
          },
        },
      },
    },
  },
});

export default App;
