import { useFilterOptions } from '../../filter';

export const useUserVariable = () => {
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
    });

  return {
    title: `{{t("Current user")}}`,
    value: '$user',
    options: options.map((option) => {
      return {
        key: option.name,
        value: option.name,
        label: option.title,
      };
    }),
  };
};
