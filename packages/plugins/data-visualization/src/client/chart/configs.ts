import { SchemaProperties } from '@formily/react';
import { lang } from '../locale';

export type FieldConfigProps = Partial<{
  name: string;
  title: string;
  required: boolean;
  defaultValue: any;
}>;

export type AnySchemaProperties = SchemaProperties<any, any, any, any, any, any, any, any>;
export type ConfigProps = FieldConfigProps | AnySchemaProperties | (() => AnySchemaProperties);

const selectField = ({ name, title, required, defaultValue }: FieldConfigProps) => {
  return {
    [name]: {
      title: lang(title),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      required,
      default: defaultValue,
    },
  };
};

const booleanField = ({ name, title, defaultValue = false }: FieldConfigProps) => {
  return {
    [name]: {
      'x-content': lang(title),
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      default: defaultValue,
    },
  };
};

export default {
  field: selectField,
  booleanField,
};
