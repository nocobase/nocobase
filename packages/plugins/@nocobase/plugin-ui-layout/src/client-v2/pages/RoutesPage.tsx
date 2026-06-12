/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { NocoBaseDesktopRoute } from '@nocobase/client-v2';
import { NocoBaseDesktopRouteType } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ADMIN_UI_LAYOUT, DEFAULT_MOBILE_UI_LAYOUT } from '../../constants';
import { useT } from '../locale';

type RouteLayoutConfig = {
  key: string;
  label: string;
  uid: string;
  mobile?: boolean;
};

type RouteFormValues = {
  title: string;
  type: NocoBaseDesktopRouteType;
  routePath?: string;
};

type DesktopRoutesResource = {
  create: (params: { layout: string; values: Partial<NocoBaseDesktopRoute> }) => Promise<unknown>;
  destroy: (params: { filterByTk: Array<number | string> | number | string; layout: string }) => Promise<unknown>;
  update: (params: {
    filterByTk: number | string;
    layout: string;
    values: Partial<NocoBaseDesktopRoute>;
  }) => Promise<unknown>;
};

type RoutesPageFlowContext = {
  api: {
    request: (params: {
      method: 'get';
      params: Record<string, unknown>;
      skipNotify?: boolean;
      url: string;
    }) => Promise<{ data?: unknown }>;
    resource: (name: string) => DesktopRoutesResource;
  };
  message?: {
    error?: (content: string) => void;
    success?: (content: string) => void;
  };
};

type RouteListPayload = {
  data?: NocoBaseDesktopRoute[];
};

const routeLayouts: RouteLayoutConfig[] = [
  {
    key: 'desktop',
    label: 'Desktop routes',
    uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
  },
  {
    key: 'mobile',
    label: 'Mobile routes',
    mobile: true,
    uid: DEFAULT_MOBILE_UI_LAYOUT.uid,
  },
];

function toRoutePayload(responseData: unknown): RouteListPayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as RouteListPayload;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}

function getRouteTitle(route: NocoBaseDesktopRoute, t: (key: string, options?: Record<string, unknown>) => string) {
  return route.title || route.schemaUid || t('Untitled');
}

function getRoutePath(route: NocoBaseDesktopRoute) {
  const path = route.options?.path;
  return typeof path === 'string' && path.trim() ? path.trim() : '';
}

function normalizeRouteValues(values: RouteFormValues, route?: NocoBaseDesktopRoute): Partial<NocoBaseDesktopRoute> {
  const routePath = values.routePath?.trim();
  const shouldPersistSchemaUid =
    values.type === NocoBaseDesktopRouteType.page || values.type === NocoBaseDesktopRouteType.flowPage;
  return {
    ...(shouldPersistSchemaUid ? { schemaUid: route?.schemaUid || randomId() } : {}),
    title: values.title.trim(),
    type: values.type,
    ...(routePath ? { options: { ...(route?.options ?? {}), href: routePath } } : {}),
  };
}

