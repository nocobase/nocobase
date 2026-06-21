/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined, RightSquareOutlined } from '@ant-design/icons';
import { DrawerFormLayout } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import type {
  CollectionTemplateConfigureItemProps,
  CollectionTemplateSyncFieldsProps,
} from '@nocobase/plugin-data-source-manager/client-v2';
import { useRequest } from 'ahooks';
import { Alert, App, Button, Cascader, Form, Input, Select, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { get } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { compileLegacyTemplate } from '@nocobase/plugin-data-source-manager/client-v2';

export type SqlPreviewField = {
  collection?: string;
  interface?: string;
  source?: string | string[];
  type?: string;
  uiSchema?: Record<string, unknown>;
};

export type SqlPreviewResult = {
  data?: Array<Record<string, unknown>>;
  error?: string;
  fields?: Record<string, SqlPreviewField>;
  sources?: string[];
};

type CollectionRecord = {
  fields?: SqlFieldRecord[];
  inherits?: string[];
  name?: string;
  title?: React.ReactNode;
};

export type SqlFieldRecord = {
  interface?: string;
  name: string;
  source?: string | string[] | null;
  type?: string;
  uiSchema?: Record<string, unknown>;
};

type FieldInterfaceRecord = {
  default?: {
    type?: string;
    uiSchema?: Record<string, unknown>;
  };
  name?: string;
  title?: React.ReactNode;
  availableTypes?: string[];
};

type FieldInterfaceManager = {
  getFieldInterface?: (name?: string) => FieldInterfaceRecord | undefined;
  getFieldInterfaceGroups?: () => Record<string, { label?: React.ReactNode; order?: number }>;
  getFieldInterfaces?: () => Array<Record<string, unknown>>;
};

const relationTypes = new Set(['hasOne', 'hasMany', 'belongsToMany', 'belongsTo']);
const internalPreviewName = '__sqlPreview';

function normalizeListResponse(response: unknown) {
  const payload = get(response, 'data.data');
  if (Array.isArray(payload)) {
    return payload;
  }
  const nested = get(payload, 'data');
  return Array.isArray(nested) ? nested : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isSqlPreviewPayload(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.data) ||
    isRecord(value.fields) ||
    Array.isArray(value.sources) ||
    typeof value.error === 'string'
  );
}

export function normalizeSqlPreviewResult(value: unknown): SqlPreviewResult {
  const candidates = [value, get(value, 'data'), get(value, 'data.data'), get(value, 'data.data.data')];
  const payload = candidates.find(isSqlPreviewPayload);

  if (!payload) {
    return {
      data: [],
      fields: {},
      sources: [],
    };
  }

  return {
    data: Array.isArray(payload.data) ? (payload.data as Array<Record<string, unknown>>) : [],
    error: typeof payload.error === 'string' ? payload.error : undefined,
    fields: isRecord(payload.fields) ? (payload.fields as Record<string, SqlPreviewField>) : {},
    sources: Array.isArray(payload.sources) ? (payload.sources.filter(Boolean) as string[]) : [],
  };
}

