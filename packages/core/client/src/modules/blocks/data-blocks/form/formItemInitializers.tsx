import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';
import { gridRowColWrap, useFormItemInitializerFields } from '../../../../schema-initializer/utils';
import { ParentCollectionFields, AssociatedFields } from '../../../../schema-initializer/buttons/FormItemInitializers';

// 表单里配置字段

export const formItemInitializers = new SchemaInitializer({
  name: 'FormItemInitializers',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'displayFields',
      title: '{{t("Display fields")}}',
      useChildren: useFormItemInitializerFields,
    },
    {
      name: 'parentCollectionFields',
      Component: ParentCollectionFields,
    },
    {
      name: 'associationFields',
      Component: AssociatedFields,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'addText',
      title: '{{t("Add text")}}',
      Component: 'MarkdownFormItemInitializer',
    },
  ],
});
