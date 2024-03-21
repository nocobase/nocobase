import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';
import { useOptionalFieldList } from '../../../../block-provider/hooks';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { useAssociatedFields } from '../../../../filter-provider/utils';

/**
 * @deprecated
 */
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
            // 'x-designer': 'AssociationFilter.Item.Designer',
            'x-toolbar': 'CollapseItemSchemaToolbar',
            'x-settings': 'fieldSettings:FilterCollapseItem',
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
      name: 'choicesFields',
      type: 'itemGroup',
      title: '{{t("Choices fields")}}',
      hideIfNoChildren: true,
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
            // 'x-designer': 'AssociationFilter.Item.Designer',
            'x-toolbar': 'CollapseItemSchemaToolbar',
            'x-settings': 'fieldSettings:FilterCollapseItem',
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

/**
 * @deprecated
 */
export const filterCollapseItemInitializer_deprecated = new CompatibleSchemaInitializer({
  name: 'AssociationFilterInitializers',
  style: { marginTop: 16 },
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'associationFields',
      title: '{{t("Association fields")}}',
      useChildren() {
        const associatedFields = useAssociatedFields();
        const useProps = '{{useAssociationFilterBlockProps}}';
        const cm = useCollectionManager_deprecated();
        const children = associatedFields.map((field) => ({
          name: field.key,
          title: field.uiSchema?.title,
          Component: 'AssociationFilterDesignerDisplayField',
          schema: {
            name: field.name,
            title: field.uiSchema?.title,
            type: 'void',
            // 'x-designer': 'AssociationFilter.Item.Designer',
            'x-toolbar': 'CollapseItemSchemaToolbar',
            'x-settings': 'fieldSettings:FilterCollapseItem',
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
      hideIfNoChildren: true,
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
            // 'x-designer': 'AssociationFilter.Item.Designer',
            'x-toolbar': 'CollapseItemSchemaToolbar',
            'x-settings': 'fieldSettings:FilterCollapseItem',
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

export const filterCollapseItemInitializer = new CompatibleSchemaInitializer(
  {
    name: 'filterCollapse:configureFields',
    style: { marginTop: 16 },
    icon: 'SettingOutlined',
    title: '{{t("Configure fields")}}',
    items: [
      {
        type: 'itemGroup',
        name: 'associationFields',
        title: '{{t("Association fields")}}',
        useChildren() {
          const associatedFields = useAssociatedFields();
          const useProps = '{{useAssociationFilterBlockProps}}';
          const cm = useCollectionManager_deprecated();
          const children = associatedFields.map((field) => ({
            name: field.key,
            title: field.uiSchema?.title,
            Component: 'AssociationFilterDesignerDisplayField',
            schema: {
              name: field.name,
              title: field.uiSchema?.title,
              type: 'void',
              // 'x-designer': 'AssociationFilter.Item.Designer',
              'x-toolbar': 'CollapseItemSchemaToolbar',
              'x-settings': 'fieldSettings:FilterCollapseItem',
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
        hideIfNoChildren: true,
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
              // 'x-designer': 'AssociationFilter.Item.Designer',
              'x-toolbar': 'CollapseItemSchemaToolbar',
              'x-settings': 'fieldSettings:FilterCollapseItem',
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
  },
  filterCollapseItemInitializer_deprecated,
);
