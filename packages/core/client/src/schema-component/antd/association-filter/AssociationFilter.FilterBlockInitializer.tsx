import { SchemaInitializer } from '../../../application/schema-initializer/SchemaInitializer';
import { useOptionalFieldList } from '../../../block-provider/hooks';
import { useCollectionManager } from '../../../data-source';
import { useAssociatedFields } from '../../../filter-provider/utils';

export const associationFilterFilterBlockInitializer = new SchemaInitializer({
  name: 'AssociationFilter.FilterBlockInitializer',
  style: { marginTop: 16 },
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'associationFields',
      title: '{{t("Association fields")}}',
      useChildren() {
        const cm = useCollectionManager();
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
                label: cm.getCollection(field.target)?.getPrimaryKey() || 'id',
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
      name: 'choicesFields',
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
