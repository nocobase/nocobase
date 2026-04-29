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
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '../../../flow-compat';
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
  getAdminLayoutMenuVirtualPath,
  reconcileAdminLayoutMenuItems,
  shouldRenderIconInTitle,
} from './AdminLayoutMenuUtils';
import { findFirstPageRoute } from './AdminLayoutCompat';
import {
  buildMenuBasicSchema,
  buildLinkSettingSchema,
  createInsertMenuStep,
  findNextSiblingRoute,
  findPrevSiblingRoute,
  getMenuCreationDefaultParams,
  getMenuCreationUiSchema,
  getMenuEditDefaultParams,
  matchesRoutePath,
  toTreeSelectItems,
} from './AdminLayoutMenuFlowUtils';
import { resolveAdminRouteRuntimeTarget, toRouterNavigationPath } from './resolveAdminRouteRuntimeTarget';

export * from './AdminLayoutMenuUtils';
const insertPositionToMethod = {
  beforeBegin: 'insertBefore',
  afterEnd: 'insertAfter',
} as const;

export class AdminLayoutMenuItemModel extends FlowModel<AdminLayoutMenuItemStructure> {
  private creationPersisted = false;
  private persistedStateHydrated = false;
  private persistedStateHydrating?: Promise<void>;

  onInit(options: any) {
    super.onInit(options);
    this.syncFromRoute(
      this.props.route as NocoBaseDesktopRoute,
      this.props.parentRoute as NocoBaseDesktopRoute | undefined,
    );
    if (this.shouldHydratePersistedState()) {
      void this.hydratePersistedState();
    }
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

  shouldHydratePersistedState() {
    if (this.isCreationSession()) {
      return false;
    }

    if (this.context.flowSettingsEnabled) {
      return true;
    }

    return this.hasPersistedMenuInstanceFlowFlag();
  }

  getRouteRepository() {
    return this.context.routeRepository;
  }

  hasPersistedMenuInstanceFlowFlag(route = this.getRoute()) {
    return route?.options?.hasPersistedMenuInstanceFlow === true;
  }

  getCurrentPersistedInstanceFlowCount() {
    return this.flowRegistry.getFlows().size;
  }

  buildRouteOptionsWithPersistedFlowFlag(hasPersistedMenuInstanceFlow: boolean) {
    const route = this.getRoute();
    const nextOptions = {
      ...(route?.options || {}),
    };

    if (hasPersistedMenuInstanceFlow) {
      nextOptions.hasPersistedMenuInstanceFlow = true;
    } else {
      delete nextOptions.hasPersistedMenuInstanceFlow;
    }

    return Object.keys(nextOptions).length > 0 ? nextOptions : undefined;
  }

  async syncPersistedFlowRouteFlag() {
    if (this.isCreationSession()) {
      return;
    }

    const route = this.getRoute();
    if (route?.id == null) {
      return;
    }

    const hasPersistedMenuInstanceFlow = this.getCurrentPersistedInstanceFlowCount() > 0;
    if (this.hasPersistedMenuInstanceFlowFlag(route) === hasPersistedMenuInstanceFlow) {
      return;
    }

    const options = this.buildRouteOptionsWithPersistedFlowFlag(hasPersistedMenuInstanceFlow);
    await this.getRouteRepository().updateRoute(route.id, { options });
    this.setProps({
      route: {
        ...route,
        options,
      },
    });
  }

  async destroyPersistedState() {
    if (this.isCreationSession()) {
      return;
    }

    await this.flowEngine.modelRepository?.destroy?.(this.uid);
  }

  /**
   * 按固定 uid 从 flowModels 仓库恢复实例级事件流与步骤参数。
   *
   * @returns {Promise<void>} 恢复完成
   */
  async hydratePersistedState() {
    if (this.persistedStateHydrated) {
      return;
    }

    if (this.persistedStateHydrating) {
      return await this.persistedStateHydrating;
    }

    this.persistedStateHydrating = (async () => {
      if (this.isCreationSession()) {
        return;
      }

      const repository = this.flowEngine.modelRepository;
      if (!repository?.findOne) {
        return;
      }

      const data = await repository.findOne({ uid: this.uid });
      if (!data?.uid) {
        return;
      }

      if (data.stepParams && typeof data.stepParams === 'object') {
        this.setStepParams(data.stepParams);
      }

      if (data.flowRegistry && typeof data.flowRegistry === 'object') {
        for (const key of [...this.flowRegistry.getFlows().keys()]) {
          this.flowRegistry.removeFlow(key);
        }
        this.flowRegistry.addFlows(data.flowRegistry);

        const hasBeforeRenderFlow = Object.values(data.flowRegistry).some((flow: any) => {
          if (!flow || flow.manual === true) {
            return false;
          }
          if (!flow.on) {
            return true;
          }
          return typeof flow.on === 'string' ? flow.on === 'beforeRender' : flow.on?.eventName === 'beforeRender';
        });

        if (hasBeforeRenderFlow) {
          void this.rerender();
        }
      }
    })().finally(() => {
      this.persistedStateHydrated = true;
      this.persistedStateHydrating = undefined;
    });

    return await this.persistedStateHydrating;
  }

  /**
   * 判断当前菜单模型是否存在需要通过 flowModels 持久化的实例事件流。
   *
   * @returns {boolean} 是否需要走 FlowModel 默认保存链路
   */
  hasPersistableInstanceFlows() {
    const currentFlowCount = this.flowRegistry.getFlows().size;
    const initialFlowCount = Object.keys((this as any)._options?.flowRegistry || {}).length;
    return currentFlowCount > 0 || initialFlowCount > 0;
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

    // @ts-ignore
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

    const nextValues = {
      ...values,
    };

    if (values.options && this.hasPersistedMenuInstanceFlowFlag(route)) {
      nextValues.options = {
        ...values.options,
        hasPersistedMenuInstanceFlow: true,
      };
    }

    await this.getRouteRepository().updateRoute(route.id, nextValues);
    this.setProps({
      route: {
        ...route,
        ...nextValues,
      },
    });
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
      if (this.creationPersisted) {
        return true;
      }

      const values = this.getStepParams('menuCreation', 'basic') as AdminLayoutMenuCreationParams | undefined;
      await this.persistMenuCreation(values || {});
      this.creationPersisted = true;
      return true;
    }

    const currentPersistedInstanceFlowCount = this.getCurrentPersistedInstanceFlowCount();

    // 菜单基础设置继续直接保存到 route repository；
    // 只有实例事件流需要回退到 FlowModel 默认持久化链路。
    if (currentPersistedInstanceFlowCount > 0) {
      await super.saveStepParams();
    } else if (this.hasPersistedMenuInstanceFlowFlag()) {
      await this.destroyPersistedState();
    } else if (this.hasPersistableInstanceFlows()) {
      await super.saveStepParams();
    }

    await this.syncPersistedFlowRouteFlag();
    return true;
  }

