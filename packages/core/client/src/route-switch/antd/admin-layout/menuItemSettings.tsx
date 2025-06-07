/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleFilled } from '@ant-design/icons';
import { TreeSelect } from '@formily/antd-v5';
import { Field, onFieldChange } from '@formily/core';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { App, ConfigProvider } from 'antd';
import { SiderContext } from 'antd/es/layout/Sider';
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  css,
  findRouteBySchemaUid,
  isVariable,
  NocoBaseDesktopRouteType,
  useAllAccessDesktopRoutes,
  useCompile,
  useCurrentPageUid,
  useCurrentRoute,
  useGlobalTheme,
  useNavigateNoUpdate,
  useNocoBaseRoutes,
  useURLAndHTMLSchema,
} from '../../..';
import { getPageMenuSchema } from '../../../';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useInsertPageSchema } from '../../../modules/menu/PageMenuItem';
import { SchemaToolbar } from '../../../schema-settings/GeneralSchemaDesigner';
import {
  SchemaSettingsItem,
  SchemaSettingsModalItem,
  SchemaSettingsSubMenu,
  SchemaSettingsSwitchItem,
} from '../../../schema-settings/SchemaSettings';
import { NocoBaseDesktopRoute } from './convertRoutesToSchema';

const components = { TreeSelect };

const toItems = (routes: NocoBaseDesktopRoute[], { t, compile }) => {
  const items = [];
  for (const route of routes) {
    // filter out the tabs
    if (route.type === NocoBaseDesktopRouteType.tabs) {
      continue;
    }

    const item = {
      label: isVariable(route.title) ? compile(route.title) : t(route.title),
      value: `${route.id}||${route.type}`,
    };
    if (route.children?.length > 0) {
      item['children'] = toItems(route.children, { t, compile });
    }
    items.push(item);
  }
  return items;
};

const insertPositionToMethod = {
  beforeBegin: 'insertBefore',
  afterEnd: 'insertAfter',
};

const findPrevSibling = (routes: NocoBaseDesktopRoute[], currentRoute: NocoBaseDesktopRoute | undefined) => {
  if (!currentRoute) {
    return;
  }

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    if (route.id === currentRoute.id) {
      return routes[i - 1];
    }

    if (route.children) {
      const prevSibling = findPrevSibling(route.children, currentRoute);
      if (prevSibling) {
        return prevSibling;
      }
    }
  }
};

const findNextSibling = (routes: NocoBaseDesktopRoute[], currentRoute: NocoBaseDesktopRoute | undefined) => {
  if (!currentRoute) {
    return;
  }

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    if (route.id === currentRoute.id) {
      return routes[i + 1];
    }

    if (route.children) {
      const nextSibling = findNextSibling(route.children, currentRoute);
      if (nextSibling) {
        return nextSibling;
      }
    }
  }
};

export const RemoveRoute: FC = () => {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const { deleteRoute } = useNocoBaseRoutes();
  const currentRoute = useCurrentRoute();
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const navigate = useNavigateNoUpdate();
  const currentPageUid = useCurrentPageUid();

  return (
    <SchemaSettingsItem
      title="Delete"
      eventKey="remove"
      onClick={() => {
        modal.confirm({
          title: t('Delete menu item'),
          content: t('Are you sure you want to delete it?'),
          onOk: async () => {
            // 删除对应菜单的路由
            currentRoute?.id != null && (await deleteRoute(currentRoute.id));

            if (
              currentPageUid !== currentRoute?.schemaUid &&
              !findRouteBySchemaUid(currentPageUid, currentRoute?.children)
            ) {
              return;
            }

            // 上一个兄弟节点
            const prevSibling = findPrevSibling(allAccessRoutes, currentRoute);
            // 下一个兄弟节点
            const nextSibling = findNextSibling(allAccessRoutes, currentRoute);

            if (prevSibling || nextSibling) {
              // 如果删除的是当前打开的页面或分组，需要跳转到上一个页面或分组
              navigate(`/admin/${prevSibling?.schemaUid || nextSibling?.schemaUid}`);
            } else {
              navigate(`/`);
            }
          },
        });
      }}
    >
      {t('Delete')}
    </SchemaSettingsItem>
  );
};

