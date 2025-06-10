/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionDesigner,
  SchemaSettings,
  SchemaSettingsItemType,
  SchemaSettingsLinkageRules,
  useSchemaToolbar,
} from '@nocobase/client';

const schemaSettingsItems: SchemaSettingsItemType[] = [
  {
    name: 'Customize',
    Component: (props): any => {
      return props.children;
    },
    children: [
      {
        name: 'editButton',
        Component: ActionDesigner.ButtonEditor,
        useComponentProps() {
          const { buttonEditorProps } = useSchemaToolbar();
          return buttonEditorProps;
        },
      },
      {
        name: 'linkageRules',
        Component: SchemaSettingsLinkageRules,
        useComponentProps() {
          const { linkageRulesProps } = useSchemaToolbar();
          return {
            ...linkageRulesProps,
          };
        },
      },
      {
        name: 'remove',
        sort: 100,
        Component: ActionDesigner.RemoveButton as any,
        useComponentProps() {
          const { removeButtonProps } = useSchemaToolbar();
          return removeButtonProps;
        },
      },
    ],
  },
];

/**
 * @deprecated
 * 用于兼容之前的 name
 */
const deprecatedPrintActionSettings = new SchemaSettings({
  name: 'ActionSettings:print',
  items: schemaSettingsItems,
});

const printActionSettings = new SchemaSettings({
  name: 'actionSettings:print',
  items: schemaSettingsItems,
});

export { deprecatedPrintActionSettings, printActionSettings };
