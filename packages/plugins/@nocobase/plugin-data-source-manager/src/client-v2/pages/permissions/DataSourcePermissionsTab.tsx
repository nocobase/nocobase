/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import {
  CollectionFilter,
  DrawerFormLayout,
  ExtendCollectionsProvider,
  Table,
  type CompiledFilter,
} from '@nocobase/client-v2';
import type { Collection, CollectionOptions } from '@nocobase/flow-engine';
import { useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Alert, App, Empty, Form, Radio, Tabs, Tag, Typography, theme } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React, { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { compileLegacyTemplate, compileLegacyTemplateText } from '../../utils/compileLegacyTemplate';
import { StrategyActionsEditor, RoleResourceActionsEditor } from './PermissionEditors';
import {
  saveRoleResourcePermissions,
  updateGeneralActionPermissions,
  type CreateUpdateResource,
  type GetResource,
  type UpdateResource,
} from './permissionRequests';
import { ScopeSelect } from './ScopeSelect';
import type { AvailableAction, DataSourceRecord, RoleCollectionRecord } from './types';
import { NAMESPACE } from '../../locale';
import PluginDataSourceManagerClientV2 from '../../plugin';
import type { ComponentLoader, DataSourcePermissionRole, DataSourcePermissionTabProps } from '../../registries';

const ROLE_COLLECTIONS_FILTER_COLLECTION_NAME = 'dataSourcePermissionCollectionsFilter';
const COLLECTION_ACTION_PERMISSION_PAGE_SIZE = 20;
const DATA_SOURCE_PERMISSION_PAGE_SIZE = 50;

const ROLE_COLLECTIONS_FILTER_COLLECTION: CollectionOptions = {
  name: ROLE_COLLECTIONS_FILTER_COLLECTION_NAME,
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Collection display name")}}',
        type: 'string',
      },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{t("Collection name")}}',
        type: 'string',
      },
    },
  ],
};

function normalizeListResponse(response: any) {
  const payload = response?.data?.data;
  if (Array.isArray(payload)) {
    return { records: payload, total: response?.data?.meta?.count || payload.length };
  }
  return {
    records: payload?.rows || payload?.data || [],
    total: payload?.count || payload?.total || response?.data?.meta?.count || 0,
    page: payload?.page,
    pageSize: payload?.pageSize,
  };
}

function useTableFillClassName() {
  return useMemo(
    () => css`
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;

      .ant-spin-nested-loading,
      .ant-spin-container,
      .ant-table,
      .ant-table-container {
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .ant-table-content,
      .ant-table-body {
        flex: 1;
        min-height: 0;
      }

      .ant-table-thead > tr > th {
        white-space: nowrap;
      }

      .ant-pagination {
        flex: 0 0 auto;
      }
    `,
    [],
  );
}

interface FlowContextWithDataSources {
  dataSourceManager: {
    getDataSource: (dataSourceKey: string) => { getCollection: (collectionName: string) => unknown } | undefined;
  };
}

function getCollection(ctx: unknown, dataSourceKey: string, collectionName: string) {
  const flowContext = ctx as FlowContextWithDataSources;
  return flowContext.dataSourceManager.getDataSource(dataSourceKey)?.getCollection(collectionName) as
    | Collection
    | undefined;
}

function getResponseData<T>(response: unknown) {
  return (response as { data?: { data?: T } } | undefined)?.data?.data;
}