  async save() {
    if (this.isCreationSession()) {
      if (!this.creationPersisted) {
        const values = this.getStepParams('menuCreation', 'basic') as AdminLayoutMenuCreationParams | undefined;
        await this.persistMenuCreation(values || {});
        this.creationPersisted = true;
      }
      this.remove();
      return true;
    }

    await super.save();
    await this.syncPersistedFlowRouteFlag();
    return true;
  }

  async destroy(): Promise<boolean> {
    if (this.isCreationSession()) {
      return this.remove();
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

    await this.getRouteRepository().deleteRoute(route.id);

    if (!shouldNavigate) {
      return true;
    }

    const sibling = prevSibling || nextSibling;
    if (!sibling) {
      this.context.router.navigate('/');
      return true;
    }

    const target = resolveAdminRouteRuntimeTarget({
      app: this.context.app,
      route: sibling,
    });

    if (!target.runtimePath) {
      return true;
    }

    if (target.navigationMode === 'document') {
      window.location.assign(target.runtimePath);
      return true;
    }

    this.context.router.navigate(toRouterNavigationPath(target.runtimePath, this.context.router?.basename));
    return true;
  }

  toProLayoutRoute(options: AdminLayoutMenuRouteOptions): AdminLayoutMenuNode | null {
    const route = this.props.route as NocoBaseDesktopRoute;
    const parentRoute = this.props.parentRoute as NocoBaseDesktopRoute | undefined;
    const depth = options.depth || 0;

    if (!route || typeof route !== 'object') {
      return null;
    }

    const shouldShowIconInTitle = shouldRenderIconInTitle({ depth, isMobile: options.isMobile });
    const { name, icon } = buildMenuTitleWithIcon(route, options.t, shouldShowIconInTitle);

    if (route.type === NocoBaseDesktopRouteType.link) {
      const identity = route.id ?? route.schemaUid ?? route.menuSchemaUid ?? route.title ?? this.uid;

      return {
        name,
        icon,
        path: getAdminLayoutMenuVirtualPath('link', identity),
        hideInMenu: route.hideInMenu,
        _route: route,
        _parentRoute: parentRoute,
        _depth: depth,
        _model: this,
      };
    }

    if (route.type === NocoBaseDesktopRouteType.page || route.type === NocoBaseDesktopRouteType.flowPage) {
      const runtimeTarget = resolveAdminRouteRuntimeTarget({
        app: this.context.app,
        route,
      });
      const path = route.schemaUid
        ? `/admin/${route.schemaUid}`
        : getAdminLayoutMenuVirtualPath('link', `${this.uid}-invalid`);

      return {
        name,
        icon,
        path,
        redirect: route.schemaUid ? `/admin/${route.schemaUid}` : undefined,
        hideInMenu: route.hideInMenu,
        disabled: !runtimeTarget.runtimePath,
        _runtimePath: runtimeTarget.runtimePath,
        _navigationMode: runtimeTarget.navigationMode,
        _isLegacy: runtimeTarget.isLegacy,
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
          .map((item: AdminLayoutMenuItemModel) =>
            item.toProLayoutRoute({
              ...options,
              depth: depth + 1,
            }),
          )
          .filter(Boolean) || [];

      if (options.designable && depth === 0) {
        children.push(getAdminLayoutMenuInitializerButton('schema-initializer-Menu-side', this, route));
      }

      const runtimeTarget = resolveAdminRouteRuntimeTarget({
        app: this.context.app,
        route,
      });

      const groupRoute: AdminLayoutMenuNode = {
        name,
        icon,
        path: `/admin/${route.id}`,
        redirect:
          children[0]?.key === 'x-designer-button'
            ? undefined
            : `/admin/${findFirstPageRoute(itemChildren)?.schemaUid || route.id}`,
        hideInMenu: route.hideInMenu,
        _runtimePath: runtimeTarget.runtimePath,
        _navigationMode: runtimeTarget.navigationMode,
        _isLegacy: runtimeTarget.isLegacy,
        _route: route,
        _parentRoute: parentRoute,
        _depth: depth,
        _model: this,
      };

      if (children.length > 0) {
        groupRoute.routes = children as AdminLayoutMenuNode[];
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
        const schema: Record<string, any> = buildMenuBasicSchema(ctx.t);

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
