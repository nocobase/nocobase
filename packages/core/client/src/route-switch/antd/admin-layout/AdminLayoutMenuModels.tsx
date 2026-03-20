/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModel } from '@nocobase/flow-engine';
import type { FlowSettingsContext } from '@nocobase/flow-engine';
import { uid } from '@nocobase/utils/client';
import { findFirstPageRoute, NocoBaseDesktopRoute, NocoBaseDesktopRouteType } from '../../../admin-shell';
import {
  AdminLayoutMenuCreationMeta,
  AdminLayoutMenuCreationParams,
  AdminLayoutMenuInsertPosition,
  AdminLayoutMenuItemRenderer,
  AdminLayoutMenuItemStructure,
  AdminLayoutMenuMovePositionOption,
  AdminLayoutMenuNode,
  AdminLayoutMenuRouteOptions,
  buildMenuTitleWithIcon,
  getAdminLayoutMenuMovePositionOptions,
  getAdminLayoutMenuInitializerButton,
  reconcileAdminLayoutMenuItems,
  shouldRenderIconInTitle,
} from './AdminLayoutMenuUtils';
import {
  buildInsertRouteSchema,
  buildLinkSettingSchema,
  createInsertMenuStep,
  findNextSiblingRoute,
  findPrevSiblingRoute,
  getMenuCreationDefaultParams,
  getMenuCreationUiSchema,
  getMenuEditDefaultParams,
  insertRouteSchema,
  matchesRoutePath,
  toTreeSelectItems,
} from './AdminLayoutMenuFlowUtils';

export * from './AdminLayoutMenuUtils';
export { insertRouteSchema } from './AdminLayoutMenuFlowUtils';

const insertPositionToMethod = {
  beforeBegin: 'insertBefore',
  afterEnd: 'insertAfter',
} as const;

export class AdminLayoutMenuItemModel extends FlowModel<AdminLayoutMenuItemStructure> {
  onInit(options) {
    super.onInit(options);
    this.syncFromRoute(
      this.props.route as NocoBaseDesktopRoute,
      this.props.parentRoute as NocoBaseDesktopRoute | undefined,
    );
  }

  syncFromRoute(route: NocoBaseDesktopRoute, parentRoute?: NocoBaseDesktopRoute) {
    this.setProps({
      route,
      parentRoute,
    });

    if (route?.type === NocoBaseDesktopRouteType.group) {
      reconcileAdminLayoutMenuItems(this, Array.isArray(route.children) ? route.children : [], route);
      return;
    }

    (this.subModels.menuItems || []).forEach((item) => {
      this.flowEngine.removeModelWithSubModels(item.uid);
    });
    delete this.subModels.menuItems;
  }

  getRoute() {
    return this.props.route as NocoBaseDesktopRoute;
  }

  getParentRoute() {
    return this.props.parentRoute as NocoBaseDesktopRoute | undefined;
  }

  getCreationMeta() {
    return this.props.creationMeta as AdminLayoutMenuCreationMeta | undefined;
  }

  isCreationSession() {
    return !!this.getCreationMeta()?.menuType;
  }

  getRouteRepository() {
    return this.context.routeRepository;
  }

  async insertRouteSchema(schema: Record<string, any>) {
    await insertRouteSchema(this.context.api, schema);
  }

  async createMenuRoute(
    route: NocoBaseDesktopRoute,
    options?: {
      parentId?: string | number;
      refreshAfterMutation?: boolean;
    },
  ) {
    const { parentId, refreshAfterMutation = true } = options || {};
    const payload = {
      ...route,
      parentId: parentId ?? route.parentId ?? undefined,
    };
    const requestOptions = refreshAfterMutation ? undefined : { refreshAfterMutation: false };
    const { data } = await this.getRouteRepository().createRoute(payload, requestOptions);
    return data?.data;
  }

  async createRouteForInsert(
    route: NocoBaseDesktopRoute,
    insertPosition: AdminLayoutMenuInsertPosition,
    targetRoute = this.getCreationMeta()?.targetRoute || this.getRoute(),
  ) {
    const createdRoute = await this.createMenuRoute(route, {
      parentId: insertPosition === 'beforeEnd' ? targetRoute?.id || undefined : targetRoute?.parentId || undefined,
      refreshAfterMutation: false,
    });

    const moveMethod = insertPositionToMethod[insertPosition];
    if (moveMethod) {
      try {
        await this.getRouteRepository().moveRoute({
          sourceId: createdRoute?.id,
          targetId: targetRoute?.id,
          sortField: 'sort',
          method: moveMethod,
        });
      } catch (error) {
        await this.getRouteRepository().refreshAccessible();
        throw error;
      }
      return createdRoute?.id;
    }

    await this.getRouteRepository().refreshAccessible();
    return createdRoute?.id;
  }

