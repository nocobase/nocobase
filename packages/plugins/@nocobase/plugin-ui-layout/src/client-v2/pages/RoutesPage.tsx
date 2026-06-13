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
  EyeInvisibleOutlined,
  EyeOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Table, type NocoBaseDesktopRoute } from '@nocobase/client-v2';
import { NocoBaseDesktopRouteType } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ADMIN_UI_LAYOUT, DEFAULT_MOBILE_UI_LAYOUT } from '../../constants';
import { useT } from '../locale';
import { getUiLayoutRouteUrl } from './UiLayoutsPage';

type RouteLayoutConfig = {
  key: string;
  label: string;
  routePath: string;
  uid: string;
  mobile?: boolean;
};

type RouteFormValues = {
  title: string;
  type: NocoBaseDesktopRouteType;
  routePath?: string;
};

type RouteFilterValues = {
  keyword?: string;
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
  app?: Parameters<typeof getUiLayoutRouteUrl>[0];
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
    routePath: DEFAULT_ADMIN_UI_LAYOUT.routePath,
    uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
  },
  {
    key: 'mobile',
    label: 'Mobile routes',
    mobile: true,
    routePath: DEFAULT_MOBILE_UI_LAYOUT.routePath,
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

function getLinkRoutePath(route: NocoBaseDesktopRoute) {
  const path = route.options?.path;
  return typeof path === 'string' && path.trim() ? path.trim() : '';
}

function getRouteTypeLabel(type: NocoBaseDesktopRouteType | undefined) {
  if (type === NocoBaseDesktopRouteType.group) {
    return 'Group';
  }
  if (type === NocoBaseDesktopRouteType.page) {
    return 'Page (v1)';
  }
  if (type === NocoBaseDesktopRouteType.flowPage) {
    return 'Page (v2)';
  }
  if (type === NocoBaseDesktopRouteType.link) {
    return 'Link';
  }
  if (type === NocoBaseDesktopRouteType.tabs) {
    return 'Tab';
  }
  return 'Unknown';
}

function getRouteTypeColor(type: NocoBaseDesktopRouteType | undefined) {
  if (type === NocoBaseDesktopRouteType.flowPage || type === NocoBaseDesktopRouteType.page) {
    return 'purple';
  }
  if (type === NocoBaseDesktopRouteType.link) {
    return 'red';
  }
  if (type === NocoBaseDesktopRouteType.group) {
    return 'blue';
  }
  return 'default';
}

function canRouteHaveChildren(route: NocoBaseDesktopRoute) {
  if (route.type === NocoBaseDesktopRouteType.group) {
    return true;
  }
  if (route.type === NocoBaseDesktopRouteType.page || route.type === NocoBaseDesktopRouteType.flowPage) {
    return !!route.enableTabs;
  }
  return false;
}

function findRouteById(routes: NocoBaseDesktopRoute[], id: number | undefined): NocoBaseDesktopRoute | undefined {
  if (id === undefined) {
    return undefined;
  }
  for (const route of routes) {
    if (route.id === id) {
      return route;
    }
    const child = findRouteById(route.children ?? [], id);
    if (child) {
      return child;
    }
  }
  return undefined;
}

function getRouteAccessPath(route: NocoBaseDesktopRoute, layout: RouteLayoutConfig, routes: NocoBaseDesktopRoute[]) {
  if (route.type === NocoBaseDesktopRouteType.group || route.type === NocoBaseDesktopRouteType.link) {
    return '';
  }
  if (!route.schemaUid) {
    return '';
  }
  if (route.type === NocoBaseDesktopRouteType.tabs) {
    const parent = findRouteById(routes, route.parentId);
    if (!parent?.schemaUid) {
      return '';
    }
    return `${layout.routePath}/${parent.schemaUid}/tabs/${route.schemaUid}`;
  }
  return `${layout.routePath}/${route.schemaUid}`;
}

function filterRoutesByKeyword(
  routes: NocoBaseDesktopRoute[],
  keyword: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return routes;
  }
  return routes
    .map((route) => {
      const children = filterRoutesByKeyword(route.children ?? [], normalizedKeyword, t);
      const routeTitle = getRouteTitle(route, t).toLowerCase();
      const schemaUid = String(route.schemaUid || '').toLowerCase();
      const routeType = String(route.type || '').toLowerCase();
      const linkPath = getLinkRoutePath(route).toLowerCase();
      const matched =
        routeTitle.includes(normalizedKeyword) ||
        schemaUid.includes(normalizedKeyword) ||
        routeType.includes(normalizedKeyword) ||
        linkPath.includes(normalizedKeyword);
      if (matched || children.length) {
        return {
          ...route,
          children: children.length ? children : route.children,
        };
      }
      return null;
    })
    .filter((route): route is NocoBaseDesktopRoute => !!route);
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

function RouteTypeTag({ type }: { type: NocoBaseDesktopRouteType | undefined }) {
  const t = useT();
  return <Tag color={getRouteTypeColor(type)}>{t(getRouteTypeLabel(type))}</Tag>;
}

function RouteEditorModal(props: {
  confirmLoading?: boolean;
  defaultType?: NocoBaseDesktopRouteType;
  initialRoute?: NocoBaseDesktopRoute | null;
  mobile?: boolean;
  onCancel: () => void;
  onSubmit: (values: RouteFormValues) => Promise<void>;
  open: boolean;
  title: string;
}) {
  const t = useT();
  const [form] = Form.useForm<RouteFormValues>();
  const routeType = Form.useWatch('type', form);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    form.setFieldsValue({
      routePath: props.initialRoute
        ? getLinkRoutePath(props.initialRoute) || String(props.initialRoute.options?.href || '')
        : '',
      title: props.initialRoute?.title || '',
      type: props.initialRoute?.type || props.defaultType || NocoBaseDesktopRouteType.flowPage,
    });
  }, [form, props.defaultType, props.initialRoute, props.open]);
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
      title={props.title}
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

