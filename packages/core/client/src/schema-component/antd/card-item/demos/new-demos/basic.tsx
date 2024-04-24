import { getAppComponent } from '@nocobase/test/web';
import { SchemaSettings } from '@nocobase/client';

const simpleSettings = new SchemaSettings({
  name: 'simpleSettings',
  items: [
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

const App = getAppComponent({
  designable: true,
  schema: {
    type: 'void',
    name: 'root',
    'x-component': 'DndContext',
    properties: {
      block1: {
        type: 'void',
        'x-component': 'CardItem',
        'x-component-props': {
          title: 'Block 1',
        },
        'x-settings': 'simpleSettings',
        properties: {
          hello: {
            type: 'void',
            'x-component': 'div',
            'x-content': 'Hello Card!',
          },
        },
      },
      block2: {
        type: 'void',
        'x-component': 'CardItem',
        'x-settings': 'simpleSettings',
        'x-component-props': {
          title: 'Block 2',
        },
        properties: {
          hello: {
            type: 'void',
            'x-component': 'div',
            'x-content': 'Hello Card!',
          },
        },
      },
    },
  },
  appOptions: {
    schemaSettings: [simpleSettings],
  },
});

export default App;
