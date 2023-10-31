import { SchemaInitializer } from '../../../application/schema-initializer';
import { useOptionalFieldList } from '../../../block-provider/hooks';
import { useAssociatedFields } from '../../../filter-provider/utils';

export const associationFilterFilterBlockInitializer = new SchemaInitializer({
  name: 'AssociationFilter.FilterBlockInitializer',
  style: { marginTop: 16 },
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'association-fields',
      title: '{{t("Association fields")}}',
      useChildren() {
        const associatedFields = useAssociatedFields();
        const useProps = '{{useAssociationFilterBlockProps}}';
        const children = associatedFields.map((field) => ({
          name: field.key,
          title: field.uiSchema?.title,
          Component: 'AssociationFilterDesignerDisplayField',
          schema: {
            name: field.name,
            title: field.uiSchema?.title,
            type: 'void',
            'x-designer': 'AssociationFilter.Item.Designer',
            'x-component': 'AssociationFilter.Item',
            'x-component-props': {
              fieldNames: {
                label: field.targetKey || 'id',
              },
              useProps,
            },
            properties: {},
          },
        }));
        return children;
      },
    },
    {
      type: 'itemGroup',
      title: '{{t("Choices fields")}}',
      checkChildrenLength: true,
      useChildren() {
        const optionalList = useOptionalFieldList();
        const useProps = '{{useAssociationFilterBlockProps}}';
        const optionalChildren = optionalList.map((field) => ({
          name: field.key,
          title: field.uiSchema.title,
          Component: 'AssociationFilterDesignerDisplayField',
          schema: {
            name: field.name,
            title: field.uiSchema.title,
            interface: field.interface,
            type: 'void',
            'x-designer': 'AssociationFilter.Item.Designer',
            'x-component': 'AssociationFilter.Item',
            'x-component-props': {
              fieldNames: {
                label: field.name,
              },
              useProps,
            },
            properties: {},
          },
        }));

        return optionalChildren;
      },
    },
  ],
});
