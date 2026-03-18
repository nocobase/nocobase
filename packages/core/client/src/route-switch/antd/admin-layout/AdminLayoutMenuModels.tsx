/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Badge, Tooltip } from 'antd';
import React, { FC, useCallback, useContext, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  findFirstPageRoute,
  NocoBaseDesktopRoute,
  NocoBaseDesktopRouteType,
  NocoBaseRouteContext,
} from '../../../admin-shell';
import {
  Icon,
  ParentRouteContext,
  SortableItem,
  useDesignable,
  useParseURLAndParams,
  useRouterBasename,
  useSchemaInitializerRender,
} from '../../../';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import { navigateWithinSelf } from '../../../block-provider/hooks';
import { withTooltipComponent } from '../../../hoc/withTooltipComponent';
import { useEvaluatedExpression } from '../../../hooks/useParsedValue';
import { menuItemInitializer } from '../../../modules/menu/menuItemInitializer';
import { VariableScope } from '../../../variables/VariableScope';
import { MenuSchemaToolbar } from './menuItemSettings';
import { runAfterMobileMenuClosed } from './mobileMenuNavigation';

type AdminLayoutMenuRenderType = 'item' | 'group';

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
  routes?: AdminLayoutMenuNode[];
};

type AdminLayoutMenuRouteOptions = {
  designable: boolean;
  isMobile: boolean;
  t: (title: any) => any;
  depth?: number;
};

type AdminLayoutMenuItemStructure = {
  subModels: {
    items?: AdminLayoutMenuItemModel[];
  };
};

type AdminLayoutMenuTreeStructure = {
  subModels: {
    items?: AdminLayoutMenuItemModel[];
  };
};

const menuItemStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

export const MobileMenuControlContext = React.createContext<{
  closeMobileMenu: () => void;
}>({
  closeMobileMenu: () => {},
});

export const HeaderContext = React.createContext<{ inHeader: boolean }>({ inHeader: false });

/**
 * 生成菜单子模型的稳定 uid。
 *
 * 这里优先使用 route 自身的稳定标识，避免菜单重算时重复创建 model；
 * 同时把父级 uid 编进去，保证同一个 route 被移动到不同分组时仍然能正确重建。
 *
 * @param {string} parentUid 父模型 uid
 * @param {NocoBaseDesktopRoute} route 当前菜单路由
 * @param {number} index 当前层级中的索引
 * @returns {string} 子模型 uid
 */
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

/**
 * 同步某一层菜单的子模型集合。
 *
 * 它会复用还存在的菜单项模型，并同步删除已经失效的分支，
 * 这样可以让 Layout 菜单逐步切换到 FlowModel 树，同时不引入额外的 UI 行为变化。
 *
 * @param {FlowModel & { subModels: { items?: AdminLayoutMenuItemModel[] } }} parent 父模型
 * @param {NocoBaseDesktopRoute[]} routes 当前层菜单路由列表
 * @param {NocoBaseDesktopRoute | undefined} parentRoute 父级路由
 */
function reconcileMenuItems(
  parent: FlowModel & { subModels: { items?: AdminLayoutMenuItemModel[] } },
  routes: NocoBaseDesktopRoute[],
  parentRoute?: NocoBaseDesktopRoute,
) {
  const existingItems = [...(parent.subModels.items || [])];
  const existingItemMap = new Map(existingItems.map((item) => [item.uid, item]));
  const nextItems: AdminLayoutMenuItemModel[] = [];
  const nextUidSet = new Set<string>();

  routes.forEach((route, index) => {
    const uid = getAdminLayoutMenuItemUid(parent.uid, route, index);
    let itemModel = existingItemMap.get(uid);
    const isExistingModel = !!itemModel;

    if (!itemModel) {
      itemModel = parent.addSubModel('items', {
        uid,
        use: AdminLayoutMenuItemModel,
        props: {
          route,
          parentRoute,
        },
      }) as AdminLayoutMenuItemModel;
    }

    itemModel.sortIndex = index + 1;
    if (isExistingModel) {
      itemModel.syncFromRoute(route, parentRoute);
    }
    nextItems.push(itemModel);
    nextUidSet.add(uid);
  });

  existingItems.forEach((item) => {
    if (!nextUidSet.has(item.uid)) {
      parent.flowEngine.removeModelWithSubModels(item.uid);
    }
  });

  parent.subModels.items = nextItems;
}

const MenuDesignerButton: FC<{ testId: string }> = (props) => {
  const { render: renderInitializer } = useSchemaInitializerRender(menuItemInitializer);

  return renderInitializer({
    style: { background: 'none' },
    'data-testid': props.testId,
  });
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

const MenuItemTitle: React.FC = (props) => {
  return <>{props.children}</>;
};

const MenuItemTitleWithTooltip = withTooltipComponent(MenuItemTitle);

/**
 * Fix the issue where SchemaToolbar cannot be displayed normally in Group
 * @returns
 */
const MenuSchemaToolbarWithContainer = () => {
  const divRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const submenuTitleContainer = divRef.current?.closest('.ant-menu-submenu-title') as HTMLDivElement | null;
    const fallbackContainer = divRef.current?.parentElement?.parentElement?.parentElement as HTMLDivElement | null;
    setContainer(submenuTitleContainer || fallbackContainer);
  }, []);

  return (
    <>
      <MenuSchemaToolbar container={container || undefined} />
      <div ref={divRef}></div>
    </>
  );
};