const InsertMenuItems = (props) => {
  const { eventKey, title, insertPosition } = props;
  const { t } = useTranslation();
  const { urlSchema, paramsSchema, openInNewWindowSchema } = useURLAndHTMLSchema();
  const currentRoute = useCurrentRoute();
  const isSubMenu = currentRoute?.type === NocoBaseDesktopRouteType.group;
  const { createRoute, moveRoute } = useNocoBaseRoutes();
  const insertPageSchema = useInsertPageSchema();

  if (!isSubMenu && insertPosition === 'beforeEnd') {
    return null;
  }

  return (
    <SchemaSettingsSubMenu eventKey={eventKey} title={title}>
      <SchemaSettingsModalItem
        eventKey={`${insertPosition}group`}
        title={t('Group')}
        schema={
          {
            type: 'object',
            title: t('Add group'),
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: t('Menu item title'),
                required: true,
                'x-component-props': {},
              },
              icon: {
                title: t('Icon'),
                'x-component': 'IconPicker',
                'x-decorator': 'FormItem',
              },
            },
          } as ISchema
        }
        onSubmit={async ({ title, icon }) => {
          const schemaUid = uid();
          const parentId = insertPosition === 'beforeEnd' ? currentRoute?.id : currentRoute?.parentId;

          // 1. 先创建一个路由
          const { data } = await createRoute({
            type: NocoBaseDesktopRouteType.group,
            title,
            icon,
            // 'beforeEnd' 表示的是 Insert inner，此时需要把路由插入到当前路由的内部
            parentId: parentId || undefined,
            schemaUid,
          });

          if (insertPositionToMethod[insertPosition]) {
            // 2. 然后再把路由移动到对应的位置
            await moveRoute({
              sourceId: data?.data?.id,
              targetId: currentRoute?.id as any,
              sortField: 'sort',
              method: insertPositionToMethod[insertPosition],
            });
          }
        }}
      />

      <SchemaSettingsModalItem
        eventKey={`${insertPosition}page`}
        title={t('Page')}
        schema={
          {
            type: 'object',
            title: t('Add page'),
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: t('Menu item title'),
                required: true,
                'x-component-props': {},
              },
              icon: {
                title: t('Icon'),
                'x-component': 'IconPicker',
                'x-decorator': 'FormItem',
              },
            },
          } as ISchema
        }
        onSubmit={async ({ title, icon }) => {
          const menuSchemaUid = uid();
          const pageSchemaUid = uid();
          const tabSchemaUid = uid();
          const tabSchemaName = uid();
          const parentId = insertPosition === 'beforeEnd' ? currentRoute?.id : currentRoute?.parentId;

          // 1. 先创建一个路由
          const { data } = await createRoute({
            type: NocoBaseDesktopRouteType.page,
            title,
            icon,
            // 'beforeEnd' 表示的是 Insert inner，此时需要把路由插入到当前路由的内部
            parentId: parentId || undefined,
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

          if (insertPositionToMethod[insertPosition]) {
            // 2. 然后再把路由移动到对应的位置
            await moveRoute({
              sourceId: data?.data?.id,
              targetId: currentRoute?.id,
              sortField: 'sort',
              method: insertPositionToMethod[insertPosition],
            });
          }

          // 3. 插入一个对应的 Schema
          insertPageSchema(getPageMenuSchema({ pageSchemaUid, tabSchemaUid, tabSchemaName }));
        }}
      />
      <SchemaSettingsModalItem
        eventKey={`${insertPosition}link`}
        title={t('Link')}
        schema={
          {
            type: 'object',
            title: t('Add link'),
            properties: {
              title: {
                title: t('Menu item title'),
                required: true,
                'x-component': 'Input',
                'x-decorator': 'FormItem',
              },
              icon: {
                title: t('Icon'),
                'x-component': 'IconPicker',
                'x-decorator': 'FormItem',
              },
              href: urlSchema,
              params: paramsSchema,
              openInNewWindow: openInNewWindowSchema,
            },
          } as ISchema
        }
        onSubmit={async ({ title, icon, href, params, openInNewWindow }) => {
          const schemaUid = uid();
          const parentId = insertPosition === 'beforeEnd' ? currentRoute?.id : currentRoute?.parentId;

          // 1. 先创建一个路由
          const { data } = await createRoute({
            type: NocoBaseDesktopRouteType.link,
            title,
            icon,
            // 'beforeEnd' 表示的是 Insert inner，此时需要把路由插入到当前路由的内部
            parentId: parentId || undefined,
            schemaUid,
            options: {
              href,
              params,
              openInNewWindow,
            },
          });

          if (insertPositionToMethod[insertPosition]) {
            // 2. 然后再把路由移动到对应的位置
            await moveRoute({
              sourceId: data?.data?.id,
              targetId: currentRoute?.id,
              sortField: 'sort',
              method: insertPositionToMethod[insertPosition],
            });
          }
        }}
      />
    </SchemaSettingsSubMenu>
  );
};

