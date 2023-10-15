import config, { FieldConfigProps } from '../configs';
const { booleanField } = config;

export default {
  isStack: (props: FieldConfigProps) => booleanField({ name: 'isStack', title: 'isStack', ...props }),
  smooth: (props: FieldConfigProps) => booleanField({ name: 'smooth', title: 'smooth', ...props }),
  isPercent: (props: FieldConfigProps) => booleanField({ name: 'isPercent', title: 'isPercent', ...props }),
  isGroup: (props: FieldConfigProps) => booleanField({ name: 'isGroup', title: 'isGroup', ...props }),
};
