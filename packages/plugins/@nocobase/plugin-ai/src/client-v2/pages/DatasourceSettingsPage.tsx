/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Cascader,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Select,
  Space,
  Spin,
  Steps,
  Switch,
  Table,
  Tabs,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { DeleteOutlined, ExclamationCircleFilled, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useApp } from '@nocobase/client-v2';
import type { APIClient } from '@nocobase/client-v2';
import { dayjs } from '@nocobase/utils/client';
import { useT } from '../locale';
import { AI_SETTINGS_DRAWER_WIDTH } from './drawerWidth';

type APIClientLike = Pick<APIClient, 'resource'>;
type ResourceAction = (params?: Record<string, unknown>) => Promise<unknown>;
type APIResponse = {
  data?: {
    data?: unknown;
    count?: unknown;
  };
};
type FilterValue = Record<string, unknown>;
type SortValue = string[];
type DrawerMode = 'create' | 'edit';
type DatasourceFormMode = 'steps' | 'tabs';
export type AIContextDatasourceRecord = {
  id: number | string;
  title: string;
  description?: string;
  datasource: string;
  collectionName: string;
  fields?: string[];
  filter?: FilterValue;
  sort?: SortValue;
  limit: number;
  enabled: boolean;
  createdAt?: string;
};
export type DatasourceFormValues = Omit<AIContextDatasourceRecord, 'id' | 'datasource' | 'collectionName'> & {
  id?: number | string;
  collection?: string[];
  filterText?: string;
  sortText?: string;
  datasource?: string;
  collectionName?: string;
};
type DatasourceListResult = {
  data: AIContextDatasourceRecord[];
  total?: number;
};
export type PreviewResult = {
  options?: {
    datasource?: string;
    collectionName?: string;
    fields?: string[];
  };
  records?: Array<Array<{ name: string; value: unknown }>>;
};
type CollectionOption = {
  label: string;
  value: string;
  children?: CollectionOption[];
};
type FieldOption = {
  label: string;
  value: string;
};
type DataSourceManagerLike = {
  getDataSources?: () => DataSourceLike[];
  getCollection?: (dataSourceKey: string, collectionName: string) => CollectionLike | undefined;
};
type DataSourceLike = {
  key: string;
  displayName?: string;
  collectionManager?: {
    getCollections?: () => CollectionLike[];
  };
};
type CollectionLike = {
  name: string;
  title?: string;
  getFields?: () => FieldLike[];
};
type FieldLike = {
  name: string;
  title?: string;
  type?: string;
  options?: {
    interface?: string;
    hidden?: boolean;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isResourceAction = (value: unknown): value is ResourceAction => typeof value === 'function';

const callResourceAction = async (
  apiClient: APIClientLike,
  resourceName: string,
  actionName: string,
  params?: Record<string, unknown>,
): Promise<unknown> => {
  const resource = apiClient.resource(resourceName) as Record<string, unknown>;
  const action = resource[actionName];
  if (!isResourceAction(action)) {
    throw new Error(`Missing resource action: ${resourceName}.${actionName}`);
  }
  return action(params);
};

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

const isAIContextDatasourceRecord = (value: unknown): value is AIContextDatasourceRecord =>
  isRecord(value) &&
  (typeof value.id === 'string' || typeof value.id === 'number') &&
  typeof value.title === 'string' &&
  typeof value.datasource === 'string' &&
  typeof value.collectionName === 'string';

const safeParseJson = <T,>(value: string | undefined, fallback: T): T => {
  if (!value?.trim()) {
    return fallback;
  }
  const parsed = JSON.parse(value);
  return parsed as T;
};

export const normalizeDatasourceValues = (values: DatasourceFormValues): Omit<AIContextDatasourceRecord, 'id'> => {
  const [datasource, collectionName] = values.collection || [values.datasource, values.collectionName];
  if (!datasource || !collectionName) {
    throw new Error('Missing datasource collection.');
  }
  return {
    title: values.title,
    description: values.description || '',
    datasource,
    collectionName,
    fields: Array.isArray(values.fields) ? values.fields : [],
    filter: safeParseJson<FilterValue | undefined>(values.filterText, values.filter),
    sort: safeParseJson<SortValue | undefined>(values.sortText, values.sort),
    limit: values.limit,
    enabled: values.enabled !== false,
  };
};

export const toDatasourceFormValues = (record: AIContextDatasourceRecord): DatasourceFormValues => ({
  ...record,
  collection: [record.datasource, record.collectionName],
  filterText: record.filter ? JSON.stringify(record.filter, null, 2) : '',
  sortText: record.sort ? JSON.stringify(record.sort, null, 2) : '',
});

export async function listContextDatasources(apiClient: APIClientLike): Promise<DatasourceListResult> {
  const response = await callResourceAction(apiClient, 'aiContextDatasources', 'list');
  const data = readResponseData(response);
  return {
    data: Array.isArray(data) ? data.filter(isAIContextDatasourceRecord) : [],
    total: readResponseCount(response),
  };
}

export async function createContextDatasource(apiClient: APIClientLike, values: DatasourceFormValues) {
  await callResourceAction(apiClient, 'aiContextDatasources', 'create', {
    values: normalizeDatasourceValues(values),
  });
}

export async function updateContextDatasource(
  apiClient: APIClientLike,
  id: string | number,
  values: DatasourceFormValues,
) {
  await callResourceAction(apiClient, 'aiContextDatasources', 'update', {
    filterByTk: id,
    values: normalizeDatasourceValues(values),
  });
}

export async function deleteContextDatasource(apiClient: APIClientLike, id: string | number) {
  await callResourceAction(apiClient, 'aiContextDatasources', 'destroy', {
    filterByTk: id,
  });
}

export async function updateContextDatasourceEnabled(apiClient: APIClientLike, id: string | number, enabled: boolean) {
  await callResourceAction(apiClient, 'aiContextDatasources', 'update', {
    filterByTk: id,
    values: { enabled },
  });
}

export async function previewContextDatasource(
  apiClient: APIClientLike,
  values: DatasourceFormValues,
): Promise<PreviewResult> {
  const response = await callResourceAction(apiClient, 'aiContextDatasources', 'preview', {
    values: normalizeDatasourceValues(values),
  });
  const data = readResponseData(response);
  return isRecord(data) ? (data as PreviewResult) : {};
}

const getCollectionOptions = (manager: DataSourceManagerLike | undefined): CollectionOption[] => {
  return (manager?.getDataSources?.() || []).map((dataSource) => ({
    label: dataSource.displayName || dataSource.key,
    value: dataSource.key,
    children: (dataSource.collectionManager?.getCollections?.() || []).map((collection) => ({
      label: collection.title || collection.name,
      value: collection.name,
    })),
  }));
};

const getFieldOptions = (manager: DataSourceManagerLike | undefined, collection?: string[]): FieldOption[] => {
  const [dataSourceKey, collectionName] = collection || [];
  if (!dataSourceKey || !collectionName) {
    return [];
  }
  const fields = manager?.getCollection?.(dataSourceKey, collectionName)?.getFields?.() || [];
  return fields
    .filter((field) => field.options?.interface && !field.options?.hidden)
    .map((field) => ({
      label: field.title || field.name,
      value: field.name,
    }));
};

const createInitialValues = (): DatasourceFormValues => ({
  title: '',
  description: '',
  collection: undefined,
  fields: [],
  filterText: '',
  sortText: '',
  limit: 1000,
  enabled: true,
});

const getDatasourceStepFields = (step: number): Array<keyof DatasourceFormValues> => {
  if (step === 0) {
    return ['title', 'collection', 'limit', 'enabled'];
  }
  if (step === 1) {
    return ['fields'];
  }
  return [];
};

const DatasourceForm: React.FC<{
  manager?: DataSourceManagerLike;
  preview: PreviewResult | null;
  previewing: boolean;
  editing: boolean;
  currentStep: number;
  mode: DatasourceFormMode;
  onStepChange?: (step: number) => void;
}> = ({ manager, preview, previewing, editing, currentStep, mode, onStepChange }) => {
  const t = useT();
  const { token } = theme.useToken();
  const form = Form.useFormInstance<DatasourceFormValues>();
  const collection = Form.useWatch('collection', form);
  const fieldOptions = useMemo(() => getFieldOptions(manager, collection), [collection, manager]);
  const previewRows = useMemo(
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
  const previewColumns = useMemo(
    () =>
      (preview?.options?.fields || []).map((field) => ({
        key: field,
        dataIndex: field,
        title: field,
        render: (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value)),
      })),
    [preview],
  );
  const stepItems = [
    { title: t('Collection') },
    { title: t('Fields') },
    { title: t('Filter') },
    { title: t('Sort') },
    { title: t('Preview') },
  ];

  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <>
          <Form.Item name="title" label={t('Title')} rules={[{ required: true }]} preserve>
            <Input />
          </Form.Item>
          <Form.Item name="collection" label={t('Collection')} rules={[{ required: true }]} preserve>
            <Cascader
              disabled={editing}
              showSearch
              options={getCollectionOptions(manager)}
              onChange={() => {
                form.setFieldValue('fields', []);
              }}
            />
          </Form.Item>
          <Form.Item name="description" label={t('Description')} preserve>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Flex gap="middle" align="center">
            <Form.Item name="limit" label={t('Limit')} rules={[{ required: true }]} preserve>
              <InputNumber min={1} max={20000} step={100} changeOnWheel />
            </Form.Item>
            <Form.Item name="enabled" label={t('Enabled')} valuePropName="checked" preserve>
              <Switch />
            </Form.Item>
          </Flex>
        </>
      );
    }
    if (step === 1) {
      return (
        <Form.Item name="fields" label={t('Fields')} rules={[{ required: true }]} preserve>
          <Select mode="multiple" options={fieldOptions} />
        </Form.Item>
      );
    }
    if (step === 2) {
      return (
        <Form.Item name="filterText" label={t('Filter group')} preserve>
          <Input.TextArea autoSize={{ minRows: 6 }} />
        </Form.Item>
      );
    }
    if (step === 3) {
      return (
        <Form.Item name="sortText" label={t('Sort Fields')} preserve>
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
      );
    }
    return (
      <Spin spinning={previewing}>
        <Tabs
          type="card"
          items={[
            {
              key: 'table',
              label: t('Table'),
              children: <Table columns={previewColumns} dataSource={previewRows} pagination={{ pageSize: 25 }} />,
            },
            {
              key: 'json',
              label: 'JSON',
              children: (
                <Typography.Paragraph copyable={{ text: JSON.stringify(previewRows, null, 2) }}>
                  <pre>{JSON.stringify(previewRows, null, 2)}</pre>
                </Typography.Paragraph>
              ),
            },
          ]}
        />
      </Spin>
    );
  };

  if (mode === 'tabs') {
    return (
      <Tabs
        defaultActiveKey="0"
        items={stepItems.map((item, step) => ({
          key: String(step),
          label: item.title,
          forceRender: true,
          children: renderStepContent(step),
        }))}
        onChange={(key) => {
          onStepChange?.(Number(key));
        }}
      />
    );
  }

  return (
    <Flex vertical gap="middle">
      <Steps current={currentStep} size="small" items={stepItems} />
      <div style={{ borderBlockStart: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}` }} />
      <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>{renderStepContent(0)}</div>
      <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>{renderStepContent(1)}</div>
      <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>{renderStepContent(2)}</div>
      <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>{renderStepContent(3)}</div>
      <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>{renderStepContent(4)}</div>
    </Flex>
  );
};

const EnabledSwitch: React.FC<{
  record: AIContextDatasourceRecord;
  onUpdated: () => Promise<void>;
}> = ({ record, onUpdated }) => {
  const app = useApp();
  const [loading, setLoading] = useState(false);
  const handleChange = async (enabled: boolean) => {
    setLoading(true);
    try {
      await updateContextDatasourceEnabled(app.apiClient, record.id, enabled);
      await onUpdated();
    } finally {
      setLoading(false);
    }
  };
  return <Switch size="small" checked={record.enabled !== false} loading={loading} onChange={handleChange} />;
};

export const DatasourceSettingsPage: React.FC = () => {
  const app = useApp();
  const t = useT();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<DatasourceFormValues>();
  const manager = app.dataSourceManager as DataSourceManagerLike | undefined;
  const [records, setRecords] = useState<AIContextDatasourceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | undefined>();
  const [editingRecord, setEditingRecord] = useState<AIContextDatasourceRecord | undefined>();
  const [currentStep, setCurrentStep] = useState(0);
  const drawerOpen = !!drawerMode;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listContextDatasources(app.apiClient);
      setRecords(result.data);
    } finally {
      setLoading(false);
    }
  }, [app.apiClient]);

  useEffect(() => {
    refresh().catch((error: unknown) => {
      console.error(error);
      setLoading(false);
    });
  }, [refresh]);

  const openCreateDrawer = () => {
    setEditingRecord(undefined);
    setPreview(null);
    setCurrentStep(0);
    form.setFieldsValue(createInitialValues());
    setDrawerMode('create');
  };

  const openDetailDrawer = (record: AIContextDatasourceRecord) => {
    setEditingRecord(record);
    setPreview(null);
    setCurrentStep(0);
    form.setFieldsValue(toDatasourceFormValues(record));
    setDrawerMode('edit');
  };

  const closeDrawer = () => {
    setDrawerMode(undefined);
    setEditingRecord(undefined);
    form.resetFields();
    setPreview(null);
    setCurrentStep(0);
  };

  const handlePreview = async () => {
    const values = form.getFieldsValue(true);
    setPreviewing(true);
    try {
      setPreview(await previewContextDatasource(app.apiClient, values));
    } finally {
      setPreviewing(false);
    }
  };

  const handleDetailTabChange = (step: number) => {
    setCurrentStep(step);
    if (step === 4) {
      handlePreview().catch((error: unknown) => {
        console.error(error);
        setPreviewing(false);
      });
    }
  };

  const handleNext = async () => {
    await form.validateFields(getDatasourceStepFields(currentStep));
    if (currentStep === 3) {
      await handlePreview();
    }
    setCurrentStep((step) => Math.min(step + 1, 4));
  };

  const handleFinish = async (values: DatasourceFormValues) => {
    setSaving(true);
    try {
      if (editingRecord) {
        await updateContextDatasource(app.apiClient, editingRecord.id, values);
        message.success(t('Saved successfully'));
      } else {
        await createContextDatasource(app.apiClient, values);
        message.success(t('Processing complete!'));
      }
      closeDrawer();
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record: AIContextDatasourceRecord) => {
    modal.confirm({
      title: t('Confirm whether to delete'),
      icon: <ExclamationCircleFilled />,
      content: t('Are you sure delete this datasource?'),
      okType: 'danger',
      async onOk() {
        await deleteContextDatasource(app.apiClient, record.id);
        message.success(t('Datasource deleted successfully'));
        await refresh();
      },
    });
  };

  return (
    <Card>
      <Flex vertical gap="middle">
        <Flex justify="space-between" wrap="wrap" gap="middle">
          <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
            {t('Refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
            {t('Add datasource')}
          </Button>
        </Flex>
        <Spin spinning={loading}>
          {records.length ? (
            <List
              grid={{ gutter: token.margin, xs: 1, sm: 1, md: 2, lg: 3, xl: 4, xxl: 4 }}
              dataSource={records}
              pagination={{ pageSize: 12, showSizeChanger: false }}
              renderItem={(record) => (
                <List.Item>
                  <Card hoverable onClick={() => openDetailDrawer(record)}>
                    <Card.Meta
                      title={
                        <Flex justify="space-between" align="center" gap="small">
                          <Typography.Text ellipsis>{record.title}</Typography.Text>
                          <span onClick={(event) => event.stopPropagation()}>
                            <EnabledSwitch record={record} onUpdated={refresh} />
                          </span>
                        </Flex>
                      }
                      description={
                        <Space size="small" wrap>
                          <Typography.Text type="secondary">{t('Collection')}</Typography.Text>
                          <Typography.Text>{`${record.datasource}/${record.collectionName}`}</Typography.Text>
                          <Typography.Text type="secondary">{t('Limit')}</Typography.Text>
                          <Typography.Text>{record.limit}</Typography.Text>
                        </Space>
                      }
                    />
                    <Flex vertical gap="small" style={{ marginBlockStart: token.marginSM }}>
                      <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                        {record.description}
                      </Typography.Paragraph>
                      <Flex justify="space-between" align="center" gap="small">
                        <Typography.Text type="secondary">
                          {record.createdAt
                            ? `${t('Created at')} ${dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}`
                            : null}
                        </Typography.Text>
                        <span onClick={(event) => event.stopPropagation()}>
                          <Tooltip title={t('Delete')}>
                            <Button
                              type="link"
                              danger
                              icon={<DeleteOutlined />}
                              aria-label={t('Delete')}
                              onClick={() => handleDelete(record)}
                            />
                          </Tooltip>
                        </span>
                      </Flex>
                    </Flex>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button icon={<PlusOutlined />} type="primary" onClick={openCreateDrawer}>
                {t('Create a new datasource')}
              </Button>
            </Empty>
          )}
        </Spin>
      </Flex>
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        width={AI_SETTINGS_DRAWER_WIDTH}
        title={drawerMode === 'edit' ? t('Edit datasource') : t('Add datasource')}
        footer={
          drawerMode === 'edit' ? (
            <Flex justify="flex-end" align="center">
              <Space>
                <Button onClick={closeDrawer}>{t('Cancel')}</Button>
                <Button type="primary" loading={saving} onClick={() => form.submit()}>
                  {t('Submit')}
                </Button>
              </Space>
            </Flex>
          ) : (
            <Flex justify="space-between" gap="small">
              <Button onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))} disabled={currentStep === 0}>
                {t('Previous')}
              </Button>
              <Space>
                <Button onClick={closeDrawer}>{t('Cancel')}</Button>
                {currentStep < 4 ? (
                  <Button type="primary" loading={previewing} onClick={handleNext}>
                    {t('Next')}
                  </Button>
                ) : (
                  <Button type="primary" loading={saving} onClick={() => form.submit()}>
                    {t('Submit')}
                  </Button>
                )}
              </Space>
            </Flex>
          )
        }
      >
        <Spin spinning={saving}>
          <Form<DatasourceFormValues> form={form} layout="vertical" onFinish={handleFinish}>
            <DatasourceForm
              manager={manager}
              preview={preview}
              previewing={previewing}
              editing={!!editingRecord}
              currentStep={currentStep}
              mode={drawerMode === 'edit' ? 'tabs' : 'steps'}
              onStepChange={handleDetailTabChange}
            />
          </Form>
        </Spin>
      </Drawer>
    </Card>
  );
};

export default DatasourceSettingsPage;