const EditMenuItem = () => {
  const { t } = useTranslation();
  const schema = useMemo(() => {
    return {
      type: 'object',
      title: t('Edit menu item'),
      properties: {
        title: {
          title: t('Menu item title'),
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {},
        },
        icon: {
          title: t('Menu item icon'),
          'x-component': 'IconPicker',
          'x-decorator': 'FormItem',
        },
      },
    };
  }, [t]);
  const currentRoute = useCurrentRoute();
  const { urlSchema, paramsSchema, openInNewWindowSchema } = useURLAndHTMLSchema();
  const initialValues = useMemo(() => {
    return {
      title: currentRoute.title,
      icon: currentRoute.icon,
    };
  }, [currentRoute.title, currentRoute.icon]);
  if (currentRoute.type === NocoBaseDesktopRouteType.link) {
    schema.properties['href'] = urlSchema;
    schema.properties['params'] = paramsSchema;
    schema.properties['openInNewWindow'] = openInNewWindowSchema;
    initialValues['href'] = currentRoute.options.href;
    initialValues['params'] = currentRoute.options.params;
    initialValues['openInNewWindow'] = currentRoute.options.openInNewWindow !== false;
  }

  const { updateRoute } = useNocoBaseRoutes();
  const onEditSubmit: (values: any) => void = useCallback(({ title, icon, href, params, openInNewWindow }) => {
    // 更新菜单对应的路由
    if (currentRoute.id !== undefined) {
      updateRoute(currentRoute.id, {
        title,
        icon,
        options:
          href || params
            ? {
                href,
                params,
                openInNewWindow,
              }
            : undefined,
      });
    }
  }, []);

  return (
    <SchemaSettingsModalItem
      title={t('Edit')}
      eventKey="edit"
      schema={schema as ISchema}
      initialValues={initialValues}
      onSubmit={onEditSubmit}
    />
  );
};

const HiddenMenuItem = () => {
  const { t } = useTranslation();
  const currentRoute = useCurrentRoute();
  const { updateRoute } = useNocoBaseRoutes();
  const { modal } = App.useApp();

  return (
    <SchemaSettingsSwitchItem
      title={t('Hidden')}
      checked={currentRoute.hideInMenu}
      onChange={(value) => {
        modal.confirm({
          title: t('Are you sure you want to hide this menu?'),
          icon: <ExclamationCircleFilled />,
          content: t(
            'After hiding, this menu will no longer appear in the menu bar. To show it again, you need to go to the route management page to configure it.',
          ),
          async onOk() {
            if (currentRoute.id !== undefined) {
              await updateRoute(currentRoute.id, {
                hideInMenu: !!value,
              });
            }
          },
        });
      }}
    />
  );
};

const MoveToMenuItem = () => {
  const { t } = useTranslation();
  const currentRoute = useCurrentRoute();
  const effects = useCallback(
    (form) => {
      onFieldChange('target', (field: Field) => {
        const [id, type] = field?.value?.split?.('||') || [];
        field.query('position').take((f: Field) => {
          f.dataSource =
            type === NocoBaseDesktopRouteType.group
              ? [
                  { label: t('Before'), value: 'beforeBegin' },
                  { label: t('After'), value: 'afterEnd' },
                  { label: t('Inner'), value: 'beforeEnd', disabled: currentRoute?.id == id },
                ]
              : [
                  { label: t('Before'), value: 'beforeBegin' },
                  { label: t('After'), value: 'afterEnd' },
                ];
        });
      });
    },
    [t],
  );
  const compile = useCompile();
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const items = useMemo(() => {
    const result = toItems(allAccessRoutes, { t, compile });
    // The last two empty options are placeholders to prevent the last option from being hidden (a bug in TreeSelect)
    return [...result, { label: '', value: '', disabled: true }, { label: '', value: '', disabled: true }];
  }, []);
  const modalSchema = useMemo(() => {
    return {
      type: 'object',
      title: t('Move to'),
      properties: {
        target: {
          title: t('Target'),
          enum: items,
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'TreeSelect',
          'x-component-props': {},
        },
        position: {
          title: t('Position'),
          required: true,
          enum: [
            { label: t('Before'), value: 'beforeBegin' },
            { label: t('After'), value: 'afterEnd' },
          ],
          default: 'afterEnd',
          'x-component': 'Radio.Group',
          'x-decorator': 'FormItem',
        },
      },
    } as ISchema;
  }, [items, t]);

  const { moveRoute } = useNocoBaseRoutes();
  const onMoveToSubmit: (values: any) => void = useCallback(
    async ({ target, position }) => {
      const [targetId] = target?.split?.('||') || [];
      if (!targetId) {
        return;
      }

      if (targetId === undefined || !currentRoute) {
        return;
      }

      const positionToMethod = {
        beforeBegin: 'insertBefore',
        afterEnd: 'insertAfter',
      };

      // 'beforeEnd' 表示的是插入到一个分组的里面
      const options =
        position === 'beforeEnd'
          ? {
              targetScope: {
                parentId: targetId,
              },
            }
          : {
              targetId: targetId,
            };

      await moveRoute({
        sourceId: currentRoute.id as any,
        sortField: 'sort',
        method: positionToMethod[position],
        ...options,
      });
    },
    [currentRoute, moveRoute],
  );

  return (
    <SchemaSettingsModalItem
      title={t('Move to')}
      eventKey="move-to"
      components={components}
      effects={effects}
      schema={modalSchema}
      onSubmit={onMoveToSubmit}
    />
  );
};