  async createMenuFromMeta(meta: AdminLayoutMenuCreationMeta, values: AdminLayoutMenuCreationParams) {
    const routeType =
      meta.menuType === 'flowPage'
        ? NocoBaseDesktopRouteType.flowPage
        : meta.menuType === 'page'
          ? NocoBaseDesktopRouteType.page
          : meta.menuType === 'group'
            ? NocoBaseDesktopRouteType.group
            : NocoBaseDesktopRouteType.link;
    const createRoute = async (route: NocoBaseDesktopRoute) => {
      if (meta.insertPosition) {
        return this.createRouteForInsert(route, meta.insertPosition, meta.targetRoute);
      }

      return this.createMenuRoute(route, {
        parentId: meta.parentRoute?.id,
      });
    };

    if (meta.menuType === 'group') {
      await createRoute({
        type: routeType,
        title: values.title,
        icon: values.icon,
        schemaUid: uid(),
      });
      return;
    }

    if (meta.menuType === 'link') {
      await createRoute({
        type: routeType,
        title: values.title,
        icon: values.icon,
        schemaUid: uid(),
        options: {
          href: values.href,
          params: values.params,
          openInNewWindow: values.openInNewWindow,
        },
      });
      return;
    }

    const pageSchemaUid = uid();
    const menuSchemaUid = uid();
    const tabSchemaUid = uid();
    const tabSchemaName = uid();

    await createRoute({
      type: routeType,
      title: values.title,
      icon: values.icon,
      schemaUid: pageSchemaUid,
      menuSchemaUid,
      enableTabs: false,
      children: [
        {
          type: NocoBaseDesktopRouteType.tabs,
          schemaUid: tabSchemaUid,
          tabSchemaName,
          hidden: true,
        },
      ],
    });

    await this.insertRouteSchema(buildInsertRouteSchema(meta.menuType, pageSchemaUid, tabSchemaUid, tabSchemaName));
  }

  async persistMenuCreation(values: AdminLayoutMenuCreationParams) {
    const meta = this.getCreationMeta();
    if (!meta) {
      return;
    }
    await this.createMenuFromMeta(meta, values);
  }

  async updateMenuRoute(values: Partial<NocoBaseDesktopRoute>) {
    const route = this.getRoute();
    if (route?.id == null) {
      return;
    }

    await this.getRouteRepository().updateRoute(route.id, values);
  }

  async moveMenuRoute(target: string, position: 'beforeBegin' | 'afterEnd' | 'beforeEnd') {
    const route = this.getRoute();
    const [targetId, targetType] = target?.split?.('||') || [];
    if (!targetId || route?.id == null) {
      return;
    }

    if (position === 'beforeEnd' && targetType !== NocoBaseDesktopRouteType.group) {
      throw new Error(this.context?.t?.('Only groups support inner moves') || 'Only groups support inner moves');
    }

    if (position === 'beforeEnd' && String(route.id) === targetId) {
      throw new Error(
        this.context?.t?.('A menu group cannot be moved inside itself') || 'A menu group cannot be moved inside itself',
      );
    }

    await this.getRouteRepository().moveRoute({
      sourceId: route.id,
      sortField: 'sort',
      method: position === 'beforeEnd' ? undefined : insertPositionToMethod[position],
      ...(position === 'beforeEnd'
        ? {
            targetScope: {
              parentId: targetId,
            },
          }
        : {
            targetId,
          }),
    });
  }

  async saveStepParams() {
    if (this.isCreationSession()) {
      return;
    }

    return super.saveStepParams();
  }

  async save() {
    if (this.isCreationSession()) {
      const values = this.getStepParams('menuCreation', 'basic') as AdminLayoutMenuCreationParams | undefined;
      await this.persistMenuCreation(values || {});
      await this.destroy();
      return true;
    }

    return super.save();
  }

