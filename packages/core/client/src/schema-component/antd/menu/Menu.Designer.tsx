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
import { ISchema, Schema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Modal } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { findByUid } from '.';
import { createDesignable, useCompile, useNocoBaseRoutes } from '../..';
import {
  GeneralSchemaDesigner,
  getPageMenuSchema,
  isVariable,
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsSubMenu,
  SchemaSettingsSwitchItem,
  useAPIClient,
  useDesignable,
  useURLAndHTMLSchema,
} from '../../../';
import { useInsertPageSchema } from '../../../modules/menu/PageMenuItem';
import { NocoBaseDesktopRouteType } from '../../../route-switch/antd/admin-layout/convertRoutesToSchema';

const insertPositionToMethod = {
  beforeBegin: 'insertBefore',
  afterEnd: 'insertAfter',
};

const toItems = (properties = {}, { t, compile }) => {
  const items = [];
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const element = properties[key];
      const item = {
        label: isVariable(element.title) ? compile(element.title) : t(element.title),
        value: `${element['x-uid']}||${element['x-component']}`,
      };
      if (element.properties) {
        const children = toItems(element.properties, { t, compile });
        if (children?.length) {
          item['children'] = children;
        }
      }
      items.push(item);
    }
  }
  return items;
};

const findMenuSchema = (fieldSchema: Schema) => {
  let parent = fieldSchema.parent;
  while (parent) {
    if (parent['x-component'] === 'Menu') {
      return parent;
    }
    parent = parent.parent;
  }
};

