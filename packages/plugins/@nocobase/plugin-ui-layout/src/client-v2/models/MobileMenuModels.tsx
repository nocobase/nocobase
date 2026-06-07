/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '@nocobase/client-v2/flow-compat';
import { FlowModel, type FlowSettingsContext } from '@nocobase/flow-engine';
import React, { type ReactNode } from 'react';
import {
  collectMobileTabRoutes,
  getMobileMenuItemUid,
  getMobilePagePath,
  getMobileRouteIcon,
  getMobileRouteTabKey,
  getMobileRouteTitle,
  isMobileTabRoute,
  type MobileRouteTitleTranslator,
} from './MobileMenuUtils';
export { MobileMenuSettingsIconPicker } from './MobileMenuComponents';

export { collectMobileTabRoutes, getMobilePagePath, toMobileRouterNavigationPath } from './MobileMenuUtils';

export type MobileTabNode = {
  key: string;
  label: ReactNode;
  icon: ReactNode;
  type: NocoBaseDesktopRouteType.flowPage | NocoBaseDesktopRouteType.link;
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

type MobileRouteRepository = {
  updateRoute?: (filterByTk: string | number, values: Partial<NocoBaseDesktopRoute>) => Promise<unknown>;
  deleteRoute?: (filterByTk: string | number) => Promise<unknown>;
};

type MobileMenuEditParams = {
  title?: string;
  icon?: string;
  href?: string;
  openInNewWindow?: boolean;
};

function getMobileMenuEditDefaultParams(route: NocoBaseDesktopRoute | undefined): MobileMenuEditParams {
  return {
    title: route?.title,
    icon: route?.icon,
    href: route?.options?.href,
    openInNewWindow: route?.options?.openInNewWindow !== false,
  };
}

function getMobileMenuEditUiSchema(
  t: (title: string) => string,
  route: NocoBaseDesktopRoute | undefined,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
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

  onInit(options: Parameters<FlowModel['onInit']>[0]) {
    super.onInit(options);
    this.syncFromRoute(
      this.props.route as NocoBaseDesktopRoute,
      this.props.parentRoute as NocoBaseDesktopRoute | undefined,
    );
  }

  syncFromRoute(route: NocoBaseDesktopRoute, parentRoute?: NocoBaseDesktopRoute) {
    this.route = route;
    this.parentRoute = parentRoute;
    this.setHidden(!!route?.hidden || !!route?.hideInMenu);
    this.setProps({
      route,
      parentRoute,
    });
  }

  getRoute() {
    return this.route || (this.props.route as NocoBaseDesktopRoute | undefined);
  }

  getParentRoute() {
    return this.parentRoute || (this.props.parentRoute as NocoBaseDesktopRoute | undefined);
  }

  getRouteRepository() {
    const repository = this.flowEngine.context.routeRepository as MobileRouteRepository | undefined;
    if (!repository) {
      throw new Error('[NocoBase] plugin-ui-layout route repository is unavailable.');
    }

    return repository;
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

    await routeRepository.updateRoute(route.id, values);
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

    await routeRepository.deleteRoute(route.id);
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
    return true;
  }

  async save() {
    return true;
  }

  toMobileTabNode(options: MobileTabNodeOptions): MobileTabNode | null {
    const route = this.getRoute();
    if (!route || !isMobileTabRoute(route)) {
      return null;
    }

    const key = getMobileRouteTabKey(route, this.sortIndex);
    const isFlowPage = route.type === NocoBaseDesktopRouteType.flowPage;

    return {
      key,
      label: getMobileRouteTitle(route, options.t),
      icon: getMobileRouteIcon(route),
      type: route.type,
      active: key === options.activeKey,
      path: isFlowPage ? getMobilePagePath(options.basePathname, route) : undefined,
      href: !isFlowPage && typeof route.options?.href === 'string' ? route.options.href : undefined,
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
            route?.type === NocoBaseDesktopRouteType.link
              ? {
                  ...(route.options || {}),
                  href: params.href,
                  openInNewWindow: params.openInNewWindow !== false,
                }
              : route?.options,
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
