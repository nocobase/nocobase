/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { DrawerFormLayout, Table } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button, Card, Dropdown, Flex, Form, Input, Select, Space, Switch, Tag, theme } from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { DEFAULT_ADMIN_UI_LAYOUT, UI_LAYOUT_TYPE_DESKTOP, UI_LAYOUT_TYPE_MOBILE } from '../../constants';
import { useT } from '../locale';

type UiLayoutPrimaryKey = string;
type UiLayoutType = string;

export type UiLayoutRecord = {
  title: string;
  uid: string;
  layoutType: UiLayoutType;
  routeName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
};

export type UiLayoutFormValues = {
  title: string;
  uid: string;
  layoutType: UiLayoutType;
  routeName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
};

type UiLayoutFormDraftValues = Omit<UiLayoutFormValues, 'routeName' | 'authCheck'> &
  Partial<Pick<UiLayoutFormValues, 'authCheck'>>;

type ListMeta = {
  count?: number;
  pageSize?: number;
  page?: number;
};

type ListBody = {
  data: UiLayoutRecord[];
  meta?: ListMeta;
};

type UiLayoutAppLike = {
  router?: {
    basename?: string;
    getBasename?: () => string | undefined;
  };
  getPublicPath?: () => string;
  getRouteUrl?: (pathname: string) => string;
};

export type UiLayoutResource = {
  create: (params: { values: UiLayoutFormValues }) => Promise<unknown>;
  update: (params: { filterByTk: UiLayoutPrimaryKey; values: UiLayoutFormValues }) => Promise<unknown>;
  destroy: (params: { filterByTk: UiLayoutPrimaryKey | UiLayoutPrimaryKey[] }) => Promise<unknown>;
};

export async function createUiLayout(args: {
  resource: UiLayoutResource;
  values: UiLayoutFormValues;
  onSubmitted: () => void;
}): Promise<void> {
  await args.resource.create({ values: args.values });
  args.onSubmitted();
}

export async function updateUiLayout(args: {
  resource: UiLayoutResource;
  filterByTk: UiLayoutPrimaryKey;
  values: UiLayoutFormValues;
  onSubmitted: () => void;
}): Promise<void> {
  await args.resource.update({ filterByTk: args.filterByTk, values: args.values });
  args.onSubmitted();
}

