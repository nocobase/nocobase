import { ExclamationCircleFilled } from "@ant-design/icons";
import { ISchema } from "@formily/react";
import { Modal } from 'antd';
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NocoBaseDesktopRouteType, useCurrentRoute, useNocoBaseRoutes, useURLAndHTMLSchema } from "../../..";
import { SchemaSettings } from "../../../application/schema-settings/SchemaSettings";
import { SchemaToolbar } from "../../../schema-settings/GeneralSchemaDesigner";
import { SchemaSettingsModalItem, SchemaSettingsSwitchItem } from "../../../schema-settings/SchemaSettings";

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
  ],
});

export const MenuSchemaToolbar = () => {
  return <SchemaToolbar settings={menuItemSettings} showBorder={false} />;
}
