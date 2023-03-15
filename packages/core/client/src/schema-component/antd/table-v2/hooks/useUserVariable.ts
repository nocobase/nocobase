import { useFilterOptions } from '../../filter';

export const useUserVariable = ({ collectionField, operator }) => {
  if (!collectionField || !operator) return null;

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
        disabled: collectionField.name !== option.name || operator.value === '$dateBetween',
      };
    });

  return {
    title: `{{t("Current user")}}`,
    value: '$user',
    disabled: options.every((option) => option.disabled),
    options: options,
  };
};
