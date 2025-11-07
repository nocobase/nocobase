import { FlowModelContext, MultiRecordResource, observer, useFlowContext } from '@nocobase/flow-engine';
import { Button, Flex, Popconfirm, Space, Table } from 'antd';
import React from 'react';
import { FormComponent } from './FormComponent';

export const CrudComponent = observer(() => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource; selectedRowKeys: Array<string> }>();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Flex justify="space-between" align="center">
        <Button>Filter</Button>
        <Space>
          <Popconfirm
            title="Are you sure to delete all selected records?"
            onConfirm={async () => {
              const selectedRowKeys = ctx.selectedRowKeys;
              if (selectedRowKeys && selectedRowKeys.length > 0) {
                console.log('Deleting records with IDs:', selectedRowKeys);
                await ctx.resource.destroy(selectedRowKeys);
                ctx.message.success('Records deleted successfully');
              } else {
                ctx.message.warning('No records selected');
              }
            }}
          >
            <Button>{ctx.t('Delete')}</Button>
          </Popconfirm>
          <Button
            type="primary"
            onClick={() => {
              ctx.viewer.open({
                type: 'drawer',
                width: '50%',
                content: <FormComponent />,
              });
            }}
          >
            Add new
          </Button>
        </Space>
      </Flex>
      <Table<any>
        dataSource={ctx.resource.getData()}
        rowKey={'id'}
        rowSelection={{
          type: 'checkbox',
          onChange: (selectedRowKeys, selectedRows) => {
            ctx.defineProperty('selectedRowKeys', {
              get: () => selectedRowKeys,
            });
            ctx.defineProperty('selectedRows', {
              get: () => selectedRows,
            });
          },
        }}
        columns={[
          { title: 'ID', dataIndex: 'id', key: 'id' },
          { title: 'Name', dataIndex: 'name', key: 'name' },
          // { title: 'Telephone', dataIndex: 'telephone', key: 'telephone' },
          // { title: 'Live', dataIndex: 'live', key: 'live' },
          // { title: 'Remark', dataIndex: 'remark', key: 'remark' },
          { title: 'Address', dataIndex: 'address', key: 'address' },
          {
            title: 'Actions',
            key: 'actions',
            render: (_value, record) => (
              <Space>
                <Button
                  type="link"
                  onClick={() => {
                    ctx.viewer.open({
                      type: 'drawer',
                      width: '50%',
                      content: <FormComponent record={record} />,
                    });
                  }}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Are you sure to delete this record?"
                  onConfirm={async () => {
                    await ctx.resource.destroy(record.id);
                    ctx.message.success('Record deleted successfully');
                  }}
                >
                  <Button type="link">Delete</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={{
          showSizeChanger: true,
          total: ctx.resource.getCount(),
          pageSize: ctx.resource.getPageSize(),
          onChange: (page, pageSize) => {
            ctx.resource.setPage(page);
            ctx.resource.setPageSize(pageSize);
            ctx.resource.refresh();
          },
        }}
      />
    </Space>
  );
});