function inferFieldInterface(field: string, value: unknown) {
  if (field.toLowerCase() === 'id') {
    return 'id';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  if (typeof value === 'boolean') {
    return 'checkbox';
  }
  if (typeof value === 'string' && dayjs(value).isValid()) {
    return 'datetime';
  }
  return 'input';
}

function normalizeFieldSource(source?: string | string[] | null) {
  if (Array.isArray(source)) {
    return source.filter(Boolean).join('.') || null;
  }
  return source || null;
}

function getFieldTitle(field: SqlFieldRecord) {
  const options = getFieldOptions(field);
  return (options.uiSchema?.title as React.ReactNode) || options.title || options.name;
}

function getFieldOptions(field: any) {
  return field?.options || field || {};
}

function getCollectionOptions(collections: CollectionRecord[], t: (key: string) => string) {
  return collections
    .filter((collection) => collection.name)
    .map((collection) => ({
      value: collection.name,
      label: compileLegacyTemplate(collection.title || collection.name, t),
    }));
}

function getFieldInterfaceOptions(manager: {
  getFieldInterfaceGroups?: () => Record<string, { label?: React.ReactNode; order?: number }>;
  getFieldInterfaces?: () => Array<Record<string, unknown>>;
}) {
  const groups = manager?.getFieldInterfaceGroups?.() || {};
  const interfaces = manager?.getFieldInterfaces?.() || [];
  const grouped = new Map<
    string,
    Array<{ availableTypes?: string[]; defaultType?: string; label: React.ReactNode; value: string }>
  >();

  interfaces
    .filter((fieldInterface) => fieldInterface.name && fieldInterface.group !== 'relation')
    .forEach((fieldInterface) => {
      const group = String(fieldInterface.group || 'other');
      const items = grouped.get(group) || [];
      items.push({
        value: String(fieldInterface.name),
        label: (fieldInterface.title as React.ReactNode) || String(fieldInterface.name),
        availableTypes: fieldInterface.availableTypes as string[] | undefined,
        defaultType: (fieldInterface.default as { type?: string } | undefined)?.type,
      });
      grouped.set(group, items);
    });

  return Array.from(grouped.entries())
    .sort(([groupA], [groupB]) => (groups[groupA]?.order ?? 0) - (groups[groupB]?.order ?? 0))
    .map(([group, options]) => ({
      label: groups[group]?.label || group,
      options,
    }));
}

function getSourceFieldOptions(options: {
  collections: CollectionRecord[];
  dataSource?: { getCollection?: (name: string) => any };
  sources: string[];
  t: (key: string) => string;
}) {
  const { collections, dataSource, sources, t } = options;

  return sources
    .map((source) => collections.find((collection) => collection.name === source))
    .filter(Boolean)
    .map((collection) => {
      const runtimeCollection = collection.name ? dataSource?.getCollection?.(collection.name) : undefined;
      const fields =
        typeof runtimeCollection?.getFields === 'function' ? runtimeCollection.getFields() : collection.fields || [];
      return {
        value: collection.name,
        label: compileLegacyTemplate(collection.title || runtimeCollection?.title || collection.name, t),
        children: fields
          .map(getFieldOptions)
          .filter((field) => field.name && !relationTypes.has(String(field.type)))
          .map((field) => ({
            value: field.name,
            label: compileLegacyTemplate(getFieldTitle(field), t),
          })),
      };
    });
}

function findSourceField(
  collections: CollectionRecord[],
  sourcePath?: string[],
  dataSource?: { getCollection?: (name: string) => any },
) {
  if (!sourcePath?.length) {
    return undefined;
  }
  const [collectionName, fieldName] = sourcePath;
  const runtimeCollection = dataSource?.getCollection?.(collectionName);
  const fields =
    typeof runtimeCollection?.getFields === 'function'
      ? runtimeCollection.getFields().map(getFieldOptions)
      : collections.find((collection) => collection.name === collectionName)?.fields || [];
  return fields.find((field) => field.name === fieldName);
}

function getSqlFieldInterfaceOptions(groups: ReturnType<typeof getFieldInterfaceOptions>, fieldType?: string) {
  return groups
    .map((group) => ({
      label: group.label,
      options: group.options.filter((option) => {
        if (!fieldType) {
          return true;
        }
        return option.availableTypes?.includes(fieldType) || option.defaultType === fieldType;
      }),
    }))
    .filter((group) => group.options.length);
}

function getSqlSyncErrorMessage(error: unknown, fallback: string) {
  const typedError = error as
    | {
        message?: string;
        response?: {
          data?: {
            errors?: Array<{ message?: string }>;
          };
        };
      }
    | undefined;
  return (
    typedError?.response?.data?.errors
      ?.map((item) => item.message)
      .filter(Boolean)
      .join('\n') ||
    typedError?.message ||
    fallback
  );
}

function getSqlFormValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

export function buildSqlFieldsFromPreview(options: {
  currentFields?: SqlFieldRecord[];
  manager?: FieldInterfaceManager;
  preview?: SqlPreviewResult;
}) {
  const { currentFields = [], manager, preview } = options;
  const nextFields = new Map<string, SqlFieldRecord>();
  const previewFields = preview?.fields || {};
  const firstRow = preview?.data?.[0] || {};

  if (Object.keys(firstRow).length) {
    Object.entries(firstRow).forEach(([column, value]) => {
      const previewField = previewFields[column];
      const fieldInterface = previewField?.interface || inferFieldInterface(column, value);
      const defaultConfig = manager?.getFieldInterface?.(fieldInterface)?.default || {};
      const uiSchema = previewField?.uiSchema || defaultConfig.uiSchema || {};
      nextFields.set(column, {
        name: column,
        interface: fieldInterface,
        type: previewField?.type || defaultConfig.type,
        source: previewField?.source,
        uiSchema: {
          title: column,
          ...uiSchema,
        },
      });
    });
  } else {
    Object.entries(previewFields).forEach(([column, field]) => {
      nextFields.set(column, {
        name: column,
        type: 'string',
        ...field,
        uiSchema: {
          title: column,
          ...(field.uiSchema || {}),
        },
      });
    });
  }

  currentFields.forEach((field) => {
    if (field?.name && nextFields.has(field.name)) {
      nextFields.set(field.name, field);
    }
  });

  return Array.from(nextFields.values());
}

function useCollections() {
  const ctx = useFlowContext();

  return useRequest(async () => {
    const response = await ctx.api.request({
      url: 'dataSources/main/collections:list',
      params: {
        paginate: false,
        sort: ['sort'],
        filter: {
          'hidden.$isFalsy': true,
        },
        appends: ['fields'],
      },
    });
    return normalizeListResponse(response) as CollectionRecord[];
  });
}

function SqlStatementControl(props: {
  editing: boolean;
  loading: boolean;
  onChange?: (value?: string) => void;
  onConfirm: () => void;
  onEdit: () => void;
  onExecute: () => void;
  onValueChange?: (value?: string) => void;
  t: (key: string) => string;
  value?: string;
}) {
  const { editing, loading, onChange, onConfirm, onEdit, onExecute, onValueChange, t, value } = props;

  return (
    <div>
      <Input.TextArea
        autoSize={{ minRows: 5 }}
        disabled={!editing}
        value={value}
        onChange={(event) => {
          onValueChange?.(event.target.value);
          onChange?.(event.target.value);
        }}
      />
      <Space size={8} style={{ marginTop: 4 }}>
        <Button
          ghost
          icon={<EditOutlined />}
          loading={loading && editing}
          size="small"
          type="primary"
          onClick={editing ? onConfirm : onEdit}
        >
          {editing ? t('Confirm') : t('Edit')}
        </Button>
        <Button ghost icon={<RightSquareOutlined />} loading={loading} size="small" type="primary" onClick={onExecute}>
          {t('Execute')}
        </Button>
      </Space>
    </div>
  );
}

export function SqlStatementConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = ctx.t;
  const initialSql = getSqlFormValue(props.form.getFieldValue('sql'));
  const [editing, setEditing] = useState(() => !initialSql);
  const sql = Form.useWatch('sql', props.form);
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager as FieldInterfaceManager;
  const autoPreviewRunRef = useRef(false);
  const confirmedSqlRef = useRef<string | undefined>(initialSql);
  const editingRef = useRef(!initialSql);
  const markEditing = useCallback(() => {
    editingRef.current = true;
    setEditing(true);
  }, []);
  const markUnconfirmed = useCallback(() => {
    confirmedSqlRef.current = undefined;
    editingRef.current = true;
    setEditing(true);
  }, []);
  const markConfirmed = useCallback(
    (value: string) => {
      confirmedSqlRef.current = value;
      editingRef.current = false;
      setEditing(false);
      props.form.setFields([{ name: 'sql', errors: [] }]);
    },
    [props.form],
  );
  const request = useRequest(
    async (statement: string) => {
      const response = await ctx.api.resource('sqlCollection').execute({
        values: {
          sql: statement,
        },
      });
      return normalizeSqlPreviewResult(response);
    },
    {
      manual: true,
    },
  );
  const applyPreviewResult = useCallback(
    (data?: SqlPreviewResult) => {
      const previewResult = normalizeSqlPreviewResult(data);
      const currentSources = props.form.getFieldValue('sources') || [];
      const currentFields = props.form.getFieldValue('fields') || [];
      const nextFields = buildSqlFieldsFromPreview({
        currentFields: Array.isArray(currentFields) ? currentFields : [],
        manager,
        preview: previewResult,
      });
      props.form.setFieldValue(
        'sources',
        Array.from(
          new Set([...(Array.isArray(currentSources) ? currentSources : []), ...(previewResult.sources || [])]),
        ),
      );
      props.form.setFieldValue(internalPreviewName, previewResult);
      props.form.setFieldValue('fields', nextFields);
    },
    [manager, props.form],
  );
  const applyPreviewError = useCallback(
    (error: unknown) => {
      const typedError = error as Record<string, unknown> | undefined;
      const errors = get(typedError, 'response.data.errors') as Array<{ message?: string }> | undefined;
      const message =
        errors
          ?.map((item) => item.message)
          .filter(Boolean)
          .join('\n') || get(typedError, 'message');
      props.form.setFieldValue(internalPreviewName, {
        error: message || t('SQL error'),
      });
      markUnconfirmed();
    },
    [markUnconfirmed, props.form, t],
  );
  const runSql = useCallback(
    async (options: { confirm?: boolean } = {}) => {
      const currentSql = getSqlFormValue(props.form.getFieldValue('sql')) || getSqlFormValue(sql);
      if (!currentSql) {
        return;
      }
      try {
        const data = await request.runAsync(currentSql);
        applyPreviewResult(data);
        if (options.confirm) {
          markConfirmed(currentSql);
        }
      } catch (error) {
        applyPreviewError(error);
      }
    },
    [applyPreviewError, applyPreviewResult, markConfirmed, props.form, request, sql],
  );
  const handleConfirm = useCallback(async () => {
    if (!getSqlFormValue(props.form.getFieldValue('sql')) && !getSqlFormValue(sql)) {
      return;
    }
    await runSql({ confirm: true });
  }, [props.form, runSql, sql]);
  const handleExecute = useCallback(async () => {
    await runSql();
  }, [runSql]);

  useEffect(() => {
    if (autoPreviewRunRef.current || props.mode !== 'edit') {
      return;
    }

    const currentSql = getSqlFormValue(props.form.getFieldValue('sql')) || getSqlFormValue(sql);
    if (!currentSql) {
      return;
    }

    autoPreviewRunRef.current = true;
    const runInitialPreview = async () => {
      await runSql({ confirm: true });
    };
    runInitialPreview();
  }, [props.form, props.mode, runSql, sql]);

  return (
    <Form.Item
      name="sql"
      label={t('SQL')}
      rules={[
        { required: true },
        {
          validator() {
            const currentSql = getSqlFormValue(props.form.getFieldValue('sql')) || getSqlFormValue(sql);
            if (currentSql && confirmedSqlRef.current === currentSql && !editingRef.current) {
              return Promise.resolve();
            }
            return Promise.reject(new Error(t('Please confirm the SQL statement first')));
          },
        },
      ]}
    >
      <SqlStatementControl
        editing={editing}
        loading={request.loading}
        t={t}
        onValueChange={markUnconfirmed}
        onConfirm={handleConfirm}
        onEdit={markEditing}
        onExecute={handleExecute}
      />
    </Form.Item>
  );
}