const EditTooltip = () => {
  const { t } = useTranslation();
  const currentRoute = useCurrentRoute();
  const { updateRoute } = useNocoBaseRoutes();

  const editTooltipSchema = useMemo(() => {
    return {
      type: 'object',
      title: t('Edit tooltip'),
      properties: {
        tooltip: {
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
          'x-component-props': {},
        },
      },
    };
  }, [t]);
  const initialTooltipValues = useMemo(() => {
    return {
      tooltip: currentRoute.tooltip,
    };
  }, [currentRoute.tooltip]);

  const onEditTooltipSubmit: (values: any) => void = useCallback(
    ({ tooltip }) => {
      // 更新菜单对应的路由
      if (currentRoute.id !== undefined) {
        updateRoute(currentRoute.id, {
          tooltip,
        });
      }
    },
    [currentRoute.id, updateRoute],
  );

  return (
    <SchemaSettingsModalItem
      title={t('Edit tooltip')}
      eventKey="edit-tooltip"
      schema={editTooltipSchema as ISchema}
      initialValues={initialTooltipValues}
      onSubmit={onEditTooltipSubmit}
    />
  );
};

export const menuItemSettings = new SchemaSettings({
  name: 'menuSettings:menuItem',
  items: [
    {
      name: 'edit',
      Component: EditMenuItem,
    },
    {
      name: 'editTooltip',
      Component: EditTooltip,
    },
    {
      name: 'hidden',
      Component: HiddenMenuItem,
    },
    {
      name: 'moveTo',
      Component: MoveToMenuItem,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'insertbeforeBegin',
      Component: () => {
        const { t } = useTranslation();
        return (
          <InsertMenuItems eventKey={'insertbeforeBegin'} title={t('Insert before')} insertPosition={'beforeBegin'} />
        );
      },
    },
    {
      name: 'insertafterEnd',
      Component: () => {
        const { t } = useTranslation();
        return <InsertMenuItems eventKey={'insertafterEnd'} title={t('Insert after')} insertPosition={'afterEnd'} />;
      },
    },
    {
      name: 'insertbeforeEnd',
      Component: () => {
        const { t } = useTranslation();
        return <InsertMenuItems eventKey={'insertbeforeEnd'} title={t('Insert inner')} insertPosition={'beforeEnd'} />;
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      sort: 100,
      Component: RemoveRoute,
    },
  ],
});

const iconStyle = css`
  .anticon {
    line-height: 16px !important;
  }
`;

const siderContextValue = { siderCollapsed: false };
export const MenuSchemaToolbar: FC<{ container?: HTMLElement }> = (props) => {
  return (
    <ResetThemeTokenAndKeepAlgorithm>
      {/* 避免 Sider 的状态影响到 SchemaToolbar。否则会导致在折叠状态下，SchemaToolbar 的样式异常 */}
      <SiderContext.Provider value={siderContextValue}>
        <SchemaToolbar
          spaceClassName={iconStyle}
          settings={menuItemSettings}
          showBorder={false}
          container={props.container}
        />
      </SiderContext.Provider>
    </ResetThemeTokenAndKeepAlgorithm>
  );
};

/**
 * 重置主题，避免被 ProLayout 的主题影响
 * @param props
 * @returns
 */
export const ResetThemeTokenAndKeepAlgorithm: FC = (props) => {
  const { theme } = useGlobalTheme();

  return (
    <ConfigProvider
      theme={{
        ...theme,
        inherit: false,
      }}
    >
      {props.children}
    </ConfigProvider>
  );
};
