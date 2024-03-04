export const mainCollections = [
  {
    name: 'users',
    title: 'Users',
    fields: [
      {
        key: 'id',
        name: 'id',
        interface: 'id',
        primaryKey: true,
        uiSchema: {
          type: 'number',
          title: 'ID',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
          rawTitle: 'ID',
        },
      },
      {
        uiSchema: {
          type: 'string',
          title: 'Nickname',
          'x-component': 'Input',
        },
        name: 'nickname',
        type: 'string',
        interface: 'input',
      },
      {
        uiSchema: {
          type: 'string',
          title: 'Email',
          'x-component': 'Input',
          required: true,
        },
        key: 'rrskwjl5wt1',
        name: 'email',
        type: 'string',
        interface: 'email',
        unique: true,
      },
      {
        name: 'favoriteColor',
        type: 'string',
        interface: 'color',
        uiSchema: {
          type: 'string',
          'x-component': 'ColorPicker',
          default: '#1677FF',
          title: 'Favorite Color',
        },
      },
    ],
  },
  {
    name: 'roles',
    title: 'Roles',
    fields: [
      {
        uiSchema: {
          type: 'string',
          title: 'Role UID',
          'x-component': 'Input',
        },
        name: 'name',
        type: 'uid',
        interface: 'input',
        primaryKey: true,
      },
      {
        uiSchema: {
          type: 'string',
          title: 'Role name',
          'x-component': 'Input',
        },
        name: 'title',
        type: 'string',
        interface: 'input',
      },
      {
        name: 'description',
        type: 'string',
      },
    ],
  },
];

export const TestDBCollections = [
  {
    name: 'test1',
    title: 'Test1',
    fields: [
      {
        name: 'id',
        interface: 'id',
        primaryKey: true,
        uiSchema: {
          type: 'number',
          title: 'ID',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
      },
      {
        name: 'field1',
        interface: 'input',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          title: 'Field1',
        },
      },
      {
        name: 'field2',
        interface: 'number',
        uiSchema: {
          'x-component-props': {
            step: '1',
            stringMode: true,
          },
          'x-component': 'InputNumber',
          title: 'Field2',
        },
        defaultValue: 1,
      },
    ],
  },
];
