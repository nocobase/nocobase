import { useField, useFieldSchema, useForm } from '@formily/react';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsNumberFormat } from '../../../../schema-settings/SchemaSettingsNumberFormat';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { useIsFieldReadPretty } from '../../../../schema-component/antd/form-item/FormItem.Settings';
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
  ],
});