function getStableLazyComponent<Props>(
  cache: Map<
    string,
    { loader: ComponentLoader<Props>; Component: React.LazyExoticComponent<React.ComponentType<Props>> }
  >,
  key: string,
  loader: ComponentLoader<Props>,
) {
  const cached = cache.get(key);
  if (cached?.loader === loader) {
    return cached.Component;
  }
  const Component = lazy(loader);
  cache.set(key, { loader, Component });
  return Component;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSearchText(value: unknown) {
  return String(value ?? '').toLowerCase();
}

function matchCollectionFilterValue(candidates: string[], operator: string, value: unknown) {
  const expected = normalizeSearchText(value);
  if (!expected) {
    return true;
  }

  switch (operator) {
    case '$eq':
      return candidates.some((candidate) => candidate === expected);
    case '$ne':
      return candidates.every((candidate) => candidate !== expected);
    case '$notIncludes':
      return candidates.every((candidate) => !candidate.includes(expected));
    case '$includes':
    default:
      return candidates.some((candidate) => candidate.includes(expected));
  }
}

function matchCollectionFilterField(candidates: string[], value: unknown) {
  if (!isRecord(value)) {
    return matchCollectionFilterValue(candidates, '$includes', value);
  }

  const operatorEntries = Object.entries(value).filter(([operator]) => operator.startsWith('$'));
  if (!operatorEntries.length) {
    return true;
  }

  return operatorEntries.every(([operator, operatorValue]) =>
    matchCollectionFilterValue(candidates, operator, operatorValue),
  );
}

function matchesRoleCollectionFilter(
  record: RoleCollectionRecord,
  filter: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (!isRecord(filter)) {
    return true;
  }

  const results: boolean[] = [];
  if (Array.isArray(filter.$and)) {
    results.push(filter.$and.every((item) => matchesRoleCollectionFilter(record, item, t)));
  }
  if (Array.isArray(filter.$or)) {
    results.push(filter.$or.some((item) => matchesRoleCollectionFilter(record, item, t)));
  }

  if (Object.prototype.hasOwnProperty.call(filter, 'title')) {
    const rawTitle = record.title == null ? '' : String(record.title);
    const candidates = Array.from(
      new Set([rawTitle, compileLegacyTemplateText(record.title, t, '')].filter(Boolean).map(normalizeSearchText)),
    );
    results.push(matchCollectionFilterField(candidates, filter.title));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'name')) {
    results.push(matchCollectionFilterField([normalizeSearchText(record.name)], filter.name));
  }

  return results.length ? results.every(Boolean) : true;
}

