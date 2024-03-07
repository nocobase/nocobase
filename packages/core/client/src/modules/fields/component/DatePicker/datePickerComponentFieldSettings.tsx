import { useFieldSchema } from '@formily/react';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsDateFormat } from '../../../../schema-settings/SchemaSettingsDateFormat';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';

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
  ],
});
