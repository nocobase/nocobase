import { getAppComponent } from '@nocobase/test/web';

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    'x-decorator': 'FormV2',
    'x-component': 'ShowFormData',
    properties: {
      test1: {
        type: 'string',
        title: 'Test1',
        'x-decorator': 'FormItem',
        'x-component': 'Input.TextArea',
        'x-component-props': {
          autoSize: {
            minRows: 2,
            maxRows: 6,
          },
        },
      },
      test2: {
        type: 'string',
        title: 'Test2',
        'x-decorator': 'FormItem',
        'x-component': 'Input.TextArea',
      },
      read1: {
        interface: 'string',
        type: 'string',
        default:
          'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
        title: `Read pretty`,
        'x-read-pretty': true,
        'x-decorator': 'FormItem',
        'x-component': 'Input.TextArea',
      },
      read2: {
        interface: 'string',
        type: 'string',
        title: `Read pretty(ellipsis)`,
        'x-read-pretty': true,
        'x-decorator': 'FormItem',
        default:
          'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
        'x-component': 'Input.TextArea',
        'x-component-props': {
          ellipsis: true,
          style: {
            width: '100px',
          },
        },
      },
      read3: {
        interface: 'string',
        type: 'string',
        title: `Read pretty(autop)`,
        default:
          'NocoBase is a scalability-first, open-source no-code/low-code platform for building business applications and enterprise solutions.',
        'x-read-pretty': true,
        'x-decorator': 'FormItem',
        'x-component': 'Input.TextArea',
        'x-component-props': {
          autop: true,
        },
      },
    },
  },
});

export default App;