interface GeneralActionPermissionsProps {
  activeRole?: DataSourcePermissionRole | null;
  availableActions: AvailableAction[];
  dataSource: DataSourceRecord;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function GeneralActionPermissions(props: GeneralActionPermissionsProps) {
  const ctx = useFlowContext();
  const { message } = App.useApp();
  const [actions, setActions] = useState<string[]>([]);
  const resource = useMemo(
    () => ctx.api.resource(`dataSources/${props.dataSource.key}/roles`) as unknown as UpdateResource & GetResource,
    [ctx.api, props.dataSource.key],
  );

  const request = useRequest(
    async () => {
      if (!props.activeRole?.name) {
        return [];
      }
      const response = await resource.get({
        filterByTk: props.activeRole.name,
      });
      const roleRecord = getResponseData<{ strategy?: { actions?: string[] } }>(response);
      const nextActions = roleRecord?.strategy?.actions || [];
      setActions(nextActions);
      return nextActions;
    },
    {
      refreshDeps: [props.activeRole?.name, props.dataSource.key],
      ready: Boolean(props.activeRole?.name),
    },
  );

  const handleChange = useMemoizedFn(async (nextActions: string[]) => {
    if (!props.activeRole?.name) {
      return;
    }
    setActions(nextActions);
    try {
      await updateGeneralActionPermissions(resource, props.activeRole.name, nextActions);
      message.success(props.t('Saved successfully'));
    } catch (error) {
      message.error(error instanceof Error ? error.message : props.t('Save failed'));
      request.refresh();
    }
  });

  return (
    <div
      className={css`
        width: 100%;
      `}
    >
      <StrategyActionsEditor
        value={actions}
        onChange={handleChange}
        availableActions={props.availableActions}
        t={props.t}
      />
    </div>
  );
}

interface ResourcePermissionFormProps {
  activeRole?: DataSourcePermissionRole | null;
  availableActions: AvailableAction[];
  collection: RoleCollectionRecord;
  dataSource: DataSourceRecord;
  onSubmitted: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function ResourcePermissionForm(props: ResourcePermissionFormProps) {
  const ctx = useFlowContext();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const usingActionsConfig = Form.useWatch('usingActionsConfig', form);
  const collection = getCollection(ctx, props.dataSource.key, props.collection.name);
  const resource = useMemo(
    () =>
      ctx.api.resource('roles.dataSourceResources', props.activeRole?.name) as unknown as CreateUpdateResource &
        GetResource,
    [ctx.api, props.activeRole?.name],
  );

  const request = useRequest(
    async () => {
      if (!props.activeRole?.name) {
        return undefined;
      }
      if (!props.collection.exists) {
        const initialValues = {
          usingActionsConfig: false,
          actions: [],
        };
        form.setFieldsValue(initialValues);
        return initialValues;
      }
      const response = await resource.get({
        filter: {
          dataSourceKey: props.dataSource.key,
          name: props.collection.name,
        },
        appends: ['actions', 'actions.scope'],
      });
      const values = getResponseData<Record<string, unknown>>(response) || {
        usingActionsConfig: props.collection.usingConfig === 'resourceAction',
        actions: [],
      };
      form.setFieldsValue(values);
      return values;
    },
    {
      refreshDeps: [props.activeRole?.name, props.collection.name, props.dataSource.key],
      ready: Boolean(props.activeRole?.name),
    },
  );

  async function handleSubmit() {
    if (!props.activeRole?.name) {
      throw new Error('Role is required');
    }
    const values = await form.validateFields();

    await saveRoleResourcePermissions(resource, props.collection, props.dataSource.key, values);
    message.success(props.t('Saved successfully'));
    props.onSubmitted();
  }

  return (
    <DrawerFormLayout
      title={props.t('Configure permission')}
      onSubmit={handleSubmit}
      submitting={request.loading}
      submitText={props.t('Submit')}
      cancelText={props.t('Cancel')}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          usingActionsConfig: false,
          actions: [],
        }}
      >
        <Form.Item name="usingActionsConfig" label={props.t('Permission policy')}>
          <Radio.Group
            options={[
              { value: false, label: props.t('General') },
              { value: true, label: props.t('Individual') },
            ]}
          />
        </Form.Item>
        {usingActionsConfig ? (
          <Form.Item name="actions" noStyle>
            <RoleResourceActionsEditor
              availableActions={props.availableActions}
              collectionFields={props.collection.fields || []}
              t={props.t}
              renderScopeSelect={({ value, onChange }) => (
                <ScopeSelect
                  value={value}
                  onChange={onChange}
                  collection={collection}
                  dataSourceKey={props.dataSource.key}
                  resourceName={props.collection.name}
                  t={props.t}
                />
              )}
            />
          </Form.Item>
        ) : null}
      </Form>
    </DrawerFormLayout>
  );
}

interface CollectionActionPermissionsProps {
  activeRole?: DataSourcePermissionRole | null;
  availableActions: AvailableAction[];
  dataSource: DataSourceRecord;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function CollectionActionPermissionsContent(props: CollectionActionPermissionsProps) {
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const engine = useFlowEngine();
  const tableFillClassName = useTableFillClassName();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(COLLECTION_ACTION_PERMISSION_PAGE_SIZE);
  const [collectionFilter, setCollectionFilter] = useState<CompiledFilter>();
  const collection = ctx.dataSourceManager
    .getDataSource('main')
    ?.getCollection(ROLE_COLLECTIONS_FILTER_COLLECTION_NAME) as Collection | undefined;
  const resource = useMemo(
    () => ctx.api.resource('roles.dataSourcesCollections', props.activeRole?.name),
    [ctx.api, props.activeRole?.name],
  );
  const tClient = useMemoizedFn((key: string, options?: Record<string, unknown>) =>
    engine.context.t(key, { ns: ['client', NAMESPACE], ...options }),
  );

  const request = useRequest(
    async () => {
      if (!props.activeRole?.name) {
        return { records: [], total: 0 };
      }
      const response = await resource.list({
        page: 1,
        pageSize: COLLECTION_ACTION_PERMISSION_PAGE_SIZE,
        filter: {
          dataSourceKey: props.dataSource.key,
        },
        sort: ['sort'],
        appends: ['fields'],
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [props.activeRole?.name, props.dataSource.key],
    },
  );

  const filteredRecords = useMemo(() => {
    return (request.data?.records || []).filter((record) =>
      matchesRoleCollectionFilter(record, collectionFilter, props.t),
    );
  }, [collectionFilter, props.t, request.data?.records]);

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const openResourceForm = useMemoizedFn((record: RoleCollectionRecord) => {
    ctx.viewer.drawer({
      width: '50%',
      closable: true,
      content: () => (
        <ResourcePermissionForm
          activeRole={props.activeRole}
          availableActions={props.availableActions}
          collection={record}
          dataSource={props.dataSource}
          t={props.t}
          onSubmitted={() => {
            request.refresh();
          }}
        />
      ),
    });
  });

  const columns = useMemo<ColumnsType<RoleCollectionRecord>>(
    () => [
      {
        title: tClient('Collection display name'),
        dataIndex: 'title',
        width: token.sizeXXL * 5,
        ellipsis: true,
        render: (value) => compileLegacyTemplate(value, props.t),
      },
      {
        title: tClient('Collection name'),
        dataIndex: 'name',
        width: token.sizeXXL * 5,
        ellipsis: true,
      },
      {
        title: props.t('Permission policy'),
        dataIndex: 'usingConfig',
        width: token.sizeXXL * 4,
        render: (value) =>
          value === 'resourceAction' ? (
            <Tag color="orange">{props.t('Individual')}</Tag>
          ) : (
            <Tag>{props.t('General')}</Tag>
          ),
      },
      {
        title: props.t('Actions'),
        width: token.sizeXXL * 3,
        render: (_, record) => <a onClick={() => openResourceForm(record)}>{props.t('Configure')}</a>,
      },
    ],
    [openResourceForm, props, tClient, token.sizeXXL],
  );

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current: page,
      pageSize,
      total: filteredRecords.length,
      onChange(nextPage, nextPageSize) {
        setPage(nextPage);
        setPageSize(nextPageSize);
      },
    }),
    [filteredRecords.length, page, pageSize],
  );

