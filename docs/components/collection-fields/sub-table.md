# SubTable - 子表格

## Interface

```ts
export const subTable: FieldOptions = {
  name: 'subTable',
  type: 'object',
  group: 'relation',
  order: 2,
  title: '子表格',
  isAssociation: true,
  disabled: true,
  default: {
    type: 'hasMany',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-decorator': 'FormItem',
      'x-component': 'Table',
      'x-component-props': {},
      'x-designable-bar': 'Table.DesignableBar',
      enum: [],
    },
  },
  initialize: (values: any) => {
    if (!values.target) {
      values.target = `t_${uid()}`;
    }
    if (!values.foreignKey) {
      values.foreignKey = `f_${uid()}`;
    }
  },
  properties: {
    ...defaultProps,
    children: {
      type: 'array',
      title: '子表格字段',
      'x-decorator': 'FormItem',
      'x-component': 'DatabaseField',
    },
  },
};
```