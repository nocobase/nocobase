import { lang } from '../../locale';

type ExtendConfigProps = {
  schema: any;
};

type FieldConfigProps = {
  name: string;
  title: string;
  required?: boolean;
  defaultValue?: any;
};

export type ConfigProps = ExtendConfigProps | FieldConfigProps;

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
  xField: (props: FieldConfigProps) => selectField({ name: 'xField', title: 'xField', required: true, ...props }),
  yField: (props: FieldConfigProps) => selectField({ name: 'yField', title: 'yField', required: true, ...props }),
  seriesField: (props: FieldConfigProps) => selectField({ name: 'seriesField', title: 'seriesField', ...props }),
  isStack: (props: FieldConfigProps) => booleanField({ name: 'isStack', title: 'isStack', ...props }),
  smooth: (props: FieldConfigProps) => booleanField({ name: 'smooth', title: 'smooth', ...props }),
  isPercent: (props: FieldConfigProps) => booleanField({ name: 'isPercent', title: 'isPercent', ...props }),
  isGroup: (props: FieldConfigProps) => booleanField({ name: 'isGroup', title: 'isGroup', ...props }),
  extend: ({ schema }: ExtendConfigProps) => schema,
};
