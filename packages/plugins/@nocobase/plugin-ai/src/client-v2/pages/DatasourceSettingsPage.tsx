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
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Radio,
  Space,
  Spin,
  Steps,
  Switch,
  Table,
  Tabs,
  Tooltip,
  Typography,
  theme,
  Transfer,
} from 'antd';
import type { GetProp, TableColumnsType, TableProps, TransferProps } from 'antd';
import { DeleteOutlined, ExclamationCircleFilled, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { FilterGroup, useApp, VariableFilterItem } from '@nocobase/client-v2';
import type { APIClient } from '@nocobase/client-v2';
import { dayjs } from '@nocobase/utils/client';
import { createCollectionContextMeta, observable, useFlowContext } from '@nocobase/flow-engine';
import type { Collection } from '@nocobase/flow-engine';
import { useT } from '../locale';
import { useUnsavedChangesBeforeClose } from './useUnsavedChangesBeforeClose';

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
  dataSource?: DataSourceLike;
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
type TransferItem = GetProp<TransferProps, 'dataSource'>[number];
type TableRowSelection<T extends object> = TableProps<T>['rowSelection'];
type FieldTransferItem = {
  key: string;
  title: string;
  direction?: 'asc' | 'desc';
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

const cloneJsonValue = <T,>(value: T): T => {
  if (value == null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
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
    filter: cloneJsonValue(safeParseJson<FilterValue | undefined>(values.filterText, values.filter)),
    sort: cloneJsonValue(safeParseJson<SortValue | undefined>(values.sortText, values.sort)),
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
  const response = await callResourceAction(apiClient, 'aiContextDatasources', 'list', {
    sort: ['-createdAt'],
    pageSize: 16,
  });
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

const getCurrentCollection = (
  manager: DataSourceManagerLike | undefined,
  collection?: string[],
): CollectionLike | undefined => {
  const [dataSourceKey, collectionName] = collection || [];
  if (!dataSourceKey || !collectionName) {
    return undefined;
  }
  return manager?.getCollection?.(dataSourceKey, collectionName);
};

const getCollectionDisplayName = (
  manager: DataSourceManagerLike | undefined,
  collection?: string[],
): string | undefined => {
  const currentCollection = getCurrentCollection(manager, collection);
  if (!currentCollection) {
    return undefined;
  }
  const dataSourceTitle = currentCollection.dataSource?.displayName || collection?.[0];
  return `${dataSourceTitle} / ${currentCollection.title || currentCollection.name}`;
};

const getFieldTransferItems = (
  manager: DataSourceManagerLike | undefined,
  collection?: string[],
): FieldTransferItem[] => {
  const fields = getCurrentCollection(manager, collection)?.getFields?.() || [];
  return fields
    .filter((field) => field.options?.interface && !field.options?.hidden)
    .map((field) => ({
      key: field.name,
      title: field.title || field.name,
    }));
};

const createInitialValues = (): DatasourceFormValues => ({
  title: '',
  description: '',
  collection: undefined,
  fields: [],
  filter: { logic: '$and', items: [] },
  sort: [],
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

const TableTransfer: React.FC<
  TransferProps<FieldTransferItem> & {
    dataSource: FieldTransferItem[];
    leftColumns: TableColumnsType<FieldTransferItem>;
    rightColumns: TableColumnsType<FieldTransferItem>;
  }
> = ({ leftColumns, rightColumns, ...restProps }) => {
  return (
    <Transfer style={{ width: '100%' }} {...restProps}>
      {({ direction, filteredItems, onItemSelect, onItemSelectAll, selectedKeys: listSelectedKeys, disabled }) => {
        const columns = direction === 'left' ? leftColumns : rightColumns;
        const rowSelection: TableRowSelection<TransferItem> = {
          getCheckboxProps: () => ({ disabled }),
          onChange(selectedRowKeys) {
            onItemSelectAll(
              selectedRowKeys.filter((key): key is string => typeof key === 'string'),
              'replace',
            );
          },
          selectedRowKeys: listSelectedKeys,
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
        };

        return (
          <Table
            rowSelection={rowSelection}
            columns={columns as TableColumnsType<TransferItem>}
            dataSource={filteredItems}
            size="small"
            style={{ pointerEvents: disabled ? 'none' : undefined }}
            pagination={{
              defaultPageSize: 20,
            }}
            onRow={({ key, disabled: itemDisabled }) => ({
              onClick: () => {
                if (itemDisabled || disabled || typeof key !== 'string') {
                  return;
                }
                onItemSelect(key, !listSelectedKeys.includes(key));
              },
            })}
          />
        );
      }}
    </Transfer>
  );
};

const fieldTransferFilterOption = (input: string, item: FieldTransferItem) => item.title.includes(input);

const FieldsTransfer: React.FC<{
  value?: string[];
  onChange?: (targetKeys: string[]) => void;
  manager?: DataSourceManagerLike;
  collection?: string[];
}> = ({ value, onChange, manager, collection }) => {
  const t = useT();
  const dataSource = useMemo(() => getFieldTransferItems(manager, collection), [collection, manager]);
  const columns: TableColumnsType<FieldTransferItem> = [
    {
      dataIndex: 'title',
      title: t('Field display name'),
    },
  ];

  return (
    <Flex align="start" gap="middle" vertical>
      <TableTransfer
        dataSource={dataSource}
        targetKeys={value}
        showSearch
        showSelectAll={false}
        onChange={(targetKeys) => onChange?.(targetKeys.filter((key): key is string => typeof key === 'string'))}
        filterOption={fieldTransferFilterOption}
        leftColumns={columns}
        rightColumns={columns}
      />
    </Flex>
  );
};

const SortFieldsTransfer: React.FC<{
  value?: string[];
  onChange?: (targetKeys: string[]) => void;
  manager?: DataSourceManagerLike;
  collection?: string[];
}> = ({ value, onChange, manager, collection }) => {
  const t = useT();
  const [dataSource, setDataSource] = useState<FieldTransferItem[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  const emitChange = useCallback(
    (keys: string[], items: FieldTransferItem[]) => {
      onChange?.(
        keys.map((key) => {
          const record = items.find((item) => item.key === key);
          return record?.direction === 'desc' ? `-${key}` : key;
        }),
      );
    },
    [onChange],
  );

  useEffect(() => {
    const directions = (value || []).reduce<Record<string, 'asc' | 'desc'>>((result, item) => {
      if (item.startsWith('-')) {
        result[item.slice(1)] = 'desc';
      } else {
        result[item] = 'asc';
      }
      return result;
    }, {});
    const nextDataSource = getFieldTransferItems(manager, collection).map((item) => ({
      ...item,
      direction: directions[item.key],
    }));
    setTargetKeys((value || []).map((item) => (item.startsWith('-') ? item.slice(1) : item)));
    setDataSource(nextDataSource);
  }, [collection, manager, value]);

  const handleTransferTargetChange = useCallback(
    (keys: string[]) => {
      setTargetKeys(keys);
      emitChange(keys, dataSource);
    },
    [dataSource, emitChange],
  );

  const leftColumns: TableColumnsType<FieldTransferItem> = [
    {
      dataIndex: 'title',
      title: t('Field display name'),
    },
  ];

  const rightColumns: TableColumnsType<FieldTransferItem> = [
    {
      dataIndex: 'title',
      title: t('Field display name'),
    },
    {
      title: t('Direction'),
      render: (_value, record) => (
        <div onClick={(event) => event.stopPropagation()}>
          <Radio.Group
            value={record.direction || 'asc'}
            options={[
              { value: 'asc', label: t('Asc') },
              { value: 'desc', label: t('Desc') },
            ]}
            onChange={(event) => {
              event.stopPropagation();
              const nextDataSource = dataSource.map((item) =>
                item.key === record.key ? { ...item, direction: event.target.value } : item,
              );
              setDataSource(nextDataSource);
              emitChange(targetKeys, nextDataSource);
            }}
          />
        </div>
      ),
    },
    {
      title: t('Actions'),
      render: (_value, record) => (
        <Space direction="horizontal">
          <Button
            type="link"
            onClick={(event) => {
              event.stopPropagation();
              const sortingIndex = targetKeys.indexOf(record.key);
              if (sortingIndex > 0) {
                const nextTargetKeys = [...targetKeys];
                nextTargetKeys[sortingIndex] = nextTargetKeys[sortingIndex - 1];
                nextTargetKeys[sortingIndex - 1] = record.key;
                handleTransferTargetChange(nextTargetKeys);
              }
            }}
          >
            {t('Up')}
          </Button>
          <Button
            type="link"
            onClick={(event) => {
              event.stopPropagation();
              const sortingIndex = targetKeys.indexOf(record.key);
              if (sortingIndex !== -1 && sortingIndex < targetKeys.length - 1) {
                const nextTargetKeys = [...targetKeys];
                nextTargetKeys[sortingIndex] = nextTargetKeys[sortingIndex + 1];
                nextTargetKeys[sortingIndex + 1] = record.key;
                handleTransferTargetChange(nextTargetKeys);
              }
            }}
          >
            {t('Down')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Flex align="start" gap="middle" vertical>
      <TableTransfer
        dataSource={dataSource}
        targetKeys={targetKeys}
        showSearch
        showSelectAll={false}
        onChange={(keys) => handleTransferTargetChange(keys.filter((key): key is string => typeof key === 'string'))}
        filterOption={fieldTransferFilterOption}
        leftColumns={leftColumns}
        rightColumns={rightColumns}
      />
    </Flex>
  );
};

const FilterEditor: React.FC<{
  value?: FilterValue;
  onChange?: (value: FilterValue) => void;
  collection?: CollectionLike;
}> = ({ value, onChange, collection }) => {
  const t = useT();
  const flowContext = useFlowContext();
  const filterValue = useMemo(
    () => observable(cloneJsonValue(value || { logic: '$and', items: [] })) as FilterValue,
    [value],
  );

  useEffect(() => {
    if (!collection) {
      return;
    }
    flowContext.model.context.defineProperty('collection', {
      get: () => collection,
      meta: createCollectionContextMeta(() => collection as Collection, t('Current collection')),
    });
  }, [collection, flowContext, t]);

  return (
    <FilterGroup
      value={filterValue}
      onChange={(nextValue) => onChange?.(cloneJsonValue(nextValue))}
      FilterItem={(props) => <VariableFilterItem {...props} model={flowContext.model} />}
    />
  );
};

const renderPreviewValue = (value: unknown, field?: FieldLike, t?: (key: string) => string) => {
  if (value == null) {
    return '';
  }
  if (field?.type === 'date') {
    return dayjs(value as string).format('YYYY-MM-DD HH:mm:ss');
  }
  if (typeof value === 'string') {
    return t ? t(value) : value;
  }
  return JSON.stringify(value);
};

const PreviewPanel: React.FC<{
  manager?: DataSourceManagerLike;
  preview: PreviewResult | null;
  previewing: boolean;
  collection?: string[];
  onRefresh: () => void;
}> = ({ manager, preview, previewing, collection, onRefresh }) => {
  const t = useT();
  const collectionDisplayName = getCollectionDisplayName(manager, collection) || '';
  const title = `${t('Collection')}: ${collectionDisplayName}`;
  const currentCollection = preview?.options
    ? getCurrentCollection(manager, [preview.options.datasource || '', preview.options.collectionName || ''])
    : getCurrentCollection(manager, collection);
  const collectionFields = useMemo(() => {
    const names = preview?.options?.fields || [];
    const fields = currentCollection?.getFields?.() || [];
    return names
      .map((name) => fields.find((field) => field.name === name) || { name, title: name })
      .filter((field): field is FieldLike => !!field);
  }, [currentCollection, preview?.options?.fields]);
  const dataSource = useMemo(
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
      collectionFields.map((field) => ({
        key: field.name,
        title: (
          <Typography.Text style={{ minWidth: 100, maxWidth: 300 }} ellipsis={{ tooltip: field.title || field.name }}>
            {field.title || field.name}
          </Typography.Text>
        ),
        dataIndex: field.name,
        width: 'auto',
        render: (value: unknown) => (
          <Typography.Text
            style={{ minWidth: 100, maxWidth: 300 }}
            ellipsis={{ tooltip: renderPreviewValue(value, field, t) }}
          >
            {renderPreviewValue(value, field, t)}
          </Typography.Text>
        ),
      })),
    [collectionFields, t],
  );
  const jsonText = JSON.stringify(dataSource, null, 2);

  return (
    <div style={{ padding: '16px' }}>
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
                style={{ borderTop: 'none', borderTopLeftRadius: 0 }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Table
                    columns={columns}
                    dataSource={dataSource}
                    loading={previewing}
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
                extra={<Typography.Text copyable={{ text: jsonText }} />}
                style={{ borderTop: 'none', borderTopLeftRadius: 0 }}
              >
                <Typography.Paragraph>
                  {!previewing ? (
                    <pre style={{ height: '62vh', overflowY: 'auto', marginTop: 24 }}>{jsonText}</pre>
                  ) : null}
                </Typography.Paragraph>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

const DatasourceForm: React.FC<{
  manager?: DataSourceManagerLike;
  preview: PreviewResult | null;
  previewing: boolean;
  editing: boolean;
  currentStep: number;
  mode: DatasourceFormMode;
  onPreview: () => void;
  onStepChange?: (step: number) => void;
}> = ({ manager, preview, previewing, editing, currentStep, mode, onPreview, onStepChange }) => {
  const t = useT();
  const form = Form.useFormInstance<DatasourceFormValues>();
  const collection = Form.useWatch('collection', form);
  const collectionDisplayName = getCollectionDisplayName(manager, collection);
  const currentCollection = getCurrentCollection(manager, collection);
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
                form.setFieldsValue({
                  fields: [],
                  filter: { logic: '$and', items: [] },
                  sort: [],
                });
              }}
            />
          </Form.Item>
          <Form.Item name="description" label={t('Description')} preserve>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Flex justify="space-between" align="center">
            <Form.Item name="limit" label={t('Limit')} rules={[{ required: true }]} layout="horizontal" preserve>
              <InputNumber min={1} max={20000} step={100} changeOnWheel />
            </Form.Item>
            <Form.Item
              name="enabled"
              label={t('Enabled')}
              valuePropName="checked"
              rules={[{ required: true }]}
              layout="horizontal"
              preserve
            >
              <Switch />
            </Form.Item>
          </Flex>
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <Form.Item label={t('Collection')}>
            <Input value={collectionDisplayName} disabled />
          </Form.Item>
          <Form.Item
            name="fields"
            label={t('Fields')}
            rules={[{ required: true, message: t('Please select fields') }]}
            preserve
          >
            <FieldsTransfer manager={manager} collection={collection} />
          </Form.Item>
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <Form.Item label={t('Collection')}>
            <Input value={collectionDisplayName} disabled />
          </Form.Item>
          <Form.Item name="filter" label={t('Filter group')} preserve>
            <FilterEditor collection={currentCollection} />
          </Form.Item>
        </>
      );
    }
    if (step === 3) {
      return (
        <>
          <Form.Item label={t('Collection')}>
            <Input value={collectionDisplayName} disabled />
          </Form.Item>
          <Form.Item name="sort" label={t('Sort Fields')} preserve>
            <SortFieldsTransfer manager={manager} collection={collection} />
          </Form.Item>
        </>
      );
    }
    return (
      <Spin spinning={previewing}>
        <PreviewPanel
          manager={manager}
          preview={preview}
          previewing={previewing}
          collection={collection}
          onRefresh={onPreview}
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
      <Divider dashed />
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
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const manager = app.dataSourceManager as DataSourceManagerLike | undefined;
  const [records, setRecords] = useState<AIContextDatasourceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listContextDatasources(app.apiClient);
      setRecords(result.data);
      setTotal(result.total ?? result.data.length);
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
    ctx.viewer.open({
      type: 'drawer',
      width: '50%',
      closable: true,
      content: <DatasourceDrawerContent manager={manager} onSubmitted={refresh} />,
    });
  };

  const openDetailDrawer = (record: AIContextDatasourceRecord) => {
    ctx.viewer.open({
      type: 'drawer',
      width: '50%',
      closable: true,
      content: <DatasourceDrawerContent record={record} manager={manager} onSubmitted={refresh} />,
    });
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
    <>
      {records.length === 0 && !loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
          <Card style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button icon={<PlusOutlined />} type="primary" onClick={openCreateDrawer}>
                {t('Create a new datasource')}
              </Button>
            </Empty>
          </Card>
        </div>
      ) : (
        <div style={{ width: '100%', overflowX: 'auto', padding: token.paddingXS }}>
          <Space direction="vertical" size="large" style={{ width: '100%', minWidth: 1200 }}>
            <Flex justify="flex-end" align="center">
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
                  {t('Add datasource')}
                </Button>
              </Space>
            </Flex>
            <List
              grid={{ gutter: token.margin, column: 4 }}
              dataSource={records}
              loading={loading}
              pagination={{
                showSizeChanger: false,
                total,
                pageSize: 16,
              }}
              renderItem={(record) => (
                <List.Item>
                  <Card
                    hoverable
                    variant="borderless"
                    style={{ minWidth: 300, display: 'flex', flexDirection: 'column' }}
                    onClick={() => openDetailDrawer(record)}
                  >
                    <Card.Meta
                      title={
                        <Flex justify="space-between" align="center">
                          <span>{record.title}</span>
                          <span onClick={(event) => event.stopPropagation()}>
                            <EnabledSwitch record={record} onUpdated={refresh} />
                          </span>
                        </Flex>
                      }
                      description={
                        <Space style={{ fontSize: token.fontSizeSM }}>
                          <Typography.Text type="secondary">{t('Collection')}</Typography.Text>
                          <Typography.Text>{`${record.datasource}/${record.collectionName}`}</Typography.Text>
                          <Divider type="vertical" />
                          <Typography.Text type="secondary">{t('Limit')}</Typography.Text>
                          <Typography.Text>{record.limit}</Typography.Text>
                        </Space>
                      }
                    />
                    <div
                      style={{
                        height: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        paddingTop: token.paddingSM,
                      }}
                    >
                      <div style={{ width: '100%', height: 90 }}>
                        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                          {record.description}
                        </Typography.Paragraph>
                      </div>
                      <div style={{ marginTop: 'auto' }}>
                        <Flex justify="space-between" align="center">
                          <Space style={{ fontSize: token.fontSizeSM - 2 }}>
                            <Typography.Text type="secondary">
                              {record.createdAt
                                ? `${t('Created at')} ${dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}`
                                : null}
                            </Typography.Text>
                          </Space>
                          <Tooltip title={t('Delete')}>
                            <Button
                              type="link"
                              icon={<DeleteOutlined />}
                              aria-label={t('Delete')}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(record);
                              }}
                            />
                          </Tooltip>
                        </Flex>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </Space>
        </div>
      )}
    </>
  );
};

const DatasourceDrawerContent: React.FC<{
  record?: AIContextDatasourceRecord;
  manager?: DataSourceManagerLike;
  onSubmitted: () => Promise<void>;
}> = ({ record, manager, onSubmitted }) => {
  const app = useApp();
  const ctx = useFlowContext();
  const t = useT();
  const { message } = App.useApp();
  const { token: themeToken } = theme.useToken();
  const [form] = Form.useForm<DatasourceFormValues>();
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formDirty, setFormDirty] = useState(false);
  const mode: DrawerMode = record ? 'edit' : 'create';
  const initialValues = useMemo(() => (record ? toDatasourceFormValues(record) : createInitialValues()), [record]);
  const { Header, Footer } = ctx.view;

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const requestClose = useUnsavedChangesBeforeClose({
    view: ctx.view,
    form,
    initialValues,
    dirty: formDirty,
    title: t('Unsaved changes'),
    content: t("Are you sure you don't want to save?"),
  });

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
      if (record) {
        await updateContextDatasource(app.apiClient, record.id, values);
        message.success(t('Saved successfully'));
      } else {
        await createContextDatasource(app.apiClient, values);
        message.success(t('Processing complete!'));
      }
      await onSubmitted();
      await ctx.view.close(undefined, true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title={record ? t('Edit datasource') : t('Add datasource')} />
      <Spin spinning={saving}>
        <Form<DatasourceFormValues>
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onValuesChange={() => setFormDirty(true)}
        >
          <DatasourceForm
            manager={manager}
            preview={preview}
            previewing={previewing}
            editing={!!record}
            currentStep={currentStep}
            mode={record ? 'tabs' : 'steps'}
            onStepChange={handleDetailTabChange}
            onPreview={() => {
              handlePreview().catch((error: unknown) => {
                console.error(error);
                setPreviewing(false);
              });
            }}
          />
        </Form>
      </Spin>
      <Footer>
        {mode === 'edit' ? (
          <Flex justify="flex-end" align="center">
            <Space>
              <Button onClick={requestClose}>{t('Cancel')}</Button>
              <Button type="primary" loading={saving} onClick={() => form.submit()}>
                {t('Submit')}
              </Button>
            </Space>
          </Flex>
        ) : (
          <Flex justify="flex-end" align="end">
            <Space>
              <Button
                style={{ margin: `0 ${themeToken.marginXS}px` }}
                onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                disabled={currentStep === 0}
              >
                {t('Previous')}
              </Button>
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
        )}
      </Footer>
    </>
  );
};

export default DatasourceSettingsPage;
