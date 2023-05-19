import { connect, mapReadPretty, observer } from '@formily/react';
import { Select, SelectProps, Tag } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../../collection-manager/hooks';
import { useCompile } from '../../hooks';

export type CollectionSelectProps = SelectProps<any, any> & {
  filter?: (item: any, index: number, array: any[]) => boolean;
};

function useOptions({ filter }: CollectionSelectProps) {
  const compile = useCompile();
  const { collections = [] } = useCollectionManager();
  const filtered = typeof filter === 'function' ? collections.filter(filter) : collections;
  return filtered
    .filter((item) => !item.hidden)
    .map((item) => ({
      label: compile(item.title),
      value: item.name,
      color: item.category?.color,
    }));
}

export const CollectionSelect = connect(
  (props: CollectionSelectProps) => {
    const { filter, ...others } = props;
    const options = useOptions(props);
    const { t } = useTranslation();

    return (
      <Select
        placeholder={t('Select collection')}
        {...others}
        showSearch
        filterOption={(input, option) => (option?.label ?? '').includes(input)}
        options={options}
      />
    );
  },
  mapReadPretty(
    observer((props: CollectionSelectProps) => {
      const { mode } = props;
      const compile = useCompile();
      const options = useOptions(props).filter((option) => {
        if (mode === 'multiple') {
          return (props.value ?? []).includes(option.value);
        }
        return props.value === option.value;
      });

      return (
        <div>
          {options.map((option) => (
            <Tag key={option.value} color={option.color}>
              {compile(option.label)}
            </Tag>
          ))}
        </div>
      );
    }),
  ),
);