const GroupItem: FC<{ item: AdminLayoutMenuNode }> = (props) => {
  const { item } = props;
  const { designable } = useDesignable();
  const badgeCount = useEvaluatedExpression(item._route.options?.badge?.count);
  const ariaLabel =
    typeof item.name === 'string' || typeof item.name === 'number'
      ? String(item.name)
      : typeof item._route?.title === 'string' || typeof item._route?.title === 'number'
        ? String(item._route.title)
        : undefined;

  // fake schema used to pass routing information to SortableItem
  const fakeSchema: any = { __route__: item._route };

  return (
    <ParentRouteContext.Provider value={item._parentRoute}>
      <NocoBaseRouteContext.Provider value={item._route}>
        <SortableItem id={item._route.id} schema={fakeSchema} aria-label={ariaLabel} style={menuItemStyle}>
          {props.children}
          {designable && <MenuSchemaToolbarWithContainer />}
          {badgeCount != null && (
            <Badge
              {...item._route.options?.badge}
              count={badgeCount}
              style={{ marginLeft: 4, color: item._route.options?.badge?.textColor, maxWidth: '10em' }}
              dot={false}
            ></Badge>
          )}
        </SortableItem>
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
  const { parseURLAndParams } = useParseURLAndParams();
  const location = useLocation();
  const badgeCount = useEvaluatedExpression(item._route.options?.badge?.count);
  const navigate = useNavigateNoUpdate();
  const basenameOfCurrentRouter = useRouterBasename();
  const { closeMobileMenu } = useContext(MobileMenuControlContext);
  // 如果点击的是一个 group，直接跳转到第一个子页面
  const path = item.redirect || item.path;
  const badgeProps = { ...item._route.options?.badge, count: badgeCount };

  const handleClickLink = useCallback(
    async (event: React.MouseEvent) => {
      const href = item._route.options?.href;
      const params = item._route.options?.params;
      const openInNewWindow = item._route.options?.openInNewWindow;

      event.preventDefault();
      event.stopPropagation();

      try {
        const url = await parseURLAndParams(href, params || []);

        if (openInNewWindow !== false) {
          if (props.options?.isMobile) {
            closeMobileMenu();
          }
          window.open(url, '_blank');
        } else {
          runAfterMobileMenuClosed({
            isMobile: !!props.options?.isMobile,
            closeMobileMenu,
            callback: () => {
              navigateWithinSelf(href, navigate, window.location.origin + basenameOfCurrentRouter);
            },
          });
        }
      } catch (err) {
        console.error(err);
        if (props.options?.isMobile) {
          closeMobileMenu();
        }
        window.open(href, '_blank');
      }
    },
    [parseURLAndParams, item, props.options?.isMobile, closeMobileMenu, navigate, basenameOfCurrentRouter],
  );

  const handleClickMenuItem = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!props.options?.isMobile) {
        navigate(path);
        return;
      }

      // 移动端先收起菜单，再跳转，避免返回时菜单残留在打开态。
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

  const fakeSchema: any = { __route__: item._route };

  if (item._route?.type === NocoBaseDesktopRouteType.link) {
    return (
      <ParentRouteContext.Provider value={item._parentRoute}>
        <NocoBaseRouteContext.Provider value={item._route}>
          <SortableItem id={item._route.id} schema={fakeSchema} style={menuItemStyle}>
            <div onClick={handleClickLink}>
              {/* 这里是为了扩大点击区域 */}
              <Link to={location.pathname} aria-label={typeof item.name === 'string' ? item.name : undefined}>
                {props.children}
              </Link>
            </div>
            <MenuSchemaToolbar />
            {badgeCount != null && (
              <Badge
                {...item._route.options?.badge}
                count={badgeCount}
                style={{ marginLeft: 4, color: item._route.options?.badge?.textColor, maxWidth: '10em' }}
                dot={false}
              ></Badge>
            )}
          </SortableItem>
        </NocoBaseRouteContext.Provider>
      </ParentRouteContext.Provider>
    );
  }

  return (
    <ParentRouteContext.Provider value={item._parentRoute}>
      <NocoBaseRouteContext.Provider value={item._route}>
        <SortableItem id={item._route.id} schema={fakeSchema} style={menuItemStyle}>
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
          <MenuSchemaToolbar />
          {badgeCount != null && (
            <Badge
              {...badgeProps}
              style={{ marginLeft: 4, color: item._route.options?.badge?.textColor, maxWidth: '10em' }}
              dot={false}
            ></Badge>
          )}
        </SortableItem>
      </NocoBaseRouteContext.Provider>
    </ParentRouteContext.Provider>
  );
};