const InsertMenuItems = (props) => {
  const { eventKey, title, insertPosition } = props;
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { urlSchema, paramsSchema } = useURLAndHTMLSchema();
  const isSubMenu = fieldSchema['x-component'] === 'Menu.SubMenu';
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
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
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
          const route = fieldSchema['__route__'];
          const parentRoute = fieldSchema.parent?.['__route__'];
          const schemaUid = uid();

          // 1. 先创建一个路由
          const { data } = await createRoute({
            type: NocoBaseDesktopRouteType.group,
            title,
            icon,
            // 'beforeEnd' 表示的是 Insert inner，此时需要把路由插入到当前路由的内部
            parentId: insertPosition === 'beforeEnd' ? route?.id : parentRoute?.id,
            schemaUid,
          });

          if (insertPositionToMethod[insertPosition]) {
            // 2. 然后再把路由移动到对应的位置
            await moveRoute({
              sourceId: data?.data?.id,
              targetId: route?.id,
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
          const route = fieldSchema['__route__'];
          const parentRoute = fieldSchema.parent?.['__route__'];
          const menuSchemaUid = uid();
          const pageSchemaUid = uid();
          const tabSchemaUid = uid();
          const tabSchemaName = uid();

          // 1. 先创建一个路由
          const { data } = await createRoute({
            type: NocoBaseDesktopRouteType.page,
            title,
            icon,
            // 'beforeEnd' 表示的是 Insert inner，此时需要把路由插入到当前路由的内部
            parentId: insertPosition === 'beforeEnd' ? route?.id : parentRoute?.id,
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

          // 2. 然后再把路由移动到对应的位置
          if (insertPositionToMethod[insertPosition]) {
            await moveRoute({
              sourceId: data?.data?.id,
              targetId: route?.id,
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
            },
          } as ISchema
        }
        onSubmit={async ({ title, icon, href, params }) => {
          const route = fieldSchema['__route__'];
          const parentRoute = fieldSchema.parent?.['__route__'];
          const schemaUid = uid();

          // 1. 先创建一个路由
          const { data } = await createRoute(
            {
              type: NocoBaseDesktopRouteType.link,
              title,
              icon,
              // 'beforeEnd' 表示的是 Insert inner，此时需要把路由插入到当前路由的内部
              parentId: insertPosition === 'beforeEnd' ? route?.id : parentRoute?.id,
              schemaUid,
              options: {
                href,
                params,
              },
            },
            false,
          );

          // 2. 然后再把路由移动到对应的位置
          if (insertPositionToMethod[insertPosition]) {
            await moveRoute({
              sourceId: data?.data?.id,
              targetId: route?.id,
              sortField: 'sort',
              method: insertPositionToMethod[insertPosition],
            });
          }
        }}
      />
    </SchemaSettingsSubMenu>
  );
};

const components = { TreeSelect };

export const MenuDesigner = () => {
  const { updateRoute, deleteRoute } = useNocoBaseRoutes();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { dn, refresh } = useDesignable();
  const { t } = useTranslation();
  const menuSchema = findMenuSchema(fieldSchema);
  const compile = useCompile();
  const { urlSchema, paramsSchema } = useURLAndHTMLSchema();
  const onSelect = useMemo(
    () => compile(menuSchema?.['x-component-props']?.['onSelect']),
    [menuSchema?.['x-component-props']?.['onSelect']],
  );
  const items = useMemo(() => toItems(menuSchema?.properties, { t, compile }), [menuSchema?.properties, t, compile]);
  const effects = useCallback(
    (form) => {
      onFieldChange('target', (field: Field) => {
        const [, component] = field?.value?.split?.('||') || [];
        field.query('position').take((f: Field) => {
          f.dataSource =
            component === 'Menu.SubMenu'
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
  const initialValues = useMemo(() => {
    return {
      title: field.title,
      icon: field.componentProps.icon,
    };
  }, [field.title, field.componentProps.icon]);
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
      tooltip: field.componentProps.tooltip,
    };
  }, [field.componentProps.tooltip]);
  if (fieldSchema['x-component'] === 'Menu.URL') {
    schema.properties['href'] = urlSchema;
    schema.properties['params'] = paramsSchema;
    initialValues['href'] = field.componentProps.href;
    initialValues['params'] = field.componentProps.params;
  }
  const onEditSubmit: (values: any) => void = useCallback(
    ({ title, icon, href, params }) => {
      const schema = {
        ['x-uid']: fieldSchema['x-uid'],
        'x-server-hooks': [
          {
            type: 'onSelfSave',
            method: 'extractTextToLocale',
          },
        ],
      };
      if (title) {
        fieldSchema.title = title;
        field.title = title;
        schema['title'] = title;
        refresh();
      }
      field.componentProps.icon = icon;
      field.componentProps.href = href;
      field.componentProps.params = params;
      schema['x-component-props'] = { icon, href, params };
      fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
      fieldSchema['x-component-props']['icon'] = icon;
      fieldSchema['x-component-props']['href'] = href;
      fieldSchema['x-component-props']['params'] = params;
      onSelect?.({ item: { props: { schema: fieldSchema } } });
      dn.emit('patch', {
        schema,
      });

      // 更新菜单对应的路由
      if (fieldSchema['__route__']?.id) {
        updateRoute(fieldSchema['__route__'].id, {
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
    [fieldSchema, field, dn, refresh, onSelect],
  );
  const onEditTooltipSubmit: (values: any) => void = useCallback(
    ({ tooltip }) => {
      // 更新菜单对应的路由
      if (fieldSchema['__route__']?.id) {
        updateRoute(fieldSchema['__route__'].id, {
          tooltip,
        });
      }
    },
    [fieldSchema, field, dn, refresh, onSelect],
  );

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
      const [uid] = target?.split?.('||') || [];
      if (!uid) {
        return;
      }
      const current = findByUid(menuSchema, uid);
      const dn = createDesignable({
        t,
        api,
        refresh,
        current,
      });

      const positionToMethod = {
        beforeBegin: 'insertBefore',
        afterEnd: 'insertAfter',
      };

      // 'beforeEnd' 表示的是插入到一个分组的里面
      const options =
        position === 'beforeEnd'
          ? {
              targetScope: {
                parentId: current.__route__.id,
              },
            }
          : {
              targetId: current.__route__.id,
            };

      await moveRoute({
        sourceId: (fieldSchema as any).__route__.id,
        sortField: 'sort',
        method: positionToMethod[position],
        ...options,
      });

      dn.loadAPIClientEvents();
      dn.insertAdjacent(position, fieldSchema);
    },
    [menuSchema, t, api, refresh, moveRoute, fieldSchema],
  );

  const removeConfirmTitle = useMemo(() => {
    return {
      title: t('Delete menu item'),
      onOk: () => {
        // 删除对应菜单的路由
        fieldSchema['__route__']?.id && deleteRoute(fieldSchema['__route__'].id);
      },
    };
  }, [fieldSchema, deleteRoute, t]);
  return (
    <GeneralSchemaDesigner>
      <SchemaSettingsModalItem
        title={t('Edit')}
        eventKey="edit"
        schema={schema as ISchema}
        initialValues={initialValues}
        onSubmit={onEditSubmit}
      />
      <SchemaSettingsModalItem
        title={t('Edit tooltip')}
        eventKey="edit-tooltip"
        schema={editTooltipSchema as ISchema}
        initialValues={initialTooltipValues}
        onSubmit={onEditTooltipSubmit}
      />
      <SchemaSettingsSwitchItem
        title={t('Hidden')}
        checked={fieldSchema['x-component-props']?.hidden}
        onChange={(v) => {
          Modal.confirm({
            title: t('Are you sure you want to hide this menu?'),
            icon: <ExclamationCircleFilled />,
            content: t(
              'After hiding, this menu will no longer appear in the menu bar. To show it again, you need to go to the route management page to configure it.',
            ),
            async onOk() {
              fieldSchema['x-component-props'].hidden = !!v;
              field.componentProps.hidden = !!v;

              // 更新菜单对应的路由
              if (fieldSchema['__route__']?.id) {
                await updateRoute(fieldSchema['__route__'].id, {
                  hideInMenu: !!v,
                });
              }

              dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  'x-component-props': fieldSchema['x-component-props'],
                },
              });
            },
          });
        }}
      />
      <SchemaSettingsModalItem
        title={t('Move to')}
        eventKey="move-to"
        components={components}
        effects={effects}
        schema={modalSchema}
        onSubmit={onMoveToSubmit}
      />
      <SchemaSettingsDivider />
      <InsertMenuItems eventKey={'insertbeforeBegin'} title={t('Insert before')} insertPosition={'beforeBegin'} />
      <InsertMenuItems eventKey={'insertafterEnd'} title={t('Insert after')} insertPosition={'afterEnd'} />
      <InsertMenuItems eventKey={'insertbeforeEnd'} title={t('Insert inner')} insertPosition={'beforeEnd'} />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove confirm={removeConfirmTitle} />
    </GeneralSchemaDesigner>
  );
};