export function SqlSourceCollectionsConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = ctx.t;
  const collectionsRequest = useCollections();
  const watchedSources = Form.useWatch('sources', props.form);
  const sources = useMemo(() => (Array.isArray(watchedSources) ? watchedSources : []), [watchedSources]);
  const options = useMemo(() => {
    const collectionOptions = getCollectionOptions(collectionsRequest.data || [], t);
    const missingOptions = sources
      .filter((source) => !collectionOptions.some((option) => option.value === source))
      .map((source) => ({ value: source, label: source }));

    return [...collectionOptions, ...missingOptions];
  }, [collectionsRequest.data, sources, t]);

  return (
    <Form.Item name="sources" label={t('Source collections')}>
      <Select mode="multiple" options={options} loading={collectionsRequest.loading} allowClear />
    </Form.Item>
  );
}

export function SqlFieldsConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = ctx.t;
  const collectionsRequest = useCollections();
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager as FieldInterfaceManager;
  const mainDataSource = ctx.dataSourceManager.getDataSource('main');
  const rawPreview = Form.useWatch(internalPreviewName, { form: props.form, preserve: true }) as
    | SqlPreviewResult
    | undefined;
  const preview = useMemo(() => normalizeSqlPreviewResult(rawPreview), [rawPreview]);
  const watchedSources = Form.useWatch('sources', props.form);
  const watchedFields = Form.useWatch('fields', props.form);
  const sources = useMemo(() => (Array.isArray(watchedSources) ? watchedSources : []), [watchedSources]);
  const fields = useMemo(() => (Array.isArray(watchedFields) ? watchedFields : []), [watchedFields]);
  const fieldOptions = useMemo(() => getFieldInterfaceOptions(manager), [manager]);
  const sourceFieldOptions = useMemo(
    () =>
      getSourceFieldOptions({
        collections: collectionsRequest.data || [],
        dataSource: mainDataSource,
        sources,
        t,
      }),
    [collectionsRequest.data, mainDataSource, sources, t],
  );
  const lastPreviewRef = useRef<SqlPreviewResult>();

  useEffect(() => {
    if (!rawPreview || lastPreviewRef.current === rawPreview) {
      return;
    }
    lastPreviewRef.current = rawPreview;

    const normalizedFields = buildSqlFieldsFromPreview({
      currentFields: fields,
      manager,
      preview,
    });
    if (normalizedFields.length) {
      props.form.setFieldValue('fields', normalizedFields);
    }
  }, [fields, manager, preview, props.form, rawPreview]);

  const updateField = useCallback(
    (index: number, nextField: SqlFieldRecord) => {
      const nextFields = [...fields];
      nextFields.splice(index, 1, {
        ...nextField,
        source: normalizeFieldSource(nextField.source),
      });
      props.form.setFieldValue('fields', nextFields);
    },
    [fields, props.form],
  );

  if (collectionsRequest.loading) {
    return <Spin />;
  }
  if (preview?.error) {
    return (
      <>
        <Form.Item name="fields" hidden rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={t('Fields')} required>
          <Alert showIcon message={`${t('SQL error: ')}${preview.error}`} type="error" />
        </Form.Item>
      </>
    );
  }

  if (!preview && !fields?.length) {
    return (
      <>
        <Form.Item name="fields" hidden rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={t('Fields')} required>
          <Alert showIcon message={t('Please use a valid SELECT or WITH AS statement')} />
        </Form.Item>
      </>
    );
  }
  if (!fields?.length) {
    return (
      <>
        <Form.Item name="fields" hidden rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={t('Fields')} required>
          <Alert showIcon message={t('Please use a valid SELECT or WITH AS statement')} />
        </Form.Item>
      </>
    );
  }

  const columns: ColumnsType<SqlFieldRecord> = [
    {
      title: t('Field name'),
      dataIndex: 'name',
      width: 130,
    },
    {
      title: t('Field source'),
      dataIndex: 'source',
      width: 220,
      render: (value, record, index) => (
        <Cascader
          allowClear
          options={sourceFieldOptions}
          placeholder={t('Select field source')}
          value={typeof value === 'string' ? value.split('.') : value}
          onChange={(nextValue) => {
            const sourcePath = nextValue as string[] | undefined;
            const sourceField = findSourceField(collectionsRequest.data || [], sourcePath, mainDataSource);
            updateField(index, {
              ...record,
              source: sourcePath,
              interface: sourceField?.interface || record.interface,
              type: sourceField?.type || record.type,
              uiSchema: (sourceField?.uiSchema as Record<string, unknown>) || record.uiSchema,
            });
          }}
        />
      ),
    },
    {
      title: t('Field interface'),
      dataIndex: 'interface',
      width: 180,
      render: (value, record, index) => {
        if (record.source) {
          const fieldInterface = manager?.getFieldInterface?.(value);
          return <Tag>{compileLegacyTemplate(fieldInterface?.title || value, t)}</Tag>;
        }

        return (
          <Select
            allowClear
            popupMatchSelectWidth={false}
            style={{ width: '100%' }}
            options={getSqlFieldInterfaceOptions(fieldOptions, record.type).map((group) => ({
              label: compileLegacyTemplate(group.label, t),
              options: group.options.map((option) => ({
                value: option.value,
                label: compileLegacyTemplate(option.label, t),
              })),
            }))}
            value={value || 'input'}
            onChange={(nextInterface) => {
              const fieldInterface = manager?.getFieldInterface?.(nextInterface);
              updateField(index, {
                ...record,
                interface: nextInterface || null,
                type: fieldInterface?.default?.type || record.type,
                uiSchema: {
                  ...(fieldInterface?.default?.uiSchema || {}),
                  title: fieldInterface?.default?.uiSchema?.title || record.uiSchema?.title,
                },
              });
            }}
          />
        );
      },
    },
    {
      title: t('Field display name'),
      dataIndex: ['uiSchema', 'title'],
      width: 180,
      render: (_, record, index) => (
        <Input
          value={(record.uiSchema?.title as string) || record.name}
          onChange={(event) => {
            updateField(index, {
              ...record,
              uiSchema: {
                ...(record.uiSchema || {}),
                title: event.target.value,
              },
            });
          }}
        />
      ),
    },
  ];

  return (
    <Form.Item label={t('Fields')} required>
      <Form.Item name="fields" hidden rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Table
        bordered
        columns={columns}
        dataSource={fields}
        pagination={false}
        rowKey="name"
        scroll={{ y: 300 }}
        size="small"
      />
    </Form.Item>
  );
}

