import { ExclamationCircleFilled } from "@ant-design/icons";
import { TreeSelect } from '@formily/antd-v5';
import { Field, onFieldChange } from '@formily/core';
import { ISchema } from "@formily/react";
import { Modal } from 'antd';
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { isVariable, NocoBaseDesktopRouteType, useAllAccessDesktopRoutes, useCompile, useCurrentRoute, useNocoBaseRoutes, useURLAndHTMLSchema } from "../../..";
import { SchemaSettings } from "../../../application/schema-settings/SchemaSettings";
import { SchemaToolbar } from "../../../schema-settings/GeneralSchemaDesigner";
import { SchemaSettingsModalItem, SchemaSettingsSwitchItem } from "../../../schema-settings/SchemaSettings";
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
  ],
});

export const MenuSchemaToolbar = () => {
  return <SchemaToolbar settings={menuItemSettings} showBorder={false} />;
}
