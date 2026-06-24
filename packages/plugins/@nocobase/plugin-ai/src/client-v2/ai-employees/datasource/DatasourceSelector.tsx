/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Divider,
  Empty,
  Flex,
  Layout,
  List,
  Space,
  Spin,
  Table,
  Tabs,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { APIClient } from '@nocobase/client-v2';
import { useApp } from '@nocobase/client-v2';
import type { Collection, CollectionField } from '@nocobase/flow-engine';
import { useFlowContext } from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import { useT } from '../../locale';
import type { ContextItem } from '../types';
import type { AIContextDatasourceRecord, PreviewResult } from '../../pages/DatasourceSettingsPage';
import { previewContextDatasource, toDatasourceFormValues } from '../../pages/DatasourceSettingsPage';

const { Sider, Content } = Layout;
const { Text } = Typography;

type APIClientLike = Pick<APIClient, 'resource'>;
type DataSourceManagerLike = {
  getCollection?: (dataSourceKey: string, collectionName: string) => Collection | undefined;
};
type DatasourceFlowContext = {
  dataSourceManager?: DataSourceManagerLike;
};
type APIResponse = {
  data?: {
    data?: unknown;
    count?: unknown;
  };
};
type DatasourceRow = Record<string, unknown> & { key: number };

export type DatasourceSelectorProps = {
  contextItems?: ContextItem[];
  onAdd: (item: Omit<ContextItem, 'type'>) => void;
  onRemove: (uid: string) => void;
  onClose?: () => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isAIContextDatasourceRecord = (value: unknown): value is AIContextDatasourceRecord =>
  isRecord(value) &&
  (typeof value.id === 'string' || typeof value.id === 'number') &&
  typeof value.title === 'string' &&
  typeof value.datasource === 'string' &&
  typeof value.collectionName === 'string';

const readResponseData = (response: unknown): unknown => {
  if (!isRecord(response)) {
    return undefined;
  }
  return (response as APIResponse).data?.data;
};

const readResponseCount = (response: unknown): number | undefined => {
  if (!isRecord(response)) {
    return undefined;
  }
  const count = (response as APIResponse).data?.count;
  return typeof count === 'number' ? count : undefined;
};

async function listEnabledContextDatasources(
  apiClient: APIClientLike,
  params: { page: number; pageSize: number },
): Promise<{ data: AIContextDatasourceRecord[]; total?: number }> {
  const response = await apiClient.resource('aiContextDatasources').list({
    filter: {
      enabled: true,
    },
    sort: ['-createdAt'],
    page: params.page,
    pageSize: params.pageSize,
  });
  const data = readResponseData(response);
  return {
    data: Array.isArray(data) ? data.filter(isAIContextDatasourceRecord) : [],
    total: readResponseCount(response),
  };
}

const getCollectionDisplayName = (
  collection: Collection | undefined,
  record: AIContextDatasourceRecord | undefined,
) => {
  if (!collection) {
    return record ? `${record.datasource}/${record.collectionName}` : '';
  }
  return `${collection.dataSource.displayName} / ${collection.title}`;
};

const getCollectionFields = (
  collection: Collection | undefined,
  fieldNames: string[] | undefined,
): CollectionField[] => {
  const selectedFieldNames = fieldNames || [];
  const fields = collection?.getFields() || [];
  const collectionFields = fields.filter((field) => selectedFieldNames.includes(field.name));
  if (collectionFields.length) {
    return collectionFields;
  }
  return selectedFieldNames.map((name) => ({ name, title: name }) as CollectionField);
};

const renderPreviewValue = (value: unknown, field?: CollectionField, t?: (key: string) => string) => {
  if (value == null) {
    return '';
  }
  if (['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'].includes(field?.type || '')) {
    return JSON.stringify(value);
  }
  if (field?.type === 'date') {
    return dayjs(value as string).format('YYYY-MM-DD HH:mm:ss');
  }
  if (typeof value === 'string') {
    return t ? t(value) : value;
  }
  return JSON.stringify(value);
};

const DatasourcePreview: React.FC<{
  loading: boolean;
  preview: PreviewResult | null;
  record?: AIContextDatasourceRecord;
  manager?: DataSourceManagerLike;
  onRefresh?: () => void;
}> = ({ loading, preview, record, manager, onRefresh }) => {
  const t = useT();
  const { token } = theme.useToken();
  const collection = record ? manager?.getCollection?.(record.datasource, record.collectionName) : undefined;
  const collectionFields = useMemo(
    () => getCollectionFields(collection, preview?.options?.fields),
    [collection, preview?.options?.fields],
  );
  const title = `${t('Collection')}: ${getCollectionDisplayName(collection, record)}`;
  const rows = useMemo(
    () =>
      (preview?.records || []).map((row, index) => ({
        key: index,
        ...row.reduce<Record<string, unknown>>((result, item) => {
          result[item.name] = item.value;
          return result;
        }, {}),
      })),
    [preview],
  );
  const columns = useMemo<ColumnsType<DatasourceRow>>(
    () =>
      collectionFields.map((field) => ({
        key: field.name,
        dataIndex: field.name,
        title: (
          <Text style={{ minWidth: 100, maxWidth: 300 }} ellipsis={{ tooltip: field.title }}>
            {field.title}
          </Text>
        ),
        width: 'auto',
        render: (value: unknown) => {
          const text = renderPreviewValue(value, field, t);
          return (
            <Text style={{ minWidth: 100, maxWidth: 300 }} ellipsis={{ tooltip: text }}>
              {text}
            </Text>
          );
        },
      })),
    [collectionFields, t],
  );
  const jsonText = JSON.stringify(rows, null, 2);

  return (
    <Spin spinning={loading}>
      {preview ? (
        <div style={{ padding: 16 }}>
          <Tabs
            type="card"
            tabBarStyle={{ marginBottom: 0 }}
            defaultActiveKey="table"
            items={[
              {
                key: 'table',
                label: t('Table'),
                children: (
                  <Card
                    title={title}
                    extra={
                      <Tooltip title={t('Refresh')}>
                        <Button icon={<ReloadOutlined />} type="link" onClick={onRefresh} />
                      </Tooltip>
                    }
                    style={{
                      borderTop: 'none',
                      borderTopLeftRadius: 0,
                    }}
                  >
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Table
                        columns={columns}
                        dataSource={rows}
                        loading={loading}
                        scroll={{ x: 'max-content', y: '56vh' }}
                        pagination={{
                          showSizeChanger: true,
                          showTotal: (total) => t('Total {{total}} items', { total }),
                          pageSize: 25,
                        }}
                      />
                    </Space>
                  </Card>
                ),
              },
              {
                key: 'json',
                label: 'JSON',
                children: (
                  <Card
                    title={title}
                    extra={<Text copyable={{ text: jsonText }} />}
                    style={{
                      borderTop: 'none',
                      borderTopLeftRadius: 0,
                    }}
                  >
                    <Typography.Paragraph>
                      {!loading ? (
                        <pre
                          style={{
                            height: '62vh',
                            overflowY: 'auto',
                            marginTop: token.marginLG,
                          }}
                        >
                          {jsonText}
                        </pre>
                      ) : null}
                    </Typography.Paragraph>
                  </Card>
                ),
              },
            ]}
          />
        </div>
      ) : (
        <Flex style={{ height: '80vh' }} justify="center" align="center" vertical>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Flex>
      )}
    </Spin>
  );
};

const DatasourceList: React.FC<{
  records: AIContextDatasourceRecord[];
  loading: boolean;
  total?: number;
  page: number;
  pageSize: number;
  selectedId?: string | number;
  checkedIds: Set<string>;
  onSelect: (record: AIContextDatasourceRecord) => void;
  onAdd: (item: Omit<ContextItem, 'type'>) => void;
  onRemove: (uid: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
}> = ({ records, loading, total, page, pageSize, selectedId, checkedIds, onSelect, onAdd, onRemove, onPageChange }) => {
  const t = useT();

  return (
    <List<AIContextDatasourceRecord>
      style={{ height: '80vh', overflowY: 'auto', padding: '10px' }}
      dataSource={records}
      loading={loading}
      pagination={{
        align: 'center',
        showSizeChanger: false,
        total,
        pageSize,
        current: page,
        onChange: onPageChange,
      }}
      renderItem={(record) => (
        <List.Item>
          <div
            style={
              record.id === selectedId
                ? {
                    border: '2px dashed #1677ff',
                    borderRadius: 8,
                  }
                : {}
            }
          >
            <Card
              key={record.id}
              hoverable
              variant="borderless"
              style={{ minWidth: 280, display: 'flex', flexDirection: 'column' }}
              onClick={() => onSelect(record)}
            >
              <Card.Meta
                title={
                  <Flex justify="space-between" align="center">
                    <span>{record.title}</span>
                    <Checkbox
                      checked={checkedIds.has(String(record.id))}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        if (event.target.checked) {
                          onAdd({ uid: String(record.id), title: record.title });
                        } else {
                          onRemove(String(record.id));
                        }
                      }}
                    />
                  </Flex>
                }
                description={
                  <Space style={{ fontSize: 13 }}>
                    <Text type="secondary">{t('Collection')}</Text>
                    <Text>{`${record.datasource}/${record.collectionName}`}</Text>
                    <Divider type="vertical" />
                    <Text type="secondary">{t('Limit')}</Text>
                    <Text>{record.limit}</Text>
                  </Space>
                }
              />
              <div
                style={{
                  width: 250,
                  height: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  paddingTop: 10,
                }}
              >
                <div style={{ width: '100%', height: 70 }}>
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                    {record.description}
                  </Typography.Paragraph>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <Flex justify="space-between" align="center">
                    <Space style={{ fontSize: 10 }}>
                      <Text type="secondary">
                        {record.createdAt
                          ? `${t('Created at')} ${dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}`
                          : null}
                      </Text>
                    </Space>
                  </Flex>
                </div>
              </div>
            </Card>
          </div>
        </List.Item>
      )}
    />
  );
};

