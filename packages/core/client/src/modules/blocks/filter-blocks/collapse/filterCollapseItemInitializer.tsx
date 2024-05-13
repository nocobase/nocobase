/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';
import { useOptionalFieldList } from '../../../../block-provider/hooks';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { useAssociatedFields } from '../../../../filter-provider/utils';

const commonOptions: any = {
  style: { marginTop: 16 },
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'associationFields',
      title: '{{t("Association fields")}}',
      useChildren() {
        const cm = useCollectionManager_deprecated();
        const associatedFields = useAssociatedFields();
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
            'x-use-component-props': 'useAssociationFilterBlockProps',
            'x-component-props': {
              fieldNames: {
                label: field.targetKey || cm.getCollection(field.target)?.getPrimaryKey() || 'id',
              },
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
            'x-use-component-props': 'useAssociationFilterBlockProps',
            'x-component-props': {
              fieldNames: {
                label: field.name,
              },
            },
            properties: {},
          },
        }));

        return optionalChildren;
      },
    },
  ],
};

/**
 * @deprecated
 */
export const associationFilterFilterBlockInitializer = new SchemaInitializer({
  name: 'AssociationFilter.FilterBlockInitializer',
  ...commonOptions,
});

/**
 * @deprecated
 * use `filterCollapseItemInitializer` instead
 */
export const filterCollapseItemInitializer_deprecated = new CompatibleSchemaInitializer({
  name: 'AssociationFilterInitializers',
  ...commonOptions,
});

export const filterCollapseItemInitializer = new CompatibleSchemaInitializer(
  {
    name: 'filterCollapse:configureFields',
    ...commonOptions,
  },
  filterCollapseItemInitializer_deprecated,
);
