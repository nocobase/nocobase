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
import {
  buildPageMenuRoute,
  DrawerFormLayout,
  IconPicker,
  isPageMenuRoute,
  NocoBaseDesktopRouteType,
  resolvePageMenuModels,
  Table,
  type NocoBaseDesktopRoute,
  type ResolvedPageMenuModel,
} from '@nocobase/client-v2';
import { randomId, useFlowContext, useFlowEngine, useFlowView } from '@nocobase/flow-engine';
import { App as AntdApp, Button, Checkbox, Form, Input, Popover, Radio, Space, Tag, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'antd/es/table/interface';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MOBILE_UI_LAYOUT_UID } from '../../constants';
import { useT } from '../locale';
import { getMultiPortalRouteUrl } from '../routeUrl';
import type { MultiPortalRecord } from './MultiPortalsPage';

type RouteType = NonNullable<NocoBaseDesktopRoute['type']>;

type RouteFormValues = {
  enableTabs?: boolean;
  icon?: string;
  params?: RouteSearchParameter[];
  routePath?: string;
  showInMenu?: boolean;
  title: string;
  type: RouteType;
};

type RouteSearchParameter = {
  name?: string;
  value?: string;
};

type RouteFilterValues = {
  keyword?: string;
};

type DesktopRoutePortalParams = {
  portal: string;
};

type DesktopRoutesResource = {
  create: (params: DesktopRoutePortalParams & { values: Partial<NocoBaseDesktopRoute> }) => Promise<unknown>;
  destroy: (
    params: DesktopRoutePortalParams & { filterByTk: Array<number | string> | number | string },
  ) => Promise<unknown>;
  update: (
    params: DesktopRoutePortalParams & {
      filterByTk: number | string;
      values: Partial<NocoBaseDesktopRoute>;
    },
  ) => Promise<unknown>;
};

type PortalRoutesFlowContext = {
  api: {
    request: (params: {
      method: 'get';
      params: Record<string, unknown>;
      skipNotify?: boolean;
      url: string;
    }) => Promise<{ data?: unknown }>;
    resource: (name: string) => DesktopRoutesResource;
  };
  app?: Parameters<typeof getMultiPortalRouteUrl>[0];
  viewer: {
    drawer: (options: { closable?: boolean; content: () => React.ReactNode; width?: number | string }) => unknown;
  };
};

type RouteListPayload = {
  data?: NocoBaseDesktopRoute[];
};

const actionLinkButtonStyle: React.CSSProperties = {
  paddingInline: 0,
};

const IconPickerFormControl = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof IconPicker>>(
  (props, ref) => (
    <div ref={ref}>
      <IconPicker {...props} />
    </div>
  ),
);

IconPickerFormControl.displayName = 'IconPickerFormControl';

function toRoutePayload(responseData: unknown): RouteListPayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as RouteListPayload;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}

function getRouteTitle(route: NocoBaseDesktopRoute, t: ReturnType<typeof useT>) {
  const title = typeof route.title === 'string' ? route.title.trim() : '';
  if (title) {
    return title;
  }
  if (route.type === NocoBaseDesktopRouteType.tabs) {
    return t('Untitled');
  }
  return route.schemaUid || t('Untitled');
}

