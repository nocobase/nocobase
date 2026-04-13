/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSettingsContext } from '@nocobase/flow-engine';
import {
  AdminLayoutMenuCreationMeta,
  AdminLayoutMenuCreationParams,
  AdminLayoutMenuCreationType,
  AdminLayoutMenuInsertPosition,
  getAdminLayoutMenuMovePositionOptions,
} from './AdminLayoutMenuUtils';
import { getFlowPageMenuSchema, getPageMenuSchema, isVariable } from './AdminLayoutCompat';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from './route-types';

const buildLinkSettingSchema = (t: (title: any) => any) => ({
  href: {
    title: t('URL'),
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'FlowSettingsVariableTextArea',
    'x-component-props': {
      rows: 1,
      maxRows: 1,
    },
    description: t('Do not concatenate search params in the URL'),
  },
  params: {
    type: 'array',
    title: t('Search parameters'),
    'x-component': 'ArrayItems',
    'x-decorator': 'FormItem',
    items: {
      type: 'object',
      properties: {
        space: {
          type: 'void',
          'x-component': 'Space',
          properties: {
            name: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: t('Name'),
              },
            },
            value: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'FlowSettingsVariableTextArea',
              'x-component-props': {
                placeholder: t('Value'),
                rows: 1,
                maxRows: 1,
                useTypedConstant: true,
                changeOnSelect: true,
              },
            },
            remove: {
              type: 'void',
              'x-decorator': 'FormItem',
              'x-component': 'ArrayItems.Remove',
            },
          },
        },
      },
    },
    properties: {
      add: {
        type: 'void',
        title: t('Add parameter'),
        'x-component': 'ArrayItems.Addition',
      },
    },
  },
  openInNewWindow: {
    type: 'boolean',
    'x-content': t('Open in new window'),
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
  },
});

export const insertRouteSchema = async (
  api: { request: (options: any) => Promise<any> },
  schema: Record<string, any>,
) => {
  await api.request({
    method: 'POST',
    url: '/uiSchemas:insert',
    data: schema,
  });
};

export const getMenuCreationDefaultParams = (
  meta: AdminLayoutMenuCreationMeta | undefined,
): AdminLayoutMenuCreationParams => {
  if (!meta) {
    return {};
  }

  if (meta.menuType === 'link' && meta.source !== 'insert') {
    return {
      openInNewWindow: true,
    };
  }

  return {};
};

const MENU_TYPE_OPTIONS: Array<{ label: string; value: AdminLayoutMenuCreationType }> = [
  { label: 'Group', value: 'group' },
  { label: 'Classic page (v1)', value: 'page' },
  { label: 'Modern page (v2)', value: 'flowPage' },
  { label: 'Link', value: 'link' },
];

