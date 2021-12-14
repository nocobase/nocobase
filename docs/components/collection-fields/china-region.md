# ChinaRegion - 中国行政区

## Interface 

```ts
export const chinaRegion: FieldOptions = {
  name: 'chinaRegion',
  type: 'object',
  group: 'choices',
  order: 7,
  title: '中国行政区划',
  isAssociation: true,
  default: {
    type: 'belongsToMany',
    target: 'china_regions',
    targetKey: 'code',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Cascader',
      'x-component-props': {
        changeOnSelectLast: false,
        loadData: '{{ ChinaRegion.loadData() }}',
        labelInValue: true,
        maxLevel: 3,
        fieldNames: {
          label: 'name',
          value: 'code',
          children: 'children',
        },
      },
      'x-reactions': [
        '{{ ChinaRegion.useFieldValue }}',
        '{{ useAsyncDataSource(ChinaRegion.loadDataSource()) }}',
      ],
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Cascader.DesignableBar',
    },
  },
  initialize: (values: any) => {
    if (!values.through) {
      values.through = `t_${uid()}`;
    }
    if (!values.foreignKey) {
      values.foreignKey = `f_${uid()}`;
    }
    if (!values.otherKey) {
      values.otherKey = `f_${uid()}`;
    }
    if (!values.sourceKey) {
      values.sourceKey = 'id';
    }
    if (!values.targetKey) {
      values.targetKey = 'id';
    }
  },
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.maxLevel': {
      type: 'number',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      title: '可选择的层级',
      default: 3,
      enum: [
        { value: 1, label: '省' },
        { value: 2, label: '市' },
        { value: 3, label: '区/县' },
        { value: 4, label: '乡镇/街道' },
        { value: 5, label: '村/居委会' },
      ],
    },
    'uiSchema.x-component-props.changeOnSelectLast': {
      type: 'boolean',
      'x-component': 'Checkbox',
      'x-content': '必须选到最后一级',
      'x-decorator': 'FormItem',
    },
  },
  operations: [{ label: '等于', value: 'code.in' }],
};
```