  return (
    <div
      className={css`
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          flex: 0 0 auto;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: ${token.marginSM}px;
          flex-wrap: wrap;
          margin-bottom: ${token.marginSM}px;
        `}
      >
        <CollectionFilter
          collection={collection}
          t={tClient}
          filterableFieldNames={['title', 'name']}
          onChange={(nextFilter) => {
            setPage(1);
            setCollectionFilter(nextFilter);
          }}
        />
      </div>
      <Table<RoleCollectionRecord>
        rowKey="name"
        loading={request.loading}
        dataSource={pagedRecords}
        columns={columns}
        pagination={pagination}
        scroll={{ x: 'max-content', y: '100%' }}
        className={tableFillClassName}
      />
    </div>
  );
}

function CollectionActionPermissions(props: CollectionActionPermissionsProps) {
  return (
    <ExtendCollectionsProvider collections={[ROLE_COLLECTIONS_FILTER_COLLECTION]}>
      <CollectionActionPermissionsContent {...props} />
    </ExtendCollectionsProvider>
  );
}

interface DataSourcePermissionDrawerProps {
  activeRole?: DataSourcePermissionRole | null;
  availableActions: AvailableAction[];
  dataSource: DataSourceRecord;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function DataSourcePermissionDrawer(props: DataSourcePermissionDrawerProps) {
  const { activeRole, availableActions, dataSource, t } = props;
  const ctx = useFlowContext();
  const permissionTabComponentCache = useRef(
    new Map<
      string,
      {
        loader: ComponentLoader<DataSourcePermissionTabProps>;
        Component: React.LazyExoticComponent<React.ComponentType<DataSourcePermissionTabProps>>;
      }
    >(),
  );
  const plugin = ctx.app.pm.get(PluginDataSourceManagerClientV2) as PluginDataSourceManagerClientV2 | undefined;
  const tabProps = useMemo<DataSourcePermissionTabProps>(
    () => ({
      activeRole,
      availableActions,
      dataSource,
      t,
    }),
    [activeRole, availableActions, dataSource, t],
  );
  const extraTabs = useMemo(
    () =>
      plugin?.getPermissionTabs(tabProps).map((item) => ({
        key: item.key,
        label: item.label,
        sort: item.sort ?? 100,
        Component: getStableLazyComponent(permissionTabComponentCache.current, item.key, item.componentLoader),
      })) || [],
    [plugin, tabProps],
  );
  const tabItems = useMemo(() => {
    const items = new Map<
      string,
      {
        key: string;
        label: React.ReactNode;
        sort: number;
        children: React.ReactNode;
      }
    >();
    [
      {
        key: 'general',
        label: t('General action permissions'),
        sort: 10,
        children: (
          <GeneralActionPermissions
            activeRole={activeRole}
            availableActions={availableActions}
            dataSource={dataSource}
            t={t}
          />
        ),
      },
      {
        key: 'actions',
        label: t('Action permissions'),
        sort: 20,
        children: (
          <CollectionActionPermissions
            activeRole={activeRole}
            availableActions={availableActions}
            dataSource={dataSource}
            t={t}
          />
        ),
      },
      ...extraTabs.map(({ Component, ...item }) => ({
        ...item,
        children: (
          <Suspense fallback={null}>
            <Component {...tabProps} />
          </Suspense>
        ),
      })),
    ].forEach((item) => {
      items.set(item.key, item);
    });
    return Array.from(items.values()).sort((a, b) => a.sort - b.sort);
  }, [activeRole, availableActions, dataSource, extraTabs, t, tabProps]);

  return (
    <DrawerFormLayout title={t('Configure permission')} footer={<></>}>
      <Tabs items={tabItems} />
    </DrawerFormLayout>
  );
}

interface DataSourcePermissionsTabProps {
  activeRole?: DataSourcePermissionRole | null;
}

export default function DataSourcePermissionsTab(props: DataSourcePermissionsTabProps) {
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const engine = useFlowEngine();
  const t = useMemoizedFn((key: string, options?: Record<string, unknown>) =>
    engine.context.t(key, { ns: [NAMESPACE, 'client'], ...options }),
  );
  const tableFillClassName = useTableFillClassName();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DATA_SOURCE_PERMISSION_PAGE_SIZE);

