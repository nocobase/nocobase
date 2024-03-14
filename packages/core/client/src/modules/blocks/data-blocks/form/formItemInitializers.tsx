import { gridRowColWrap, useFormItemInitializerFields } from '../../../../schema-initializer/utils';
import { ParentCollectionFields, AssociatedFields } from '../../../../schema-initializer/buttons/FormItemInitializers';
import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';

/**
 * @deprecated
 * 表单里配置字段
 */
export const formItemInitializers_deprecated = new CompatibleSchemaInitializer({
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

export const formItemInitializers = new CompatibleSchemaInitializer(
  {
    name: 'form:configureFields',
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
  },
  formItemInitializers_deprecated,
);
