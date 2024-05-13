/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer } from '../../../application/schema-initializer/SchemaInitializer';
import { SchemaInitializerItemType } from '../../../application/schema-initializer/types';
import { useAssociatedFields } from '../../../filter-provider/utils';

/**
 * @deprecated
 */
export const associationFilterInitializer = new SchemaInitializer({
  name: 'AssociationFilter.Initializer',
  style: {
    marginTop: 16,
  },
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      name: 'associationFields',
      type: 'itemGroup',
      title: '{{t("Association fields")}}',
      useChildren() {
        const associatedFields = useAssociatedFields();
        const children: SchemaInitializerItemType[] = associatedFields.map((field) => ({
          type: 'item',
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
            'x-use-component-props': 'useAssociationFilterProps',
            'x-component-props': {
              fieldNames: {
                label: field.targetKey || 'id',
              },
            },
            properties: {},
          },
        }));

        return children;
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      title: '{{t("Delete")}}',
      Component: 'AssociationFilterDesignerDelete',
    },
  ],
});
