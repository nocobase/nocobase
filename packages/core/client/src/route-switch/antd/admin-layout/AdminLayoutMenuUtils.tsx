/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  DragHandler as FlowDragHandler,
  Droppable,
  FlowModel,
  FlowModelRenderer,
  FlowSettingsButton,
} from '@nocobase/flow-engine';
import { Badge, Tooltip } from 'antd';
import qs from 'qs';
import React, { FC, useCallback, useContext, useEffect } from 'react';
import { Link, useLocation, type NavigateFunction } from 'react-router-dom';
import { Icon } from '../../../icon';
import { runAfterMobileMenuClosed } from './mobileMenuNavigation';
import { ResetThemeTokenAndKeepAlgorithm } from './ResetThemeTokenAndKeepAlgorithm';
import type { AdminLayoutMenuItemModel } from './AdminLayoutMenuModels';
import { uid } from '@nocobase/utils/client';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from './route-types';
import {
  appendQueryStringToUrl,
  navigateWithinSelf,
  NocoBaseRouteContext,
  ParentRouteContext,
  reduceValueSize,
  useEvaluatedExpression,
  useNavigateNoUpdate,
  useRouterBasename,
  VariableScope,
  withTooltipComponent,
} from './AdminLayoutCompat';

export type AdminLayoutMenuRenderType = 'item' | 'group';

export type AdminLayoutMenuRenderOptions = {
  isMobile?: boolean;
  collapsed?: boolean;
  menuRenderType?: string;
};

export type AdminLayoutMenuNode = {
  key?: string;
  name: React.ReactNode;
  icon?: React.ReactNode;
  path: string;
  redirect?: string;
  hideInMenu?: boolean;
  disabled?: boolean;
  _route: any;
  _parentRoute?: NocoBaseDesktopRoute;
  _depth?: number;
  _model?: AdminLayoutMenuItemModel;
  _launcherModel?: FlowModel;
  routes?: AdminLayoutMenuNode[];
};

export type AdminLayoutMenuRouteOptions = {
  designable: boolean;
  isMobile: boolean;
  t: (title: any) => any;
  depth?: number;
};

export type AdminLayoutMenuMovePositionOption = {
  label: any;
  value: 'beforeBegin' | 'afterEnd' | 'beforeEnd';
  disabled?: boolean;
};

export type AdminLayoutMenuInsertPosition = 'beforeBegin' | 'afterEnd' | 'beforeEnd';

export type AdminLayoutMenuCreationType = 'group' | 'page' | 'flowPage' | 'link';

export type AdminLayoutMenuCreationSource = 'header' | 'sider' | 'insert';

export type AdminLayoutMenuCreationMeta = {
  menuType: AdminLayoutMenuCreationType;
  source: AdminLayoutMenuCreationSource;
  insertPosition?: AdminLayoutMenuInsertPosition;
  targetRoute?: NocoBaseDesktopRoute;
  parentRoute?: NocoBaseDesktopRoute;
};

export type AdminLayoutMenuCreationParams = {
  menuType?: AdminLayoutMenuCreationType;
  title?: string;
  icon?: string;
  href?: string;
  params?: any[];
  openInNewWindow?: boolean;
};

export type AdminLayoutMenuItemStructure = {
  subModels: {
    menuItems?: AdminLayoutMenuItemModel[];
  };
};

type AdminLayoutMenuItemsParent = FlowModel & {
  subModels: {
    menuItems?: AdminLayoutMenuItemModel[];
  };
};

/**
 * 为不会直接参与站内路由跳转的菜单节点生成稳定且唯一的占位路径。
 * 这些节点仍会被 ProLayout/rc-menu 当成菜单 key 使用，因此不能复用 '/'。
 * @param type 占位路径类型
 * @param identity 节点身份
 * @returns 唯一占位路径
 */
export const getAdminLayoutMenuVirtualPath = (type: 'link' | 'designer', identity: string | number) => {
  return `/admin/__admin_layout__/${type}/${encodeURIComponent(String(identity))}`;
};

const menuItemStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

const LEGACY_FLOW_MENU_VARIABLE_MAPPINGS: Array<{
  pattern: RegExp;
  resolve: (match: RegExpMatchArray) => string;
}> = [
  {
    pattern: /^\$user(?:\.(.+))?$/,
    resolve: (match) => `ctx.user${match[1] ? `.${match[1]}` : ''}`,
  },
  {
    pattern: /^currentUser(?:\.(.+))?$/,
    resolve: (match) => `ctx.user${match[1] ? `.${match[1]}` : ''}`,
  },
  {
    pattern: /^\$nRole$/,
    resolve: () => 'ctx.role',
  },
  {
    pattern: /^\$nToken$/,
    resolve: () => 'ctx.token',
  },
  {
    pattern: /^\$nURLSearchParams(?:\.(.+))?$/,
    resolve: (match) => `ctx.urlSearchParams${match[1] ? `.${match[1]}` : ''}`,
  },
];

/**
 * 仅在模板表达式内部兼容历史菜单变量写法，避免误改普通文本。
 * @param template 原始模板字符串
 * @returns 归一化后的模板字符串
 */
export const normalizeAdminLayoutMenuLegacyVariables = (template: string) => {
  if (typeof template !== 'string' || !template.includes('{{')) {
    return template;
  }

  return template.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (full, expression: string) => {
    const trimmed = String(expression || '').trim();

    for (const mapping of LEGACY_FLOW_MENU_VARIABLE_MAPPINGS) {
      const match = trimmed.match(mapping.pattern);
      if (match) {
        return `{{ ${mapping.resolve(match)} }}`;
      }
    }

    return full;
  });
};

/**
 * 使用 FlowContext 解析 admin-layout link 菜单的 URL 和查询参数。
 * @param options 解析所需参数
 * @returns 最终可跳转的 URL
 */
export const resolveAdminLayoutMenuLink = async (options: {
  context: FlowModel['context'];
  href: string;
  params?: Array<{ name: string; value: any }>;
}) => {
  const { context, href, params = [] } = options;

  const targetHref = typeof href === 'string' ? normalizeAdminLayoutMenuLegacyVariables(href) : href;
  const resolvedHref = await context.resolveJsonTemplate(targetHref);
  const query: Record<string, any> = {};

  for (const { name, value } of params) {
    if (!name) {
      continue;
    }

    try {
      const nextValue =
        typeof value === 'string'
          ? await context.resolveJsonTemplate(normalizeAdminLayoutMenuLegacyVariables(value))
          : value;

      if (nextValue === undefined || nextValue === null) {
        continue;
      }

      query[name] = reduceValueSize(nextValue);
    } catch (error) {
      console.error(error);
    }
  }

  return appendQueryStringToUrl(String(resolvedHref ?? href ?? ''), qs.stringify(query));
};