function RouteEditorModal(props: {
  confirmLoading?: boolean;
  initialRoute?: NocoBaseDesktopRoute | null;
  mobile?: boolean;
  onCancel: () => void;
  onSubmit: (values: RouteFormValues) => Promise<void>;
  open: boolean;
}) {
  const t = useT();
  const [form] = Form.useForm<RouteFormValues>();
  const routeType = Form.useWatch('type', form);
  const title = props.initialRoute ? t('Edit route') : t('Add route');

  useEffect(() => {
    if (!props.open) {
      return;
    }
    form.setFieldsValue({
      routePath: props.initialRoute
        ? getRoutePath(props.initialRoute) || String(props.initialRoute.options?.href || '')
        : '',
      title: props.initialRoute?.title || '',
      type: props.initialRoute?.type || NocoBaseDesktopRouteType.flowPage,
    });
  }, [form, props.initialRoute, props.open]);
  const routeTypeOptions = useMemo(() => {
    if (props.mobile) {
      return [
        {
          label: t('Page'),
          value: NocoBaseDesktopRouteType.flowPage,
        },
        {
          label: t('Link'),
          value: NocoBaseDesktopRouteType.link,
        },
      ];
    }

    return [
      {
        label: t('Group'),
        value: NocoBaseDesktopRouteType.group,
      },
      {
        label: t('Classic page (v1)'),
        value: NocoBaseDesktopRouteType.page,
      },
      {
        label: t('Modern page (v2)'),
        value: NocoBaseDesktopRouteType.flowPage,
      },
      {
        label: t('Link'),
        value: NocoBaseDesktopRouteType.link,
      },
    ];
  }, [props.mobile, t]);

  return (
    <Modal
      cancelText={t('Cancel')}
      confirmLoading={props.confirmLoading}
      destroyOnClose
      okText={t('Submit')}
      onCancel={props.onCancel}
      onOk={() => form.submit()}
      open={props.open}
      title={title}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          props.onSubmit(values);
        }}
      >
        <Form.Item
          label={t('Title')}
          name="title"
          rules={[
            {
              message: t('Title field is required'),
              required: true,
              whitespace: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t('Type')}
          name="type"
          rules={[
            {
              message: t('The field value is required'),
              required: true,
            },
          ]}
        >
          <Select options={routeTypeOptions} />
        </Form.Item>
        {routeType === NocoBaseDesktopRouteType.link ? (
          <Form.Item
            label={t('URL')}
            name="routePath"
            rules={[
              {
                message: t('URL field is required'),
                required: true,
                whitespace: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  );
}

function RoutesTable({ layout }: { layout: RouteLayoutConfig }) {
  const ctx = useFlowContext<RoutesPageFlowContext>();
  const t = useT();
  const tRef = useRef(t);
  const { token } = theme.useToken();
  const [routes, setRoutes] = useState<NocoBaseDesktopRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRoute, setEditingRoute] = useState<NocoBaseDesktopRoute | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const desktopRoutesResource = useMemo(() => ctx.api.resource('desktopRoutes'), [ctx.api]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ctx.api.request({
        url: '/desktopRoutes:listAccessible',
        method: 'get',
        params: {
          layout: layout.uid,
          paginate: false,
          sort: 'sort',
          tree: true,
        },
        skipNotify: true,
      });
      setRoutes(toRoutePayload(response?.data).data ?? []);
      setSelectedRowKeys([]);
    } catch {
      const translate = tRef.current;
      ctx.message?.error?.(translate('Failed to load routes for {{layout}}', { layout: translate(layout.label) }));
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [ctx.api, ctx.message, layout.label, layout.uid]);

  useEffect(() => {
    async function run() {
      await loadRoutes();
    }
    run().catch(() => undefined);
  }, [loadRoutes]);

  const openAddModal = useCallback(() => {
    setEditingRoute(null);
    setEditorOpen(true);
  }, []);

  const openEditModal = useCallback((route: NocoBaseDesktopRoute) => {
    setEditingRoute(route);
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingRoute(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: RouteFormValues) => {
      setSaving(true);
      try {
        if (editingRoute?.id !== undefined) {
          await desktopRoutesResource.update({
            filterByTk: editingRoute.id,
            layout: layout.uid,
            values: normalizeRouteValues(values, editingRoute),
          });
          ctx.message?.success?.(t('Updated successfully'));
        } else {
          await desktopRoutesResource.create({
            layout: layout.uid,
            values: normalizeRouteValues(values),
          });
          ctx.message?.success?.(t('Saved successfully'));
        }
        closeEditor();
        await loadRoutes();
      } finally {
        setSaving(false);
      }
    },
    [closeEditor, ctx.message, desktopRoutesResource, editingRoute, layout.uid, loadRoutes, t],
  );

  const handleDelete = useCallback(
    async (route: NocoBaseDesktopRoute) => {
      if (route.id === undefined) {
        return;
      }
      await desktopRoutesResource.destroy({
        filterByTk: route.id,
        layout: layout.uid,
      });
      ctx.message?.success?.(t('Deleted successfully'));
      await loadRoutes();
    },
    [ctx.message, desktopRoutesResource, layout.uid, loadRoutes, t],
  );
  const selectedRouteIds = useMemo(
    () => selectedRowKeys.filter((key): key is number | string => typeof key === 'number' || typeof key === 'string'),
    [selectedRowKeys],
  );
  const hasSelectedRoutes = selectedRouteIds.length > 0;

  const updateSelectedRoutes = useCallback(
    async (values: Partial<NocoBaseDesktopRoute>) => {
      for (const routeId of selectedRouteIds) {
        await desktopRoutesResource.update({
          filterByTk: routeId,
          layout: layout.uid,
          values,
        });
      }
      ctx.message?.success?.(t('Updated successfully'));
      await loadRoutes();
    },
    [ctx.message, desktopRoutesResource, layout.uid, loadRoutes, selectedRouteIds, t],
  );

  const deleteSelectedRoutes = useCallback(async () => {
    if (!selectedRouteIds.length) {
      return;
    }
    await desktopRoutesResource.destroy({
      filterByTk: selectedRouteIds,
      layout: layout.uid,
    });
    ctx.message?.success?.(t('Deleted successfully'));
    await loadRoutes();
  }, [ctx.message, desktopRoutesResource, layout.uid, loadRoutes, selectedRouteIds, t]);

  const columns = useMemo<ColumnsType<NocoBaseDesktopRoute>>(
    () => [
      {
        dataIndex: 'title',
        title: t('Route name'),
        render: (_value, route) => getRouteTitle(route, t),
      },
      {
        dataIndex: 'type',
        title: t('Type'),
        width: 160,
        render: (value) => value || t('Unknown'),
      },
      {
        dataIndex: 'schemaUid',
        title: t('UID'),
        width: 220,
        render: (value) => value || '-',
      },
      {
        dataIndex: 'routePath',
        title: t('Route path'),
        width: 220,
        render: (_value, route) => getRoutePath(route) || String(route.options?.href || '') || t('No route path'),
      },
      {
        dataIndex: 'hideInMenu',
        title: t('Show in menu'),
        width: 140,
        render: (value) =>
          value ? (
            <Space>
              <CloseOutlined style={{ color: token.colorError }} />
              {t('Hidden')}
            </Space>
          ) : (
            <Space>
              <CheckOutlined style={{ color: token.colorSuccess }} />
              {t('Shown')}
            </Space>
          ),
      },
      {
        dataIndex: 'actions',
        title: t('Actions'),
        width: 160,
        render: (_value, route) => {
          const routeTitle = getRouteTitle(route, t);
          return (
            <Space size={token.marginXXS}>
              <Button
                aria-label={t('Edit route {{route}}', { route: routeTitle })}
                icon={<EditOutlined />}
                onClick={() => openEditModal(route)}
                size="small"
                type="text"
              />
              <Popconfirm
                cancelText={t('Cancel')}
                okText={t('Delete')}
                onConfirm={() => handleDelete(route)}
                title={t('Are you sure you want to delete it?')}
              >
                <Button
                  aria-label={t('Delete route {{route}}', { route: routeTitle })}
                  icon={<DeleteOutlined />}
                  size="small"
                  type="text"
                />
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [handleDelete, openEditModal, t, token.colorError, token.colorSuccess, token.marginXXS],
  );

  return (
    <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Typography.Text type="secondary">{t(layout.label)}</Typography.Text>
        <Space>
          <Button
            aria-label={t('Delete')}
            disabled={!hasSelectedRoutes}
            icon={<DeleteOutlined />}
            onClick={deleteSelectedRoutes}
          >
            {t('Delete')}
          </Button>
          <Button
            aria-label={t('Hide in menu')}
            disabled={!hasSelectedRoutes}
            icon={<EyeInvisibleOutlined />}
            onClick={() => updateSelectedRoutes({ hideInMenu: true })}
          >
            {t('Hide in menu')}
          </Button>
          <Button
            aria-label={t('Show in menu')}
            disabled={!hasSelectedRoutes}
            icon={<EyeOutlined />}
            onClick={() => updateSelectedRoutes({ hideInMenu: false })}
          >
            {t('Show in menu')}
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadRoutes}>
            {t('Refresh')}
          </Button>
          <Button icon={<PlusOutlined />} onClick={openAddModal} type="primary">
            {t('Add route')}
          </Button>
        </Space>
      </Space>
      <Table<NocoBaseDesktopRoute>
        columns={columns}
        dataSource={routes}
        loading={loading}
        locale={{
          emptyText: t('No routes in {{layout}}', { layout: t(layout.label) }),
        }}
        pagination={false}
        rowSelection={{
          onChange: setSelectedRowKeys,
          selectedRowKeys,
        }}
        rowKey={(route) => route.id ?? String(route.schemaUid)}
      />
      <RouteEditorModal
        confirmLoading={saving}
        initialRoute={editingRoute}
        mobile={layout.mobile}
        onCancel={closeEditor}
        onSubmit={handleSubmit}
        open={editorOpen}
      />
    </Space>
  );
}

const RoutesPage: React.FC = () => {
  const t = useT();

  return (
    <Card>
      <Tabs
        destroyInactiveTabPane
        items={routeLayouts.map((layout) => ({
          key: layout.key,
          label: t(layout.label),
          children: <RoutesTable layout={layout} />,
        }))}
      />
    </Card>
  );
};

export default RoutesPage;
