import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { SchemaSettingsDateFormat } from '../../../../schema-settings';

export const columnDatePickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:ColumnDatePicker',
  items: [
    {
      name: 'dateDisplayFormat',
      Component: SchemaSettingsDateFormat as any,
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        return {
          fieldSchema,
        };
      },
    },
  ],
});
