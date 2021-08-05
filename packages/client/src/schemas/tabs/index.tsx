import { observer, connect, useField, RecursionField } from '@formily/react';
import React from 'react';
import { Button, Tabs as AntdTabs, Dropdown, Menu, Switch } from 'antd';
import {
  findPropertyByPath,
  getSchemaPath,
  SchemaField,
  useDesignable,
} from '../../components/schema-renderer';
import { Schema, SchemaKey } from '@formily/react';
import { PlusOutlined, MenuOutlined } from '@ant-design/icons';
import { useState } from 'react';
import cls from 'classnames';
import { createSchema, removeSchema, updateSchema } from '..';
import './style.less';
import { uid } from '@formily/shared';
import { DragHandle, SortableItem } from '../../components/Sortable';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { FormDialog, FormLayout } from '@formily/antd';
import IconPicker from '../../components/icon-picker';

const useTabs = ({ singleton }) => {
  const tabsField = useField();
  const { schema } = useDesignable();
  const tabs: { name: SchemaKey; props: any; schema: Schema }[] = [];
  schema.mapProperties((schema, name) => {
    const field = tabsField.query(tabsField.address.concat(name)).take();
    if (field?.display === 'none' || field?.display === 'hidden') return;
    if (schema['x-component']?.indexOf('TabPane') > -1) {
      tabs.push({
        name,
        props: {
          key: schema?.['x-component-props']?.key || name,
          ...schema?.['x-component-props'],
        },
        schema,
      });
    }
  });
  if (singleton) {
    return [tabs.shift()].filter(Boolean);
  }
  return tabs;
};

export const Tabs: any = observer((props: any) => {
  const { singleton, ...others } = props;
  const {
    designable,
    schema,
    DesignableBar,
    appendChild,
    root,
    remove,
    insertAfter,
  } = useDesignable();
  const tabs = useTabs({ singleton });
  const [dragOverlayContent, setDragOverlayContent] = useState('');

  const moveToAfter = (path1, path2) => {
    if (!path1 || !path2) {
      return;
    }
    if (path1.join('.') === path2.join('.')) {
      return;
    }
    const data = findPropertyByPath(root, path1);
    if (!data) {
      return;
    }
    remove(path1);
    return insertAfter(data.toJSON(), path2);
  };

  if (singleton) {
    return (
      <div className={'nb-tabs'}>
        <DesignableBar />
        {tabs.map(({ props, schema, name }, key) => (
          <RecursionField schema={schema} name={name} onlyRenderProperties />
        ))}
      </div>
    );
  }

  return (
    <div className={'nb-tabs'}>
      <DesignableBar />
      <DndContext
        onDragStart={(event) => {
          setDragOverlayContent(event.active.data?.current?.title || '');
        }}
        onDragEnd={async (event) => {
          const path1 = event.active?.data?.current?.path;
          const path2 = event.over?.data?.current?.path;
          const data = moveToAfter(path1, path2);
          await updateSchema(data);
        }}
      >
        <DragOverlay style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {dragOverlayContent}
        </DragOverlay>
        <AntdTabs
          {...others}
          className={cls({ singleton })}
          tabBarExtraContent={
            designable && (
              <Button
                type={'dashed'}
                icon={<PlusOutlined />}
                onClick={async () => {
                  const values = await FormDialog('新增标签页', () => {
                    return (
                      <FormLayout layout={'vertical'}>
                        <SchemaField
                          schema={{
                            type: 'object',
                            properties: {
                              title: {
                                type: 'string',
                                title: '标签名称',
                                required: true,
                                'x-decorator': 'FormItem',
                                'x-component': 'Input',
                              },
                              icon: {
                                type: 'string',
                                title: '标签图标',
                                'x-decorator': 'FormItem',
                                'x-component': 'IconPicker',
                              },
                            },
                          }}
                        />
                      </FormLayout>
                    );
                  }).open({
                    initialValues: {
                      title: schema['title'],
                      icon: schema['x-component-props']?.['icon'],
                    },
                  });
                  const data = appendChild({
                    type: 'void',
                    name: uid(),
                    title: values.title,
                    'x-component': 'Tabs.TabPane',
                    'x-designable-bar': 'Tabs.TabPane.DesignableBar',
                    'x-component-props': {
                      icon: values.icon,
                    },
                    properties: {
                      [uid()]: {
                        type: 'void',
                        'x-component': 'Grid',
                        'x-component-props': {
                          addNewComponent: 'AddNew.PaneItem',
                        },
                      },
                    },
                  });
                  await createSchema(data);
                }}
              >
                新增标签页
              </Button>
            )
          }
        >
          {tabs.map(({ props, schema, name }, key) => (
            <AntdTabs.TabPane
              {...props}
              tab={
                <RecursionField schema={schema} name={name} onlyRenderSelf />
              }
              key={key}
            >
              <RecursionField
                schema={schema}
                name={name}
                onlyRenderProperties
              />
            </AntdTabs.TabPane>
          ))}
        </AntdTabs>
      </DndContext>
    </div>
  );
});