  async destroy(): Promise<boolean> {
    if (this.isCreationSession()) {
      const parent = this.parent as
        | (FlowModel & {
            subModels?: {
              menuCreationSessions?: FlowModel[];
            };
          })
        | null;
      if (parent?.subModels?.menuCreationSessions) {
        parent.subModels.menuCreationSessions = parent.subModels.menuCreationSessions.filter((item) => item !== this);
        if (parent.subModels.menuCreationSessions.length === 0) {
          delete parent.subModels.menuCreationSessions;
        }
      }

      this.observerDispose();
      this.invalidateFlowCache('beforeRender', true);
      this.flowEngine.removeModel(this.uid);
      return true;
    }

    const route = this.getRoute();
    if (!route?.id) {
      return false;
    }

    const allAccessRoutes = this.getRouteRepository().listAccessible();
    const pathname = this.context.location?.pathname || window.location.pathname;
    const shouldNavigate = matchesRoutePath(route, pathname, this.context.router?.basename);
    const prevSibling = findPrevSiblingRoute(allAccessRoutes, route);
    const nextSibling = findNextSiblingRoute(allAccessRoutes, route);

    await Promise.all([
      this.getRouteRepository().deleteRoute(route.id),
      route.schemaUid
        ? this.context.api.resource('uiSchemas')[`remove/${route.schemaUid}`]?.()
        : Promise.resolve(undefined),
    ]);

    if (!shouldNavigate) {
      return true;
    }

    const sibling = prevSibling || nextSibling;
    const nextPath = sibling
      ? `/admin/${sibling.type === NocoBaseDesktopRouteType.group ? sibling.id : sibling.schemaUid}`
      : '/';
    this.context.router.navigate(nextPath);
    return true;
  }

  toProLayoutMenuItem(options: AdminLayoutMenuRouteOptions): AdminLayoutMenuNode | null {
    const route = this.props.route as NocoBaseDesktopRoute;
    const parentRoute = this.props.parentRoute as NocoBaseDesktopRoute | undefined;
    const depth = options.depth || 0;

    if (!route || typeof route !== 'object') {
      return null;
    }

    const shouldShowIconInTitle = shouldRenderIconInTitle({ depth, isMobile: options.isMobile });
    const { name, icon } = buildMenuTitleWithIcon(route, options.t, shouldShowIconInTitle);

    if (route.type === NocoBaseDesktopRouteType.link) {
      return {
        name,
        icon,
        path: '/',
        hideInMenu: route.hideInMenu,
        _route: route,
        _parentRoute: parentRoute,
        _depth: depth,
        _model: this,
      };
    }

    if (route.type === NocoBaseDesktopRouteType.page || route.type === NocoBaseDesktopRouteType.flowPage) {
      return {
        name,
        icon,
        path: `/admin/${route.schemaUid}`,
        redirect: `/admin/${route.schemaUid}`,
        hideInMenu: route.hideInMenu,
        _route: route,
        _parentRoute: parentRoute,
        _depth: depth,
        _model: this,
      };
    }

    if (route.type === NocoBaseDesktopRouteType.group) {
      const itemChildren = Array.isArray(route.children) ? route.children : [];
      const children =
        (this.subModels.menuItems || [])
          .map((item: any) =>
            item.toProLayoutMenuItem({
              ...options,
              depth: depth + 1,
            }),
          )
          .filter(Boolean) || [];

      if (options.designable && depth === 0) {
        children.push(getAdminLayoutMenuInitializerButton('schema-initializer-Menu-side', this, route));
      }

      const groupRoute: AdminLayoutMenuNode = {
        name,
        icon,
        path: `/admin/${route.id}`,
        redirect:
          children[0]?.key === 'x-designer-button'
            ? undefined
            : `/admin/${findFirstPageRoute(itemChildren)?.schemaUid || route.id}`,
        hideInMenu: route.hideInMenu,
        _route: route,
        _parentRoute: parentRoute,
        _depth: depth,
        _model: this,
      };

      if (children.length > 0) {
        groupRoute.routes = children;
      }

      return groupRoute;
    }

    return null;
  }

  render() {
    return (
      <AdminLayoutMenuItemRenderer
        item={this.props.item}
        dom={this.props.dom}
        options={this.props.options}
        renderType={this.props.renderType}
      />
    );
  }
}

