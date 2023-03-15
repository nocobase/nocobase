import { useFilterOptions } from '../../filter';

export const useUserVariable = ({ schema, operator }) => {
  const options = useFilterOptions('users')
    .filter((field) => {
      if (!field.target) {
        return true;
      }
      return field.type === 'belongsTo';
    })
    .map((field) => {
      if (field.children) {
        field.children = field.children.filter((child) => {
          return !child.target;
        });
      }
      return field;
    })
    .map((option) => {
      return {
        key: option.name,
        value: option.name,
        label: option.title,
        // TODO: 现在是通过组件的名称来过滤能够被选择的选项，这样的坏处是不够精确，后续可以优化
        disabled: schema?.['x-component'] !== option.schema['x-component'],
      };
    });

  return {
    title: `{{t("Current user")}}`,
    value: '$user',
    disabled: options.every((option) => option.disabled),
    options: options,
  };
};
