/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { DrawerFormLayout, isTitleField, Table, useCurrentAppInfo } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button, Dropdown, Form, Select, Space, Spin, Switch, Tag, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../../locale';
import { PluginDataSourceManagerClientV2 } from '../../plugin';
import { compileLegacyTemplate } from '../../utils/compileLegacyTemplate';
import { getCollectionFieldActionUrl } from './collectionFieldApi';
import { filterFieldInterfacesByCollectionTemplate } from './collectionTemplateFieldInterfaces';
import { FieldForm } from './FieldForm';
import {
  buildSqlFieldsFromPreview,
  getSqlPreviewInternalName,
  normalizeSqlPreviewResult,
  SqlFieldsConfigureItem,
  SqlPreviewConfigureItem,
  SqlSourceCollectionsConfigureItem,
} from './SqlCollectionConfigure';

interface FieldsPageProps {
  dataSourceKey: string;
  collection: Record<string, any>;
}

type FieldInterfaceOption = {
  name: string;
  title?: React.ReactNode;
  label?: React.ReactNode;
  group?: string;
  order?: number;
  hidden?: boolean;
  isAssociation?: boolean;
  availableTypes?: string[];
  default?: Record<string, any>;
};

type FieldInterfaceGroupOption = {
  key: string;
  label: React.ReactNode;
  order?: number;
  children: FieldInterfaceOption[];
};

function normalizeListResponse(response: any) {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : [];
}

const fallbackFieldInterfaceGroups: Record<string, { label: string; order: number }> = {
  basic: { label: 'Basic', order: 1 },
  choices: { label: 'Choices', order: 20 },
  media: { label: 'Media', order: 40 },
  datetime: { label: 'Date & Time', order: 80 },
  relation: { label: 'Relation', order: 100 },
  advanced: { label: 'Advanced type', order: 200 },
  systemInfo: { label: 'System info', order: 400 },
  others: { label: 'Others', order: 800 },
};

const readOnlyRelationInterfaces = new Set(['obo', 'oho', 'o2m', 'm2o', 'm2m', 'o2o']);

