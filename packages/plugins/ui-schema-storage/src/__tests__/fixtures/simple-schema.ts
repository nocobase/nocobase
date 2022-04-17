export default {
  name: 'root-name',
  'x-uid': 'root',
  properties: {
    p1: {
      'x-uid': 'p1',
      'x-component-props': {
        title: "alias's",
      },
    },
    p2: {
      'x-uid': 'p2',
      properties: {
        p21: {
          'x-uid': 'p21',
          properties: {
            p211: {
              'x-uid': 'p211',
            },
          },
        },
      },
    },
  },
  items: [
    {
      name: 'i1',
      'x-uid': 'i1',
    },
    {
      name: 'i2',
      'x-uid': 'i2',
    },
  ],
};
