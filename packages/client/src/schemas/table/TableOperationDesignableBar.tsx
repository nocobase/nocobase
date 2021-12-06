import React, { useState } from 'react';
import { Dropdown, Menu, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { uid, merge } from '@formily/shared';
import cls from 'classnames';
import { MenuOutlined } from '@ant-design/icons';
import { useDesignable, ISchema } from '..';
import { getSchemaPath } from '../../components/schema-renderer';
import { useClient } from '../../constate';
import SwitchMenuItem from '../../components/SwitchMenuItem';
import { DragHandle } from '../../components/Sortable';

export const TableOperationDesignableBar = () => {
  const { t } = useTranslation();
  const { schema: columnSchema } = useDesignable();
  const groupSchema = Object.values(columnSchema.properties || {}).shift();
  const groupPath = getSchemaPath(groupSchema);
  const { schema, remove, refresh, appendChild } = useDesignable(groupPath);
  const [visible, setVisible] = useState(false);
  const { createSchema, removeSchema, updateSchema } = useClient();

  const map = new Map();
  schema.mapProperties((s) => {
    if (!s['x-action-type']) {
      return;
    }
    map.set(s['x-action-type'], s.name);
  });
  const path = getSchemaPath(schema);
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space>
          <DragHandle />
          <Dropdown
            trigger={['hover']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.ItemGroup title={t('Enable actions')}>
                  {[
                    { title: t('View'), name: 'view' },
                    { title: t('Edit'), name: 'update' },
                    { title: t('Delete'), name: 'destroy' },
                  ].map((item) => (
                    <SwitchMenuItem
                      key={item.name}
                      title={item.title}
                      checked={map.has(item.name)}
                      onChange={async (checked) => {
                        if (checked) {
                          const s = generateMenuActionSchema(item.name);
                          const data = appendChild(s);
                          await createSchema(data);
                        } else if (map.get(item.name)) {
                          const removed = remove([...path, map.get(item.name)]);
                          await removeSchema(removed);
                        }
                      }}
                    />
                  ))}
                </Menu.ItemGroup>
                <Menu.Divider />
                <Menu.SubMenu disabled title={t('Customize')}>
                  <Menu.Item style={{ minWidth: 120 }}>{t('Function')}</Menu.Item>
                  <Menu.Item>{t('Popup form')}</Menu.Item>
                  <Menu.Item>{t('Flexible popup')}</Menu.Item>
                </Menu.SubMenu>
              </Menu>
            }
          >
            <MenuOutlined />
          </Dropdown>
        </Space>
      </span>
    </div>
  );
};
function generateMenuActionSchema(type) {
  const actions: { [key: string]: ISchema } = {
    view: {
      key: uid(),
      name: uid(),
      type: 'void',
      title: "{{ t('View') }}",
      'x-component': 'Action',
      'x-component-props': {
        type: 'link',
      },
      'x-designable-bar': 'Table.Action.DesignableBar',
      'x-action-type': 'view',
      properties: {
        [uid()]: {
          type: 'void',
          title: "{{ t('View record') }}",
          'x-component': 'Action.Drawer',
          'x-component-props': {
            bodyStyle: {
              background: '#f0f2f5',
              // paddingTop: 0,
            },
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Tabs',
              'x-designable-bar': 'Tabs.DesignableBar',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: "{{ t('Details') }}",
                  'x-designable-bar': 'Tabs.TabPane.DesignableBar',
                  'x-component': 'Tabs.TabPane',
                  'x-component-props': {},
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Grid',
                      'x-component-props': {
                        addNewComponent: 'AddNew.PaneItem',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    update: {
      key: uid(),
      name: uid(),
      type: 'void',
      title: "{{ t('Edit') }}",
      'x-component': 'Action',
      'x-component-props': {
        type: 'link',
      },
      'x-designable-bar': 'Table.Action.DesignableBar',
      'x-action-type': 'update',
      properties: {
        [uid()]: {
          type: 'void',
          title: "{{ t('Edit record') }}",
          'x-decorator': 'Form',
          'x-decorator-props': {
            useResource: '{{ Table.useResource }}',
            useValues: '{{ Table.useTableRowRecord }}',
          },
          'x-component': 'Action.Drawer',
          'x-component-props': {
            useOkAction: '{{ Table.useTableUpdateAction }}',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-component-props': {
                addNewComponent: 'AddNew.FormItem',
              },
            },
          },
        },
      },
    },
    destroy: {
      key: uid(),
      name: uid(),
      type: 'void',
      title: "{{ t('Delete') }}",
      'x-component': 'Action',
      'x-designable-bar': 'Table.Action.DesignableBar',
      'x-action-type': 'destroy',
      'x-component-props': {
        useAction: '{{ Table.useTableDestroyAction }}',
        type: 'link',
        confirm: {
          title: "{{ t('Delete record') }}",
          content: "{{ t('Are you sure you want to delete it?') }}",
        },
      },
    },
  };
  return actions[type];
}
