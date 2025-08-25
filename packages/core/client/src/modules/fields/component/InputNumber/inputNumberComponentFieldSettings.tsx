/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useIsFieldReadPretty } from '../../../../schema-component/antd/form-item/FormItem.Settings';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { SchemaSettingsNumberFormat } from '../../../../schema-settings/SchemaSettingsNumberFormat';
import { autoFocusSettingsItem, enableLinkSettingsItem, openModeSettingsItem } from '../Input/inputComponentSettings';

export const inputNumberComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:InputNumber',
  items: [
    {
      name: 'displayFormat',
      Component: SchemaSettingsNumberFormat as any,
      useComponentProps() {
        const schema = useFieldSchema();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const fieldSchema = tableColumnSchema || schema;
        return {
          fieldSchema,
        };
      },
      useVisible() {
        const isFieldReadPretty = useIsFieldReadPretty();
        return isFieldReadPretty;
      },
    },
    enableLinkSettingsItem,
    openModeSettingsItem,
    autoFocusSettingsItem,
  ],
});
