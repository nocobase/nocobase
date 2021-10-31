# createdBy - 添加人

## Interface

```ts
export const createdBy: FieldOptions = {
  name: 'createdBy',
  type: 'object',
  group: 'systemInfo',
  order: 3,
  title: '添加人',
  isAssociation: true,
  default: {
    dataType: 'belongsTo',
    target: 'users',
    foreignKey: 'created_by_id',
    // name,
    uiSchema: {
      type: 'object',
      title: '添加人',
      'x-component': 'Select.Drawer',
      'x-component-props': {
        fieldNames: {
          value: 'id',
          label: 'nickname',
        },
      },
      'x-decorator': 'FormItem',
      'x-read-pretty': true,
      'x-designable-bar': 'Select.Drawer.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
```