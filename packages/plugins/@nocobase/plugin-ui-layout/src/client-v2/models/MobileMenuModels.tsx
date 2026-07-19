/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowModel,
  replaceFlowRegistry,
  type FlowRegistryData,
  type FlowSettingsContext,
  type StepParams,
} from '@nocobase/flow-engine';
import type { ISchema } from '@formily/json-schema';
import React, { type ReactNode } from 'react';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from './mobileFlowCompat';
import {
  collectMobileTabRoutes,
  getMobileLinkRouteHref,
  getMobileMenuItemUid,
  getMobilePagePath,
  getMobileRouteIcon,
  getMobileRouteTabKey,
  getMobileRouteTitle,
  isFlowPageRoute,
  isMobileTabRoute,
  mobileRouteTreeContainsTabKey,
  type MobileRouteTitleTranslator,
} from './MobileMenuUtils';
import { refreshMobileLayoutAccessibleRoutes } from '../mobileRouteRepository';
export { MobileMenuSettingsIconPicker } from './MobileMenuComponents';

export { collectMobileTabRoutes, getMobilePagePath, toMobileRouterNavigationPath } from './MobileMenuUtils';

type MobileLayoutRouteRefreshModel = Parameters<typeof refreshMobileLayoutAccessibleRoutes>[0];

export type MobileTabNode = {
  key: string;
  label: ReactNode;
  icon: ReactNode;
  type: NonNullable<NocoBaseDesktopRoute['type']>;
  active?: boolean;
  path?: string;
  href?: string;
  route: NocoBaseDesktopRoute;
  model: MobileLayoutMenuItemModel;
};

export type MobileTabNodeOptions = {
  activeKey?: string;
  basePathname?: string;
  t: MobileRouteTitleTranslator;
};

export type MobileLayoutMenuStructure = {
  subModels: {
    menuItems?: MobileLayoutMenuItemModel[];
  };
};

type MobileMenuItemsParent = FlowModel<MobileLayoutMenuStructure> & {
  subModels: {
    menuItems?: MobileLayoutMenuItemModel[];
  };
};

type MobileMenuModelLike = FlowModel & {
  getRoute?: () => NocoBaseDesktopRoute | undefined;
  syncFromRoute?: (route: NocoBaseDesktopRoute, parentRoute?: NocoBaseDesktopRoute) => void;
  toMobileTabNode?: (options: MobileTabNodeOptions) => MobileTabNode | null;
};

type MobileMenuRouteTreeRefresher = {
  refreshMenuRouteTree?: () => void;
};

type MobileRouteRepository = {
  listAccessible?: () => NocoBaseDesktopRoute[];
  setRoutes?: (routes: NocoBaseDesktopRoute[]) => void;
  isAccessibleLoaded?: () => boolean;
  refreshAccessible?: () => Promise<NocoBaseDesktopRoute[]>;
  ensureAccessibleLoaded?: () => Promise<NocoBaseDesktopRoute[]>;
  updateRoute?: (
    filterByTk: string | number,
    values: Partial<Omit<NocoBaseDesktopRoute, 'options'>> & {
      options?: NocoBaseDesktopRoute['options'] | null;
    },
    options?: {
      refreshAfterMutation?: boolean;
    },
  ) => Promise<unknown>;
  deleteRoute?: (
    filterByTk: string | number,
    options?: {
      refreshAfterMutation?: boolean;
    },
  ) => Promise<unknown>;
};

type MobileMenuEditParams = {
  title?: string;
  icon?: string;
  href?: string;
  openInNewWindow?: boolean;
};

type PersistedMobileMenuModelData = {
  uid?: string;
  stepParams?: StepParams;
  flowRegistry?: FlowRegistryData;
};

type MobileMenuLinkageOriginalProps = Record<string, unknown> & {
  hiddenModel?: boolean;
  hiddenText?: unknown;
  disabled?: unknown;
  required?: unknown;
  hidden?: unknown;
};

function omitMobileMenuRuntimeProps(props: Record<string, unknown> = {}) {
  const persistableProps = { ...props };
  delete persistableProps.dom;
  delete persistableProps.item;
  delete persistableProps.route;
  delete persistableProps.parentRoute;
  return persistableProps;
}

