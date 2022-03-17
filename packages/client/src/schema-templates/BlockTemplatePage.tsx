import { Card, PageHeader as AntdPageHeader, Table } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useCompile, useRequest } from '..';

export const BlockTemplatePage = () => {
  const { data, loading } = useRequest({
    resource: 'uiSchemaTemplates',
    action: 'list',
    params: {
      appends: ['collection'],
      sort: ['-createdAt'],
    },
  });
  const compile = useCompile();
  const { t } = useTranslation();
  return (
    <div>
      <AntdPageHeader ghost={false} title={t('Block templates')} />
      <div style={{ margin: 24 }}>
        <Card bordered={false}>
          <Table
            rowSelection={{
              type: 'checkbox',
            }}
            columns={[
              {
                dataIndex: 'name',
                title: t('Template name'),
                render: (value) => <>{value || '未命名'}</>,
              },
              {
                dataIndex: ['collection', 'title'],
                title: t('Collection display name'),
                render: (value) => compile(value),
              },
              {
                dataIndex: 'componentName',
                title: t('Block type'),
                render: (value) => value,
              },
              {
                dataIndex: 'actions',
                title: t('Actions'),
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