Tabs.TabPane = observer((props: any) => {
  const { schema, DesignableBar } = useDesignable();
  return (
    <SortableItem
      id={schema.name}
      data={{
        title: schema.title,
        path: getSchemaPath(schema),
      }}
    >
      <div className={'nb-tab-pane'}>
        <IconPicker type={props.icon} />
        {schema.title} <DesignableBar />
      </div>
    </SortableItem>
  );
});

Tabs.DesignableBar = () => {
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const field = useField();
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Dropdown
          trigger={['click']}
          visible={visible}
          placement={'bottomRight'}
          onVisibleChange={(visible) => {
            setVisible(visible);
          }}
          overlay={
            <Menu>
              <Menu.Item
                onClick={async () => {
                  const singleton = !field.componentProps.singleton;
                  schema['x-component-props'] =
                    schema['x-component-props'] || {};
                  schema['x-component-props'].singleton = singleton;
                  field.componentProps.singleton = singleton;
                  updateSchema(schema);
                }}
              >
                禁用标签页 <span style={{ marginRight: 24 }}></span>{' '}
                <Switch
                  size={'small'}
                  checked={!!field.componentProps.singleton}
                />
              </Menu.Item>
            </Menu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </span>
    </div>
  );
};

Tabs.TabPane.DesignableBar = () => {
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const field = useField();
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <DragHandle />{' '}
        <Dropdown
          trigger={['click']}
          visible={visible}
          onVisibleChange={(visible) => {
            setVisible(visible);
          }}
          overlay={
            <Menu>
              <Menu.Item
                onClick={async () => {
                  const values = await FormDialog('修改名称和图标', () => {
                    return (
                      <FormLayout layout={'vertical'}>
                        <SchemaField
                          schema={{
                            type: 'object',
                            properties: {
                              title: {
                                type: 'string',
                                title: '标签名称',
                                required: true,
                                'x-decorator': 'FormItem',
                                'x-component': 'Input',
                              },
                              icon: {
                                type: 'string',
                                title: '标签图标',
                                'x-decorator': 'FormItem',
                                'x-component': 'IconPicker',
                              },
                            },
                          }}
                        />
                      </FormLayout>
                    );
                  }).open({
                    initialValues: {
                      title: schema['title'],
                      icon: schema['x-component-props']?.['icon'],
                    },
                  });
                  field.componentProps.icon = values.icon;
                  schema.title = values.title;
                  schema['x-component-props'] =
                    schema['x-component-props'] || {};
                  schema['x-component-props']['icon'] = values.icon;
                  refresh();
                  updateSchema(schema);
                }}
              >
                修改名称和图标
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                onClick={async () => {
                  const data = remove();
                  await removeSchema(data);
                  setVisible(false);
                }}
              >
                移除
              </Menu.Item>
            </Menu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </span>
    </div>
  );
};
