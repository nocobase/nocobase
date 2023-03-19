import { css } from '@emotion/css';
import { connect } from '@formily/react';
import { useCollectionManager, useRecord, useRequest } from '@nocobase/client';
import { CollectionsGraph } from '@nocobase/utils/client';
import { Col, Input, Modal, Row, Select, Spin, Table, Tag } from 'antd';
import uniq from 'lodash/uniq';
import React, { useCallback, useState } from 'react';

const excludeCollections = ['users', 'roles', 'applications'];

const useCollectionsGraph = ({ removed = [] }) => {
  const { collections } = useCollectionManager();

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

const columns = [
  {
    title: '标题',
    dataIndex: 'title',
  },
  {
    title: '标识',
    dataIndex: 'name',
  },
  {
    title: '分类',
    dataIndex: 'category',
    render: (categories) => categories.map((category) => <Tag color={category.color}>{category.name}</Tag>),
  },
];

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

  const res2 = useRequest({
    url: `collections`,
    params: {
      fields: ['name', 'title', 'hidden', 'category.name', 'category.color', 'category.sort'],
      sort: 'sort',
      paginate: false,
    },
  });

  return {
    loading: res1.loading || res2.loading,
    collections: (res2.data?.data || []).filter((item) => !item.hidden && !excludeCollections.includes(item.name)),
    removed: selected,
    setSelected,
  };
};

export const TableTransfer = connect((props) => {
  const { onChange } = props;
  const { loading, collections, removed, setSelected } = useCollections();
  const [selectedRowKeys1, setSelectedRowKeys1] = useState([]);
  const [selectedRowKeys2, setSelectedRowKeys2] = useState([]);
  const { findAddable, findRemovable } = useCollectionsGraph({ removed });
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
            <strong style={{ fontSize: 16 }}>未共享数据表</strong>
            <Input.Group compact style={{ width: 360 }}>
              <Select
                style={{ width: '35%' }}
                size={'middle'}
                defaultValue={'*'}
                options={[{ label: '全部分类', value: '*' }]}
              />
              <Input.Search style={{ width: '65%' }} placeholder="input search text" onSearch={() => {}} />
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
            dataSource={collections.filter((collection) => removed.includes(collection.name))}
            scroll={{ y: 'calc(100vh - 260px)' }}
            onRow={({ name, disabled }) => ({
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
                Modal.confirm({
                  title: '请确定需要添加以下数据表',
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
            <strong style={{ fontSize: 16 }}>已共享数据表</strong>
            <Input.Group compact style={{ width: 360 }}>
              <Select
                style={{ width: '35%' }}
                size={'middle'}
                defaultValue={'*'}
                options={[{ label: '全部分类', value: '*' }]}
              />
              <Input.Search style={{ width: '65%' }} placeholder="input search text" onSearch={() => {}} />
            </Input.Group>
          </div>
          <Table
            bordered
            rowKey={'name'}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedRowKeys2,
              onChange(selectedRowKeys) {
                const values = uniq(removed.concat(selectedRowKeys));
                setSelected(values);
                onChange(values);
                setSelectedRowKeys2([]);
              },
            }}
            pagination={false}
            size={'small'}
            columns={columns}
            dataSource={collections.filter((collection) => {
              const includes = (text: string, s: string) => {
                return text.toLowerCase().includes(s);
              };
              const { name, title, category = [] } = collection;
              const results = [!removed.includes(collection.name)];
              const filter1 = {
                name: '',
                category: '',
              };
              if (filter1.name) {
                results.push(includes(name, filter1.name) || includes(title, filter1.name));
              }
              if (filter1.category) {
                results.push(category.some((item) => includes(item.name, filter1.category)));
              }
              return !results.includes(false);
            })}
            // dataSource={collections.filter((collection) => !selected.includes(collection.name))}
            scroll={{ y: 'calc(100vh - 260px)' }}
            onRow={({ name }) => ({
              onClick: () => {
                const removing = findRemovable(name);
                const change = () => {
                  removed.push(...removing);
                  const values = uniq([...removed]);
                  setSelected(values);
                  onChange(values);
                };
                if (removing.length === 1) {
                  return change();
                }
                Modal.confirm({
                  title: '请确定需要移除以下数据表',
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
