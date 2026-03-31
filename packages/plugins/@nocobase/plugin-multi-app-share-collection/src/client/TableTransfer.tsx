/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect } from '@formily/react';
import { css, useCollectionManager_deprecated, useRecord, useRequest, useToken } from '@nocobase/client';
import { CollectionsGraph, lodash } from '@nocobase/utils/client';
import { App, Col, Input, Row, Select, Spin, Table, Tag } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const excludeCollections = ['users', 'roles', 'applications'];

const useCollectionsGraph = ({ removed = [] }) => {
  const { collections } = useCollectionManager_deprecated();

  const findAddable = useCallback(
    (name) => {
      return CollectionsGraph.connectedNodes({
        collections,
        nodes: [name],
        excludes: excludeCollections,
      }).filter((name) => removed.includes(name));
    },
    [removed],
  );

  const findRemovable = useCallback(
    (name) => {
      return CollectionsGraph.connectedNodes({
        collections,
        nodes: [name],
        excludes: excludeCollections,
        direction: 'reverse',
      }).filter((name) => !removed.includes(name));
    },
    [removed],
  );

  return {
    findAddable,
    findRemovable,
  };
};

const useCollections = () => {
  const record = useRecord();
  const [selected, setSelected] = useState<any>([]);

  const res1 = useRequest(
    {
      url: `applications/${record.name}/collectionBlacklist:list`,
      params: {
        paginate: false,
        params: {
          fields: ['name'],
        },
      },
    },
    {
      onSuccess(data) {
        setSelected(data.data?.map((data) => data.name));
      },
    },
  );

  const res2 = useRequest<{
    data: any[];
  }>({
    url: `collections`,
    params: {
      fields: ['name', 'title', 'hidden', 'category.name', 'category.color', 'category.sort'],
      sort: 'sort',
      paginate: false,
    },
  });

  const res3 = useRequest<{
    data: any[];
  }>({
    url: `collectionCategories`,
    params: {
      sort: 'sort',
      paginate: false,
    },
  });

  return {
    loading: res1.loading || res2.loading || res3.loading,
    collections: (res2.data?.data || []).filter((item) => !item.hidden && !excludeCollections.includes(item.name)),
    removed: selected,
    setSelected,
    categories: (res3.data?.data || []).map((cat) => ({ label: cat.name, value: cat.name })),
  };
};

const includes = (text: string, s: string | string[]) => {
  const values = Array.isArray(s) ? s : [s];
  for (const val of values) {
    if (text.toLowerCase().includes(val)) {
      return true;
    }
  }
  return false;
};

const useRemovedDataSource = ({ collections, removed }) => {
  const [filter, setFilter] = useState({ name: '', category: [] });
  const dataSource = useMemo(() => {
    return collections.filter((collection) => {
      const { name, title, category = [] } = collection;
      const results = [removed.includes(collection.name)];
      if (filter.name) {
        results.push(includes(name, filter.name) || includes(title, filter.name));
      }
      if (filter.category.length > 0) {
        results.push(category.some((item) => includes(item.name, filter.category)));
      }
      return !results.includes(false);
    });
  }, [collections, removed, filter]);
  const setNameFilter = useMemo(
    () =>
      lodash.debounce((name) => {
        setFilter({
          ...filter,
          name,
        });
      }, 300),
    [],
  );
  return {
    dataSource,
    setNameFilter,
    setCategoryFilter: (category) => {
      setFilter({
        ...filter,
        category,
      });
    },
  };
};

const useAddedDataSource = ({ collections, removed }) => {
  const [filter, setFilter] = useState({ name: '', category: [] });
  const dataSource = collections.filter((collection) => {
    const { name, title, category = [] } = collection;
    const results = [!removed.includes(collection.name)];
    if (filter.name) {
      results.push(includes(name, filter.name) || includes(title, filter.name));
    }
    if (filter.category.length > 0) {
      results.push(category.some((item) => includes(item.name, filter.category)));
    }
    return !results.includes(false);
  });
  const setNameFilter = useMemo(
    () =>
      lodash.debounce((name) => {
        setFilter({
          ...filter,
          name,
        });
      }, 300),
    [],
  );
  return {
    dataSource,
    setNameFilter,
    setCategoryFilter: (category) => {
      setFilter({
        ...filter,
        category,
      });
    },
  };
};