export const DatasourceSelector: React.FC<DatasourceSelectorProps> = ({ contextItems, onAdd, onRemove }) => {
  const app = useApp();
  const flowContext = useFlowContext<DatasourceFlowContext>();
  const manager = flowContext.dataSourceManager || (app.dataSourceManager as DataSourceManagerLike | undefined);
  const [records, setRecords] = useState<AIContextDatasourceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AIContextDatasourceRecord>();
  const [selectedId, setSelectedId] = useState<string | number>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState<number>();

  const checkedIds = useMemo(
    () => new Set((contextItems || []).filter((item) => item.type === 'datasource').map((item) => String(item.uid))),
    [contextItems],
  );

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEnabledContextDatasources(app.apiClient, { page, pageSize });
      setRecords(result.data);
      setTotal(result.total);
      return result.data;
    } finally {
      setLoading(false);
    }
  }, [app.apiClient, page, pageSize]);

  const selectRecord = useCallback(
    async (record: AIContextDatasourceRecord) => {
      setSelectedId(record.id);
      setSelectedRecord(record);
      setPreviewing(true);
      try {
        setPreview(await previewContextDatasource(app.apiClient, toDatasourceFormValues(record)));
      } finally {
        setPreviewing(false);
      }
    },
    [app.apiClient],
  );

  const refreshPreview = useCallback(() => {
    if (!selectedRecord) {
      return;
    }
    selectRecord(selectedRecord).catch((error: unknown) => {
      console.error(error);
      setPreviewing(false);
    });
  }, [selectRecord, selectedRecord]);

  useEffect(() => {
    let disposed = false;
    const run = async () => {
      try {
        const nextRecords = await loadRecords();
        if (disposed) {
          return;
        }
        if (nextRecords.length) {
          await selectRecord(nextRecords[0]);
        } else {
          setSelectedId(undefined);
          setSelectedRecord(undefined);
          setPreview(null);
        }
      } catch (error) {
        console.error(error);
        setLoading(false);
        setPreviewing(false);
      }
    };
    run();
    return () => {
      disposed = true;
    };
  }, [loadRecords, selectRecord]);

  return (
    <div>
      <div
        style={{
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {records.length ? (
          <Layout style={{ height: '80vh', backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Sider width={300} style={{ paddingLeft: 20, backgroundColor: 'transparent' }}>
              <Flex align="center" vertical>
                <DatasourceList
                  records={records}
                  loading={loading}
                  total={total}
                  page={page}
                  pageSize={pageSize}
                  selectedId={selectedId}
                  checkedIds={checkedIds}
                  onSelect={(record) => {
                    selectRecord(record).catch((error: unknown) => {
                      console.error(error);
                      setPreviewing(false);
                    });
                  }}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  onPageChange={(nextPage, nextPageSize) => {
                    setPage(nextPage);
                    setPageSize(nextPageSize);
                  }}
                />
              </Flex>
            </Sider>
            <Divider type="vertical" variant="dashed" style={{ height: '95%', margin: 'auto 0px auto 10px' }} />
            <Content style={{ backgroundColor: 'transparent' }}>
              <DatasourcePreview
                loading={previewing}
                preview={preview}
                record={selectedRecord}
                manager={manager}
                onRefresh={refreshPreview}
              />
            </Content>
          </Layout>
        ) : (
          <Flex style={{ height: '80vh' }} justify="center" align="center" vertical>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Flex>
        )}
      </div>
    </div>
  );
};

export default DatasourceSelector;
