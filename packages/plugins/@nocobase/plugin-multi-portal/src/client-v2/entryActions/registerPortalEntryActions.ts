/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application, EntryActionScope } from '@nocobase/client-v2';
import type { FlowModelContext, SubModelItem } from '@nocobase/flow-engine';
import { getPortalEntryActionStore } from './portalEntryActionStore';
import type { AppPortalAppItem, AppPortalItem } from './types';

const SCOPES: EntryActionScope[] = ['action-panel', 'app-switcher'];
const DESKTOP_LAYOUT_TYPE = 'desktop';
const MOBILE_LAYOUT_TYPE = 'mobile';
const MAIN_APP_NAME = 'main';

type LayoutTypeDefinition = {
  layoutType?: unknown;
  layoutModelClass?: unknown;
  rootPageModelClass?: unknown;
  childPageModelClass?: unknown;
};

type RuntimeContextLike = {
  isMobileLayout?: unknown;
  layout?: LayoutTypeDefinition;
  layoutContext?: unknown;
  inputArgs?: {
    isMobileLayout?: unknown;
  };
  view?: {
    inputArgs?: {
      isMobileLayout?: unknown;
    };
  };
  model?: {
    context?: unknown;
  };
};

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function toRuntimeContext(value: unknown): RuntimeContextLike | null {
  return isObjectLike(value) ? (value as RuntimeContextLike) : null;
}

function collectRuntimeContexts(value: unknown, result: RuntimeContextLike[] = [], visited = new Set<unknown>()) {
  if (!isObjectLike(value) || visited.has(value)) {
    return result;
  }

  visited.add(value);
  const ctx = toRuntimeContext(value);
  if (!ctx) {
    return result;
  }

  result.push(ctx);
  collectRuntimeContexts(ctx.layoutContext, result, visited);
  collectRuntimeContexts(ctx.model?.context, result, visited);

  return result;
}

function readString(value: unknown) {
  return typeof value === 'string' && value ? value : null;
}

function isMobileModelClass(value: unknown) {
  const modelClass = readString(value);
  return !!modelClass && modelClass.toLowerCase().includes(MOBILE_LAYOUT_TYPE);
}

function inferLayoutTypeFromDefinition(layout?: LayoutTypeDefinition) {
  const modelClasses = [layout?.layoutModelClass, layout?.rootPageModelClass, layout?.childPageModelClass];
  if (modelClasses.some(isMobileModelClass)) {
    return MOBILE_LAYOUT_TYPE;
  }

  return modelClasses.some(readString) ? DESKTOP_LAYOUT_TYPE : null;
}

function getCurrentLayoutType(ctx: FlowModelContext) {
  const contexts = collectRuntimeContexts(ctx);

  for (const context of contexts) {
    const layoutType = readString(context.layout?.layoutType);
    if (layoutType) {
      return layoutType;
    }
  }

  if (
    contexts.some(
      (context) =>
        context.isMobileLayout === true ||
        context.inputArgs?.isMobileLayout === true ||
        context.view?.inputArgs?.isMobileLayout === true,
    )
  ) {
    return MOBILE_LAYOUT_TYPE;
  }

  for (const context of contexts) {
    const layoutType = inferLayoutTypeFromDefinition(context.layout);
    if (layoutType) {
      return layoutType;
    }
  }

  return contexts.some(
    (context) =>
      context.isMobileLayout === false ||
      context.inputArgs?.isMobileLayout === false ||
      context.view?.inputArgs?.isMobileLayout === false,
  )
    ? DESKTOP_LAYOUT_TYPE
    : null;
}

function getPortalTitle(portal: AppPortalItem) {
  return portal.title || portal.routePath;
}

function getQualifiedPortalTitle(
  portal: AppPortalItem,
  portalApp: AppPortalAppItem | undefined,
  t: (key: string) => string,
) {
  const title = getPortalTitle(portal);
  const appLabel = getPortalAppLabel(portal.appName, portalApp, t);
  return appLabel ? `${appLabel} / ${title}` : title;
}

function getQualifiedPortalTargetTitle(
  portal: AppPortalItem,
  portalApp: AppPortalAppItem | undefined,
  t: (key: string) => string,
) {
  const title = getPortalTitle(portal);
  const appLabel = getPortalAppLabel(portal.appName, portalApp, t);
  return appLabel ? `${appLabel} / ${title}` : title;
}

