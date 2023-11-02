import React, { useState } from 'react';
import { Space, Table, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DataType } from './interfaces';
import { data } from './displayData';
import CustomDrawer from './components/Drawer/CustomDrawer';
import { observable } from '@formily/reactive';
import { Observer } from '@formily/react';

const columns: ColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (text) => <a>{text}</a>,
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: 'Tags',
    key: 'tags',
    dataIndex: 'tags',
    render: (_, { tags }) => (
      <>
        {tags.map((tag) => {
          let color = tag.length > 5 ? 'geekblue' : 'green';
          if (tag === 'loser') {
            color = 'volcano';
          }
          return (
            <Tag color={color} key={tag}>
              {tag.toUpperCase()}
            </Tag>
          );
        })}
      </>
    ),
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <a>Invite {record.name}</a>
        <a>Delete</a>
      </Space>
    ),
  },
];

const obs = observable({
  value: 'Hello world',
});
const SampleDisplay = () => {
  const [open, setOpen] = useState(false);
  const [showCurl, setShowCurl] = useState(false);
  const onClose = () => {
    setOpen(false);
  };
  console.log('open', open);
  console.log(data);

  return (
    <>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Button type="primary" onClick={() => setOpen(true)}>
          Add record
        </Button>
        <input
          style={{
            height: 28,
            padding: '0 8px',
            border: '2px solid #888',
            borderRadius: 3,
          }}
          onChange={(e) => {
            obs.value = e.target.value;
          }}
        />
        <Button type="primary" onClick={() => setShowCurl(true)}>
          Submit
        </Button>
        {showCurl && <Observer>{() => <div>{obs.value}</div>}</Observer>}
        <Table columns={columns} dataSource={data} />;
      </Space>
      {open && <CustomDrawer onClose={onClose} isOpen={open} />}
    </>
  );
};

export default SampleDisplay;
