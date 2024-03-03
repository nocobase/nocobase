import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';
import { gridRowColWrap, useFilterFormItemInitializerFields } from '../../../../schema-initializer/utils';
import {
  FilterParentCollectionFields,
  FilterAssociatedFields,
} from '../../../../schema-initializer/buttons/FormItemInitializers';

export const filterFormItemInitializers = new SchemaInitializer({
  name: 'FilterFormItemInitializers',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'displayFields',
      title: '{{t("Display fields")}}',
      useChildren: useFilterFormItemInitializerFields,
    },
    {
      name: 'parentCollectionFields',
      Component: FilterParentCollectionFields,
    },
    {
      name: 'associationFields',
      Component: FilterAssociatedFields,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      title: '{{t("Add text")}}',
      Component: 'MarkdownFormItemInitializer',
      name: 'addText',
    },
  ],
});
