---
group:
  title: Collection Fields
  path: /components/collection-fields
  order: 3
---

# Attachment - 附件

## Interface

```ts
export const attachment: FieldOptions = {
  name: 'attachment',
  type: 'object',
  group: 'media',
  title: '附件',
  isAssociation: true,
  default: {
    type: 'belongsToMany',
    target: 'attachments',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Upload.Attachment',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Upload.DesignableBar',
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
    'uiSchema.x-component-props.multiple': {
      type: 'boolean',
      'x-content': '允许上传多个文件',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      default: true,
    },
  },
};
```