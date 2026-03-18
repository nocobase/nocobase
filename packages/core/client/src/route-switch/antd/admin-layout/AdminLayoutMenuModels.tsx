/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TreeSelect, FormLayout } from '@formily/antd-v5';
import { DragHandler as FlowDragHandler, Droppable, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import type { FlowSettingsContext } from '@nocobase/flow-engine';
import { Badge, Tooltip } from 'antd';
import React, { FC, useCallback, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  findFirstPageRoute,
  NocoBaseDesktopRoute,
  NocoBaseDesktopRouteType,
  NocoBaseRouteContext,
} from '../../../admin-shell';
import {
  Icon,
  FormDialog,
  getPageMenuSchema,
  ParentRouteContext,
  SchemaComponent,
  SchemaComponentOptions,
  useParseURLAndParams,
  useRouterBasename,
  useSchemaInitializerRender,
  zIndexContext,
  ICON_POPUP_Z_INDEX,
} from '../../../';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import { navigateWithinSelf } from '../../../block-provider/hooks';
import { withTooltipComponent } from '../../../hoc/withTooltipComponent';
import { useEvaluatedExpression } from '../../../hooks/useParsedValue';
import { FlowSettingsVariableTextArea } from '../../../modules/actions/link/useURLAndHTMLSchema';
import { getFlowPageMenuSchema } from '../../../modules/menu';
import { menuItemInitializer } from '../../../modules/menu/menuItemInitializer';
import { VariableScope } from '../../../variables/VariableScope';
import { runAfterMobileMenuClosed } from './mobileMenuNavigation';
import { ResetThemeTokenAndKeepAlgorithm } from './menuItemSettings';
import { uid } from '@nocobase/utils/client';

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

type AdminLayoutMenuMovePositionOption = {
  label: any;
  value: 'beforeBegin' | 'afterEnd' | 'beforeEnd';
  disabled?: boolean;
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
const adminMenuTreeSelectComponents = { TreeSelect };

const insertPositionToMethod = {
  beforeBegin: 'insertBefore',
  afterEnd: 'insertAfter',
} as const;

/**
 * 根据当前选中的目标菜单，生成可用的 Move to 位置选项。
 *
 * @param target 目标节点的 `id||type` 组合值
 * @param currentRouteId 当前正在编辑的菜单 id
 * @param t 国际化函数
 * @returns 可渲染到 Radio.Group 的位置选项
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

const buildLinkSettingSchema = (t: (title: any) => any) => ({
  href: {
    title: t('URL'),
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'FlowSettingsVariableTextArea',
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

const toTreeSelectItems = (routes: NocoBaseDesktopRoute[], t: (title: any) => any) => {
  return (routes || [])
    .filter((route) => route.type !== NocoBaseDesktopRouteType.tabs)
    .map((route) => ({
      label: t(route.title),
      value: `${route.id}||${route.type}`,
      children: route.children?.length ? toTreeSelectItems(route.children, t) : undefined,
    }));
};

const findPrevSiblingRoute = (routes: NocoBaseDesktopRoute[], currentRoute: NocoBaseDesktopRoute | undefined) => {
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

const findNextSiblingRoute = (routes: NocoBaseDesktopRoute[], currentRoute: NocoBaseDesktopRoute | undefined) => {
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

const matchesRoutePath = (route: NocoBaseDesktopRoute | undefined, pathname: string): boolean => {
  if (!route) {
    return false;
  }

  const candidates = [
    route.id != null ? `/admin/${route.id}` : null,
    route.schemaUid ? `/admin/${route.schemaUid}` : null,
  ].filter(Boolean) as string[];

  if (candidates.some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`))) {
    return true;
  }

  return Array.isArray(route.children) ? route.children.some((child) => matchesRoutePath(child, pathname)) : false;
};

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
      }) as unknown as AdminLayoutMenuItemModel;
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

type AdminLayoutMenuDragMoveOptions = {
  sourceId: string | number;
  targetId?: string | number;
  targetScope?: {
    parentId: string | number;
  };
  sortField: 'sort';
  method?: 'insertAfter' | 'prepend';
};

/**
 * 根据拖拽的 active / over 菜单模型，计算 desktopRoutes:move 所需参数。
 *
 * 普通菜单拖到普通菜单上时，保持旧语义，按目标节点排序；
 * 普通菜单拖到分组上时，视为插入该分组内部；
 * 分组拖到分组上时，仍按顶层/同层分组排序，避免误变成嵌套分组。
 *
 * @param {FlowModel | undefined} activeModel 被拖拽的模型
 * @param {FlowModel | undefined} overModel 命中的目标模型
 * @returns {AdminLayoutMenuDragMoveOptions | undefined} 可直接传给 routeRepository.moveRoute 的参数
 */
export function resolveAdminLayoutMenuDragMoveOptions(
  activeModel?: FlowModel,
  overModel?: FlowModel,
): AdminLayoutMenuDragMoveOptions | undefined {
  if (!(activeModel instanceof AdminLayoutMenuItemModel) || !(overModel instanceof AdminLayoutMenuItemModel)) {
    return;
  }

  const activeRoute = activeModel.getRoute();
  const overRoute = overModel.getRoute();

  if (!activeRoute?.id || !overRoute?.id || activeRoute.id === overRoute.id) {
    return;
  }

  if (overRoute.type === NocoBaseDesktopRouteType.group && activeRoute.type !== NocoBaseDesktopRouteType.group) {
    return {
      sourceId: activeRoute.id,
      targetScope: {
        parentId: overRoute.id,
      },
      sortField: 'sort',
      method: 'prepend',
    };
  }

  return {
    sourceId: activeRoute.id,
    targetId: overRoute.id,
    sortField: 'sort',
  };
}

/**
 * 从拖拽事件中安全提取 active / over 模型，再交给菜单移动规则计算。
 *
 * @param flowEngine flow engine 实例
 * @param event 当前拖拽结束事件
 * @returns desktopRoutes:move 所需参数
 */
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
  const badgeCount = useEvaluatedExpression(item._route.options?.badge?.count);
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

  if (item._route?.type === NocoBaseDesktopRouteType.link) {
    return (
      <ParentRouteContext.Provider value={item._parentRoute}>
        <NocoBaseRouteContext.Provider value={item._route}>
          <div role="none" style={menuItemStyle}>
            <div onClick={handleClickLink}>
              {/* 这里是为了扩大点击区域 */}
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
  if (!(model instanceof AdminLayoutMenuItemModel)) {
    return null;
  }

  const route = model.getRoute();

  if (!route?.id) {
    return null;
  }

  return <FlowDragHandler model={model} />;
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

  return (
    <ResetThemeTokenAndKeepAlgorithm>
      <Droppable model={model}>
        <FlowModelRenderer
          model={model}
          showFlowSettings={{
            showBackground: false,
            showBorder: false,
            showDynamicFlowsEditor: false,
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

  getRoute() {
    return this.props.route as NocoBaseDesktopRoute;
  }

  getParentRoute() {
    return this.props.parentRoute as NocoBaseDesktopRoute | undefined;
  }

  getRouteRepository() {
    return this.context.routeRepository;
  }

  getSchemaComponentOptions() {
    const app = this.context.app;
    return {
      scope: app?.scopes || {},
      components: {
        ...(app?.components || {}),
        FlowSettingsVariableTextArea,
        ...adminMenuTreeSelectComponents,
      },
    };
  }

  async openMenuItemDialog(title: string, schema: Record<string, any>, initialValues: Record<string, any> = {}) {
    const options = this.getSchemaComponentOptions();

    return FormDialog(title, () => {
      return (
        <SchemaComponentOptions scope={options.scope} components={options.components}>
          <FormLayout layout="vertical">
            <zIndexContext.Provider value={ICON_POPUP_Z_INDEX}>
              <SchemaComponent schema={schema} />
            </zIndexContext.Provider>
          </FormLayout>
        </SchemaComponentOptions>
      );
    }).open({
      initialValues,
    });
  }

  async insertRouteSchema(schema: Record<string, any>) {
    await this.context.api.request({
      method: 'POST',
      url: '/uiSchemas:insert',
      data: schema,
    });
  }

  async createRouteForInsert(route: NocoBaseDesktopRoute, insertPosition: 'beforeBegin' | 'afterEnd' | 'beforeEnd') {
    const currentRoute = this.getRoute();
    const parentId = insertPosition === 'beforeEnd' ? currentRoute?.id : currentRoute?.parentId;
    const { data } = await this.getRouteRepository().createRoute(
      {
        ...route,
        parentId: parentId || undefined,
      },
      {
        refreshAfterMutation: false,
      },
    );

    if (insertPositionToMethod[insertPosition]) {
      try {
        await this.getRouteRepository().moveRoute({
          sourceId: data?.data?.id,
          targetId: currentRoute?.id,
          sortField: 'sort',
          method: insertPositionToMethod[insertPosition],
        });
      } catch (error) {
        await this.getRouteRepository().refreshAccessible();
        throw error;
      }
      return data?.data?.id;
    }

    await this.getRouteRepository().refreshAccessible();
    return data?.data?.id;
  }

  async openInsertMenuDialog(
    insertPosition: 'beforeBegin' | 'afterEnd' | 'beforeEnd',
    type: 'group' | 'page' | 'flowPage' | 'link',
  ) {
    const route = this.getRoute();
    if (!route || (insertPosition === 'beforeEnd' && route.type !== NocoBaseDesktopRouteType.group)) {
      return;
    }

    const t = this.context.t;
    const baseSchema: Record<string, any> = {
      type: 'object',
      title:
        type === 'group'
          ? t('Add group')
          : type === 'page'
            ? t('Add classic page')
            : type === 'flowPage'
              ? t('Add modern page')
              : t('Add link'),
      properties: {
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
      },
    };

    if (type === 'link') {
      Object.assign(baseSchema.properties, buildLinkSettingSchema(t));
    }

    const values = await this.openMenuItemDialog(baseSchema.title, baseSchema);
    if (!values) {
      return;
    }

    if (type === 'group') {
      await this.createRouteForInsert(
        {
          type: NocoBaseDesktopRouteType.group,
          title: values.title,
          icon: values.icon,
          schemaUid: uid(),
        },
        insertPosition,
      );
      return;
    }

    if (type === 'link') {
      await this.createRouteForInsert(
        {
          type: NocoBaseDesktopRouteType.link,
          title: values.title,
          icon: values.icon,
          schemaUid: uid(),
          options: {
            href: values.href,
            params: values.params,
            openInNewWindow: values.openInNewWindow,
          },
        },
        insertPosition,
      );
      return;
    }

    const pageSchemaUid = uid();
    const menuSchemaUid = uid();
    const tabSchemaUid = uid();
    const tabSchemaName = uid();

    await this.createRouteForInsert(
      {
        type: type === 'flowPage' ? NocoBaseDesktopRouteType.flowPage : NocoBaseDesktopRouteType.page,
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
      },
      insertPosition,
    );

    await this.insertRouteSchema(
      type === 'flowPage'
        ? getFlowPageMenuSchema({ pageSchemaUid })
        : getPageMenuSchema({ pageSchemaUid, tabSchemaUid, tabSchemaName }),
    );
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
    return undefined;
  }

  async destroy(): Promise<boolean> {
    const route = this.getRoute();
    if (!route?.id) {
      return false;
    }

    const allAccessRoutes = this.getRouteRepository().listAccessible();
    const pathname = this.context.location?.pathname || window.location.pathname;
    const shouldNavigate = matchesRoutePath(route, pathname);
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

AdminLayoutMenuItemModel.registerFlow({
  key: 'menuSettings',
  title: 'Menu settings',
  steps: {
    edit: {
      title: 'Edit',
      defaultParams: async (ctx: FlowSettingsContext<AdminLayoutMenuItemModel>) => {
        const route = ctx.model.getRoute();
        return {
          title: route?.title,
          icon: route?.icon,
          href: route?.options?.href,
          params: route?.options?.params,
          openInNewWindow: route?.options?.openInNewWindow !== false,
        };
      },
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
        const items = toTreeSelectItems(ctx.routeRepository.listAccessible(), ctx.t);
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
  },
});

const registerAdminLayoutMenuExtraMenuItems = (
  AdminLayoutMenuItemModel as typeof AdminLayoutMenuItemModel & {
    registerExtraMenuItems?: typeof FlowModel.registerExtraMenuItems;
  }
).registerExtraMenuItems;

registerAdminLayoutMenuExtraMenuItems?.call(AdminLayoutMenuItemModel, (model, t) => {
  const menuModel = model as AdminLayoutMenuItemModel;
  const route = menuModel.getRoute();
  const createInsertChildren = (insertPosition: 'beforeBegin' | 'afterEnd' | 'beforeEnd') => [
    {
      key: `menu-insert-${insertPosition}-group`,
      label: t('Group'),
      onClick: () => menuModel.openInsertMenuDialog(insertPosition, 'group'),
    },
    {
      key: `menu-insert-${insertPosition}-page`,
      label: t('Classic page (v1)'),
      onClick: () => menuModel.openInsertMenuDialog(insertPosition, 'page'),
    },
    {
      key: `menu-insert-${insertPosition}-flow-page`,
      label: t('Modern page (v2)'),
      onClick: () => menuModel.openInsertMenuDialog(insertPosition, 'flowPage'),
    },
    {
      key: `menu-insert-${insertPosition}-link`,
      label: t('Link'),
      onClick: () => menuModel.openInsertMenuDialog(insertPosition, 'link'),
    },
  ];

  return [
    {
      key: 'menu-insert-before',
      group: 'common-actions',
      sort: 600,
      label: t('Insert before'),
      children: createInsertChildren('beforeBegin'),
    },
    {
      key: 'menu-insert-after',
      group: 'common-actions',
      sort: 700,
      label: t('Insert after'),
      children: createInsertChildren('afterEnd'),
    },
    ...(route?.type === NocoBaseDesktopRouteType.group
      ? [
          {
            key: 'menu-insert-inner',
            group: 'common-actions',
            sort: 800,
            label: t('Insert inner'),
            children: createInsertChildren('beforeEnd'),
          },
        ]
      : []),
  ];
});

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