export function getRouteNameFromRoutePath(routePath: string) {
  const [pathname] = routePath.trim().split(/[?#]/);
  return pathname.replace(/^\/+/, '').split('/').filter(Boolean)[0] || '';
}

function isUiLayoutRouteNameFormatValid(routeName: string) {
  return !routeName.includes('.');
}

function getUiLayoutRoutePathFormatError(routePath?: string) {
  const trimmed = routePath?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!trimmed.startsWith('/')) {
    return 'Access path must start with /';
  }
  if (trimmed.replace(/\/+$/, '') === '') {
    return 'Access path cannot be /';
  }
  if (trimmed.includes('*')) {
    return 'Access path cannot contain wildcard';
  }
  if (/[?#]/.test(trimmed)) {
    return 'Access path cannot contain query or hash';
  }
  if (!isUiLayoutRouteNameFormatValid(getRouteNameFromRoutePath(trimmed))) {
    return 'Route name cannot contain dots';
  }
  return undefined;
}

export function isUiLayoutRoutePathFormatValid(routePath?: string) {
  return !getUiLayoutRoutePathFormatError(routePath);
}

export function completeUiLayoutFormValues(values: UiLayoutFormDraftValues): UiLayoutFormValues {
  const routePath = values.routePath.trim();
  const routePathError = getUiLayoutRoutePathFormatError(routePath);
  if (routePathError) {
    throw new Error(routePathError);
  }
  const routeName = getRouteNameFromRoutePath(routePath);
  const title = values.title.trim();
  return {
    ...values,
    title,
    routePath,
    routeName,
    authCheck: true,
  };
}

function toUiLayoutFormValues(record: UiLayoutRecord, overrides: Partial<UiLayoutFormValues> = {}): UiLayoutFormValues {
  return {
    title: record.title,
    uid: record.uid,
    layoutType: record.layoutType,
    routeName: record.routeName,
    routePath: record.routePath,
    enabled: record.enabled,
    ...overrides,
    authCheck: true,
  };
}

export async function updateUiLayoutEnabled(args: {
  resource: UiLayoutResource;
  record: UiLayoutRecord;
  enabled: boolean;
  onSubmitted: () => void;
}): Promise<void> {
  await args.resource.update({
    filterByTk: args.record.uid,
    values: toUiLayoutFormValues(args.record, { enabled: args.enabled }),
  });
  args.onSubmitted();
}

export async function deleteUiLayouts(args: {
  resource: UiLayoutResource;
  filterByTk: UiLayoutPrimaryKey | UiLayoutPrimaryKey[];
  onDeleted: () => void;
}): Promise<void> {
  await args.resource.destroy({ filterByTk: args.filterByTk });
  args.onDeleted();
}

const normalizeRootPath = (pathname?: string) => {
  const trimmed = pathname?.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  return `/${trimmed.replace(/^\/+/, '')}`;
};

const normalizeBasePath = (pathname?: string) => {
  const normalized = normalizeRootPath(pathname).replace(/\/+$/, '');
  return normalized === '' || normalized === '/' ? '' : normalized;
};

const joinRoutePath = (basePath: string | undefined, pathname: string) => {
  const base = normalizeBasePath(basePath);
  const path = normalizeRootPath(pathname);
  return base ? `${base}${path}` : path;
};

function isAbsoluteUrl(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value) || value.startsWith('//');
}

export function getUiLayoutRouteUrl(app: UiLayoutAppLike | undefined, routePath: string) {
  const normalizedRoutePath = routePath.trim();
  if (isAbsoluteUrl(normalizedRoutePath)) {
    return normalizedRoutePath;
  }

  const basename = app?.router?.getBasename?.() || app?.router?.basename;
  if (basename) {
    return joinRoutePath(basename, normalizedRoutePath);
  }

  if (app?.getRouteUrl) {
    return normalizeRootPath(app.getRouteUrl(normalizedRoutePath));
  }

  return joinRoutePath(app?.getPublicPath?.(), normalizedRoutePath);
}

const defaultFormValues: Pick<UiLayoutFormValues, 'enabled'> = {
  enabled: true,
};

const createLayoutOptions = [
  {
    key: UI_LAYOUT_TYPE_DESKTOP,
    label: 'Desktop layout',
  },
  {
    key: UI_LAYOUT_TYPE_MOBILE,
    label: 'Mobile layout',
  },
] as const;

function getLayoutTypeLabel(t: (key: string) => string, layoutType: string) {
  const option = createLayoutOptions.find((item) => item.key === layoutType);
  return option ? t(option.label) : layoutType;
}

export function getLayoutTypeTagColor(layoutType: string) {
  if (layoutType === UI_LAYOUT_TYPE_DESKTOP) {
    return 'blue';
  }
  if (layoutType === UI_LAYOUT_TYPE_MOBILE) {
    return 'purple';
  }
  return 'default';
}

export function isDefaultAdminUiLayout(record: Pick<UiLayoutRecord, 'uid'>) {
  return record.uid === DEFAULT_ADMIN_UI_LAYOUT.uid;
}

function isDefaultAdminUiLayoutEdit(record?: Pick<UiLayoutRecord, 'uid'>) {
  return !!record && isDefaultAdminUiLayout(record);
}

const UiLayoutsPage: React.FC = () => {
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<UiLayoutPrimaryKey[]>([]);
  const [updatingEnabledRowKeys, setUpdatingEnabledRowKeys] = useState<UiLayoutPrimaryKey[]>([]);
  const resource = useMemo(() => ctx.api.resource('uiLayouts') as UiLayoutResource, [ctx.api]);

  const listRequest = useRequest(async (page = 1): Promise<ListBody> => {
    const response = await ctx.api.request<ListBody>({
      url: 'uiLayouts:list',
      method: 'get',
      params: {
        page,
        pageSize: 20,
        sort: ['uid'],
      },
      skipNotify: true,
    });
    return response?.data ?? { data: [] };
  });

  const { data: listResp, loading } = listRequest;
  const records = useMemo(() => {
    const list = listResp?.data;
    return Array.isArray(list) ? list : [];
  }, [listResp]);
  const pagination = useMemo(() => {
    const meta = listResp?.meta;
    if (!meta) return false as const;
    return {
      total: meta.count ?? records.length,
      pageSize: meta.pageSize ?? 20,
      current: meta.page ?? 1,
    };
  }, [listResp, records.length]);

  const refreshList = useCallback(() => {
    setSelectedRowKeys([]);
    listRequest.run(listResp?.meta?.page ?? 1);
  }, [listRequest, listResp?.meta?.page]);

  const handleTableChange = useCallback<NonNullable<TableProps<UiLayoutRecord>['onChange']>>(
    (tablePagination) => {
      listRequest.run(tablePagination.current ?? 1);
    },
    [listRequest],
  );

  const openFormDrawer = useCallback(
    (options: { record?: UiLayoutRecord; layoutType?: UiLayoutType } = {}) => {
      const { record, layoutType = UI_LAYOUT_TYPE_DESKTOP } = options;
      ctx.viewer.drawer({
        width: token.screenMD,
        closable: true,
        content: () => <UiLayoutForm layoutType={layoutType} record={record} onSubmitted={refreshList} />,
      });
    },
    [ctx.viewer, refreshList, token.screenMD],
  );

  const handleDelete = useCallback(
    (filterByTk: UiLayoutPrimaryKey | UiLayoutPrimaryKey[], options: { isBatch?: boolean } = {}) => {
      modal.confirm({
        title: options.isBatch ? t('Delete UI layouts') : t('Delete UI layout'),
        content: options.isBatch
          ? t('Are you sure you want to delete the selected UI layouts?')
          : t('Are you sure you want to delete it?'),
        async onOk() {
          await deleteUiLayouts({
            resource,
            filterByTk,
            onDeleted: refreshList,
          });
        },
      });
    },
    [modal, refreshList, resource, t],
  );

  const handleToggleEnabled = useCallback(
    async (record: UiLayoutRecord, enabled: boolean) => {
      setUpdatingEnabledRowKeys((keys) => (keys.includes(record.uid) ? keys : [...keys, record.uid]));
      try {
        await updateUiLayoutEnabled({
          resource,
          record,
          enabled,
          onSubmitted: refreshList,
        });
        message.success(t('Updated successfully'));
      } finally {
        setUpdatingEnabledRowKeys((keys) => keys.filter((key) => key !== record.uid));
      }
    },
    [message, refreshList, resource, t],
  );

  const rowSelection = useMemo<TableProps<UiLayoutRecord>['rowSelection']>(
    () => ({
      selectedRowKeys,
      onChange: (keys) => setSelectedRowKeys(keys as UiLayoutPrimaryKey[]),
      getCheckboxProps: (record) => ({
        disabled: isDefaultAdminUiLayout(record),
      }),
    }),
    [selectedRowKeys],
  );

  const createLayoutMenu = useMemo<MenuProps>(
    () => ({
      items: createLayoutOptions.map((item) => ({
        key: item.key,
        label: t(item.label),
      })),
      onClick: ({ key }) => openFormDrawer({ layoutType: key as UiLayoutType }),
    }),
    [openFormDrawer, t],
  );

  const columns = useMemo<ColumnsType<UiLayoutRecord>>(
    () => [
      { title: t('Title'), dataIndex: 'title', ellipsis: true },
      { title: t('UID'), dataIndex: 'uid', ellipsis: true },
      {
        title: t('Layout type'),
        dataIndex: 'layoutType',
        render: (value: string) => <LayoutTypeTag layoutType={value} />,
      },
      { title: t('Access path'), dataIndex: 'routePath', ellipsis: true },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        render: (value: boolean, record) => (
          <Switch
            aria-label={t('Enabled')}
            checked={value}
            disabled={isDefaultAdminUiLayout(record)}
            loading={updatingEnabledRowKeys.includes(record.uid)}
            size="small"
            onChange={async (checked) => {
              await handleToggleEnabled(record, checked);
            }}
          />
        ),
      },
      {
        title: t('Actions'),
        render: (_: unknown, record) => {
          const deleteDisabled = isDefaultAdminUiLayout(record);
          return (
            <Space>
              <a href={getUiLayoutRouteUrl(ctx.app, record.routePath)} target="_blank" rel="noopener noreferrer">
                <EyeOutlined /> {t('View')}
              </a>
              <Button type="link" icon={<EditOutlined />} onClick={() => openFormDrawer({ record })}>
                {t('Edit')}
              </Button>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={deleteDisabled}
                onClick={deleteDisabled ? undefined : () => handleDelete(record.uid)}
              >
                {t('Delete')}
              </Button>
            </Space>
          );
        },
      },
    ],
    [ctx.app, handleDelete, handleToggleEnabled, openFormDrawer, t, updatingEnabledRowKeys],
  );

  return (
    <Card>
      <Flex justify="flex-end" style={{ marginBottom: token.marginMD }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refreshList}>
            {t('Refresh')}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => handleDelete(selectedRowKeys, { isBatch: true })}
          >
            {t('Delete')}
          </Button>
          <Dropdown menu={createLayoutMenu} trigger={['hover', 'click']}>
            <Button type="primary" icon={<PlusOutlined />} aria-haspopup="menu">
              {t('Add UI layout')} <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </Flex>
      <Table<UiLayoutRecord>
        rowKey="uid"
        loading={loading}
        dataSource={records}
        columns={columns}
        pagination={pagination}
        rowSelection={rowSelection}
        onChange={handleTableChange}
      />
    </Card>
  );
};

