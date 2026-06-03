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
import { UI_LAYOUT_TYPE_DESKTOP, UI_LAYOUT_TYPE_MOBILE } from '../../constants';
import { useT } from '../locale';

type UiLayoutPrimaryKey = number | string;
type UiLayoutType = string;

export type UiLayoutRecord = {
  id: UiLayoutPrimaryKey;
  uid: string;
  layoutType: UiLayoutType;
  routeName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
};

export type UiLayoutFormValues = {
  uid: string;
  layoutType: UiLayoutType;
  routeName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
};

type UiLayoutFormDraftValues = Omit<UiLayoutFormValues, 'routeName'>;

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

export function completeUiLayoutFormValues(values: UiLayoutFormDraftValues): UiLayoutFormValues {
  return {
    ...values,
    routeName: getRouteNameFromRoutePath(values.routePath),
  };
}

function toUiLayoutFormValues(record: UiLayoutRecord, overrides: Partial<UiLayoutFormValues> = {}): UiLayoutFormValues {
  return {
    uid: record.uid,
    layoutType: record.layoutType,
    routeName: record.routeName,
    routePath: record.routePath,
    authCheck: record.authCheck,
    enabled: record.enabled,
    ...overrides,
  };
}

export async function updateUiLayoutEnabled(args: {
  resource: UiLayoutResource;
  record: UiLayoutRecord;
  enabled: boolean;
  onSubmitted: () => void;
}): Promise<void> {
  await args.resource.update({
    filterByTk: args.record.id,
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

const defaultFormValues: Pick<UiLayoutFormValues, 'authCheck' | 'enabled'> = {
  authCheck: true,
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

const UiLayoutsPage: React.FC = () => {
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<UiLayoutPrimaryKey[]>([]);
  const [updatingEnabledRowKeys, setUpdatingEnabledRowKeys] = useState<UiLayoutPrimaryKey[]>([]);
  const resource = useMemo(() => ctx.api.resource('uiLayouts') as UiLayoutResource, [ctx.api]);

  const listRequest = useRequest(async (): Promise<ListBody> => {
    const response = await ctx.api.request<ListBody>({
      url: 'uiLayouts:list',
      method: 'get',
      params: {
        pageSize: 20,
        sort: ['id'],
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
    listRequest.refresh();
  }, [listRequest]);

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
      setUpdatingEnabledRowKeys((keys) => (keys.includes(record.id) ? keys : [...keys, record.id]));
      try {
        await updateUiLayoutEnabled({
          resource,
          record,
          enabled,
          onSubmitted: refreshList,
        });
        message.success(t('Updated successfully'));
      } finally {
        setUpdatingEnabledRowKeys((keys) => keys.filter((key) => key !== record.id));
      }
    },
    [message, refreshList, resource, t],
  );

  const rowSelection = useMemo<TableProps<UiLayoutRecord>['rowSelection']>(
    () => ({
      selectedRowKeys,
      onChange: (keys) => setSelectedRowKeys(keys as UiLayoutPrimaryKey[]),
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
      { title: t('UID'), dataIndex: 'uid', ellipsis: true },
      {
        title: t('Layout type'),
        dataIndex: 'layoutType',
        render: (value: string) => <LayoutTypeTag layoutType={value} />,
      },
      { title: t('Route name'), dataIndex: 'routeName', ellipsis: true },
      { title: t('Access path'), dataIndex: 'routePath', ellipsis: true },
      {
        title: t('Auth check'),
        dataIndex: 'authCheck',
        render: (value: boolean) => <BooleanTag value={value} />,
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        render: (value: boolean, record) => (
          <Switch
            aria-label={t('Enabled')}
            checked={value}
            loading={updatingEnabledRowKeys.includes(record.id)}
            onChange={async (checked) => {
              await handleToggleEnabled(record, checked);
            }}
          />
        ),
      },
      {
        title: t('Actions'),
        render: (_: unknown, record) => (
          <Space>
            <a href={getUiLayoutRouteUrl(ctx.app, record.routePath)} target="_blank" rel="noopener noreferrer">
              <EyeOutlined /> {t('View')}
            </a>
            <a onClick={() => openFormDrawer({ record })}>
              <EditOutlined /> {t('Edit')}
            </a>
            <a onClick={() => handleDelete(record.id)}>
              <DeleteOutlined /> {t('Delete')}
            </a>
          </Space>
        ),
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
          <Dropdown menu={createLayoutMenu} trigger={['hover']}>
            <Button type="primary" icon={<PlusOutlined />}>
              {t('Add UI layout')} <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </Flex>
      <Table<UiLayoutRecord>
        rowKey="id"
        loading={loading}
        dataSource={records}
        columns={columns}
        pagination={pagination}
        rowSelection={rowSelection}
      />
    </Card>
  );
};

function BooleanTag(props: { value: boolean }) {
  const t = useT();
  return <Tag color={props.value ? 'success' : 'default'}>{props.value ? t('Yes') : t('No')}</Tag>;
}

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

  const initialValues = useMemo<Partial<UiLayoutFormDraftValues>>(
    () =>
      record
        ? {
            uid: record.uid,
            layoutType: record.layoutType,
            routePath: record.routePath,
            authCheck: record.authCheck,
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
          filterByTk: record.id,
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
        <Form.Item name="uid" label={t('UID')} rules={[{ required: true, message: t('The field value is required') }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="routePath"
          label={t('Access path')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="authCheck"
          label={t('Auth check')}
          valuePropName="checked"
          extra={t('Require users to sign in before accessing this layout.')}
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name="enabled"
          label={t('Enabled')}
          valuePropName="checked"
          extra={t('When disabled, this layout will not be registered or accessible.')}
        >
          <Switch />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

export default UiLayoutsPage;
