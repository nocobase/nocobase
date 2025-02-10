import { ExclamationCircleFilled } from "@ant-design/icons";
import { TreeSelect } from '@formily/antd-v5';
import { Field, onFieldChange } from '@formily/core';
import { ISchema } from "@formily/react";
import { uid } from "@formily/shared";
import { App, Modal } from 'antd';
import React, { FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { isVariable, NocoBaseDesktopRouteType, useAllAccessDesktopRoutes, useCompile, useCurrentRoute, useDesignable, useNocoBaseRoutes, useURLAndHTMLSchema } from "../../..";
import {
  getPageMenuSchema
} from '../../../';
import { SchemaSettings } from "../../../application/schema-settings/SchemaSettings";
import { SchemaToolbar } from "../../../schema-settings/GeneralSchemaDesigner";
import { SchemaSettingsItem, SchemaSettingsModalItem, SchemaSettingsSubMenu, SchemaSettingsSwitchItem } from "../../../schema-settings/SchemaSettings";
import { NocoBaseDesktopRoute } from "./convertRoutesToSchema";

const components = { TreeSelect };

const toItems = (routes: NocoBaseDesktopRoute[], { t, compile }) => {
  const items = [];
  for (const route of routes) {
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
  beforeBegin: 'prepend',
  afterEnd: 'insertAfter',
};

export const RemoveRoute: FC = () => {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const { deleteRoute } = useNocoBaseRoutes();
  const currentRoute = useCurrentRoute();

  return (
    <SchemaSettingsItem
      title="Delete"
      eventKey="remove"
      onClick={() => {
        modal.confirm({
          title: t('Delete menu item'),
          content: t('Are you sure you want to delete it?'),
          onOk: () => {
            // 删除对应菜单的路由
            currentRoute?.id != null && deleteRoute(currentRoute.id);
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
  const { dn } = useDesignable();
  const { urlSchema, paramsSchema } = useURLAndHTMLSchema();
  const currentRoute = useCurrentRoute();
  const isSubMenu = currentRoute?.type === NocoBaseDesktopRouteType.group;
  const { createRoute, moveRoute } = useNocoBaseRoutes();

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

          // 3. 插入一个对应的 Schema
          // TODO: group 不需要插入 Schema
          dn.insertAdjacent(insertPosition, {
            type: 'void',
            title,
            'x-component': 'Menu.SubMenu',
            'x-decorator': 'ACLMenuItemProvider',
            'x-component-props': {
              icon,
            },
            'x-uid': schemaUid,
          });
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
          dn.insertAdjacent(
            insertPosition,
            getPageMenuSchema({
              title,
              icon,
              pageSchemaUid,
              menuSchemaUid,
              tabSchemaUid,
              tabSchemaName,
            }),
          );
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
            },
          } as ISchema
        }
        onSubmit={async ({ title, icon, href, params }) => {
          const schemaUid = uid();
          const parentId = insertPosition === 'beforeEnd' ? currentRoute?.id : currentRoute?.parentId;

          // 1. 先创建一个路由
          const { data } = await createRoute(
            {
              type: NocoBaseDesktopRouteType.link,
              title,
              icon,
              // 'beforeEnd' 表示的是 Insert inner，此时需要把路由插入到当前路由的内部
              parentId: parentId || undefined,
              schemaUid,
              options: {
                href,
                params,
              },
            },
            false,
          );

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
          // TODO: link 不需要插入 Schema
          dn.insertAdjacent(insertPosition, {
            type: 'void',
            title,
            'x-component': 'Menu.URL',
            'x-decorator': 'ACLMenuItemProvider',
            'x-component-props': {
              icon,
              href,
              params,
            },
            'x-uid': schemaUid,
          });
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
  const { urlSchema, paramsSchema } = useURLAndHTMLSchema();
  const initialValues = useMemo(() => {
    return {
      title: currentRoute.title,
      icon: currentRoute.icon,
    };
  }, [currentRoute.title, currentRoute.icon]);
  if (currentRoute.type === NocoBaseDesktopRouteType.link) {
    schema.properties['href'] = urlSchema;
    schema.properties['params'] = paramsSchema;
    initialValues['href'] = currentRoute.options.href;
    initialValues['params'] = currentRoute.options.params;
  }

  const { updateRoute } = useNocoBaseRoutes();
  const onEditSubmit: (values: any) => void = useCallback(
    ({ title, icon, href, params }) => {
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
              }
              : undefined,
        });
      }
    },
    [],
  );

  return <SchemaSettingsModalItem
    title={t('Edit')}
    eventKey="edit"
    schema={schema as ISchema}
    initialValues={initialValues}
    onSubmit={onEditSubmit}
  />
}

const HiddenMenuItem = () => {
  const { t } = useTranslation();
  const currentRoute = useCurrentRoute();
  const { updateRoute } = useNocoBaseRoutes();

  return <SchemaSettingsSwitchItem
    title={t('Hidden')}
    checked={currentRoute.hideInMenu}
    onChange={(value) => {
      Modal.confirm({
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
}

const MoveToMenuItem = () => {
  const { t } = useTranslation();
  const effects = useCallback(
    (form) => {
      onFieldChange('target', (field: Field) => {
        const [, type] = field?.value?.split?.('||') || [];
        field.query('position').take((f: Field) => {
          f.dataSource =
            type === NocoBaseDesktopRouteType.group
              ? [
                { label: t('Before'), value: 'beforeBegin' },
                { label: t('After'), value: 'afterEnd' },
                { label: t('Inner'), value: 'beforeEnd' },
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
  const items = useMemo(() => toItems(allAccessRoutes, { t, compile }), []);
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
  const currentRoute = useCurrentRoute();
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
        beforeBegin: 'prepend',
        afterEnd: 'insertAfter',
      };

      await moveRoute({
        sourceId: currentRoute.id as any,
        targetId: targetId,
        sortField: 'sort',
        method: positionToMethod[position],
      });
    },
    [],
  );

  return <SchemaSettingsModalItem
    title={t('Move to')}
    eventKey="move-to"
    components={components}
    effects={effects}
    schema={modalSchema}
    onSubmit={onMoveToSubmit}
  />
}

export const menuItemSettings = new SchemaSettings({
  name: 'menuSettings:menuItem',
  items: [
    {
      name: 'edit',
      Component: EditMenuItem,
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
        return <InsertMenuItems eventKey={'insertbeforeBegin'} title={t('Insert before')} insertPosition={'beforeBegin'} />;
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

export const MenuSchemaToolbar: FC<{ container?: HTMLElement }> = (props) => {
  return <SchemaToolbar settings={menuItemSettings} showBorder={false} container={props.container} />;
}
