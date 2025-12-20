/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tabs, Tooltip, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { CollectionField, FlowModelContext, MultiRecordResource, useFlowContext } from '@nocobase/flow-engine';
import { useCollectionContext } from '../../context';
import { dayjs } from '@nocobase/utils/client';
import { useCompile } from '@nocobase/client';

const { Text, Paragraph } = Typography;

export const Preview: React.FC<{
  formData: Record<string, any>;
  show: boolean;
}> = ({ formData, show }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
  const currentCollection = useCollectionContext();
  const title = `${ctx.t('Collection')}: ${currentCollection.displayName}`;
  const { loading, collectionFields, datasource, refresh } = usePreview(formData);

  useEffect(() => {
    if (show) {
      refresh();
    }
  }, [show, refresh]);

  const items = [
    {
      key: 'Tab-0',
      label: ctx.t('Table'),
      children: (
        <PreviewTable
          title={title}
          loading={loading}
          collectionFields={collectionFields}
          datasource={datasource}
          onRefresh={refresh}
        />
      ),
    },
    {
      key: 'Tab-1',
      label: 'JSON',
      children: <PreviewJSON title={title} loading={loading} datasource={datasource} />,
    },
  ];

  return (
    show && (
      <div style={{ padding: '16px' }}>
        <Tabs type="card" tabBarStyle={{ marginBottom: 0 }} defaultActiveKey="1" items={items} />
      </div>
    )
  );
};

const usePreview = (formData: Record<string, any>) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
  const [loading, setLoading] = useState(false);
  const [collectionFields, setCollectionFields] = useState<CollectionField[]>([]);
  const [datasource, setDatasource] = useState<any>([]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await ctx.api.resource('aiContextDatasources').preview({ values: formData });
      const { options, records } = data?.data ?? {};
      if (options) {
        const { datasource, collectionName, fields } = options;
        const collection = ctx.dataSourceManager.getCollection(datasource, collectionName);
        const collectionFields = collection.getFields().filter((f) => fields.includes(f.name));
        setCollectionFields(collectionFields);
      }
      if (records) {
        const datasource = records.map((x) =>
          x.reduce((acc, cur) => {
            acc[cur.name] = cur.value;
            return acc;
          }, {}),
        );
        setDatasource(datasource);
      }
    } finally {
      setLoading(false);
    }
  }, [ctx, formData]);

  return {
    loading,
    collectionFields,
    datasource,
    refresh,
  };
};

const PreviewTable: React.FC<{
  title: string;
  loading: boolean;
  collectionFields: CollectionField[];
  datasource: Record<string, any>[];
  onRefresh?: () => void;
}> = ({ title, loading, collectionFields, datasource, onRefresh }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
  const compile = useCompile();
  const [columns, setColumns] = useState<any>([]);

  useEffect(() => {
    setColumns(
      collectionFields.map((field) => ({
        key: field.name,
        title: (
          <Text style={{ minWidth: 100, maxWidth: 300 }} ellipsis={{ tooltip: field.title }}>
            {field.title}
          </Text>
        ),
        dataIndex: field.name,
        width: 'auto',
        render: (value) => {
          if (['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(field.type)) {
            return (
              <Text style={{ minWidth: 100, maxWidth: 300 }} ellipsis={true}>
                {value ? JSON.stringify(value) : ''}
              </Text>
            );
          }
          if (field.type === 'date') {
            return (
              <Text style={{ minWidth: 100, maxWidth: 300 }} ellipsis={{ tooltip: value }}>
                {dayjs(value).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            );
          } else {
            return (
              <Text
                style={{ minWidth: 100, maxWidth: 300 }}
                ellipsis={{ tooltip: typeof value === 'string' ? compile(value) : value }}
              >
                {typeof value === 'string' ? compile(value) : value}
              </Text>
            );
          }
        },
      })),
    );
  }, [collectionFields]);

  return (
    <div style={{ height: '100%' }}>
      <Card
        title={title}
        extra={
          <Tooltip title={ctx.t('Refresh')}>
            <Button
              icon={<ReloadOutlined />}
              type="link"
              onClick={() => {
                onRefresh();
              }}
            ></Button>
          </Tooltip>
        }
        style={{
          borderTop: 'none',
          borderTopLeftRadius: '0',
        }}
      >
        <Space direction="vertical" size={'large'} style={{ width: '100%' }}>
          <Table
            columns={columns}
            dataSource={datasource}
            loading={loading}
            scroll={{ x: 'max-content', y: '56vh' }}
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => ctx.t('Total {{total}} items', { total }),
              pageSize: 25,
            }}
          ></Table>
        </Space>
      </Card>
    </div>
  );
};

const PreviewJSON: React.FC<{
  title: string;
  loading: boolean;
  datasource: Record<string, any>[];
}> = ({ title, loading, datasource }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (datasource) {
      setText(JSON.stringify(datasource, null, 2));
    }
  }, [datasource]);

  return (
    <div style={{ height: '100%' }}>
      <Card
        title={title}
        extra={<Text copyable={{ text }} />}
        style={{
          borderTop: 'none',
          borderTopLeftRadius: '0',
        }}
      >
        <Paragraph>
          {!loading && (
            <pre
              style={{
                height: '62vh',
                overflowY: 'auto',
                marginTop: '24px',
              }}
            >
              {text}
            </pre>
          )}
        </Paragraph>
      </Card>
    </div>
  );
};
