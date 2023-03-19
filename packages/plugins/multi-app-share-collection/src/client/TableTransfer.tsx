import { css } from '@emotion/css';
import { connect } from '@formily/react';
import { useRecord, useRequest } from '@nocobase/client';
import { Col, Row, Space, Spin, Table, Tag } from 'antd';
import React, { useState } from 'react';

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
      },
    },
    {
      onSuccess(data) {
        setSelected(data.data?.map((data) => data.collectionName));
      },
    },
  );

  const res2 = useRequest({
    url: `collections`,
    params: {
      fields: ['name', 'title', 'category.name', 'category.color'],
      sort: 'sort',
      paginate: false,
    },
  });

  return {
    loading: res1.loading || res2.loading,
    collections: res2.data?.data || [],
    selected,
    setSelected,
  };
};

export const TableTransfer = connect((props) => {
  const { onChange } = props;
  const { loading, collections, selected, setSelected } = useCollections();
  const [selectedRowKeys1, setSelectedRowKeys1] = useState([]);
  const [selectedRowKeys2, setSelectedRowKeys2] = useState([]);
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
          <div>
            <Space>
              <strong>未共享数据表</strong>
              {/* <Input />
              <Select /> */}
            </Space>
          </div>
          <Table
            bordered
            rowKey={'name'}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedRowKeys1,
              onChange(selectedRowKeys) {
                const values = selected.filter((s) => !selectedRowKeys.includes(s));
                setSelected(values);
                onChange(values);
                setSelectedRowKeys1([]);
              },
            }}
            pagination={false}
            size={'small'}
            columns={columns}
            dataSource={collections.filter((collection) => selected.includes(collection.name))}
            scroll={{ y: 'calc(100vh - 260px)' }}
            onRow={({ name, disabled }) => ({
              onClick: () => {
                if (disabled) return;
                const values = selected.filter((s) => s !== name);
                setSelected(values);
                onChange(values);
              },
            })}
          />
        </Col>
        <Col span={12}>
          <Space>
            <strong>已共享数据表</strong>
            {/* <Input />
            <Select /> */}
          </Space>
          <Table
            bordered
            rowKey={'name'}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedRowKeys2,
              onChange(selectedRowKeys) {
                const values = selected.concat(selectedRowKeys);
                setSelected(values);
                onChange(values);
                setSelectedRowKeys2([]);
              },
            }}
            pagination={false}
            size={'small'}
            columns={columns}
            dataSource={collections.filter((collection) => !selected.includes(collection.name))}
            scroll={{ y: 'calc(100vh - 260px)' }}
            onRow={({ name }) => ({
              onClick: () => {
                console.log({ name });
                selected.push(name);
                const values = [...selected];
                setSelected(values);
                onChange(values);
              },
            })}
          />
        </Col>
      </Row>
    </div>
  );
});

export default TableTransfer;