function getPortalTitleCounts(portals: AppPortalItem[]) {
  const counts = new Map<string, number>();
  for (const portal of portals) {
    const title = getPortalTitle(portal);
    counts.set(title, (counts.get(title) || 0) + 1);
  }
  return counts;
}

function shouldUseQualifiedPortalTitle(portal: AppPortalItem, titleCounts: Map<string, number>, grouped: boolean) {
  return grouped || (titleCounts.get(getPortalTitle(portal)) || 0) > 1;
}

function toPortalItem(
  portal: AppPortalItem,
  portalApp: AppPortalAppItem | undefined,
  title: string,
  targetTitle: string,
): SubModelItem {
  const portalTitle = getPortalTitle(portal);
  return {
    key: `multi-portal:portal:${portal.appName}:${portal.uid || portal.routePath}`,
    label: portalTitle,
    createModelOptions: {
      use: 'PortalEntryActionModel',
      props: {
        title,
        icon: portal.icon || 'PartitionOutlined',
        entryPortalTitle: title,
        entryPortalTargetTitle: targetTitle,
        entryPortal: portal,
        entryPortalApp: portalApp,
      },
    },
  };
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function shouldGroupPortals(apps: AppPortalAppItem[], portals: AppPortalItem[]) {
  return apps.length > 0 || uniqueValues(portals.map((portal) => portal.appName)).length > 1;
}

function getPortalAppNames(apps: AppPortalAppItem[], portals: AppPortalItem[]) {
  const portalAppNames = uniqueValues(portals.map((portal) => portal.appName));
  const appNames = apps.map((item) => item.name);
  return uniqueValues([
    ...(portalAppNames.includes(MAIN_APP_NAME) ? [MAIN_APP_NAME] : []),
    ...appNames,
    ...portalAppNames,
  ]);
}

function getPortalAppLabel(appName: string, portalApp: AppPortalAppItem | undefined, t: (key: string) => string) {
  if (appName === MAIN_APP_NAME) {
    return t('Main application');
  }
  return portalApp?.title || appName;
}

export function registerPortalEntryActions(app: Application, t: (key: string) => string) {
  if (!app.entryActionManager) {
    return;
  }

  const store = getPortalEntryActionStore(app);
  for (const scope of SCOPES) {
    app.entryActionManager.register(`multi-portal:portals:${scope}`, {
      scope,
      sort: 200,
      provider: async (ctx) => {
        const payload = await store.load();
        const currentLayoutType = getCurrentLayoutType(ctx);
        const portals = currentLayoutType
          ? payload.portals.filter((portal) => portal.layout === currentLayoutType)
          : payload.portals;

        if (portals.length <= 1) {
          return [];
        }

        const appMap = new Map(payload.apps.map((item) => [item.name, item]));
        const titleCounts = getPortalTitleCounts(portals);
        const grouped = shouldGroupPortals(payload.apps, portals);
        const createPortalItem = (portal: AppPortalItem, portalApp?: AppPortalAppItem) => {
          const title = shouldUseQualifiedPortalTitle(portal, titleCounts, grouped)
            ? getQualifiedPortalTitle(portal, portalApp, t)
            : getPortalTitle(portal);
          const targetTitle = getQualifiedPortalTargetTitle(portal, portalApp, t);
          return toPortalItem(portal, portalApp, title, targetTitle);
        };
        const children: SubModelItem[] = grouped
          ? getPortalAppNames(payload.apps, portals)
              .map((appName) => {
                const portalApp = appMap.get(appName);
                const appPortals = portals.filter((portal) => portal.appName === appName);
                return appPortals.length
                  ? {
                      key: `multi-portal:app:${appName}`,
                      label: getPortalAppLabel(appName, portalApp, t),
                      children: appPortals.map((portal) => createPortalItem(portal, portalApp)),
                    }
                  : null;
              })
              .filter((item): item is NonNullable<typeof item> => !!item)
          : portals.map((portal) => createPortalItem(portal, appMap.get(portal.appName)));

        return children.length
          ? [
              {
                key: 'multi-portal:portals',
                label: t('Portals'),
                children,
              },
            ]
          : [];
      },
    });
  }
}
