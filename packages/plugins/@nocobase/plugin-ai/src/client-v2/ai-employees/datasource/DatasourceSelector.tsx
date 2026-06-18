/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Checkbox, Empty, Flex, Layout, List, Spin, Table, Tabs, Typography, theme } from 'antd';
import type { APIClient } from '@nocobase/client-v2';
import { useApp } from '@nocobase/client-v2';
import { dayjs } from '@nocobase/utils/client';
import { useT } from '../../locale';
import type { ContextItem } from '../types';
import type { AIContextDatasourceRecord, PreviewResult } from '../../pages/DatasourceSettingsPage';
import { previewContextDatasource, toDatasourceFormValues } from '../../pages/DatasourceSettingsPage';

type APIClientLike = Pick<APIClient, 'resource'>;
type APIResponse = {
  data?: {
    data?: unknown;
    count?: unknown;
  };
};

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

const DatasourcePreview: React.FC<{
  loading: boolean;
  preview: PreviewResult | null;
}> = ({ loading, preview }) => {
  const t = useT();
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
  const columns = useMemo(
    () =>
      (preview?.options?.fields || []).map((field) => ({
        key: field,
        dataIndex: field,
        title: field,
        render: (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value)),
      })),
    [preview],
  );

  return (
    <Spin spinning={loading}>
      {preview ? (
        <Tabs
          type="card"
          items={[
            {
              key: 'table',
              label: t('Table'),
              children: <Table columns={columns} dataSource={rows} pagination={{ pageSize: 25 }} />,
            },
            {
              key: 'json',
              label: 'JSON',
              children: (
                <Typography.Paragraph copyable={{ text: JSON.stringify(rows, null, 2) }}>
                  <pre>{JSON.stringify(rows, null, 2)}</pre>
                </Typography.Paragraph>
              ),
            },
          ]}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Spin>
  );
};

export const DatasourceSelector: React.FC<DatasourceSelectorProps> = ({ contextItems, onAdd, onRemove, onClose }) => {
  const app = useApp();
  const t = useT();
  const { token } = theme.useToken();
  const [records, setRecords] = useState<AIContextDatasourceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
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
      setPreviewing(true);
      try {
        setPreview(await previewContextDatasource(app.apiClient, toDatasourceFormValues(record)));
      } finally {
        setPreviewing(false);
      }
    },
    [app.apiClient],
  );

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
    <Flex vertical>
      <Flex
        align="center"
        gap="small"
        style={{
          paddingInline: token.paddingLG,
          paddingBlock: token.padding,
          background: token.colorBgContainer,
          borderBlockEndWidth: token.lineWidth,
          borderBlockEndStyle: token.lineType as React.CSSProperties['borderBlockEndStyle'],
          borderBlockEndColor: token.colorSplit,
        }}
      >
        {onClose ? <Button type="text" icon={<CloseOutlined />} onClick={onClose} /> : null}
        <Typography.Text strong>{t('Select datasource')}</Typography.Text>
      </Flex>
      <Layout
        style={{
          minHeight: token.screenSM,
          background: token.colorBgContainer,
          borderEndStartRadius: token.borderRadiusLG,
          borderEndEndRadius: token.borderRadiusLG,
        }}
      >
        <Layout.Sider
          width={token.screenXS}
          theme="light"
          style={{
            background: token.colorBgContainer,
            borderInlineEndWidth: token.lineWidth,
            borderInlineEndStyle: token.lineType as React.CSSProperties['borderInlineEndStyle'],
            borderInlineEndColor: token.colorSplit,
          }}
        >
          <List<AIContextDatasourceRecord>
            loading={loading}
            dataSource={records}
            pagination={{
              align: 'center',
              showSizeChanger: false,
              total,
              pageSize,
              current: page,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
            renderItem={(record) => {
              const selected = selectedId === record.id;
              return (
                <List.Item
                  style={{
                    paddingInline: token.paddingSM,
                    paddingBlock: token.paddingXS,
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      selectRecord(record).catch((error: unknown) => {
                        console.error(error);
                        setPreviewing(false);
                      });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectRecord(record).catch((error: unknown) => {
                          console.error(error);
                          setPreviewing(false);
                        });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: token.paddingSM,
                      borderRadius: token.borderRadiusLG,
                      borderWidth: token.lineWidth,
                      borderStyle: token.lineType as React.CSSProperties['borderStyle'],
                      borderColor: selected ? token.colorPrimary : token.colorBorderSecondary,
                      cursor: 'pointer',
                      background: selected ? token.colorPrimaryBg : token.colorBgContainer,
                    }}
                  >
                    <Flex justify="space-between" gap="small" align="flex-start">
                      <Typography.Text strong>{record.title}</Typography.Text>
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
                    <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                      {record.description}
                    </Typography.Paragraph>
                    <Flex vertical gap={token.marginXXS}>
                      <Typography.Text type="secondary">
                        {t('Collection')}: {record.datasource}/{record.collectionName}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        {t('Limit')}: {record.limit}
                      </Typography.Text>
                      {record.createdAt ? (
                        <Typography.Text type="secondary">
                          {t('Created at')}: {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </Typography.Text>
                      ) : null}
                    </Flex>
                  </div>
                </List.Item>
              );
            }}
          />
        </Layout.Sider>
        <Layout.Content
          style={{
            padding: token.paddingLG,
            background: token.colorBgContainer,
          }}
        >
          <DatasourcePreview loading={previewing} preview={preview} />
        </Layout.Content>
      </Layout>
    </Flex>
  );
};

export default DatasourceSelector;
