import _ from 'lodash';
import { useFilterOptions } from '../../filter';

interface GetOptionsParams {
  schema: any;
  operator: string;
  /** to cache the result of processed collections */
  cached: Record<string, any[]>;
}

const useOptions = (collectionName: string, { schema, operator, cached }: GetOptionsParams) => {
  if (cached[collectionName]) {
    return _.cloneDeep(cached[collectionName]);
  }

  const result = [];
  cached[collectionName] = result;

  useFilterOptions(collectionName).forEach((option) => {
    if (!option.target) {
      return result.push({
        key: option.name,
        value: option.name,
        label: option.title,
        // TODO: 现在是通过组件的名称来过滤能够被选择的选项，这样的坏处是不够精确，后续可以优化
        disabled: schema?.['x-component'] !== option.schema['x-component'],
      });
    }

    const children =
      useOptions(option.target, {
        schema,
        operator,
        cached,
      }) || [];

    result.push({
      key: option.name,
      value: option.name,
      label: option.title,
      children,
      disabled: children.every((child) => child.disabled),
    });
  });

  return result;
};

export const useUserVariable = ({ schema, operator }) => {
  const options = useOptions('users', { schema, operator, cached: {} });

  return {
    title: `{{t("Current user")}}`,
    value: '$user',
    disabled: options.every((option) => option.disabled),
    options: options,
  };
};