export const TableTransfer = connect((props) => {
  const { onChange } = props;
  const { loading, collections, categories, removed, setSelected } = useCollections();
  const [selectedRowKeys1, setSelectedRowKeys1] = useState([]);
  const [selectedRowKeys2, setSelectedRowKeys2] = useState([]);
  const { findAddable, findRemovable } = useCollectionsGraph({ removed });
  const addedDataSource = useAddedDataSource({ collections, removed });
  const removedDataSource = useRemovedDataSource({ collections, removed });
  const { t } = useTranslation('multi-app-share-collection');
  const { modal } = App.useApp();
  const { token } = useToken();
  const columns = useMemo(
    () => [
      {
        title: t('Collection display name'),
        dataIndex: 'title',
      },
      {
        title: t('Collection name'),
        dataIndex: 'name',
      },
      {
        title: t('Collection category'),
        dataIndex: 'category',
        render: (categories) =>
          categories.map((category) => (
            <Tag key={category.name} color={category.color}>
              {category.name}
            </Tag>
          )),
      },
    ],
    [],
  );
  if (loading) {
    return <Spin />;
  }
  return (
    <div>
      <Row
        gutter={24}
        className={css`
          .ant-table-tbody > tr.ant-table-row:hover > td {
            background: #e6f7ff;
            cursor: pointer;
          }
        `}
      >
        <Col span={12}>
          <div
            className={css`
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 100%;
              margin-bottom: 8px;
            `}
          >
            <strong style={{ fontSize: token.fontSizeLG, color: token.colorText }}>{t('Unshared collections')}</strong>
            <Input.Group compact style={{ width: 360 }}>
              <Select
                popupMatchSelectWidth={false}
                onChange={(value) => {
                  removedDataSource.setCategoryFilter(value);
                }}
                mode={'multiple'}
                style={{ width: '35%' }}
                size={'middle'}
                placeholder={t('All categories')}
                options={categories}
                allowClear
              />
              <Input
                onChange={(e) => removedDataSource.setNameFilter(e.target.value)}
                style={{ width: '65%' }}
                placeholder={t('Enter name or title...')}
                allowClear
              />
            </Input.Group>
          </div>
          <Table
            bordered
            rowKey={'name'}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedRowKeys1,
              onChange(selectedRowKeys) {
                const values = removed.filter((s) => !selectedRowKeys.includes(s));
                setSelected(values);
                onChange(values);
                setSelectedRowKeys1([]);
              },
            }}
            pagination={false}
            size={'small'}
            columns={columns}
            // dataSource={collections.filter((collection) => removed.includes(collection.name))}
            dataSource={removedDataSource.dataSource}
            scroll={{ y: 'calc(100vh - 260px)' }}
            onRow={({ name, disabled }: any) => ({
              onClick: () => {
                if (disabled) return;
                const adding = findAddable(name);
                const change = () => {
                  const values = removed.filter((s) => !adding.includes(s));
                  setSelected(values);
                  onChange(values);
                };
                if (adding.length === 1) {
                  return change();
                }
                modal.confirm({
                  title: t('Are you sure to add the following collections?'),
                  width: '60%',
                  content: (
                    <div>
                      <Table
                        size={'small'}
                        columns={columns}
                        dataSource={collections.filter((collection) => adding.includes(collection.name))}
                        pagination={false}
                        scroll={{ y: '60vh' }}
                      />
                    </div>
                  ),
                  onOk() {
                    change();
                  },
                });
              },
            })}
          />
        </Col>
        <Col span={12}>
          <div
            className={css`
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 100%;
              margin-bottom: 8px;
            `}
          >
            <strong style={{ fontSize: token.fontSizeLG, color: token.colorText }}>{t('Shared collections')}</strong>
            <Input.Group compact style={{ width: 360 }}>
              <Select
                popupMatchSelectWidth={false}
                onChange={(value) => {
                  addedDataSource.setCategoryFilter(value);
                }}
                mode={'multiple'}
                style={{ width: '35%' }}
                size={'middle'}
                placeholder={t('All categories')}
                options={categories}
                allowClear
              />
              <Input
                onChange={(e) => addedDataSource.setNameFilter(e.target.value)}
                style={{ width: '65%' }}
                placeholder={t('Enter name or title...')}
                allowClear
              />
            </Input.Group>
          </div>
          <Table
            bordered
            rowKey={'name'}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedRowKeys2,
              onChange(selectedRowKeys) {
                const values = lodash.uniq(removed.concat(selectedRowKeys));
                setSelected(values);
                onChange(values);
                setSelectedRowKeys2([]);
              },
            }}
            pagination={false}
            size={'small'}
            columns={columns}
            dataSource={addedDataSource.dataSource}
            // dataSource={collections.filter((collection) => !selected.includes(collection.name))}
            scroll={{ y: 'calc(100vh - 260px)' }}
            onRow={({ name }: { name: string }) => ({
              onClick: () => {
                const removing = findRemovable(name);
                const change = () => {
                  removed.push(...removing);
                  const values = lodash.uniq([...removed]);
                  setSelected(values);
                  onChange(values);
                };
                if (removing.length === 1) {
                  return change();
                }
                modal.confirm({
                  title: t('Are you sure to remove the following collections?'),
                  width: '60%',
                  content: (
                    <div>
                      <Table
                        size={'small'}
                        columns={columns}
                        dataSource={collections.filter((collection) => removing.includes(collection.name))}
                        pagination={false}
                        scroll={{ y: '60vh' }}
                      />
                    </div>
                  ),
                  onOk() {
                    change();
                  },
                });
              },
            })}
          />
        </Col>
      </Row>
    </div>
  );
});

export default TableTransfer;