export const openAdminLayoutMenuLink = async (options: {
  context: FlowModel['context'];
  href: string;
  params?: any[];
  openInNewWindow?: boolean;
  isMobile?: boolean;
  closeMobileMenu: () => void;
  navigate: NavigateFunction;
  basenameOfCurrentRouter: string;
}) => {
  const { context, href, params, openInNewWindow, isMobile, closeMobileMenu, navigate, basenameOfCurrentRouter } =
    options;

  try {
    const url = await resolveAdminLayoutMenuLink({
      context,
      href,
      params: params || [],
    });

    if (openInNewWindow !== false) {
      if (isMobile) {
        closeMobileMenu();
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    runAfterMobileMenuClosed({
      isMobile: !!isMobile,
      closeMobileMenu,
      callback: () => {
        navigateWithinSelf(url, navigate, window.location.origin + basenameOfCurrentRouter);
      },
    });
  } catch (err) {
    console.error(err);
    if (isMobile) {
      closeMobileMenu();
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  }
};

type MenuModelLike = FlowModel & {
  getRoute?: () => NocoBaseDesktopRoute | undefined;
  getParentRoute?: () => NocoBaseDesktopRoute | undefined;
  syncFromRoute?: (route: NocoBaseDesktopRoute, parentRoute?: NocoBaseDesktopRoute) => void;
  toProLayoutRoute?: (options: AdminLayoutMenuRouteOptions) => AdminLayoutMenuNode | null;
};

const isAdminLayoutMenuModel = (model: FlowModel | undefined): model is MenuModelLike => {
  return !!model && typeof (model as MenuModelLike).getRoute === 'function';
};

const translateByModel = (model: FlowModel, value: any) => {
  return typeof model.context.t === 'function' ? model.context.t(value) : value;
};

const MENU_TYPE_ITEMS: Array<{ key: string; label: string; menuType: AdminLayoutMenuCreationType }> = [
  { key: 'group', label: 'Group', menuType: 'group' },
  { key: 'page', label: 'Classic page (v1)', menuType: 'page' },
  { key: 'flow-page', label: 'Modern page (v2)', menuType: 'flowPage' },
  { key: 'link', label: 'Link', menuType: 'link' },
];

const createMenuCreationModelOptions = (launcherModel: FlowModel, meta: AdminLayoutMenuCreationMeta) => ({
  uid: `${launcherModel.uid}-menu-creation-${uid()}`,
  use: 'AdminLayoutMenuItemModel',
  props: {
    creationMeta: meta,
  },
});

const getMenuDesignerItems = (launcherModel: FlowModel, parentRoute?: NocoBaseDesktopRoute) => {
  const t = (value: any) => translateByModel(launcherModel, value);
  const source: AdminLayoutMenuCreationSource = parentRoute ? 'sider' : 'header';

  return MENU_TYPE_ITEMS.map((item) => ({
    key: item.key,
    label: t(item.label),
    createModelOptions: () =>
      createMenuCreationModelOptions(launcherModel, {
        menuType: item.menuType,
        source,
        parentRoute,
      }),
  }));
};

const MenuDesignerButton: FC<{ testId: string; launcherModel: FlowModel; parentRoute?: NocoBaseDesktopRoute }> = (
  props,
) => {
  const t = (value: any) => translateByModel(props.launcherModel, value);

  return (
    <AddSubModelButton
      model={props.launcherModel}
      subModelKey={'menuItems'}
      items={getMenuDesignerItems(props.launcherModel, props.parentRoute)}
    >
      <FlowSettingsButton data-testid={props.testId} style={{ background: 'none' }} icon={<PlusOutlined />}>
        {t('Add menu item')}
      </FlowSettingsButton>
    </AddSubModelButton>
  );
};

const MenuTitleWithIcon: FC<{ icon: any; title: string }> = (props) => {
  if (props.icon) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Icon type={props.icon} />
        <span>{props.title}</span>
      </div>
    );
  }

  return <>{props.title}</>;
};

const MenuItemTitle: React.FC = (props) => <>{props.children}</>;
const MenuItemTitleWithTooltip = withTooltipComponent(MenuItemTitle);

export const MobileMenuControlContext = React.createContext<{
  closeMobileMenu: () => void;
}>({
  closeMobileMenu: () => {},
});

export const HeaderContext = React.createContext<{ inHeader: boolean }>({ inHeader: false });

/**
 * 根据当前选中的目标菜单，生成可用的 Move to 位置选项。
 */
export const getAdminLayoutMenuMovePositionOptions = (
  target: string | undefined,
  currentRouteId: string | number | undefined,
  t: (title: any) => any,
): AdminLayoutMenuMovePositionOption[] => {
  const [targetId, targetType] = target?.split?.('||') || [];
  const options: AdminLayoutMenuMovePositionOption[] = [
    { label: t('Before'), value: 'beforeBegin' },
    { label: t('After'), value: 'afterEnd' },
  ];

  if (targetType !== NocoBaseDesktopRouteType.group) {
    return options;
  }

  return [
    ...options,
    {
      label: t('Inner'),
      value: 'beforeEnd',
      disabled: currentRouteId !== undefined && String(currentRouteId) === targetId,
    },
  ];
};

function getAdminLayoutMenuItemUid(parentUid: string, route: NocoBaseDesktopRoute, index: number) {
  const identity =
    route.id ??
    route.schemaUid ??
    route.menuSchemaUid ??
    route.pageSchemaUid ??
    route.title ??
    `${route.type}-${index}`;

  return `${parentUid}-menu-item-${route.type || 'unknown'}-${identity}`;
}

export function reconcileAdminLayoutMenuItems(
  parent: AdminLayoutMenuItemsParent,
  routes: NocoBaseDesktopRoute[],
  parentRoute?: NocoBaseDesktopRoute,
) {
  const existingItems = [...(parent.subModels.menuItems || [])];
  const existingItemMap = new Map(existingItems.map((item) => [item.uid, item]));
  const nextItems: AdminLayoutMenuItemModel[] = [];
  const nextUidSet = new Set<string>();

  routes.forEach((route, index) => {
    const uid = getAdminLayoutMenuItemUid(parent.uid, route, index);
    let itemModel = existingItemMap.get(uid) as MenuModelLike | undefined;
    const isExistingModel = !!itemModel;

    if (!itemModel) {
      itemModel = parent.addSubModel('menuItems', {
        uid,
        use: 'AdminLayoutMenuItemModel',
        props: {
          route,
          parentRoute,
        },
      }) as unknown as MenuModelLike;
    }

    itemModel.sortIndex = index + 1;
    if (isExistingModel) {
      itemModel.syncFromRoute?.(route, parentRoute);
    }
    nextItems.push(itemModel as AdminLayoutMenuItemModel);
    nextUidSet.add(uid);
  });

  existingItems.forEach((item) => {
    if (!nextUidSet.has(item.uid)) {
      parent.flowEngine.removeModelWithSubModels(item.uid);
    }
  });

  parent.subModels.menuItems = nextItems;
}

type AdminLayoutMenuDragMoveOptions = {
  sourceId: string | number;
  targetId?: string | number;
  targetScope?: {
    parentId: string | number;
  };
  sortField: 'sort';
  method?: 'insertAfter' | 'prepend';
};

export function resolveAdminLayoutMenuDragMoveOptions(
  activeModel?: FlowModel,
  overModel?: FlowModel,
): AdminLayoutMenuDragMoveOptions | undefined {
  if (!isAdminLayoutMenuModel(activeModel) || !isAdminLayoutMenuModel(overModel)) {
    return;
  }

  const activeRoute = activeModel.getRoute?.();
  const overRoute = overModel.getRoute?.();

  if (!activeRoute?.id || !overRoute?.id || activeRoute.id === overRoute.id) {
    return;
  }

  return {
    sourceId: activeRoute.id,
    targetId: overRoute.id,
    sortField: 'sort',
  };
}

export function resolveAdminLayoutMenuDragMoveOptionsFromEvent(
  flowEngine: {
    getModel: (uid: string) => FlowModel | undefined;
  },
  event: {
    active?: { id?: string | number };
    over?: { id?: string | number } | null;
  },
): AdminLayoutMenuDragMoveOptions | undefined {
  if (!event.active?.id || !event.over?.id) {
    return;
  }

  return resolveAdminLayoutMenuDragMoveOptions(
    flowEngine.getModel(String(event.active.id)),
    flowEngine.getModel(String(event.over.id)),
  );
}

const GroupItem: FC<{ item: AdminLayoutMenuNode }> = (props) => {
  const { item } = props;
  const badgeCount = useEvaluatedExpression(item._route.options?.badge?.count, item._model?.context);
  const ariaLabel =
    typeof item.name === 'string' || typeof item.name === 'number'
      ? String(item.name)
      : typeof item._route?.title === 'string' || typeof item._route?.title === 'number'
        ? String(item._route.title)
        : undefined;

  return (
    <ParentRouteContext.Provider value={item._parentRoute}>
      <NocoBaseRouteContext.Provider value={item._route}>
        <div aria-label={ariaLabel} role="none" style={menuItemStyle}>
          {props.children}
          {badgeCount != null && (
            <Badge
              {...item._route.options?.badge}
              count={badgeCount}
              style={{ marginLeft: 4, color: item._route.options?.badge?.textColor, maxWidth: '10em' }}
              dot={false}
            ></Badge>
          )}
        </div>
      </NocoBaseRouteContext.Provider>
    </ParentRouteContext.Provider>
  );
};

const WithTooltip: FC<{ title: React.ReactNode; hidden: boolean; badgeProps: any }> = (props) => {
  const { inHeader } = useContext(HeaderContext);

  if (props.hidden || inHeader) {
    return props.children;
  }

  return (
    <Tooltip title={props.title} placement="right">
      <Badge {...props.badgeProps} style={{ transform: 'none', maxWidth: '10em' }} dot={false}>
        {props.children}
      </Badge>
    </Tooltip>
  );
};

const MenuItem: FC<{ item: AdminLayoutMenuNode; options?: AdminLayoutMenuRenderOptions }> = (props) => {
  const { item } = props;
  const location = useLocation();
  const badgeCount = useEvaluatedExpression(item._route.options?.badge?.count, item._model?.context);
  const navigate = useNavigateNoUpdate();
  const basenameOfCurrentRouter = useRouterBasename();
  const { closeMobileMenu } = useContext(MobileMenuControlContext);
  const path = item.redirect || item.path;
  const badgeProps = { ...item._route.options?.badge, count: badgeCount };

  const handleClickLink = useCallback(
    async (event: React.MouseEvent) => {
      const href = item._route.options?.href;
      const params = item._route.options?.params;
      const openInNewWindow = item._route.options?.openInNewWindow;

      event.preventDefault();
      event.stopPropagation();

      await openAdminLayoutMenuLink({
        context: item._model?.context,
        href,
        params,
        openInNewWindow,
        isMobile: !!props.options?.isMobile,
        closeMobileMenu,
        navigate,
        basenameOfCurrentRouter,
      });
    },
    [item, props.options?.isMobile, closeMobileMenu, navigate, basenameOfCurrentRouter],
  );

  const handleClickMenuItem = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!props.options?.isMobile) {
        navigate(path);
        return;
      }

      runAfterMobileMenuClosed({
        isMobile: !!props.options?.isMobile,
        closeMobileMenu,
        callback: () => {
          navigate(path);
        },
      });
    },
    [props.options?.isMobile, closeMobileMenu, navigate, path],
  );

  if (item._route?.type === NocoBaseDesktopRouteType.link) {
    return (
      <ParentRouteContext.Provider value={item._parentRoute}>
        <NocoBaseRouteContext.Provider value={item._route}>
          <div role="none" style={menuItemStyle}>
            <div onClick={handleClickLink}>
              <Link to={location.pathname} aria-label={typeof item.name === 'string' ? item.name : undefined}>
                {props.children}
              </Link>
            </div>
            {badgeCount != null && (
              <Badge
                {...item._route.options?.badge}
                count={badgeCount}
                style={{ marginLeft: 4, color: item._route.options?.badge?.textColor, maxWidth: '10em' }}
                dot={false}
              ></Badge>
            )}
          </div>
        </NocoBaseRouteContext.Provider>
      </ParentRouteContext.Provider>
    );
  }

  return (
    <ParentRouteContext.Provider value={item._parentRoute}>
      <NocoBaseRouteContext.Provider value={item._route}>
        <div role="none" style={menuItemStyle}>
          <WithTooltip
            title={item.name}
            hidden={
              item._route.type === NocoBaseDesktopRouteType.group || (item._depth || 0) > 0 || !props.options?.collapsed
            }
            badgeProps={badgeProps}
          >
            <Link
              to={path}
              aria-label={typeof item.name === 'string' ? item.name : undefined}
              onClick={handleClickMenuItem}
            >
              {props.children}
            </Link>
          </WithTooltip>
          {badgeCount != null && (
            <Badge
              {...badgeProps}
              style={{ marginLeft: 4, color: item._route.options?.badge?.textColor, maxWidth: '10em' }}
              dot={false}
            ></Badge>
          )}
        </div>
      </NocoBaseRouteContext.Provider>
    </ParentRouteContext.Provider>
  );
};

