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
import { SchemaSettingsDateFormat } from '../../../../schema-settings/SchemaSettingsDateFormat';
import { SchemaSettingsDateRange } from '../../../../schema-settings/SchemaSettingsDateRange';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { ellipsisSettingsItem, enableLinkSettingsItem, openModeSettingsItem } from '../Input/inputComponentSettings';

export const datePickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:DatePicker',
  items: [
    {
      name: 'dateDisplayFormat',
      Component: SchemaSettingsDateFormat as any,
      useComponentProps() {
        const schema = useFieldSchema();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const fieldSchema = tableColumnSchema || schema;
        return {
          fieldSchema,
        };
      },
    },
    {
      name: 'dateScopeSelect',
      Component: SchemaSettingsDateRange as any,
      useComponentProps() {
        const schema = useFieldSchema();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const fieldSchema = tableColumnSchema || schema;
        return {
          fieldSchema,
        };
      },
      useVisible() {
        const { fieldSchema: columnSchema } = useColumnSchema();
        const schema = useFieldSchema();
        const fieldSchema = columnSchema || schema;
        return !fieldSchema?.['x-read-pretty'];
      },
    },
    ellipsisSettingsItem,
    enableLinkSettingsItem,
    openModeSettingsItem,
  ],
});

export const rangePickerPickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:DatePicker.RangePicker',
  items: [
    {
      name: 'dateDisplayFormat',
      Component: SchemaSettingsDateFormat as any,
      useComponentProps() {
        const schema = useFieldSchema();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const fieldSchema = tableColumnSchema || schema;
        return {
          fieldSchema,
        };
      },
    },
    ellipsisSettingsItem,
  ],
});