function RoutesFilterButton(props: { onApply: (values: RouteFilterValues) => void }) {
  const t = useT();
  const [form] = Form.useForm<RouteFilterValues>();
  const [open, setOpen] = useState(false);

  const content = (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => {
        props.onApply(values);
        setOpen(false);
      }}
      style={{ width: 260 }}
    >
      <Form.Item label={t('Search routes')} name="keyword">
        <Input allowClear />
      </Form.Item>
      <Space>
        <Button htmlType="submit" type="primary">
          {t('Submit')}
        </Button>
        <Button
          onClick={() => {
            form.resetFields();
            props.onApply({});
            setOpen(false);
          }}
        >
          {t('Cancel')}
        </Button>
      </Space>
    </Form>
  );

  return (
    <Popover content={content} onOpenChange={setOpen} open={open} placement="bottomLeft" trigger="click">
      <Button aria-label={t('Filter')} icon={<FilterOutlined />}>
        {t('Filter')}
      </Button>
    </Popover>
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
  const [parentRoute, setParentRoute] = useState<NocoBaseDesktopRoute | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<RouteFilterValues>({});
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
    setParentRoute(null);
    setEditorOpen(true);
  }, []);

  const openAddChildModal = useCallback((route: NocoBaseDesktopRoute) => {
    setEditingRoute(null);
    setParentRoute(route);
    setEditorOpen(true);
  }, []);

  const openEditModal = useCallback((route: NocoBaseDesktopRoute) => {
    setEditingRoute(route);
    setParentRoute(null);
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingRoute(null);
    setParentRoute(null);
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
            values: {
              ...normalizeRouteValues(values),
              ...(parentRoute?.id !== undefined ? { parentId: parentRoute.id } : {}),
            },
          });
          ctx.message?.success?.(t('Saved successfully'));
        }
        closeEditor();
        await loadRoutes();
      } finally {
        setSaving(false);
      }
    },
    [closeEditor, ctx.message, desktopRoutesResource, editingRoute, layout.uid, loadRoutes, parentRoute, t],
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

  const filteredRoutes = useMemo(
    () => filterRoutesByKeyword(routes, filterValues.keyword || '', t),
    [filterValues.keyword, routes, t],
  );

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
        title: t('Title'),
        width: 260,
        render: (_value, route) => getRouteTitle(route, t),
      },
      {
        dataIndex: 'type',
        title: t('Type'),
        width: 160,
        render: (value) => <RouteTypeTag type={value as NocoBaseDesktopRouteType | undefined} />,
      },
      {
        dataIndex: 'hideInMenu',
        title: t('Show in menu'),
        width: 140,
        render: (value) =>
          value ? (
            <CloseOutlined aria-label={t('Hidden')} style={{ color: token.colorError }} />
          ) : (
            <CheckOutlined aria-label={t('Shown')} style={{ color: token.colorSuccess }} />
          ),
      },
      {
        dataIndex: 'routePath',
        title: t('Path'),
        width: 320,
        render: (_value, route) => {
          const path = getRouteAccessPath(route, layout, routes);
          if (!path) {
            return null;
          }
          return (
            <Typography.Paragraph copyable ellipsis style={{ marginBottom: 0 }}>
              {path}
            </Typography.Paragraph>
          );
        },
      },
      {
        dataIndex: 'actions',
        title: t('Actions'),
        width: 260,
        render: (_value, route) => {
          const routeTitle = getRouteTitle(route, t);
          const accessPath = getRouteAccessPath(route, layout, routes);
          const accessHref = accessPath ? getUiLayoutRouteUrl(ctx.app, accessPath) : '';
          const addChildDisabled = !canRouteHaveChildren(route);
          return (
            <Space size={token.marginXXS}>
              <Button
                aria-label={t('Add child {{route}}', { route: routeTitle })}
                disabled={addChildDisabled}
                onClick={() => openAddChildModal(route)}
                size="small"
                type="link"
              >
                {t('Add child')}
              </Button>
              <Button
                aria-label={t('Edit {{route}}', { route: routeTitle })}
                onClick={() => openEditModal(route)}
                size="small"
                type="link"
              >
                {t('Edit')}
              </Button>
              <Button
                aria-label={t('View {{route}}', { route: routeTitle })}
                disabled={!accessPath}
                href={accessHref || undefined}
                size="small"
                target="_blank"
                type="link"
              >
                {t('View')}
              </Button>
              <Popconfirm
                cancelText={t('Cancel')}
                okText={t('Delete')}
                onConfirm={() => handleDelete(route)}
                title={t('Are you sure you want to delete it?')}
              >
                <Button aria-label={t('Delete {{route}}', { route: routeTitle })} size="small" type="link">
                  {t('Delete')}
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [
      handleDelete,
      ctx.app,
      layout,
      openAddChildModal,
      openEditModal,
      routes,
      t,
      token.colorError,
      token.colorSuccess,
      token.marginXXS,
    ],
  );

  return (
    <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <RoutesFilterButton onApply={setFilterValues} />
        <Space>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadRoutes}>
            {t('Refresh')}
          </Button>
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
          <Button aria-label={t('Add new')} icon={<PlusOutlined />} onClick={openAddModal} type="primary">
            {t('Add new')}
          </Button>
        </Space>
      </Space>
      <Table<NocoBaseDesktopRoute>
        columns={columns}
        dataSource={filteredRoutes}
        loading={loading}
        locale={{
          emptyText: t('No routes in {{layout}}', { layout: t(layout.label) }),
        }}
        pagination={{
          pageSize: 20,
          total: filteredRoutes.length,
        }}
        rowSelection={{
          onChange: setSelectedRowKeys,
          selectedRowKeys,
        }}
        rowKey={(route) => route.id ?? String(route.schemaUid)}
      />
      <RouteEditorModal
        confirmLoading={saving}
        defaultType={NocoBaseDesktopRouteType.flowPage}
        initialRoute={editingRoute}
        mobile={layout.mobile}
        onCancel={closeEditor}
        onSubmit={handleSubmit}
        open={editorOpen}
        title={editingRoute ? t('Edit route') : parentRoute ? t('Add child route') : t('Add new')}
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