const MenuDragToolbarButton: FC<{ model: FlowModel }> = ({ model }) => {
  if (!isAdminLayoutMenuModel(model)) {
    return null;
  }

  const route = model.getRoute?.();
  if (!route?.id) {
    return null;
  }

  return <FlowDragHandler model={model} />;
};

export const AdminLayoutMenuItemRenderer: FC<{
  item: AdminLayoutMenuNode;
  dom: React.ReactNode;
  options?: AdminLayoutMenuRenderOptions;
  renderType: AdminLayoutMenuRenderType;
}> = ({ item, dom, options, renderType }) => {
  if (!item || !renderType) {
    return null;
  }

  const tooltipDom = <MenuItemTitleWithTooltip tooltip={item._route?.tooltip}>{dom}</MenuItemTitleWithTooltip>;

  if (renderType === 'group') {
    return (
      <VariableScope scopeId={item._route.schemaUid} type="groupItem">
        <GroupItem item={item}>{tooltipDom}</GroupItem>
      </VariableScope>
    );
  }

  return (
    <VariableScope scopeId={item._route.schemaUid} type="menuItem">
      <MenuItem item={item} options={options}>
        {tooltipDom}
      </MenuItem>
    </VariableScope>
  );
};

export const shouldRenderIconInTitle = ({ depth, isMobile }: { depth: number; isMobile: boolean }) => {
  return depth > 1 || (isMobile && depth > 0);
};