function LayoutTypeTag(props: { layoutType: string }) {
  const t = useT();
  return <Tag color={getLayoutTypeTagColor(props.layoutType)}>{getLayoutTypeLabel(t, props.layoutType)}</Tag>;
}

function UiLayoutForm(props: { layoutType: UiLayoutType; record?: UiLayoutRecord; onSubmitted: () => void }) {
  const { layoutType, record, onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const [form] = Form.useForm<UiLayoutFormDraftValues>();
  const [submitting, setSubmitting] = useState(false);
  const resource = useMemo(() => ctx.api.resource('uiLayouts') as UiLayoutResource, [ctx.api]);
  const defaultAdminLayoutEdit = isDefaultAdminUiLayoutEdit(record);

  const initialValues = useMemo<Partial<UiLayoutFormDraftValues>>(
    () =>
      record
        ? {
            title: record.title,
            uid: record.uid,
            layoutType: record.layoutType,
            routePath: record.routePath,
            enabled: record.enabled,
          }
        : {
            ...defaultFormValues,
            uid: `ui-layout-${randomId()}`,
            layoutType,
          },
    [layoutType, record],
  );

  const handleSubmit = useCallback(async () => {
    const values = completeUiLayoutFormValues(await form.validateFields());
    setSubmitting(true);
    try {
      if (record) {
        await updateUiLayout({
          resource,
          filterByTk: record.uid,
          values,
          onSubmitted,
        });
      } else {
        await createUiLayout({
          resource,
          values,
          onSubmitted,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, onSubmitted, record, resource]);

  return (
    <DrawerFormLayout
      title={record ? t('Edit UI layout') : t('Add UI layout')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="layoutType" label={t('Layout type')}>
          <Select
            disabled
            options={createLayoutOptions.map((item) => ({
              value: item.key,
              label: t(item.label),
            }))}
          />
        </Form.Item>
        <Form.Item
          name="title"
          label={t('Title')}
          rules={[{ required: true, whitespace: true, message: t('Title field is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="uid" label={t('UID')} rules={[{ required: true, message: t('The field value is required') }]}>
          <Input disabled={!!record} />
        </Form.Item>
        <Form.Item
          name="routePath"
          label={t('Access path')}
          extra={t('Must start with /. For example: /admin.')}
          rules={[
            { required: true, message: t('The field value is required') },
            {
              validator: (_, value?: string) => {
                const error = getUiLayoutRoutePathFormatError(value);
                return error ? Promise.reject(new Error(t(error))) : Promise.resolve();
              },
            },
          ]}
        >
          <Input disabled={defaultAdminLayoutEdit} />
        </Form.Item>
        <Form.Item
          name="enabled"
          label={t('Enabled')}
          valuePropName="checked"
          extra={t('When disabled, this layout will not be registered or accessible.')}
        >
          <Switch disabled={defaultAdminLayoutEdit} />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

export default UiLayoutsPage;