AdminLayoutMenuItemModel.registerFlow({
  key: 'menuCreation',
  title: 'Add menu item',
  steps: {
    basic: {
      title: 'Add menu item',
      preset: true,
      hideInSettings: true,
      defaultParams: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) =>
        getMenuCreationDefaultParams(ctx.model.getCreationMeta()),
      uiSchema: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) =>
        getMenuCreationUiSchema(ctx.t, ctx.model.getCreationMeta()),
    },
  },
});

AdminLayoutMenuItemModel.registerFlow({
  key: 'menuSettings',
  title: 'Menu settings',
  steps: {
    edit: {
      title: 'Edit',
      defaultParams: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) =>
        getMenuEditDefaultParams(ctx.model.getRoute()),
      uiSchema: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) => {
        const route = ctx.model.getRoute();
        const schema: Record<string, any> = {
          title: {
            title: ctx.t('Menu item title'),
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          icon: {
            title: ctx.t('Menu item icon'),
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
        };

        if (route?.type === NocoBaseDesktopRouteType.link) {
          Object.assign(schema, buildLinkSettingSchema(ctx.t));
        }

        return schema;
      },
      beforeParamsSave: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>, params) => {
        await ctx.model.updateMenuRoute({
          title: params.title,
          icon: params.icon,
          options:
            ctx.model.getRoute()?.type === NocoBaseDesktopRouteType.link
              ? {
                  href: params.href,
                  params: params.params,
                  openInNewWindow: params.openInNewWindow,
                }
              : undefined,
        });
      },
    },
    editTooltip: {
      title: 'Edit tooltip',
      defaultParams: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) => ({
        tooltip: ctx.model.getRoute()?.tooltip,
      }),
      uiSchema: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) => ({
        tooltip: {
          title: ctx.t('Tooltip'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      }),
      beforeParamsSave: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>, params) => {
        await ctx.model.updateMenuRoute({
          tooltip: params.tooltip,
        });
      },
    },
    hidden: {
      title: 'Hidden',
      uiMode: { type: 'switch', key: 'hideInMenu' },
      defaultParams: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) => ({
        hideInMenu: !!ctx.model.getRoute()?.hideInMenu,
      }),
      beforeParamsSave: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>, params) => {
        await ctx.model.updateMenuRoute({
          hideInMenu: !!params.hideInMenu,
        });
      },
    },
    moveTo: {
      title: 'Move to',
      defaultParams: async () => ({
        position: 'afterEnd',
      }),
      uiSchema: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) => {
        const items = await toTreeSelectItems(ctx.routeRepository.listAccessible(), ctx);
        const currentRouteId = ctx.model.getRoute()?.id;
        const defaultPositionOptions = getAdminLayoutMenuMovePositionOptions(undefined, currentRouteId, ctx.t);

        return {
          target: {
            title: ctx.t('Target'),
            enum: items,
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'TreeSelect',
          },
          position: {
            title: ctx.t('Position'),
            required: true,
            enum: defaultPositionOptions,
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
            'x-reactions': [
              (field) => {
                const options = getAdminLayoutMenuMovePositionOptions(field.form.values?.target, currentRouteId, ctx.t);
                field.dataSource = options;
                if (
                  !options.some(
                    (option: AdminLayoutMenuMovePositionOption) => option.value === field.value && !option.disabled,
                  )
                ) {
                  field.value = 'afterEnd';
                }
              },
            ],
          },
        };
      },
      beforeParamsSave: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>, params) => {
        await ctx.model.moveMenuRoute(params.target, params.position);
      },
    },
    insertBefore: createInsertMenuStep({
      title: 'Insert before',
      insertPosition: 'beforeBegin',
      resolveParentRoute: (ctx) => ctx.model.getParentRoute(),
    }),
    insertAfter: createInsertMenuStep({
      title: 'Insert after',
      insertPosition: 'afterEnd',
      resolveParentRoute: (ctx) => ctx.model.getParentRoute(),
    }),
    insertInner: createInsertMenuStep({
      title: 'Insert inner',
      hideInSettings: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) => {
        return ctx.model.getRoute()?.type !== NocoBaseDesktopRouteType.group;
      },
      canCreate: (route) => route.type === NocoBaseDesktopRouteType.group,
      insertPosition: 'beforeEnd',
      resolveParentRoute: (_ctx, route) => (route.type === NocoBaseDesktopRouteType.group ? route : undefined),
    }),
  },
});
