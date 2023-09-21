import config, { FieldConfigProps } from '../configs';
const { field, booleanField } = config;

export default {
  xField: (props: FieldConfigProps) => field({ name: 'xField', title: 'xField', required: true, ...props }),
  yField: (props: FieldConfigProps) => field({ name: 'yField', title: 'yField', required: true, ...props }),
  seriesField: (props: FieldConfigProps) => field({ name: 'seriesField', title: 'seriesField', ...props }),
  isStack: (props: FieldConfigProps) => booleanField({ name: 'isStack', title: 'isStack', ...props }),
  smooth: (props: FieldConfigProps) => booleanField({ name: 'smooth', title: 'smooth', ...props }),
  isPercent: (props: FieldConfigProps) => booleanField({ name: 'isPercent', title: 'isPercent', ...props }),
  isGroup: (props: FieldConfigProps) => booleanField({ name: 'isGroup', title: 'isGroup', ...props }),
};
