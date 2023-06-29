import { connect, mapReadPretty, observer } from '@formily/react';
import { Select, SelectProps, Tag } from 'antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelfAndChildrenCollections } from '../../../collection-manager/action-hooks';
import { useCollection, useCollectionManager } from '../../../collection-manager/hooks';
import { useCompile } from '../../hooks';
import { FilterContext } from '../filter/context';

export type CollectionSelectProps = SelectProps<any, any> & {
  filter?: (item: any, index: number, array: any[]) => boolean;
  isTableOid?: boolean;
};

function useOptions({ filter, isTableOid }: CollectionSelectProps) {
  const compile = useCompile();
  const ctx = useContext(FilterContext);
  const collection = useCollection();
  const targetCollection = isTableOid && (ctx?.collectionField?.target || collection.name);
  const inheritCollections = useSelfAndChildrenCollections(targetCollection);
  const { collections = [] } = useCollectionManager();
  const filtered =
    typeof filter === 'function'
      ? (inheritCollections || collections).filter(filter)
      : inheritCollections || collections;
  return filtered
    .filter((item) => !item.hidden)
    .map((item) => ({
      label: compile(item.title || item.label),
      value: item.name || item.value,
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
        dropdownMatchSelectWidth={false}
        {...others}
        showSearch
        filterOption={(input, option) => (option?.label ?? '').includes(input)}
        options={options}
      />
    );
  },
  mapReadPretty(
    observer(
      (props: CollectionSelectProps) => {
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
      },
      { displayName: 'CollectionSelectObserver' },
    ),
  ),
);