const readOnlyPresetFieldInterfaces = new Set(['snowflakeId', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']);

function getFieldInterfaces(ctx: any, dataSourceType?: string) {
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager;
  return (manager?.getFieldInterfaces?.(dataSourceType) || []) as FieldInterfaceOption[];
}

function getFieldInterfaceOptions(ctx: any, dataSourceType?: string) {
  const manager = ctx.dataSourceManager.collectionFieldInterfaceManager;
  const fieldInterfaces = getFieldInterfaces(ctx, dataSourceType);
  const fieldGroups = {
    ...fallbackFieldInterfaceGroups,
    ...(manager?.getFieldInterfaceGroups?.() || {}),
  };
  const grouped = fieldInterfaces.reduce<Record<string, FieldInterfaceOption[]>>((memo, fieldInterface) => {
    if (fieldInterface.hidden) {
      return memo;
    }
    const group = fieldInterface.group || 'basic';
    memo[group] = memo[group] || [];
    memo[group].push(fieldInterface);
    return memo;
  }, {});

  return Object.keys(fieldGroups)
    .map((groupName) => {
      const group = fieldGroups[groupName];
      return {
        ...group,
        key: groupName,
        children: (grouped[groupName] || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      };
    })
    .filter((group) => group.children.length)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) as FieldInterfaceGroupOption[];
}

function filterFieldInterfacesByTemplate(
  fieldInterfaces: FieldInterfaceOption[],
  collection: Record<string, any>,
  ctx: any,
  databaseDialect?: string,
) {
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const template = plugin?.getCollectionTemplate?.(collection.template || 'general');
  return filterFieldInterfacesByCollectionTemplate(fieldInterfaces, template, collection, { databaseDialect });
}

function filterFieldInterfaceGroupsByTemplate(
  groups: FieldInterfaceGroupOption[],
  collection: Record<string, any>,
  ctx: any,
  databaseDialect?: string,
) {
  return groups
    .map((group) => ({
      ...group,
      children: filterFieldInterfacesByTemplate(group.children, collection, ctx, databaseDialect),
    }))
    .filter((group) => group.children.length);
}

function filterCreatableFieldInterfaces(groups: FieldInterfaceGroupOption[], collection: Record<string, any>) {
  const isViewCollection = collection.template === 'view' || collection.view;

  return groups
    .map((group) => ({
      ...group,
      children: group.children.filter((fieldInterface) => {
        if (isViewCollection) {
          return fieldInterface.name === 'm2o';
        }
        return !['o2o', 'subTable', 'linkTo'].includes(fieldInterface.name);
      }),
    }))
    .filter((group) => group.children.length);
}

function isFieldInterfaceCompatible(fieldInterface: FieldInterfaceOption, field: Record<string, any>) {
  if (fieldInterface.name === field.interface) {
    return true;
  }
  return fieldInterface.availableTypes?.includes(field.type) || fieldInterface.default?.type === field.type;
}

function getSelectableFieldInterfaceGroups(groups: FieldInterfaceGroupOption[], field: Record<string, any>) {
  return groups
    .map((group) => ({
      ...group,
      children: group.children.filter((fieldInterface) => isFieldInterfaceCompatible(fieldInterface, field)),
    }))
    .filter((group) => {
      if (field.type === 'sort') {
        return group.key === 'advanced' && group.children.length;
      }
      return group.children.length;
    });
}

function getFieldInterfaceLabel(fieldInterface?: FieldInterfaceOption, fallback?: React.ReactNode) {
  return fieldInterface?.title || fieldInterface?.label || fallback || fieldInterface?.name;
}

function isReadOnlyFieldInterface(record: Record<string, any>, currentFieldInterface?: FieldInterfaceOption) {
  return (
    record.source ||
    readOnlyRelationInterfaces.has(record.interface) ||
    readOnlyPresetFieldInterfaces.has(record.interface) ||
    currentFieldInterface?.isAssociation ||
    currentFieldInterface?.group === 'systemInfo'
  );
}

function getCollectionUpdateActionUrl(dataSourceKey: string) {
  return dataSourceKey === 'main' ? 'collections:update' : `dataSources/${dataSourceKey}/collections:update`;
}

function isSqlCollection(collection: Record<string, any>) {
  return collection.template === 'sql';
}

function isSyncFieldsVisible(dataSourceKey: string, collection: Record<string, any>) {
  if (collection.from === 'db2cm') {
    return false;
  }

  if (collection.template === 'view') {
    return dataSourceKey === 'main';
  }

  return isSqlCollection(collection);
}

function isAddFieldVisible(options: {
  collection: Record<string, any>;
  dataSourceType?: string;
  fieldInterfaceGroups: FieldInterfaceGroupOption[];
  ctx: any;
}) {
  const plugin = options.ctx.app.pm.get(PluginDataSourceManagerClientV2);
  const dataSourceType = plugin?.getType?.(options.dataSourceType);
  return (
    !dataSourceType?.disableAddFields &&
    options.collection.template !== 'sql' &&
    options.fieldInterfaceGroups.length > 0
  );
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

function SqlSyncFieldsDrawer(props: { collection: Record<string, any>; onSubmitted: () => void }) {
  const t = useT();
  const ctx = useFlowContext();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
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

      setLoading(true);
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
      } finally {
        if (!ignore) {
          setLoading(false);
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
      await ctx.dataSourceManager.getDataSource('main')?.reload();
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
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" initialValues={props.collection}>
          <SqlSourceCollectionsConfigureItem form={form} mode="edit" template={{ title: '', name: 'sql' }} item={{}} />
          <SqlFieldsConfigureItem form={form} mode="edit" template={{ title: '', name: 'sql' }} item={{}} />
          <SqlPreviewConfigureItem form={form} mode="edit" template={{ title: '', name: 'sql' }} item={{}} />
        </Form>
      </Spin>
    </DrawerFormLayout>
  );
}

export default function FieldsPage(props: FieldsPageProps) {
  const t = useT();
  const ctx = useFlowContext();
  const appInfo = useCurrentAppInfo<{ database?: { dialect?: string } }>();
  const { message, modal } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [titleField, setTitleField] = useState<string | undefined>(props.collection.titleField);
  const [titleFieldLoadingKey, setTitleFieldLoadingKey] = useState<React.Key>();
  const [syncFieldsLoading, setSyncFieldsLoading] = useState(false);
  const request = useRequest(async () => {
    const response = await ctx.api.request({
      url: getCollectionFieldActionUrl(props.dataSourceKey, props.collection.name, 'list'),
      params: {
        paginate: false,
        filter: JSON.stringify({
          $or: [{ 'interface.$not': null }, { 'options.source.$notEmpty': true }],
        }),
        sort: ['sort'],
      },
    });
    return normalizeListResponse(response);
  });

  useEffect(() => {
    setTitleField(props.collection.titleField);
  }, [props.collection.titleField]);

  const dataSource = ctx.dataSourceManager.getDataSource(props.dataSourceKey);
  const allFieldInterfaceGroups = useMemo(
    () => getFieldInterfaceOptions(ctx, dataSource?.options?.type),
    [ctx, dataSource?.options?.type],
  );
  const fieldInterfaceGroups = useMemo(
    () =>
      filterCreatableFieldInterfaces(
        filterFieldInterfaceGroupsByTemplate(
          allFieldInterfaceGroups,
          props.collection,
          ctx,
          appInfo?.database?.dialect,
        ),
        props.collection,
      ),
    [allFieldInterfaceGroups, appInfo?.database?.dialect, ctx, props.collection],
  );
  const fieldInterfacesByName = useMemo(() => {
    return filterFieldInterfacesByTemplate(
      getFieldInterfaces(ctx, dataSource?.options?.type),
      props.collection,
      ctx,
      appInfo?.database?.dialect,
    ).reduce<Record<string, FieldInterfaceOption>>((memo, fieldInterface) => {
      memo[fieldInterface.name] = fieldInterface;
      return memo;
    }, {});
  }, [appInfo?.database?.dialect, ctx, dataSource?.options?.type, props.collection]);

  const openFieldForm = useCallback(
    (mode: 'create' | 'edit', field?: Record<string, any>, interfaceName?: string) => {
      ctx.viewer.drawer({
        width: 800,
        closable: true,
        content: () => (
          <FieldForm
            mode={mode}
            dataSourceKey={props.dataSourceKey}
            collection={props.collection}
            interfaceName={interfaceName}
            field={field}
            onSubmitted={() => request.refresh()}
          />
        ),
      });
    },
    [ctx.viewer, props.collection, props.dataSourceKey, request],
  );

  const addFieldMenu = useMemo<MenuProps>(
    () => ({
      style: {
        maxHeight: '60vh',
        overflow: 'auto',
      },
      items: fieldInterfaceGroups.map((group) => ({
        type: 'group' as const,
        key: group.key,
        label: compileLegacyTemplate(group.label, t),
        children: group.children.map((fieldInterface) => ({
          key: fieldInterface.name,
          label: compileLegacyTemplate(getFieldInterfaceLabel(fieldInterface), t),
        })),
      })),
      onClick: ({ key }) => openFieldForm('create', undefined, String(key)),
    }),
    [fieldInterfaceGroups, openFieldForm, t],
  );

  const openSqlSyncFieldsDrawer = useCallback(() => {
    ctx.viewer.drawer({
      width: 900,
      closable: true,
      content: () => (
        <SqlSyncFieldsDrawer
          collection={props.collection}
          onSubmitted={() => {
            request.refresh();
          }}
        />
      ),
    });
  }, [ctx.viewer, props.collection, request]);

  const handleDelete = useCallback(
    (filterByTk: React.Key | React.Key[]) => {
      modal.confirm({
        title: t('Delete record'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          const keys = Array.isArray(filterByTk) ? filterByTk : [filterByTk];
          await Promise.all(
            keys.map((key) =>
              ctx.api.request({
                url: getCollectionFieldActionUrl(props.dataSourceKey, props.collection.name, 'destroy', String(key)),
                method: 'post',
              }),
            ),
          );
          await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
          setSelectedRowKeys([]);
          request.refresh();
        },
      });
    },
    [ctx.api, ctx.dataSourceManager, modal, props.collection.name, props.dataSourceKey, request, t],
  );

  const handleFieldInterfaceChange = useCallback(
    async (field: Record<string, any>, nextInterfaceName?: string) => {
      const nextInterface = nextInterfaceName ? fieldInterfacesByName[nextInterfaceName] : undefined;
      const nextDefault = nextInterface?.default || {};
      const nextUiSchema = nextDefault.uiSchema
        ? {
            ...nextDefault.uiSchema,
            title: nextDefault.uiSchema.title || field.uiSchema?.title,
          }
        : field.uiSchema;
      await ctx.api.request({
        url: getCollectionFieldActionUrl(props.dataSourceKey, props.collection.name, 'update', field.name),
        method: 'post',
        data: {
          ...field,
          ...nextDefault,
          name: field.name,
          interface: nextInterfaceName || null,
          type: nextDefault.type || field.type,
          uiSchema: nextUiSchema,
        },
      });
      await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
      request.refresh();
    },
    [ctx.api, ctx.dataSourceManager, fieldInterfacesByName, props.collection.name, props.dataSourceKey, request],
  );

  const handleTitleFieldChange = useCallback(
    async (field: Record<string, any>, checked: boolean) => {
      const nextTitleField = checked ? field.name : 'id';
      setTitleFieldLoadingKey(field.name);
      try {
        await ctx.api.request({
          url: getCollectionUpdateActionUrl(props.dataSourceKey),
          method: 'post',
          params: { filterByTk: props.collection.name },
          data: { titleField: nextTitleField },
        });
        setTitleField(nextTitleField);
        await ctx.dataSourceManager.getDataSource(props.dataSourceKey)?.reload();
        message.success(t('Saved successfully'));
      } finally {
        setTitleFieldLoadingKey(undefined);
      }
    },
    [ctx.api, ctx.dataSourceManager, message, props.collection.name, props.dataSourceKey, t],
  );

  const handleSyncFields = useCallback(async () => {
    if (isSqlCollection(props.collection)) {
      openSqlSyncFieldsDrawer();
      return;
    }

    setSyncFieldsLoading(true);
    try {
      await ctx.api.resource('mainDataSource').syncFields({
        values: {
          collections: [props.collection.name],
        },
      });
      request.refresh();
      await ctx.dataSourceManager.getDataSource('main')?.reload();
      message.success(t('Sync successfully'));
    } finally {
      setSyncFieldsLoading(false);
    }
  }, [ctx.api, ctx.dataSourceManager, message, openSqlSyncFieldsDrawer, props.collection, request, t]);

  const syncFieldsVisible = isSyncFieldsVisible(props.dataSourceKey, props.collection);
  const addFieldVisible = isAddFieldVisible({
    collection: props.collection,
    ctx,
    dataSourceType: dataSource?.options?.type,
    fieldInterfaceGroups,
  });

  const columns = useMemo<ColumnsType<Record<string, any>>>(
    () => [
      {
        title: t('Field display name'),
        render: (record) => compileLegacyTemplate(record.uiSchema?.title || record.name, t),
      },
      { title: t('Field name'), dataIndex: 'name' },
      { title: t('Field type'), dataIndex: 'type', render: (value) => <Tag>{value}</Tag> },
      {
        title: t('Field interface'),
        dataIndex: 'interface',
        width: 180,
        render: (value, record) => {
          const currentFieldInterface = value ? fieldInterfacesByName[value] : undefined;
          const optionsGroups = getSelectableFieldInterfaceGroups(allFieldInterfaceGroups, record);
          if (
            (value && !currentFieldInterface) ||
            isReadOnlyFieldInterface(record, currentFieldInterface) ||
            !optionsGroups.length
          ) {
            return <Tag>{compileLegacyTemplate(getFieldInterfaceLabel(currentFieldInterface, value), t) || value}</Tag>;
          }

          const options = optionsGroups
            .map((group) => ({
              label: compileLegacyTemplate(group.label, t),
              options: group.children.map((fieldInterface) => ({
                value: fieldInterface.name,
                label: compileLegacyTemplate(getFieldInterfaceLabel(fieldInterface), t),
              })),
            }))
            .filter((group) => group.options.length);

          return (
            <Select
              allowClear
              value={value || undefined}
              style={{ width: '100%' }}
              popupMatchSelectWidth={false}
              options={options}
              onChange={(nextValue) => handleFieldInterfaceChange(record, nextValue)}
            />
          );
        },
      },
      {
        title: t('Title field'),
        dataIndex: 'titleField',
        width: 120,
        render: (_, record) =>
          isTitleField(ctx.dataSourceManager, record) ? (
            <Tooltip title={t('Default title for each record')} placement="right">
              <Switch
                aria-label={`switch-title-field-${record.name}`}
                size="small"
                loading={record.name === titleFieldLoadingKey}
                checked={record.name === (titleField || 'id')}
                onChange={(checked) => handleTitleFieldChange(record, checked)}
              />
            </Tooltip>
          ) : null,
      },
      { title: t('Description'), dataIndex: 'description', ellipsis: true },
      {
        title: t('Actions'),
        width: 160,
        render: (_, record) => (
          <Space>
            <a onClick={() => openFieldForm('edit', record)}>{t('Edit')}</a>
            <a onClick={() => handleDelete(record.name)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    [
      allFieldInterfaceGroups,
      ctx.dataSourceManager,
      fieldInterfacesByName,
      handleDelete,
      handleFieldInterfaceChange,
      handleTitleFieldChange,
      openFieldForm,
      t,
      titleField,
      titleFieldLoadingKey,
    ],
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <Space>
          <Button
            icon={<DeleteOutlined />}
            disabled={!selectedRowKeys.length}
            onClick={() => handleDelete(selectedRowKeys)}
          >
            {t('Delete')}
          </Button>
          {syncFieldsVisible ? (
            <Button icon={<SyncOutlined />} loading={syncFieldsLoading} onClick={handleSyncFields}>
              {t('Sync from database')}
            </Button>
          ) : null}
          {addFieldVisible ? (
            <Dropdown menu={addFieldMenu} placement="bottomRight" trigger={['hover']}>
              <Button type="primary" icon={<PlusOutlined />}>
                {t('Add field')} <DownOutlined />
              </Button>
            </Dropdown>
          ) : null}
        </Space>
      </div>
      <Table<Record<string, any>>
        rowKey="name"
        loading={request.loading}
        dataSource={request.data || []}
        columns={columns}
        pagination={false}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />
    </>
  );
}