function getMobileMenuEditDefaultParams(route: NocoBaseDesktopRoute | undefined): MobileMenuEditParams {
  return {
    title: route?.title,
    icon: route?.icon,
    href: getMobileLinkRouteHref(route),
    openInNewWindow: route?.options?.openInNewWindow !== false,
  };
}

function getMobileMenuEditUiSchema(
  t: (title: string) => string,
  route: NocoBaseDesktopRoute | undefined,
): Record<string, ISchema> {
  const schema: Record<string, ISchema> = {
    title: {
      title: t('Title'),
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    icon: {
      title: t('Icon'),
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'MobileMenuSettingsIconPicker',
    },
  };

  if (route?.type === NocoBaseDesktopRouteType.link) {
    Object.assign(schema, {
      href: {
        title: t('URL'),
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      openInNewWindow: {
        type: 'boolean',
        'x-content': t('Open in new window'),
        'x-decorator': 'FormItem',
        'x-component': 'Checkbox',
      },
    });
  }

  return schema;
}

function getMobileLinkEditOptions(route: NocoBaseDesktopRoute | undefined, params: MobileMenuEditParams) {
  const { href: _href, path: _path, url: _url, ...restOptions } = route?.options || {};

  return {
    ...restOptions,
    url: params.href,
    openInNewWindow: params.openInNewWindow !== false,
  };
}

export function reconcileMobileLayoutMenuItems(
  parent: MobileMenuItemsParent,
  routes: NocoBaseDesktopRoute[],
  parentRoute?: NocoBaseDesktopRoute,
) {
  const existingItems = [...(parent.subModels.menuItems || [])];
  const existingItemMap = new Map(existingItems.map((item) => [item.uid, item]));
  const nextItems: MobileLayoutMenuItemModel[] = [];
  const nextUidSet = new Set<string>();

  routes.forEach((route, index) => {
    const uid = getMobileMenuItemUid(parent.uid, route, index);
    let itemModel = existingItemMap.get(uid) as MobileMenuModelLike | undefined;
    const isExistingModel = !!itemModel;

    if (!itemModel) {
      itemModel = parent.addSubModel('menuItems', {
        uid,
        use: MobileLayoutMenuItemModel,
        props: {
          route,
          parentRoute,
        },
      }) as MobileMenuModelLike;
    }

    itemModel.sortIndex = index + 1;
    if (isExistingModel) {
      itemModel.syncFromRoute?.(route, parentRoute);
    }
    nextItems.push(itemModel as MobileLayoutMenuItemModel);
    nextUidSet.add(uid);
  });

  existingItems.forEach((item) => {
    if (!nextUidSet.has(item.uid)) {
      parent.flowEngine.removeModelWithSubModels(item.uid);
    }
  });

  parent.subModels.menuItems = nextItems;
}

export type MobileMenuDragMoveOptions = {
  sourceId: string | number;
  targetId: string | number;
  sortField: 'sort';
};

function isMobileLayoutMenuItemModel(model: FlowModel | undefined): model is MobileLayoutMenuItemModel {
  return !!model && typeof (model as MobileLayoutMenuItemModel).getRoute === 'function';
}

export function resolveMobileMenuDragMoveOptions(
  activeModel?: FlowModel,
  overModel?: FlowModel,
): MobileMenuDragMoveOptions | undefined {
  if (!isMobileLayoutMenuItemModel(activeModel) || !isMobileLayoutMenuItemModel(overModel)) {
    return;
  }

  const activeRoute = activeModel.getRoute();
  const overRoute = overModel.getRoute();

  if (!activeRoute?.id || !overRoute?.id || activeRoute.id === overRoute.id) {
    return;
  }

  return {
    sourceId: activeRoute.id,
    targetId: overRoute.id,
    sortField: 'sort',
  };
}

export function resolveMobileMenuDragMoveOptionsFromEvent(
  flowEngine: {
    getModel: (uid: string) => FlowModel | undefined;
  },
  event: {
    active?: { id?: string | number };
    over?: { id?: string | number } | null;
  },
) {
  if (!event.active?.id || !event.over?.id) {
    return;
  }

  return resolveMobileMenuDragMoveOptions(
    flowEngine.getModel(String(event.active.id)),
    flowEngine.getModel(String(event.over.id)),
  );
}

export class MobileLayoutMenuItemModel extends FlowModel {
  private route?: NocoBaseDesktopRoute;
  private parentRoute?: NocoBaseDesktopRoute;
  private routeHidden = false;
  private linkageHidden = false;
  private persistedStateHydrated = false;
  private persistedStateHydrating?: Promise<void>;
  private initialPersistedInstanceFlowCount = 0;

  private refreshParentMenuRouteTree() {
    (this.parent as unknown as MobileMenuRouteTreeRefresher | undefined)?.refreshMenuRouteTree?.();
  }

  onInit(options: Parameters<FlowModel['onInit']>[0]) {
    this.initialPersistedInstanceFlowCount = Object.keys(
      ((options as { flowRegistry?: FlowRegistryData }).flowRegistry || {}) as FlowRegistryData,
    ).length;
    super.onInit(options);
    this.syncFromRoute(
      this.props.route as NocoBaseDesktopRoute,
      this.props.parentRoute as NocoBaseDesktopRoute | undefined,
    );
    if (this.shouldHydratePersistedState()) {
      this.hydratePersistedState();
    }
  }

  private applyHiddenState() {
    super.setHidden(this.routeHidden || this.linkageHidden);
  }

  private ensureLinkageOriginalProps() {
    const model = this as unknown as { __originalProps?: MobileMenuLinkageOriginalProps };
    if (model.__originalProps) {
      return;
    }

    model.__originalProps = {
      hiddenText: undefined,
      disabled: undefined,
      required: undefined,
      hidden: undefined,
      ...this.props,
      hiddenModel: this.linkageHidden,
    };
  }

  onDispatchEventStart(...args: Parameters<FlowModel['onDispatchEventStart']>) {
    const [eventName] = args;
    if (eventName === 'beforeRender' && this.hasPersistableMenuLinkageRules()) {
      this.ensureLinkageOriginalProps();
    }

    return super.onDispatchEventStart(...args);
  }

  syncFromRoute(route: NocoBaseDesktopRoute, parentRoute?: NocoBaseDesktopRoute) {
    this.route = route;
    this.parentRoute = parentRoute;
    this.routeHidden = !!route?.hidden || !!route?.hideInMenu;
    this.applyHiddenState();
    this.setProps({
      route,
      parentRoute,
    });
  }

  setHidden(value: boolean) {
    const previous = this.hidden;
    this.linkageHidden = !!value;
    this.applyHiddenState();
    if (previous !== this.hidden) {
      this.refreshParentMenuRouteTree();
    }
  }

  getRoute() {
    return this.route || (this.props.route as NocoBaseDesktopRoute | undefined);
  }

  getParentRoute() {
    return this.parentRoute || (this.props.parentRoute as NocoBaseDesktopRoute | undefined);
  }

  private shouldHydratePersistedState() {
    if (this.context.flowSettingsEnabled) {
      return true;
    }

    return this.hasPersistedMenuInstanceFlowFlag();
  }

  private hasPersistedMenuInstanceFlowFlag(route = this.getRoute()) {
    return route?.options?.hasPersistedMenuInstanceFlow === true;
  }

  private getCurrentPersistedInstanceFlowCount() {
    return this.flowRegistry.getFlows().size;
  }

  private hasPersistableMenuLinkageRules() {
    const params = this.getStepParams('mobileMenuSettings', 'linkageRules') as { value?: unknown[] } | undefined;
    return Array.isArray(params?.value) && params.value.length > 0;
  }

  private hasCurrentPersistedMenuState() {
    return this.getCurrentPersistedInstanceFlowCount() > 0 || this.hasPersistableMenuLinkageRules();
  }

  private getRouteRepository() {
    const repository = this.flowEngine.context.routeRepository as MobileRouteRepository | undefined;
    if (!repository) {
      throw new Error('[NocoBase] plugin-ui-layout route repository is unavailable.');
    }

    return repository;
  }

  private buildRouteOptionsWithPersistedFlowFlag(hasPersistedMenuInstanceFlow: boolean) {
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

  private shouldDestroyPersistedStateOnDelete() {
    return (
      this.hasPersistedMenuInstanceFlowFlag() ||
      this.hasCurrentPersistedMenuState() ||
      this.hasPersistableInstanceFlows()
    );
  }

  private async syncPersistedFlowRouteFlag() {
    const route = this.getRoute();
    if (route?.id == null) {
      return;
    }

    const hasPersistedMenuInstanceFlow = this.hasCurrentPersistedMenuState();
    if (this.hasPersistedMenuInstanceFlowFlag(route) === hasPersistedMenuInstanceFlow) {
      return;
    }

    const options = this.buildRouteOptionsWithPersistedFlowFlag(hasPersistedMenuInstanceFlow);
    const routeRepository = this.getRouteRepository();
    if (!routeRepository.updateRoute) {
      throw new Error('[NocoBase] plugin-ui-layout route repository updateRoute is unavailable.');
    }

    await routeRepository.updateRoute(route.id, { options: options || null }, { refreshAfterMutation: false });
    await refreshMobileLayoutAccessibleRoutes(this.parent as MobileLayoutRouteRefreshModel, routeRepository);
    this.syncFromRoute(
      {
        ...route,
        options,
      },
      this.getParentRoute(),
    );
  }

  private async destroyPersistedState() {
    await this.flowEngine.modelRepository?.destroy?.(this.uid);
  }

  private async hydratePersistedState() {
    if (this.persistedStateHydrated) {
      return;
    }

    if (this.persistedStateHydrating) {
      return await this.persistedStateHydrating;
    }

    this.persistedStateHydrating = (async () => {
      let shouldRerenderAfterHydrate = false;
      const repository = this.flowEngine.modelRepository;
      if (!repository?.findOne) {
        return;
      }

      const data = (await repository.findOne({ uid: this.uid })) as PersistedMobileMenuModelData | null;
      if (!data?.uid) {
        return;
      }

      if (data.stepParams && typeof data.stepParams === 'object') {
        this.setStepParams(data.stepParams);
        shouldRerenderAfterHydrate = this.hasPersistableMenuLinkageRules();
      }

      if (data.flowRegistry && typeof data.flowRegistry === 'object') {
        replaceFlowRegistry(this.flowRegistry, data.flowRegistry);

        const hasBeforeRenderFlow = Object.values(data.flowRegistry).some((flow) => {
          if (!flow || typeof flow !== 'object' || (flow as { manual?: boolean }).manual === true) {
            return false;
          }
          const event = (flow as { on?: string | { eventName?: string } }).on;
          if (!event) {
            return true;
          }
          return typeof event === 'string' ? event === 'beforeRender' : event.eventName === 'beforeRender';
        });

        shouldRerenderAfterHydrate = shouldRerenderAfterHydrate || hasBeforeRenderFlow;
      }

      if (shouldRerenderAfterHydrate) {
        this.rerender();
      }
    })().finally(() => {
      this.persistedStateHydrated = true;
      this.persistedStateHydrating = undefined;
    });

    return await this.persistedStateHydrating;
  }

  private hasPersistableInstanceFlows() {
    const currentFlowCount = this.flowRegistry.getFlows().size;
    return currentFlowCount > 0 || this.initialPersistedInstanceFlowCount > 0;
  }

  serialize(): ReturnType<FlowModel['serialize']> {
    const data = super.serialize();
    data.props = omitMobileMenuRuntimeProps(data.props);
    return data;
  }

  async updateMenuRoute(values: Partial<NocoBaseDesktopRoute>) {
    const route = this.getRoute();
    if (!route?.id) {
      throw new Error('[NocoBase] plugin-ui-layout cannot update a mobile tab route without an id.');
    }

    const routeRepository = this.getRouteRepository();
    if (!routeRepository.updateRoute) {
      throw new Error('[NocoBase] plugin-ui-layout route repository updateRoute is unavailable.');
    }

    const nextValues = { ...values };
    if (values.options && this.hasPersistedMenuInstanceFlowFlag(route)) {
      nextValues.options = {
        ...values.options,
        hasPersistedMenuInstanceFlow: true,
      };
    }

    await routeRepository.updateRoute(route.id, nextValues, { refreshAfterMutation: false });
    await refreshMobileLayoutAccessibleRoutes(this.parent as MobileLayoutRouteRefreshModel, routeRepository);
    this.syncFromRoute(
      {
        ...route,
        ...nextValues,
      },
      this.getParentRoute(),
    );
  }

  async deleteMenuRoute() {
    const route = this.getRoute();
    if (!route?.id) {
      throw new Error('[NocoBase] plugin-ui-layout cannot delete a mobile tab route without an id.');
    }

    const routeRepository = this.getRouteRepository();
    if (!routeRepository.deleteRoute) {
      throw new Error('[NocoBase] plugin-ui-layout route repository deleteRoute is unavailable.');
    }

    const shouldDestroyPersistedState = this.shouldDestroyPersistedStateOnDelete();
    await routeRepository.deleteRoute(route.id, { refreshAfterMutation: false });
    await refreshMobileLayoutAccessibleRoutes(this.parent as MobileLayoutRouteRefreshModel, routeRepository);
    if (shouldDestroyPersistedState) {
      await this.destroyPersistedState();
    }
  }

  async destroy(): Promise<boolean> {
    const route = this.getRoute();
    if (!route?.id) {
      return false;
    }

    await this.deleteMenuRoute();
    return this.remove();
  }

  async saveStepParams() {
    const hasCurrentPersistedMenuState = this.hasCurrentPersistedMenuState();

    if (hasCurrentPersistedMenuState) {
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
    const hasCurrentPersistedMenuState = this.hasCurrentPersistedMenuState();

    if (hasCurrentPersistedMenuState) {
      await super.save();
    } else if (this.hasPersistedMenuInstanceFlowFlag()) {
      await this.destroyPersistedState();
    } else if (this.hasPersistableInstanceFlows()) {
      await super.save();
    }

    await this.syncPersistedFlowRouteFlag();
    return true;
  }

  toMobileTabNode(options: MobileTabNodeOptions): MobileTabNode | null {
    const route = this.getRoute();
    if (!route || !isMobileTabRoute(route)) {
      return null;
    }

    const key = getMobileRouteTabKey(route, this.sortIndex);
    const isFlowPage = isFlowPageRoute(route);

    return {
      key,
      label: getMobileRouteTitle(route, options.t),
      icon: getMobileRouteIcon(route),
      type: route.type,
      active: key === options.activeKey || mobileRouteTreeContainsTabKey(route.children, options.activeKey),
      path: isFlowPage ? getMobilePagePath(options.basePathname, route) : undefined,
      href: !isFlowPage ? getMobileLinkRouteHref(route) : undefined,
      route,
      model: this,
    };
  }

  protected renderHiddenInConfig(): ReactNode | undefined {
    return <div style={{ opacity: 0.3 }}>{(this.props.dom as ReactNode) || null}</div>;
  }

  render() {
    return (this.props.dom as ReactNode) || null;
  }
}

MobileLayoutMenuItemModel.registerFlow({
  key: 'mobileMenuSettings',
  title: 'Mobile menu settings',
  steps: {
    edit: {
      title: 'Edit',
      defaultParams: async (ctx: FlowSettingsContext<MobileLayoutMenuItemModel>) =>
        getMobileMenuEditDefaultParams(ctx.model.getRoute()),
      uiSchema: async (ctx: FlowSettingsContext<MobileLayoutMenuItemModel>) =>
        getMobileMenuEditUiSchema(ctx.t, ctx.model.getRoute()),
      beforeParamsSave: async (ctx: FlowSettingsContext<MobileLayoutMenuItemModel>, params: MobileMenuEditParams) => {
        const route = ctx.model.getRoute();
        await ctx.model.updateMenuRoute({
          title: params.title,
          icon: params.icon,
          options:
            route?.type === NocoBaseDesktopRouteType.link ? getMobileLinkEditOptions(route, params) : route?.options,
        });
      },
    },
    linkageRules: {
      title: 'Menu linkage rules',
      use: 'menuLinkageRules',
    },
  },
});

export default MobileLayoutMenuItemModel;