  const availableActionsRequest = useRequest(async () => {
    const response = await ctx.api.resource('availableActions').list();
    return response?.data?.data || [];
  });

  const request = useRequest(
    async () => {
      const response = await ctx.api.resource('dataSources').list({
        page,
        pageSize,
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page, pageSize],
    },
  );

  const openDataSourceDrawer = useMemoizedFn((record: DataSourceRecord) => {
    ctx.viewer.drawer({
      width: '50%',
      closable: true,
      content: () => (
        <DataSourcePermissionDrawer
          activeRole={props.activeRole}
          availableActions={availableActionsRequest.data || []}
          dataSource={record}
          t={t}
        />
      ),
    });
  });

  const columns = useMemo<ColumnsType<DataSourceRecord>>(
    () => [
      {
        title: t('Data source display name'),
        dataIndex: 'displayName',
        width: token.sizeXXL * 5,
        ellipsis: true,
        render: (value) => compileLegacyTemplate(value, t),
      },
      {
        title: t('Data source name'),
        dataIndex: 'key',
        width: token.sizeXXL * 5,
        ellipsis: true,
      },
      {
        title: t('Actions'),
        width: token.sizeXXL * 3,
        render: (_, record) => <a onClick={() => openDataSourceDrawer(record)}>{t('Configure')}</a>,
      },
    ],
    [openDataSourceDrawer, t, token.sizeXXL],
  );

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current: request.data?.page ?? page,
      pageSize: request.data?.pageSize ?? pageSize,
      total: request.data?.total,
      onChange(nextPage, nextPageSize) {
        setPage(nextPage);
        setPageSize(nextPageSize);
      },
    }),
    [page, pageSize, request.data?.page, request.data?.pageSize, request.data?.total],
  );

  if (!props.activeRole) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: ${token.marginSM}px;
      `}
    >
      <Typography.Text strong>{t('Data sources')}</Typography.Text>
      {availableActionsRequest.error ? (
        <Alert type="error" message={availableActionsRequest.error.message} showIcon />
      ) : null}
      <Table<DataSourceRecord>
        rowKey="key"
        loading={request.loading || availableActionsRequest.loading}
        dataSource={request.data?.records || []}
        columns={columns}
        pagination={pagination}
        scroll={{ x: 'max-content', y: '100%' }}
        className={cx(tableFillClassName)}
      />
    </div>
  );
}