export function SqlPreviewConfigureItem(props: CollectionTemplateConfigureItemProps) {
  const ctx = useFlowContext();
  const t = ctx.t;
  const rawPreview = Form.useWatch(internalPreviewName, { form: props.form, preserve: true }) as
    | SqlPreviewResult
    | undefined;
  const preview = useMemo(() => normalizeSqlPreviewResult(rawPreview), [rawPreview]);
  const watchedFields = Form.useWatch('fields', props.form);
  const fields = useMemo(() => (Array.isArray(watchedFields) ? watchedFields : []), [watchedFields]);
  const titleMap = useMemo(() => {
    return fields.reduce<Record<string, React.ReactNode>>((memo, field) => {
      if (field?.name) {
        memo[field.name] = field.uiSchema?.title || field.name;
      }
      return memo;
    }, {});
  }, [fields]);
  const previewColumnKeys = useMemo(() => {
    const fieldNames = fields.map((field) => field?.name).filter((name): name is string => !!name);
    if (fieldNames.length) {
      return fieldNames;
    }
    return Object.keys(preview?.data?.[0] || {});
  }, [fields, preview?.data]);
  const columns = useMemo<ColumnsType<Record<string, unknown>>>(() => {
    return previewColumnKeys.map((column) => ({
      title: compileLegacyTemplate(titleMap[column] || column, t),
      dataIndex: column,
      key: column,
    }));
  }, [previewColumnKeys, t, titleMap]);
  const dataSource = useMemo(() => {
    return (preview?.data || []).map((record, index) => ({
      ...Object.entries(record).reduce<Record<string, unknown>>((memo, [key, value]) => {
        memo[key] = typeof value === 'string' ? compileLegacyTemplate(value, t) : value;
        return memo;
      }, {}),
      key: index,
    }));
  }, [preview?.data, t]);

  return (
    <Form.Item label={t('Preview')}>
      <Table
        bordered
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowKey="key"
        scroll={{ x: Math.max(columns.length * 150, 300), y: 300 }}
      />
    </Form.Item>
  );
}

