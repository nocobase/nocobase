import { css } from '@emotion/css';
import { Card, PageHeader as AntdPageHeader, Table } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import { useRequest } from '..';
import { AddBlockTemplate } from './AddBlockTemplate';

export const BlockTemplatePage = () => {
  const { data, loading } = useRequest({
    resource: 'uiSchemaTemplates',
    action: 'list',
  });
  return (
    <div>
      <AntdPageHeader ghost={false} title={'Block templates'} />
      <div style={{ margin: 24 }}>
        <Card bordered={false}>
          <div
            className={css`
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 100%;
              margin-bottom: 16px;
            `}
          >
            <div></div>
            <AddBlockTemplate />
          </div>
          <Table
            rowSelection={{
              type: 'checkbox',
            }}
            columns={[
              {
                dataIndex: 'name',
                title: 'Template name',
                render: (value) => <>{value || '未命名'}</>,
              },
              {
                dataIndex: 'actions',
                title: 'Actions',
                render: (_, record) => <Link to={`/admin/block-templates/${record.key}`}>查看</Link>,
              },
            ]}
            loading={loading}
            dataSource={data?.data}
          />
        </Card>
      </div>
    </div>
  );
};
