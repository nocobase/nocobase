import { CollectionFieldOptions } from '../../../../collection-manager';
import { useFilterOptions } from '../../filter';

interface Operator {
  label: string;
  value: string;
}

interface GetOptionsParams {
  schema: any;
  operator: Operator;
  maxDepth: number;
  count?: number;
}

const isOperatorSupportMultiRelation = (operator: Operator) => {
  if (!operator) return false;
  return ['$eq', '$ne'].includes(operator.value);
};

const isSingleRelationField = (field: CollectionFieldOptions) => {
  if (!field) return false;
  return field.type === 'belongsTo' || field.type === 'hasOne';
};

export const useOptions = (collectionName: string, { schema, operator, maxDepth, count = 1 }: GetOptionsParams) => {
  if (count > maxDepth) {
    return [];
  }

  const result = useFilterOptions(collectionName).map((option) => {
    if (!option.target) {
      return {
        key: option.name,
        value: option.name,
        label: option.title,
        // TODO: 现在是通过组件的名称来过滤能够被选择的选项，这样的坏处是不够精确，后续可以优化
        disabled: schema?.['x-component'] !== option.schema?.['x-component'],
      };
    }

    const children =
      useOptions(option.target, {
        schema,
        operator,
        maxDepth,
        count: count + 1,
      }) || [];

    return {
      key: option.name,
      value: option.name,
      label: option.title,
      children,
      disabled:
        (!isSingleRelationField(option) && !isOperatorSupportMultiRelation(operator)) ||
        children.every((child) => child.disabled),
    };
  });

  return result;
};

export const useUserVariable = ({ schema, operator }) => {
  const options = useOptions('users', { schema, operator, maxDepth: 3 }) || [];

  return {
    label: `{{t("Current user")}}`,
    value: '$user',
    key: '$user',
    disabled: options.every((option) => option.disabled),
    children: options,
  };
};
