import { Input, FormItem } from '@formily/antd';
import { createSchemaField } from '@formily/react';

export const SchemaField = createSchemaField({
  components: {
    Input,
    FormItem,
  },
  scope: {},
});

export default SchemaField;