function getRouteOptionString(route: NocoBaseDesktopRoute, key: string) {
  const value: unknown = route.options?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function getLinkRoutePath(route: NocoBaseDesktopRoute) {
  return (
    getRouteOptionString(route, 'path') || getRouteOptionString(route, 'href') || getRouteOptionString(route, 'url')
  );
}

function getLinkRouteParams(route: NocoBaseDesktopRoute): RouteSearchParameter[] {
  const params: unknown = route.options?.params;
  if (!Array.isArray(params)) {
    return [];
  }
  return params.reduce<RouteSearchParameter[]>((items, param: unknown) => {
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

function getRouteTypeLabel(type: RouteType | undefined) {
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

function getRouteTypeColor(type: RouteType | undefined, pageMenuModel?: ResolvedPageMenuModel) {
  if (pageMenuModel) {
    return 'purple';
  }
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

function findPageMenuModel(pageMenuModels: ResolvedPageMenuModel[], type: RouteType | undefined) {
  return pageMenuModels.find((definition) => definition.routeType === type);
}

function getAvailablePageMenuModel(route: NocoBaseDesktopRoute, pageMenuModels: ResolvedPageMenuModel[]) {
  if (!isPageMenuRoute(route)) {
    return undefined;
  }
  const definition = findPageMenuModel(pageMenuModels, route.type);
  return definition && route.options?.pageMenuModelClass === definition.modelClass ? definition : undefined;
}

function getPageMenuModelLabel(
  definition: ResolvedPageMenuModel,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  return typeof definition.label === 'string' ? t(definition.label) : definition.routeType;
}

function isUnavailablePageMenuRoute(route: NocoBaseDesktopRoute, pageMenuModels: ResolvedPageMenuModel[]) {
  return isPageMenuRoute(route) && !getAvailablePageMenuModel(route, pageMenuModels);
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

function isPageRouteType(type: RouteType | undefined) {
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
  options: {
    mobile?: boolean;
    pageMenuModels: ResolvedPageMenuModel[];
    parentRoute?: NocoBaseDesktopRoute | null;
  },
) {
  if (
    options.parentRoute?.type === NocoBaseDesktopRouteType.page ||
    options.parentRoute?.type === NocoBaseDesktopRouteType.flowPage
  ) {
    return [{ label: t('Tab'), value: NocoBaseDesktopRouteType.tabs }];
  }

  if (options.parentRoute?.type === NocoBaseDesktopRouteType.group) {
    return [
      { label: t('Group'), value: NocoBaseDesktopRouteType.group },
      { label: t('Page'), value: NocoBaseDesktopRouteType.flowPage },
      { label: t('Link'), value: NocoBaseDesktopRouteType.link },
      ...options.pageMenuModels.map((definition) => ({
        label: getPageMenuModelLabel(definition, t),
        value: definition.routeType,
      })),
    ];
  }

  return [
    ...(options.mobile ? [] : [{ label: t('Group'), value: NocoBaseDesktopRouteType.group }]),
    { label: t('Page'), value: NocoBaseDesktopRouteType.flowPage },
    { label: t('Link'), value: NocoBaseDesktopRouteType.link },
    ...options.pageMenuModels.map((definition) => ({
      label: getPageMenuModelLabel(definition, t),
      value: definition.routeType,
    })),
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

function isManagedV2Route(route: NocoBaseDesktopRoute) {
  return route.hidden !== true && route.type !== NocoBaseDesktopRouteType.page;
}

function filterManagedRoutes(routes: NocoBaseDesktopRoute[]): NocoBaseDesktopRoute[] {
  return routes.filter(isManagedV2Route).map((route) => {
    const { children, ...routeWithoutChildren } = route;
    const visibleChildren = children ? filterManagedRoutes(children) : [];
    return visibleChildren.length ? { ...routeWithoutChildren, children: visibleChildren } : routeWithoutChildren;
  });
}

function getDirectTabRouteChildren(route: NocoBaseDesktopRoute) {
  return (route.children ?? []).filter((child) => child.type === NocoBaseDesktopRouteType.tabs);
}

function joinPortalRoutePath(portalRoutePath: string, routePath: string) {
  return `${portalRoutePath.replace(/\/+$/, '')}/${routePath.replace(/^\/+/, '')}`;
}

function getRouteAccessPath(route: NocoBaseDesktopRoute, portalRoutePath: string, routes: NocoBaseDesktopRoute[]) {
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
    return joinPortalRoutePath(portalRoutePath, `${parent.schemaUid}/tab/${route.schemaUid}`);
  }
  return joinPortalRoutePath(portalRoutePath, route.schemaUid);
}

function filterRoutesByKeyword(routes: NocoBaseDesktopRoute[], keyword: string, t: ReturnType<typeof useT>) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return routes;
  }
  return routes.reduce<NocoBaseDesktopRoute[]>((items, route) => {
    const children = filterRoutesByKeyword(route.children ?? [], normalizedKeyword, t);
    const matched =
      getRouteTitle(route, t).toLowerCase().includes(normalizedKeyword) ||
      String(route.schemaUid || '')
        .toLowerCase()
        .includes(normalizedKeyword) ||
      String(route.type || '')
        .toLowerCase()
        .includes(normalizedKeyword) ||
      getLinkRoutePath(route).toLowerCase().includes(normalizedKeyword);
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
    pageMenuModels?: ResolvedPageMenuModel[];
    parentId?: number;
    withInitialPageTab?: boolean;
  },
): Partial<NocoBaseDesktopRoute> {
  const routePath = values.routePath?.trim();
  const params = (values.params ?? []).filter((param) => !!param?.name?.trim() || !!param?.value?.trim());
  const shouldPersistPageSchemaUid = isPageRouteType(values.type);
  const shouldPersistTabSchemaUid = values.type === NocoBaseDesktopRouteType.tabs;
  const pageMenuModel = findPageMenuModel(options?.pageMenuModels ?? [], values.type);
  const existingPageMenuRoute = !!route && isPageMenuRoute(route);
  const shouldBuildPageMenuRoute = !!pageMenuModel && (!route || !!getAvailablePageMenuModel(route, [pageMenuModel]));

  if (pageMenuModel && shouldBuildPageMenuRoute) {
    const pageMenuRoute = buildPageMenuRoute(pageMenuModel, {
      icon: values.icon,
      parentId: options?.parentId,
      schemaUid: route?.schemaUid || randomId(),
      title: (values.title ?? '').trim(),
    });
    return {
      ...pageMenuRoute,
      hideInMenu: values.showInMenu === false,
      options: {
        ...route?.options,
        ...pageMenuRoute.options,
      },
    };
  }

  const routeValues: Partial<NocoBaseDesktopRoute> = {
    ...(shouldPersistPageSchemaUid || shouldPersistTabSchemaUid ? { schemaUid: route?.schemaUid || randomId() } : {}),
    ...(existingPageMenuRoute && route?.schemaUid ? { schemaUid: route.schemaUid } : {}),
    ...(shouldPersistTabSchemaUid ? { tabSchemaName: route?.tabSchemaName || randomId() } : {}),
    ...(shouldPersistPageSchemaUid ? { enableTabs: !!values.enableTabs } : {}),
    ...(options?.parentId !== undefined ? { parentId: options.parentId } : {}),
    hideInMenu: values.showInMenu === false,
    icon: values.icon,
    title: (values.title ?? '').trim(),
    type: values.type,
  };

  if (values.type === NocoBaseDesktopRouteType.link) {
    const existingOptions: Record<string, unknown> = route?.options ?? {};
    const { href: _href, params: _params, path: _path, url: _url, ...restOptions } = existingOptions;
    routeValues.options = {
      ...restOptions,
      ...(routePath ? { [options?.mobile ? 'url' : 'href']: routePath } : {}),
      ...(params.length ? { params } : {}),
    };
  }

  if (existingPageMenuRoute && route?.options) {
    routeValues.options = {
      ...route.options,
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

function RouteTypeTag(props: { pageMenuModels: ResolvedPageMenuModel[]; route: NocoBaseDesktopRoute }) {
  const t = useT();
  const pageMenuModel = getAvailablePageMenuModel(props.route, props.pageMenuModels);
  const label = pageMenuModel
    ? getPageMenuModelLabel(pageMenuModel, t)
    : isPageMenuRoute(props.route)
      ? t('Unavailable ({{type}})', { type: props.route.type })
      : t(getRouteTypeLabel(props.route.type));
  return <Tag color={getRouteTypeColor(props.route.type, pageMenuModel)}>{label}</Tag>;
}

function RouteEditorForm(props: {
  initialRoute?: NocoBaseDesktopRoute | null;
  mobile?: boolean;
  onSubmit: (values: RouteFormValues) => Promise<void>;
  pageMenuModels: ResolvedPageMenuModel[];
  parentRoute?: NocoBaseDesktopRoute | null;
  title: string;
}) {
  const t = useT();
  const { token } = theme.useToken();
  const [form] = Form.useForm<RouteFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const watchedRouteType = Form.useWatch('type', form);
  const routeType = props.initialRoute?.type ?? watchedRouteType;
  const routeTypeOptions = useMemo(
    () =>
      getRouteTypeOptions(t, {
        mobile: props.mobile,
        pageMenuModels: props.pageMenuModels,
        parentRoute: props.parentRoute,
      }),
    [props.mobile, props.pageMenuModels, props.parentRoute, t],
  );
  const initialValues = useMemo<RouteFormValues>(
    () => ({
      enableTabs: !!props.initialRoute?.enableTabs,
      icon: props.initialRoute?.icon,
      params: props.initialRoute ? getLinkRouteParams(props.initialRoute) : [],
      routePath: props.initialRoute ? getLinkRoutePath(props.initialRoute) : '',
      showInMenu: props.initialRoute ? !props.initialRoute.hideInMenu : true,
      title: props.initialRoute?.title || '',
      type: props.initialRoute?.type || getDefaultRouteType({ mobile: props.mobile, parentRoute: props.parentRoute }),
    }),
    [props.initialRoute, props.mobile, props.parentRoute],
  );
  const titleRules = useMemo(
    () =>
      routeType === NocoBaseDesktopRouteType.tabs
        ? undefined
        : [{ message: t('Title field is required'), required: true, whitespace: true }],
    [routeType, t],
  );

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await props.onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }, [form, props]);

  return (
    <DrawerFormLayout
      cancelText={t('Cancel')}
      onSubmit={handleSubmit}
      submitText={t('Submit')}
      submitting={submitting}
      title={props.title}
    >
      <Form form={form} initialValues={initialValues} layout="vertical">
        {props.initialRoute ? (
          <>
            <Form.Item hidden name="type">
              <Input />
            </Form.Item>
            <Form.Item label={t('Type')}>
              <RouteTypeTag pageMenuModels={props.pageMenuModels} route={props.initialRoute} />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            label={t('Type')}
            name="type"
            rules={[{ message: t('The field value is required'), required: true }]}
          >
            <Radio.Group options={routeTypeOptions} />
          </Form.Item>
        )}
        <Form.Item label={t('Title')} name="title" rules={titleRules}>
          <Input />
        </Form.Item>
        <Form.Item
          label={t('Icon')}
          name="icon"
          rules={props.mobile ? [{ message: t('Icon field is required'), required: true }] : undefined}
        >
          <IconPickerFormControl />
        </Form.Item>
        {routeType === NocoBaseDesktopRouteType.link ? (
          <>
            <Form.Item
              extra={t('Do not concatenate search params in the URL')}
              label={t('URL')}
              name="routePath"
              rules={[{ message: t('URL field is required'), required: true, whitespace: true }]}
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
    </DrawerFormLayout>
  );
}

function RoutesFilterButton(props: { onApply: (values: RouteFilterValues) => void }) {
  const t = useT();
  const [form] = Form.useForm<RouteFilterValues>();
  const [open, setOpen] = useState(false);

  return (
    <Popover
      content={
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
      }
      onOpenChange={setOpen}
      open={open}
      placement="bottomLeft"
      trigger="click"
    >
      <Button aria-label={t('Filter')} icon={<FilterOutlined />}>
        {t('Filter')}
      </Button>
    </Popover>
  );
}

function PortalRoutesTable({ portal }: { portal: MultiPortalRecord }) {
  const ctx = useFlowContext<PortalRoutesFlowContext>();
  const flowEngine = useFlowEngine();
  const t = useT();
  const tRef = React.useRef(t);
  const { message, modal } = AntdApp.useApp();
  const { token } = theme.useToken();
  const [routes, setRoutes] = useState<NocoBaseDesktopRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterValues, setFilterValues] = useState<RouteFilterValues>({});
  const [pageMenuModels, setPageMenuModels] = useState<ResolvedPageMenuModel[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const desktopRoutesResource = useMemo(() => ctx.api.resource('desktopRoutes'), [ctx.api]);
  const portalUid = portal.uid;
  const mobile = portal.uiLayoutUid === MOBILE_UI_LAYOUT_UID;

  React.useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    let active = true;
    resolvePageMenuModels(flowEngine, flowEngine.context)
      .then((definitions) => {
        if (active) {
          setPageMenuModels(definitions);
        }
      })
      .catch(() => {
        if (active) {
          setPageMenuModels([]);
        }
      });
    return () => {
      active = false;
    };
  }, [flowEngine]);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ctx.api.request({
        url: '/desktopRoutes:list',
        method: 'get',
        params: {
          paginate: false,
          portal: portalUid,
          sort: 'sort',
          tree: true,
        },
        skipNotify: true,
      });
      setRoutes(toRoutePayload(response?.data).data ?? []);
      setSelectedRowKeys([]);
    } catch {
      message.error(tRef.current('Failed to load routes'));
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [ctx.api, message, portalUid]);

  React.useEffect(() => {
    loadRoutes().catch(() => undefined);
  }, [loadRoutes]);

  const refreshRoutesAfterMutation = useCallback(async () => {
    await loadRoutes();
  }, [loadRoutes]);

  const submitRoute = useCallback(
    async (params: {
      editingRoute?: NocoBaseDesktopRoute | null;
      parentRoute?: NocoBaseDesktopRoute | null;
      values: RouteFormValues;
    }) => {
      const { editingRoute, parentRoute, values } = params;
      if (editingRoute?.id !== undefined) {
        const shouldSyncTabVisibility =
          isPageRouteType(editingRoute.type) && editingRoute.enableTabs !== !!values.enableTabs;
        await desktopRoutesResource.update({
          filterByTk: editingRoute.id,
          portal: portalUid,
          values: normalizeRouteValues(values, editingRoute, { mobile, pageMenuModels }),
        });
        if (shouldSyncTabVisibility) {
          for (const childRoute of getDirectTabRouteChildren(editingRoute)) {
            if (childRoute.id === undefined) {
              continue;
            }
            await desktopRoutesResource.update({
              filterByTk: childRoute.id,
              portal: portalUid,
              values: { hidden: !values.enableTabs },
            });
          }
        }
        message.success(t('Updated successfully'));
      } else {
        await desktopRoutesResource.create({
          portal: portalUid,
          values: normalizeRouteValues(values, undefined, {
            mobile,
            pageMenuModels,
            parentId: parentRoute?.id,
            withInitialPageTab: true,
          }),
        });
        message.success(t('Saved successfully'));
      }
      await refreshRoutesAfterMutation();
    },
    [desktopRoutesResource, message, mobile, pageMenuModels, portalUid, refreshRoutesAfterMutation, t],
  );

  const openRouteEditor = useCallback(
    (params: { editingRoute?: NocoBaseDesktopRoute | null; parentRoute?: NocoBaseDesktopRoute | null }) => {
      const editingRoute = params.editingRoute
        ? findRouteById(routes, params.editingRoute.id) ?? params.editingRoute
        : null;
      const parentRoute = params.parentRoute ?? null;
      ctx.viewer.drawer({
        width: token.screenSM,
        closable: true,
        content: () => (
          <RouteEditorForm
            initialRoute={editingRoute}
            mobile={mobile}
            onSubmit={(values) => submitRoute({ editingRoute, parentRoute, values })}
            pageMenuModels={pageMenuModels}
            parentRoute={parentRoute}
            title={editingRoute ? t('Edit route') : parentRoute ? t('Add child route') : t('Add new')}
          />
        ),
      });
    },
    [ctx.viewer, mobile, pageMenuModels, routes, submitRoute, t, token.screenSM],
  );

  const handleDelete = useCallback(
    async (filterByTk: Array<number | string> | number | string) => {
      await desktopRoutesResource.destroy({
        filterByTk,
        portal: portalUid,
      });
      message.success(t('Deleted successfully'));
      await refreshRoutesAfterMutation();
    },
    [desktopRoutesResource, message, portalUid, refreshRoutesAfterMutation, t],
  );

  const selectedRouteIds = useMemo(
    () => selectedRowKeys.filter((key): key is number | string => typeof key === 'number' || typeof key === 'string'),
    [selectedRowKeys],
  );
  const hasSelectedRoutes = selectedRouteIds.length > 0;
  const visibleRoutes = useMemo(() => filterManagedRoutes(routes), [routes]);
  const filteredRoutes = useMemo(
    () => filterRoutesByKeyword(visibleRoutes, filterValues.keyword || '', t),
    [filterValues.keyword, t, visibleRoutes],
  );

  const updateSelectedRoutes = useCallback(
    async (values: Partial<NocoBaseDesktopRoute>) => {
      for (const routeId of selectedRouteIds) {
        await desktopRoutesResource.update({
          filterByTk: routeId,
          portal: portalUid,
          values,
        });
      }
      message.success(t('Updated successfully'));
      await refreshRoutesAfterMutation();
    },
    [desktopRoutesResource, message, portalUid, refreshRoutesAfterMutation, selectedRouteIds, t],
  );

  const openDeleteConfirm = useCallback(
    (filterByTk: Array<number | string> | number | string, batch = false) => {
      modal.confirm({
        cancelText: t('Cancel'),
        content: t('Are you sure you want to delete it?'),
        okText: t('Delete'),
        async onOk() {
          await handleDelete(filterByTk);
        },
        title: batch ? t('Delete routes') : t('Delete route'),
      });
    },
    [handleDelete, modal, t],
  );

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
        render: (_value, route) => <RouteTypeTag pageMenuModels={pageMenuModels} route={route} />,
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
          const path = getRouteAccessPath(route, portal.routePath, routes);
          return path ? (
            <Typography.Paragraph copyable ellipsis style={{ marginBottom: 0 }}>
              {path}
            </Typography.Paragraph>
          ) : null;
        },
      },
      {
        dataIndex: 'actions',
        title: t('Actions'),
        width: 260,
        render: (_value, route) => {
          const routeTitle = getRouteTitle(route, t);
          const accessPath = isUnavailablePageMenuRoute(route, pageMenuModels)
            ? ''
            : getRouteAccessPath(route, portal.routePath, routes);
          const accessHref = accessPath
            ? getRouteAccessPath(route, getMultiPortalRouteUrl(ctx.app, portal.routePath, portal.portalType), routes)
            : '';
          return (
            <Space size="small">
              <Button
                aria-label={t('Add child {{route}}', { route: routeTitle })}
                disabled={!canRouteHaveChildren(route)}
                onClick={() => openRouteEditor({ parentRoute: route })}
                size="small"
                style={actionLinkButtonStyle}
                type="link"
              >
                {t('Add child')}
              </Button>
              <Button
                aria-label={t('Edit {{route}}', { route: routeTitle })}
                onClick={() => openRouteEditor({ editingRoute: route })}
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
                rel="noopener noreferrer"
                size="small"
                style={actionLinkButtonStyle}
                target="_blank"
                type="link"
              >
                {t('View')}
              </Button>
              <Button
                aria-label={t('Delete {{route}}', { route: routeTitle })}
                onClick={() => route.id !== undefined && openDeleteConfirm(route.id)}
                size="small"
                style={actionLinkButtonStyle}
                type="link"
              >
                {t('Delete')}
              </Button>
            </Space>
          );
        },
      },
    ],
    [
      ctx.app,
      openDeleteConfirm,
      openRouteEditor,
      pageMenuModels,
      portal,
      routes,
      t,
      token.colorError,
      token.colorSuccess,
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
            onClick={() => openDeleteConfirm(selectedRouteIds, true)}
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
          <Button aria-label={t('Add new')} icon={<PlusOutlined />} onClick={() => openRouteEditor({})} type="primary">
            {t('Add new')}
          </Button>
        </Space>
      </Space>
      <Table<NocoBaseDesktopRoute>
        columns={columns}
        dataSource={filteredRoutes}
        expandable={{ rowExpandable: (route) => !!route.children?.length }}
        loading={loading}
        locale={{ emptyText: t('No routes') }}
        pagination={{ pageSize: 20, total: filteredRoutes.length }}
        rowKey={(route) => route.id ?? String(route.schemaUid)}
        rowSelection={{ onChange: setSelectedRowKeys, selectedRowKeys }}
      />
    </Space>
  );
}

export default function PortalRoutesDrawer({ portal }: { portal: MultiPortalRecord }) {
  const t = useT();
  const view = useFlowView();
  const { token } = theme.useToken();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {view.Header ? <view.Header title={t('Routes')} /> : null}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: token.paddingLG }}>
        <PortalRoutesTable portal={portal} />
      </div>
    </div>
  );
}