export const AdminLayoutMenuModelRenderer: FC<{
  model: FlowModel;
  item: AdminLayoutMenuNode;
  dom: React.ReactNode;
  renderType: AdminLayoutMenuRenderType;
  options?: AdminLayoutMenuRenderOptions;
}> = ({ model, item, dom, renderType, options }) => {
  const token = model.context.themeToken;

  useEffect(() => {
    model.setProps({
      item,
      dom,
      renderType,
      options,
    });
  }, [dom, item, model, options, renderType]);

  return (
    <ResetThemeTokenAndKeepAlgorithm>
      <Droppable model={model}>
        <FlowModelRenderer
          model={model}
          showFlowSettings={{
            showBackground: false,
            showBorder: false,
            style: {
              left: -token.padding,
              right: -token.padding,
            },
          }}
          extraToolbarItems={[
            {
              key: 'menu-drag-handler',
              component: MenuDragToolbarButton,
              sort: 1,
            },
          ]}
        />
      </Droppable>
    </ResetThemeTokenAndKeepAlgorithm>
  );
};

export function getAdminLayoutMenuInitializerButton(
  testId: string,
  launcherModel: FlowModel,
  parentRoute?: NocoBaseDesktopRoute,
): AdminLayoutMenuNode {
  const identity =
    parentRoute?.id ?? parentRoute?.schemaUid ?? parentRoute?.menuSchemaUid ?? parentRoute?.title ?? launcherModel.uid;

  return {
    key: 'x-designer-button',
    name: <MenuDesignerButton testId={testId} launcherModel={launcherModel} parentRoute={parentRoute} />,
    path: getAdminLayoutMenuVirtualPath('designer', identity),
    disabled: true,
    _route: {},
    _parentRoute: parentRoute,
    _launcherModel: launcherModel,
    icon: <Icon type="setting" />,
  };
}

export const buildMenuTitleWithIcon = (
  route: NocoBaseDesktopRoute,
  t: (title: any) => any,
  showIconInTitle: boolean,
) => {
  const name = showIconInTitle ? <MenuTitleWithIcon icon={route.icon} title={t(route.title)} /> : t(route.title);
  const icon = showIconInTitle ? null : route.icon ? <Icon type={route.icon} /> : null;
  return { name, icon };
};
