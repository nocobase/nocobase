import { useFieldSchema } from '@formily/react';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsDateFormat } from '../../../../schema-settings/SchemaSettingsDateFormat';

export const datePickerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:DatePicker',
  items: [
    {
      name: 'dateDisplayFormat',
      Component: SchemaSettingsDateFormat as any,
      useComponentProps() {
        const fieldSchema = useFieldSchema();
        return {
          fieldSchema,
        };
      },
    },
  ],
});
