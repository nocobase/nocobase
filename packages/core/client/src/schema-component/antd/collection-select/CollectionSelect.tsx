import { connect, mapReadPretty, observer, useField } from '@formily/react';
import { Cascader, Select, SelectProps, Tag } from 'antd';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelfAndChildrenCollections } from '../../../collection-manager/action-hooks';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager/hooks';
import { useCompile } from '../../hooks';
import { FilterContext } from '../filter/context';
import { useDataSourceManager } from '../../../data-source';
import { parseCollectionName } from '../../../collection-manager';

export type CollectionSelectProps = SelectProps<any, any> & {
  filter?: (item: any, index: number, array: any[]) => boolean;
  isTableOid?: boolean;
};

function useCollectionOptions({ filter, isTableOid }: CollectionSelectProps) {
  const compile = useCompile();
  const field: any = useField();
  const ctx: any = useContext(FilterContext);
  const collection = useCollection_deprecated();
  const targetCollection = isTableOid && (ctx?.field?.collectionName || ctx?.collectionName || collection.name);
  const inheritCollections = useSelfAndChildrenCollections(targetCollection);
  const { collections = [] } = useCollectionManager_deprecated();
  const currentCollections = field?.dataSource
    ? collections.filter((v) => {
        return field?.dataSource.find((i) => i.value === v.name) || field?.dataSource.includes(v.name);
      })
    : collections;
  const filtered =
    typeof filter === 'function'
      ? ((inheritCollections || currentCollections) as any[]).filter(filter)
      : inheritCollections || currentCollections;
  return useMemo(
    () =>
      filtered
        .filter((item) => !item.hidden)
        .map((item) => ({
          label: compile(item.title || item.label),
          value: item.name || item.value,
          color: item.category?.color,
        })),
    [filtered],
  );
}

export const CollectionSelect = connect(
  (props: CollectionSelectProps) => {
    const { filter, ...others } = props;
    const options = useCollectionOptions(props);
    const { t } = useTranslation();
    const optionFilter = useCallback(
      (input, option) =>
        (option?.label.toLowerCase() ?? '').includes(input.toLocaleLowerCase()) ||
        (option?.value.toString().toLowerCase() ?? '').includes(input.toLocaleLowerCase()),
      [],
    );
    return (
      <Select
        // @ts-ignore
        role="button"
        data-testid="select-collection"
        placeholder={t('Select collection')}
        popupMatchSelectWidth={false}
        {...others}
        showSearch
        filterOption={optionFilter}
        options={options}
      />
    );
  },
  mapReadPretty(
    observer(
      (props: CollectionSelectProps) => {
        const { mode } = props;
        const compile = useCompile();
        const options = useCollectionOptions(props).filter((option) => {
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

export type DataSourceSelectProps = SelectProps<any, any> & {
  filter?: (item: any, index: number, array: any[]) => boolean;
};

function useDataSourceOptions({ filter }: DataSourceSelectProps) {
  const compile = useCompile();
  const dataSourceManager = useDataSourceManager();
  const dataSources = dataSourceManager.getDataSources();
  return useMemo(
    () => [
      {
        label: compile('Main'),
        value: 'main',
      },
      ...(typeof filter === 'function' ? dataSources.filter(filter) : dataSources).map((item) => ({
        label: item.displayName,
        value: item.key,
      })),
    ],
    [dataSources, filter],
  );
}

export const DataSourceSelect = connect((props: DataSourceSelectProps) => {
  const { filter, ...others } = props;
  const options = useDataSourceOptions(props);
  const { t } = useTranslation();
  const optionFilter = useCallback(
    (input, option) =>
      (option?.label.toLowerCase() ?? '').includes(input.toLocaleLowerCase()) ||
      (option?.value.toString().toLowerCase() ?? '').includes(input.toLocaleLowerCase()),
    [],
  );
  return (
    <Select
      // @ts-ignore
      role="button"
      data-testid="select-datasource"
      placeholder={t('Select data source')}
      popupMatchSelectWidth={false}
      {...others}
      showSearch
      filterOption={optionFilter}
      options={options}
    />
  );
});

export const DataSourceCollectionCascader = connect((props) => {
  const dataSourceManager = useDataSourceManager();
  const compile = useCompile();
  const { value, onChange, dataSourceFilter, collectionFilter, ...others } = props;
  const [dataSourceName, collectionName] = parseCollectionName(value);
  const path = [dataSourceName, collectionName].filter(Boolean);
  const dataSources = dataSourceManager.getDataSources();

  const options = useMemo(() => {
    return (dataSourceFilter ? dataSources.filter(dataSourceFilter) : dataSources).map((dataSource) => {
      return {
        label: compile(dataSource.displayName),
        value: dataSource.key,
        children: dataSource.collectionManager.collectionInstancesArr
          .filter(collectionFilter ?? ((collection) => !collection.hidden))
          .map((collection) => {
            return {
              label: compile(collection.title),
              value: collection.name,
            };
          }),
      };
    });
  }, [dataSources, dataSourceFilter, collectionFilter]);

  const handleChange = useCallback(
    (value) => {
      if (!value) {
        return onChange(value);
      }
      onChange(value[0] === 'main' ? value[1] : value.join(':'));
    },
    [onChange],
  );
  return <Cascader showSearch {...others} options={options} value={path} onChange={handleChange} />;
});