export function normalizeSqlCollectionSubmitValues(values: Record<string, unknown>) {
  const submitValues = { ...values };
  delete submitValues[internalPreviewName];
  if (Array.isArray(submitValues.fields)) {
    submitValues.fields = submitValues.fields.map((field) => ({
      ...(field as Record<string, unknown>),
      source: normalizeFieldSource((field as SqlFieldRecord).source),
    }));
  }
  return submitValues;
}

export function getSqlPreviewInternalName() {
  return internalPreviewName;
}

export function SqlSyncFieldsDrawer(props: CollectionTemplateSyncFieldsProps) {
  const ctx = useFlowContext();
  const t = ctx.t;
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const previewName = getSqlPreviewInternalName();

  useEffect(() => {
    form.setFieldsValue(props.collection);
  }, [form, props.collection]);

  useEffect(() => {
    let ignore = false;

    const loadPreview = async () => {
      const sql = props.collection.sql;
      if (!sql) {
        return;
      }

      try {
        const response = await ctx.api.resource('sqlCollection').execute({
          values: {
            sql,
          },
        });
        if (ignore) {
          return;
        }
        const preview = normalizeSqlPreviewResult(response);
        const currentSources = props.collection.sources || [];
        const currentFields = props.collection.fields || [];
        form.setFieldsValue({
          sources: Array.from(
            new Set([
              ...(Array.isArray(currentSources) ? currentSources : []),
              ...(Array.isArray(preview.sources) ? preview.sources : []),
            ]),
          ),
          fields: buildSqlFieldsFromPreview({
            currentFields: Array.isArray(currentFields) ? currentFields : [],
            manager: ctx.dataSourceManager.collectionFieldInterfaceManager,
            preview,
          }),
          [previewName]: preview,
        });
      } catch (error) {
        if (!ignore) {
          form.setFieldValue(previewName, {
            error: getSqlSyncErrorMessage(error, t('SQL error')),
          });
        }
      }
    };

    loadPreview();

    return () => {
      ignore = true;
    };
  }, [ctx.api, ctx.dataSourceManager.collectionFieldInterfaceManager, form, previewName, props.collection, t]);

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await ctx.api.resource('sqlCollection').setFields({
        filterByTk: props.collection.name,
        values: {
          fields: values.fields,
          sources: values.sources,
        },
      });
      await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
      props.onSubmitted();
      message.success(t('Sync successfully'));
    } finally {
      setSubmitting(false);
    }
  }, [ctx.api, ctx.dataSourceManager, form, message, props, t]);

  return (
    <DrawerFormLayout
      title={t('Sync from database')}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      onSubmit={handleSubmit}
    >
      <Form form={form} layout="vertical" initialValues={props.collection}>
        <SqlSourceCollectionsConfigureItem form={form} mode="edit" template={{ title: '', name: 'sql' }} item={{}} />
        <SqlFieldsConfigureItem form={form} mode="edit" template={{ title: '', name: 'sql' }} item={{}} />
        <SqlPreviewConfigureItem form={form} mode="edit" template={{ title: '', name: 'sql' }} item={{}} />
      </Form>
    </DrawerFormLayout>
  );
}
