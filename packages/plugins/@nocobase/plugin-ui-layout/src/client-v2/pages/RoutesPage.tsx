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
import { Table } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import {
  Button,
  Card,
  Checkbox,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Popover,
  Radio,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ADMIN_UI_LAYOUT, DEFAULT_MOBILE_UI_LAYOUT } from '../../constants';
import { useT } from '../locale';
import { MobileMenuSettingsIconPicker } from '../models/MobileMenuComponents';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '../models/mobileFlowCompat';
import { createDesktopRouteLayoutPermissionFilter } from '../permissions/layoutAwareDesktopRoutesPermissions';
import { getUiLayoutRouteUrl } from './UiLayoutsPage';

type RouteLayoutConfig = {
  key: string;
  label: string;
  routePath: string;
  uid: string;
  mobile?: boolean;
};

type RouteFormValues = {
  enableTabs?: boolean;
  icon?: string;
  params?: RouteSearchParameter[];
  routePath?: string;
  showInMenu?: boolean;
  title: string;
  type: NocoBaseDesktopRouteType;
};

type RouteSearchParameter = {
  name?: string;
  value?: string;
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

const actionLinkButtonStyle: React.CSSProperties = {
  paddingInline: 0,
};

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

function getRouteOptionString(route: NocoBaseDesktopRoute, key: string) {
  const value = route.options?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function getLinkRoutePath(route: NocoBaseDesktopRoute) {
  return (
    getRouteOptionString(route, 'path') || getRouteOptionString(route, 'href') || getRouteOptionString(route, 'url')
  );
}

function getLinkRouteParams(route: NocoBaseDesktopRoute): RouteSearchParameter[] {
  const params = route.options?.params;
  if (!Array.isArray(params)) {
    return [];
  }
  return params.reduce<RouteSearchParameter[]>((items, param) => {
    if (!param || typeof param !== 'object') {
      return items;
    }
    const item = param as RouteSearchParameter;
    items.push({
      name: typeof item.name === 'string' ? item.name : '',
      value: typeof item.value === 'string' ? item.value : '',
    });
    return items;
  }, []);
}

function getRouteTypeLabel(type: NocoBaseDesktopRouteType | undefined) {
  if (type === NocoBaseDesktopRouteType.group) {
    return 'Group';
  }
  if (type === NocoBaseDesktopRouteType.page || type === NocoBaseDesktopRouteType.flowPage) {
    return 'Page';
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

function isPageRouteType(type: NocoBaseDesktopRouteType | undefined) {
  return type === NocoBaseDesktopRouteType.page || type === NocoBaseDesktopRouteType.flowPage;
}

function getDefaultRouteType(options: { mobile?: boolean; parentRoute?: NocoBaseDesktopRoute | null }) {
  if (
    options.parentRoute?.type === NocoBaseDesktopRouteType.page ||
    options.parentRoute?.type === NocoBaseDesktopRouteType.flowPage
  ) {
    return NocoBaseDesktopRouteType.tabs;
  }
  return NocoBaseDesktopRouteType.flowPage;
}

function getRouteTypeOptions(
  t: (key: string, options?: Record<string, unknown>) => string,
  options: { mobile?: boolean; parentRoute?: NocoBaseDesktopRoute | null },
) {
  if (
    options.parentRoute?.type === NocoBaseDesktopRouteType.page ||
    options.parentRoute?.type === NocoBaseDesktopRouteType.flowPage
  ) {
    return [
      {
        label: t('Tab'),
        value: NocoBaseDesktopRouteType.tabs,
      },
    ];
  }

  if (options.parentRoute?.type === NocoBaseDesktopRouteType.group) {
    return [
      {
        label: t('Group'),
        value: NocoBaseDesktopRouteType.group,
      },
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
    ...(options.mobile
      ? []
      : [
          {
            label: t('Group'),
            value: NocoBaseDesktopRouteType.group,
          },
        ]),
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

function filterHiddenRoutes(routes: NocoBaseDesktopRoute[]): NocoBaseDesktopRoute[] {
  return routes
    .filter((route) => route.hidden !== true)
    .map((route) => {
      const { children, ...routeWithoutChildren } = route;
      const visibleChildren = children ? filterHiddenRoutes(children) : [];
      return visibleChildren.length
        ? {
            ...routeWithoutChildren,
            children: visibleChildren,
          }
        : routeWithoutChildren;
    });
}

function getDirectTabRouteChildren(route: NocoBaseDesktopRoute) {
  return (route.children ?? []).filter((child) => child.type === NocoBaseDesktopRouteType.tabs);
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
    return `${layout.routePath}/${parent.schemaUid}/tab/${route.schemaUid}`;
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
  return routes.reduce<NocoBaseDesktopRoute[]>((items, route) => {
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
      items.push({
        ...route,
        children: children.length ? children : route.children,
      });
    }
    return items;
  }, []);
}

function normalizeRouteValues(
  values: RouteFormValues,
  route?: NocoBaseDesktopRoute,
  options?: {
    mobile?: boolean;
    withInitialPageTab?: boolean;
  },
): Partial<NocoBaseDesktopRoute> {
  const routePath = values.routePath?.trim();
  const params = (values.params ?? []).filter((param) => {
    return !!param?.name?.trim() || !!param?.value?.trim();
  });
  const shouldPersistPageSchemaUid = isPageRouteType(values.type);
  const shouldPersistTabSchemaUid = values.type === NocoBaseDesktopRouteType.tabs;
  const routeValues: Partial<NocoBaseDesktopRoute> = {
    ...(shouldPersistPageSchemaUid || shouldPersistTabSchemaUid ? { schemaUid: route?.schemaUid || randomId() } : {}),
    ...(shouldPersistTabSchemaUid ? { tabSchemaName: route?.tabSchemaName || randomId() } : {}),
    ...(shouldPersistPageSchemaUid ? { enableTabs: !!values.enableTabs } : {}),
    hideInMenu: values.showInMenu === false,
    icon: values.icon,
    title: values.title.trim(),
    type: values.type,
  };

  if (values.type === NocoBaseDesktopRouteType.link) {
    const { href: _href, params: _params, path: _path, url: _url, ...restOptions } = route?.options ?? {};
    routeValues.options = {
      ...restOptions,
      ...(routePath ? { [options?.mobile ? 'url' : 'href']: routePath } : {}),
      ...(params.length ? { params } : {}),
    };
  }

  if (options?.withInitialPageTab && shouldPersistPageSchemaUid) {
    return {
      ...routeValues,
      menuSchemaUid: randomId(),
      children: [
        {
          type: NocoBaseDesktopRouteType.tabs,
          schemaUid: randomId(),
          tabSchemaName: randomId(),
          hidden: !values.enableTabs,
        },
      ],
    };
  }

  return routeValues;
}

function RouteTypeTag({ type }: { type: NocoBaseDesktopRouteType | undefined }) {
  const t = useT();
  return <Tag color={getRouteTypeColor(type)}>{t(getRouteTypeLabel(type))}</Tag>;
}

function RouteEditorDrawer(props: {
  confirmLoading?: boolean;
  initialRoute?: NocoBaseDesktopRoute | null;
  mobile?: boolean;
  onCancel: () => void;
  onSubmit: (values: RouteFormValues) => Promise<void>;
  open: boolean;
  parentRoute?: NocoBaseDesktopRoute | null;
  title: string;
}) {
  const t = useT();
  const { token } = theme.useToken();
  const [form] = Form.useForm<RouteFormValues>();
  const watchedRouteType = Form.useWatch('type', form);
  const routeType = props.initialRoute?.type ?? watchedRouteType;
  const routeTypeOptions = useMemo(
    () => getRouteTypeOptions(t, { mobile: props.mobile, parentRoute: props.parentRoute }),
    [props.mobile, props.parentRoute, t],
  );

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const type =
      props.initialRoute?.type || getDefaultRouteType({ mobile: props.mobile, parentRoute: props.parentRoute });
    form.resetFields();
    form.setFieldsValue({
      enableTabs: !!props.initialRoute?.enableTabs,
      icon: props.initialRoute?.icon,
      params: props.initialRoute ? getLinkRouteParams(props.initialRoute) : [],
      routePath: props.initialRoute ? getLinkRoutePath(props.initialRoute) : '',
      showInMenu: props.initialRoute ? !props.initialRoute.hideInMenu : true,
      title: props.initialRoute?.title || '',
      type,
    });
  }, [form, props.initialRoute, props.mobile, props.open, props.parentRoute]);

  const renderFooter = (
    <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button onClick={props.onCancel}>{t('Cancel')}</Button>
      <Button loading={props.confirmLoading} onClick={() => form.submit()} type="primary">
        {t('Submit')}
      </Button>
    </Space>
  );

  return (
    <Drawer
      destroyOnClose
      footer={renderFooter}
      forceRender
      onClose={props.onCancel}
      open={props.open}
      title={props.title}
      width={token.screenSM}
    >
      <Form form={form} layout="vertical" onFinish={props.onSubmit}>
        {props.initialRoute ? (
          <>
            <Form.Item hidden name="type">
              <Input />
            </Form.Item>
            <Form.Item label={t('Type')}>
              <RouteTypeTag type={routeType} />
            </Form.Item>
          </>
        ) : (
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
            <Radio.Group options={routeTypeOptions} />
          </Form.Item>
        )}
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
          label={t('Icon')}
          name="icon"
          rules={
            props.mobile
              ? [
                  {
                    message: t('Icon field is required'),
                    required: true,
                  },
                ]
              : undefined
          }
        >
          <MobileMenuSettingsIconPicker />
        </Form.Item>
        {routeType === NocoBaseDesktopRouteType.link ? (
          <>
            <Form.Item
              extra={t('Do not concatenate search params in the URL')}
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
              <Input.TextArea autoSize />
            </Form.Item>
            <Form.Item label={t('Search parameters')}>
              <Form.List name="params">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" size={token.marginXS} style={{ width: '100%' }}>
                    {fields.map((field) => (
                      <Space.Compact block key={field.key}>
                        <Form.Item name={[field.name, 'name']} noStyle>
                          <Input placeholder={t('Name')} />
                        </Form.Item>
                        <Form.Item name={[field.name, 'value']} noStyle>
                          <Input placeholder={t('Value')} />
                        </Form.Item>
                        <Button aria-label={t('Delete')} icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                      </Space.Compact>
                    ))}
                    <Button onClick={() => add()} type="dashed">
                      {t('Add parameter')}
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Form.Item>
          </>
        ) : null}
        <Form.Item
          extra={t('If selected, the route will be displayed in the menu.')}
          name="showInMenu"
          valuePropName="checked"
        >
          <Checkbox>{t('Show in menu')}</Checkbox>
        </Form.Item>
        {isPageRouteType(routeType) ? (
          <Form.Item
            extra={t('If selected, the page will display Tab pages.')}
            name="enableTabs"
            valuePropName="checked"
          >
            <Checkbox>{t('Enable page tabs')}</Checkbox>
          </Form.Item>
        ) : null}
      </Form>
    </Drawer>
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
        url: '/desktopRoutes:list',
        method: 'get',
        params: {
          filter: createDesktopRouteLayoutPermissionFilter(layout.uid),
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

  const openEditModal = useCallback(
    (route: NocoBaseDesktopRoute) => {
      setEditingRoute(findRouteById(routes, route.id) ?? route);
      setParentRoute(null);
      setEditorOpen(true);
    },
    [routes],
  );

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
          const shouldSyncTabVisibility =
            isPageRouteType(editingRoute.type) && editingRoute.enableTabs !== !!values.enableTabs;
          await desktopRoutesResource.update({
            filterByTk: editingRoute.id,
            layout: layout.uid,
            values: normalizeRouteValues(values, editingRoute, { mobile: layout.mobile }),
          });
          if (shouldSyncTabVisibility) {
            for (const childRoute of getDirectTabRouteChildren(editingRoute)) {
              if (childRoute.id === undefined) {
                continue;
              }
              await desktopRoutesResource.update({
                filterByTk: childRoute.id,
                layout: layout.uid,
                values: {
                  hidden: !values.enableTabs,
                },
              });
            }
          }
          ctx.message?.success?.(t('Updated successfully'));
        } else {
          await desktopRoutesResource.create({
            layout: layout.uid,
            values: {
              ...normalizeRouteValues(values, undefined, { mobile: layout.mobile, withInitialPageTab: true }),
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
    [
      closeEditor,
      ctx.message,
      desktopRoutesResource,
      editingRoute,
      layout.mobile,
      layout.uid,
      loadRoutes,
      parentRoute,
      t,
    ],
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

  const visibleRoutes = useMemo(() => filterHiddenRoutes(routes), [routes]);

  const filteredRoutes = useMemo(
    () => filterRoutesByKeyword(visibleRoutes, filterValues.keyword || '', t),
    [filterValues.keyword, visibleRoutes, t],
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
            <Space size="small">
              <Button
                aria-label={t('Add child {{route}}', { route: routeTitle })}
                disabled={addChildDisabled}
                onClick={() => openAddChildModal(route)}
                size="small"
                style={actionLinkButtonStyle}
                type="link"
              >
                {t('Add child')}
              </Button>
              <Button
                aria-label={t('Edit {{route}}', { route: routeTitle })}
                onClick={() => openEditModal(route)}
                size="small"
                style={actionLinkButtonStyle}
                type="link"
              >
                {t('Edit')}
              </Button>
              <Button
                aria-label={t('View {{route}}', { route: routeTitle })}
                disabled={!accessPath}
                href={accessHref || undefined}
                size="small"
                style={actionLinkButtonStyle}
                target="_blank"
                type="link"
              >
                {t('View')}
              </Button>
              <Popconfirm
                cancelText={t('Cancel')}
                description={t('Are you sure you want to delete it?')}
                okText={t('Delete')}
                onConfirm={() => handleDelete(route)}
                title={t('Delete route')}
              >
                <Button
                  aria-label={t('Delete {{route}}', { route: routeTitle })}
                  size="small"
                  style={actionLinkButtonStyle}
                  type="link"
                >
                  {t('Delete')}
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [handleDelete, ctx.app, layout, openAddChildModal, openEditModal, routes, t, token.colorError, token.colorSuccess],
  );

  return (
    <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <RoutesFilterButton onApply={setFilterValues} />
        <Space>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadRoutes}>
            {t('Refresh')}
          </Button>
          <Popconfirm
            cancelText={t('Cancel')}
            description={t('Are you sure you want to delete it?')}
            disabled={!hasSelectedRoutes}
            okText={t('Delete')}
            onConfirm={deleteSelectedRoutes}
            title={t('Delete routes')}
          >
            <Button aria-label={t('Delete')} disabled={!hasSelectedRoutes} icon={<DeleteOutlined />}>
              {t('Delete')}
            </Button>
          </Popconfirm>
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
        expandable={{
          rowExpandable: (route) => !!route.children?.length,
        }}
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
      <RouteEditorDrawer
        confirmLoading={saving}
        initialRoute={editingRoute}
        mobile={layout.mobile}
        onCancel={closeEditor}
        onSubmit={handleSubmit}
        open={editorOpen}
        parentRoute={parentRoute}
        title={editingRoute ? t('Edit route') : parentRoute ? t('Add child route') : t('Add new')}
      />
    </Space>
  );
}

type RoutesPageProps = {
  layoutKey?: RouteLayoutConfig['key'];
};

const RoutesPage: React.FC<RoutesPageProps> = ({ layoutKey = 'desktop' }) => {
  const layout = routeLayouts.find((item) => item.key === layoutKey) ?? routeLayouts[0];
  return (
    <Card>
      <RoutesTable layout={layout} />
    </Card>
  );
};

export const MobileRoutesPage: React.FC = () => <RoutesPage layoutKey="mobile" />;

export default RoutesPage;