export const buildMenuBasicSchema = (t: (title: any) => any): Record<string, any> => ({
  title: {
    title: t('Menu item title'),
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  icon: {
    title: t('Icon'),
    'x-decorator': 'FormItem',
    'x-component': 'IconPicker',
  },
});

const buildReactiveLinkSettingSchema = (t: (title: any) => any, dependencyField: string): Record<string, any> =>
  Object.fromEntries(
    Object.entries(buildLinkSettingSchema(t)).map(([key, value]) => [
      key,
      {
        ...value,
        'x-reactions': {
          dependencies: [dependencyField],
          fulfill: {
            state: {
              hidden: '{{$deps[0] !== "link"}}',
            },
          },
        },
      },
    ]),
  );

export const getMenuEditDefaultParams = (route: NocoBaseDesktopRoute | undefined): AdminLayoutMenuCreationParams => ({
  title: route?.title,
  icon: route?.icon,
  href: route?.options?.href,
  params: route?.options?.params,
  openInNewWindow: route?.options?.openInNewWindow !== false,
});

export const getMenuCreationUiSchema = (
  t: (title: any) => any,
  meta: AdminLayoutMenuCreationMeta | undefined,
): Record<string, any> => {
  const schema: Record<string, any> = buildMenuBasicSchema(t);

  if (meta?.menuType === 'link') {
    Object.assign(schema, buildLinkSettingSchema(t));
  }

  return schema;
};

const getInsertMenuUiSchema = (t: (title: any) => any): Record<string, any> => ({
  menuType: {
    title: t('Menu type'),
    required: true,
    enum: MENU_TYPE_OPTIONS.map((item) => ({
      label: t(item.label),
      value: item.value,
    })),
    'x-decorator': 'FormItem',
    'x-component': 'Radio.Group',
  },
  ...buildMenuBasicSchema(t),
  ...buildReactiveLinkSettingSchema(t, 'menuType'),
});

type FlowMenuModelLike = {
  getRoute(): NocoBaseDesktopRoute | undefined;
  getParentRoute(): NocoBaseDesktopRoute | undefined;
  getCreationMeta(): AdminLayoutMenuCreationMeta | undefined;
  createMenuFromMeta(meta: AdminLayoutMenuCreationMeta, values: AdminLayoutMenuCreationParams): Promise<void>;
  updateMenuRoute(values: Partial<NocoBaseDesktopRoute>): Promise<void>;
  moveMenuRoute(target: string, position: 'beforeBegin' | 'afterEnd' | 'beforeEnd'): Promise<void>;
};

export const createInsertMenuStep = (options: {
  title: string;
  insertPosition: AdminLayoutMenuInsertPosition;
  hideInSettings?: (ctx: FlowSettingsContext<any>) => Promise<boolean>;
  canCreate?: (route: NocoBaseDesktopRoute) => boolean;
  resolveParentRoute: (ctx: FlowSettingsContext<any>, route: NocoBaseDesktopRoute) => NocoBaseDesktopRoute | undefined;
}): Record<string, any> => ({
  title: options.title,
  hideInSettings: options.hideInSettings,
  defaultParams: async () => ({
    menuType: 'flowPage',
  }),
  uiSchema: async (ctx: FlowSettingsContext<any>) => getInsertMenuUiSchema(ctx.t),
  beforeParamsSave: async (ctx: FlowSettingsContext<any>, params) => {
    const model = ctx.model as FlowMenuModelLike;
    const route = model.getRoute();
    if (!route || (options.canCreate && !options.canCreate(route))) {
      return;
    }

    const parentRoute = options.resolveParentRoute(ctx, route);
    await model.createMenuFromMeta(
      {
        menuType: params.menuType,
        source: 'insert',
        insertPosition: options.insertPosition,
        targetRoute: route,
        parentRoute,
      },
      params,
    );
  },
});

export const toTreeSelectItems = async (
  routes: NocoBaseDesktopRoute[],
  ctx: Pick<FlowSettingsContext<any>, 'resolveJsonTemplate' | 't'>,
) => {
  return Promise.all(
    (routes || [])
      .filter((route) => route.type !== NocoBaseDesktopRouteType.tabs)
      .map(async (route) => ({
        label:
          typeof route.title === 'string' && isVariable(route.title)
            ? (await ctx.resolveJsonTemplate?.(route.title)) ?? route.title
            : ctx.t(route.title),
        value: `${route.id}||${route.type}`,
        children: route.children?.length ? await toTreeSelectItems(route.children, ctx) : undefined,
      })),
  );
};

export const findPrevSiblingRoute = (
  routes: NocoBaseDesktopRoute[],
  currentRoute: NocoBaseDesktopRoute | undefined,
) => {
  if (!currentRoute) {
    return;
  }

  for (let index = 0; index < routes.length; index++) {
    const route = routes[index];
    if (route.id === currentRoute.id) {
      return routes[index - 1];
    }
    if (route.children?.length) {
      const prevSibling = findPrevSiblingRoute(route.children, currentRoute);
      if (prevSibling) {
        return prevSibling;
      }
    }
  }
};

export const findNextSiblingRoute = (
  routes: NocoBaseDesktopRoute[],
  currentRoute: NocoBaseDesktopRoute | undefined,
) => {
  if (!currentRoute) {
    return;
  }

  for (let index = 0; index < routes.length; index++) {
    const route = routes[index];
    if (route.id === currentRoute.id) {
      return routes[index + 1];
    }
    if (route.children?.length) {
      const nextSibling = findNextSiblingRoute(route.children, currentRoute);
      if (nextSibling) {
        return nextSibling;
      }
    }
  }
};

export const matchesRoutePath = (
  route: NocoBaseDesktopRoute | undefined,
  pathname: string,
  basename = '/',
): boolean => {
  if (!route) {
    return false;
  }

  const normalizedBasename = basename && basename !== '/' ? basename.replace(/\/$/, '') : '';
  const normalizedPathname =
    normalizedBasename && pathname.startsWith(normalizedBasename)
      ? pathname.slice(normalizedBasename.length) || '/'
      : pathname;

  const candidates = [
    route.id != null ? `/admin/${route.id}` : null,
    route.schemaUid ? `/admin/${route.schemaUid}` : null,
  ].filter(Boolean) as string[];

  if (
    candidates.some((candidate) => normalizedPathname === candidate || normalizedPathname.startsWith(`${candidate}/`))
  ) {
    return true;
  }

  return Array.isArray(route.children)
    ? route.children.some((child) => matchesRoutePath(child, normalizedPathname, '/'))
    : false;
};

export const buildInsertRouteSchema = (
  menuType: AdminLayoutMenuCreationType,
  pageSchemaUid: string,
  tabSchemaUid: string,
  tabSchemaName: string,
) => {
  return menuType === 'flowPage'
    ? getFlowPageMenuSchema({ pageSchemaUid })
    : getPageMenuSchema({ pageSchemaUid, tabSchemaUid, tabSchemaName });
};

export { getAdminLayoutMenuMovePositionOptions, MENU_TYPE_OPTIONS, buildLinkSettingSchema };
