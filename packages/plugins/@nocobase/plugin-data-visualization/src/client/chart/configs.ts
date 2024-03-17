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

export type Config =
  | (ConfigProps & {
      property?: string;
    })
  | string;

const selectField = ({ name, title, required, defaultValue }: FieldConfigProps) => {
  return {
    [name || 'field']: {
      title: lang(title || 'Field'),
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
    [name || 'field']: {
      'x-content': lang(title || 'Field'),
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
  xField: (props: FieldConfigProps) => selectField({ name: 'xField', title: 'xField', required: true, ...props }),
  yField: (props: FieldConfigProps) => selectField({ name: 'yField', title: 'yField', required: true, ...props }),
  seriesField: (props: FieldConfigProps) => selectField({ name: 'seriesField', title: 'seriesField', ...props }),
  colorField: (props: FieldConfigProps) => selectField({ name: 'colorField', title: 'colorField', ...props }),
};