const AdminLayoutMenuItemRenderer: FC<{
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
  // ProLayout 在深层菜单和移动端侧栏一级菜单里都可能忽略 icon 字段，因此统一把图标渲染到标题内部。
  return depth > 1 || (isMobile && depth > 0);
};

export const AdminLayoutMenuModelRenderer: FC<{
  model: AdminLayoutMenuItemModel;
  item: AdminLayoutMenuNode;
  dom: React.ReactNode;
  renderType: AdminLayoutMenuRenderType;
  options?: AdminLayoutMenuRenderOptions;
}> = ({ model, item, dom, renderType, options }) => {
  useEffect(() => {
    model.setProps({
      item,
      dom,
      renderType,
      options,
    });
  }, [dom, item, model, options, renderType]);

  return <FlowModelRenderer model={model} />;
};

function getInitializerButton(testId: string, parentRoute?: NocoBaseDesktopRoute): AdminLayoutMenuNode {
  return {
    key: 'x-designer-button',
    name: <MenuDesignerButton testId={testId} />,
    path: '/',
    disabled: true,
    _route: {},
    _parentRoute: parentRoute,
    icon: <Icon type="setting" />,
  };
}

/**
 * 单个菜单节点模型。
 *
 * 它负责维护菜单树结构、路由适配结果和菜单项自身的渲染包装，
 * 这样 Layout Shell 只需要消费 model 产出的 route 数据和 render 结果。
 *
 * @example
 * ```typescript
 * const firstItem = menuTree.subModels.items?.[0];
 * ```
 */
export class AdminLayoutMenuItemModel extends FlowModel<AdminLayoutMenuItemStructure> {
  onInit(options) {
    super.onInit(options);
    this.syncFromRoute(
      this.props.route as NocoBaseDesktopRoute,
      this.props.parentRoute as NocoBaseDesktopRoute | undefined,
    );
  }

  /**
   * 使用最新 route 更新当前菜单节点及其子树。
   *
   * @param {NocoBaseDesktopRoute} route 当前菜单节点的 route
   * @param {NocoBaseDesktopRoute} [parentRoute] 父级 route
   */
  syncFromRoute(route: NocoBaseDesktopRoute, parentRoute?: NocoBaseDesktopRoute) {
    this.setProps({
      route,
      parentRoute,
    });

    if (route?.type === NocoBaseDesktopRouteType.group) {
      reconcileMenuItems(this, Array.isArray(route.children) ? route.children : [], route);
      return;
    }

    (this.subModels.items || []).forEach((item) => {
      this.flowEngine.removeModelWithSubModels(item.uid);
    });
    delete this.subModels.items;
  }

  toProLayoutMenuItem(options: AdminLayoutMenuRouteOptions): AdminLayoutMenuNode | null {
    const route = this.props.route as NocoBaseDesktopRoute;
    const parentRoute = this.props.parentRoute as NocoBaseDesktopRoute | undefined;
    const depth = options.depth || 0;

    if (!route || typeof route !== 'object') {
      return null;
    }

    const shouldShowIconInTitle = shouldRenderIconInTitle({ depth, isMobile: options.isMobile });
    const name = shouldShowIconInTitle ? (
      <MenuTitleWithIcon icon={route.icon} title={options.t(route.title)} />
    ) : (
      options.t(route.title)
    );
    const icon = shouldShowIconInTitle ? null : route.icon ? <Icon type={route.icon} /> : null;

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
        (this.subModels.items || [])
          .map((item) =>
            item.toProLayoutMenuItem({
              ...options,
              depth: depth + 1,
            }),
          )
          .filter(Boolean) || [];

      // add a designer button
      if (options.designable && depth === 0) {
        children.push(getInitializerButton('schema-initializer-Menu-side', route));
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

/**
 * Layout 菜单树根模型。
 *
 * 当前阶段先把菜单路由同步为一棵独立的 FlowModel 树，
 * 让 Layout 的菜单状态不再依赖 `convertRoutesToLayout()` 这种一次性函数结果。
 *
 * @example
 * ```typescript
 * menuTree.syncRoutes(routes);
 * ```
 */
export class AdminLayoutMenuTreeModel extends FlowModel<AdminLayoutMenuTreeStructure> {
  /**
   * 使用最新的桌面端 route 列表重建菜单树。
   *
   * @param {NocoBaseDesktopRoute[]} routes 当前用户可访问的桌面菜单路由
   */
  syncRoutes(routes: NocoBaseDesktopRoute[]) {
    reconcileMenuItems(this, Array.isArray(routes) ? routes : []);
  }

  toProLayoutRoute(options: Omit<AdminLayoutMenuRouteOptions, 'depth'>) {
    const result =
      (this.subModels.items || [])
        .map((item) =>
          item.toProLayoutMenuItem({
            ...options,
            depth: 0,
          }),
        )
        .filter(Boolean) || [];

    if (options.designable) {
      options.isMobile
        ? result.push(getInitializerButton('schema-initializer-Menu-header'))
        : result.unshift(getInitializerButton('schema-initializer-Menu-header'));
    }

    return {
      path: '/',
      children: result,
    };
  }

  render() {
    return null;
  }
}
