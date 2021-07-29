import React, {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {
  connect,
  observer,
  mapProps,
  mapReadPretty,
  useField,
  useFieldSchema,
  RecursionField,
  Schema,
  SchemaOptionsContext,
  FormProvider,
  useForm,
} from '@formily/react';
import {
  Menu as AntdMenu,
  MenuProps,
  MenuItemProps,
  SubMenuProps,
  DividerProps,
  Dropdown,
  Modal,
  Button,
} from 'antd';
import { uid } from '@formily/shared';
import cls from 'classnames';
import {
  SchemaField,
  SchemaRenderer,
  useDesignable,
} from '../../components/schema-renderer';
import {
  MenuOutlined,
  PlusOutlined,
  GroupOutlined,
  LinkOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowRightOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { IconPicker } from '../../components/icon-picker';
import { createSchema, removeSchema, updateSchema, useDefaultAction } from '..';
import { useMount } from 'ahooks';
import './style.less';
import { findPropertyByPath, getSchemaPath, useSchemaPath } from '../../';
import { generateDefaultSchema } from './defaultSchemas';
import _, { cloneDeep, get, isNull } from 'lodash';
import { FormDialog, FormItem, FormLayout, Input } from '@formily/antd';
import deepmerge from 'deepmerge';
import { onFieldChange } from '@formily/core';
import { VisibleContext } from '../../context';

export const MenuModeContext = createContext(null);

const SideMenu = (props: any) => {
  const { selectedKey, defaultSelectedKeys, onSelect, path } = props;
  const { schema } = useDesignable();
  if (!selectedKey) {
    return null;
  }
  const child = schema.properties && schema.properties[selectedKey];
  if (!child || child['x-component'] !== 'Menu.SubMenu') {
    return null;
  }

  return (
    <MenuModeContext.Provider value={'inline'}>
      <AntdMenu mode={'inline'} onSelect={onSelect}>
        <RecursionField schema={child} onlyRenderProperties />
        <Menu.AddNew key={uid()} path={[...path, selectedKey]}>
          <Button
            block
            type={'dashed'}
            className={`nb-add-new-menu-item menu-mode-inline`}
          >
            <PlusOutlined />
          </Button>
        </Menu.AddNew>
      </AntdMenu>
    </MenuModeContext.Provider>
  );
};

export const Menu: any = observer((props: any) => {
  const {
    mode,
    onSelect,
    sideMenuRef,
    defaultSelectedKeys = [],
    ...others
  } = props;
  const { designable, schema } = useDesignable();
  const fieldSchema = useFieldSchema();
  console.log('Menu.schema', schema, fieldSchema);
  const [selectedKey, setSelectedKey] = useState(
    defaultSelectedKeys[0] || null,
  );
  const ref = useRef();
  const path = useSchemaPath();
  const child = schema.properties && schema.properties[selectedKey];
  const isSubMenu = child && child['x-component'] === 'Menu.SubMenu';

  useMount(() => {
    if (mode !== 'mix') {
      return;
    }
    const sideMenuElement = sideMenuRef && (sideMenuRef.current as HTMLElement);
    if (sideMenuElement && ref.current) {
      sideMenuElement.querySelector(':scope > div').appendChild(ref.current);
    }
    sideMenuElement.style.display = isSubMenu ? 'block' : 'none';
  });

  useEffect(() => {
    const sideMenuElement = sideMenuRef && (sideMenuRef.current as HTMLElement);
    if (!sideMenuElement) {
      return;
    }
    sideMenuElement.style.display = isSubMenu ? 'block' : 'none';
  }, [selectedKey]);

  return (
    <MenuModeContext.Provider value={mode}>
      <AntdMenu
        defaultSelectedKeys={defaultSelectedKeys}
        {...others}
        mode={mode === 'mix' ? 'horizontal' : mode}
        onSelect={(info) => {
          if (mode === 'mix') {
            setSelectedKey(info.key);
          }
          const selectedSchema = schema.properties[info.key];
          console.log({ selectedSchema });
          onSelect && onSelect({ ...info, schema: selectedSchema });
        }}
      >
        <RecursionField schema={schema} onlyRenderProperties />
        <Menu.AddNew key={uid()} path={path}>
          {/* <PlusOutlined className={'nb-add-new-icon'} /> */}
          <Button
            className={`nb-add-new-menu-item menu-mode-${
              mode === 'mix' ? 'horizontal' : mode
            }`}
            block
            type={mode == 'inline' ? 'dashed' : 'primary'}
          >
            <PlusOutlined />
          </Button>
        </Menu.AddNew>
      </AntdMenu>
      {mode === 'mix' && (
        <div ref={ref}>
          <SideMenu
            path={path}
            onSelect={(info) => {
              const keyPath = [selectedKey, ...[...info.keyPath].reverse()];
              const selectedSchema = findPropertyByPath(schema, keyPath);
              console.log('keyPath', keyPath, selectedSchema);
              onSelect &&
                onSelect({ ...info, keyPath, schema: selectedSchema });
            }}
            defaultSelectedKeys={defaultSelectedKeys || []}
            selectedKey={selectedKey}
            sideMenuRef={sideMenuRef}
          />
        </div>
      )}
    </MenuModeContext.Provider>
  );
});

Menu.Divider = observer(AntdMenu.Divider);

Menu.Item = observer((props: any) => {
  const { icon } = props;
  const { schema, DesignableBar } = useDesignable();
  return (
    <AntdMenu.Item
      {...props}
      icon={<IconPicker type={icon} />}
      eventKey={schema.name}
      key={schema.name}
    >
      {schema.title}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Link = observer((props: any) => {
  const { icon } = props;
  const { schema, DesignableBar } = useDesignable();
  return (
    <AntdMenu.Item
      {...props}
      icon={<IconPicker type={icon} />}
      eventKey={schema.name}
      key={schema.name}
    >
      {schema.title}
      {/* <Link to={props.to || schema.name}>{schema.title}</Link> */}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.URL = observer((props: any) => {
  const { icon } = props;
  const { schema, DesignableBar } = useDesignable();
  return (
    <AntdMenu.Item
      {...props}
      icon={<IconPicker type={icon} />}
      eventKey={schema.name}
      key={schema.name}
    >
      <a target={'_blank'} href={props.href}>
        {schema.title}
      </a>
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Action = observer((props: any) => {
  const { icon, useAction = useDefaultAction, ...others } = props;
  const { schema, DesignableBar } = useDesignable();
  const field = useField();
  const [visible, setVisible] = useState(false);
  const { run } = useAction();
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <AntdMenu.Item
        {...others}
        key={schema.name}
        eventKey={schema.name}
        icon={<IconPicker type={icon} />}
        onClick={async () => {
          await run();
          setVisible(true);
        }}
      >
        {schema.title}
        <DesignableBar />
      </AntdMenu.Item>
      {props.children}
      {/* <RecursionField schema={schema} onlyRenderProperties /> */}
    </VisibleContext.Provider>
  );
});

Menu.SubMenu = observer((props: any) => {
  const { icon } = props;
  const { schema, DesignableBar } = useDesignable();
  const mode = useContext(MenuModeContext);
  return mode === 'mix' ? (
    <Menu.Item {...props} />
  ) : (
    <AntdMenu.SubMenu
      {...props}
      icon={<IconPicker type={icon} />}
      title={
        <>
          {schema.title} <DesignableBar />
        </>
      }
      eventKey={schema.name}
      key={schema.name}
    >
      <RecursionField schema={schema} onlyRenderProperties />
    </AntdMenu.SubMenu>
  );
});

Menu.AddNew = observer((props: any) => {
  const { designable, appendChild } = useDesignable(props.path);
  if (!designable) {
    return null;
  }
  const schemas = {
    'Menu.Link': {
      icon: <MenuOutlined />,
      title: '新建菜单项',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '菜单项名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          'x-component-props.icon': {
            type: 'string',
            title: '图标',
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
        },
      },
    },
    'Menu.SubMenu': {
      icon: <GroupOutlined />,
      title: '新建菜单分组',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '分组名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          'x-component-props.icon': {
            type: 'string',
            title: '图标',
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
        },
      },
    },
    'Menu.URL': {
      icon: <LinkOutlined />,
      title: '添加自定义链接',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '链接名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          'x-component-props.icon': {
            type: 'string',
            title: '图标',
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
          'x-component-props.href': {
            type: 'string',
            title: '自定义链接',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
      },
    },
  };

  return (
    <AntdMenu.ItemGroup
      className={'nb-menu-add-new'}
      title={
        <Dropdown
          // trigger={['click']}
          overlay={
            <AntdMenu
              onClick={async (info) => {
                console.log({ info });
                const values = await FormDialog(schemas[info.key].title, () => {
                  return (
                    <FormLayout layout={'vertical'}>
                      <SchemaField schema={schemas[info.key].schema} />
                    </FormLayout>
                  );
                }).open();
                const defaults = generateDefaultSchema(info.key);
                const data = appendChild(deepmerge(defaults, values));
                await createSchema(data);
              }}
            >
              <AntdMenu.Item key={'Menu.Link'} icon={<MenuOutlined />}>
                新建菜单项
              </AntdMenu.Item>
              <AntdMenu.Item key={'Menu.SubMenu'} icon={<GroupOutlined />}>
                新建菜单分组
              </AntdMenu.Item>
              <AntdMenu.Item key={'Menu.URL'} icon={<LinkOutlined />}>
                添加自定义链接
              </AntdMenu.Item>
            </AntdMenu>
          }
        >
          {props.children}
        </Dropdown>
      }
    />
  );
});

Menu.DesignableBar = (props) => {
  const schemas = {
    'Menu.Action': {
      icon: <MenuOutlined />,
      title: '菜单项',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '菜单项名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          'x-component-props.icon': {
            type: 'string',
            title: '图标',
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
        },
      },
    },
    'Menu.Item': {
      icon: <MenuOutlined />,
      title: '菜单项',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '菜单项名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          'x-component-props.icon': {
            type: 'string',
            title: '图标',
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
        },
      },
    },
    'Menu.Link': {
      icon: <MenuOutlined />,
      title: '菜单项',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '菜单项名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          'x-component-props.icon': {
            type: 'string',
            title: '图标',
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
        },
      },
    },
    'Menu.SubMenu': {
      icon: <GroupOutlined />,
      title: '菜单分组',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '分组名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          'x-component-props.icon': {
            type: 'string',
            title: '图标',
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
        },
      },
    },
    'Menu.URL': {
      icon: <LinkOutlined />,
      title: '自定义链接',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '链接名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          'x-component-props.icon': {
            type: 'string',
            title: '图标',
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
          'x-component-props.href': {
            type: 'string',
            title: '自定义链接',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
      },
    },
  };

  const field = useField();
  const [visible, setVisible] = useState(false);
  const {
    designable,
    schema,
    remove,
    refresh,
    insertAfter,
    insertBefore,
    appendChild,
  } = useDesignable();
  const formConfig = schemas[schema['x-component']];
  const isSubMenu = schema['x-component'] === 'Menu.SubMenu';

  if (!designable) {
    return null;
  }

  return (
    <div className={cls('designable-bar', { active: visible })}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className={'designable-bar-actions'}
      >
        <Dropdown
          overlayStyle={{
            minWidth: 150,
          }}
          trigger={['click']}
          overlay={
            <AntdMenu
              onClick={async (info) => {
                if (['update', 'move', 'delete'].includes(info.key)) {
                  return;
                }
                const methodLabels = {
                  insertBefore: '之前',
                  insertAfter: '之后',
                  appendChild: '里',
                };
                const keys = info.key.split('.');
                const method = keys.shift();
                const type = keys.join('.');
                const config = schemas[type];
                if (!config) {
                  return;
                }
                const values = await FormDialog(
                  `在「${schema.title}」${methodLabels[method]}新建${config.title}`,
                  () => {
                    return (
                      <FormLayout layout={'vertical'}>
                        <SchemaField schema={config.schema} />
                      </FormLayout>
                    );
                  },
                ).open();
                const methods = {
                  insertAfter,
                  insertBefore,
                  appendChild,
                };
                const defaults = generateDefaultSchema(type);
                const data = methods[method](deepmerge(defaults, values));
                await createSchema(data);
              }}
            >
              <AntdMenu.Item
                key={'update'}
                onClick={async () => {
                  const initialValues = {};
                  Object.keys(formConfig.schema.properties).forEach((name) => {
                    _.set(initialValues, name, get(schema, name));
                  });
                  const values = await FormDialog(
                    `修改${formConfig.title}`,
                    () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField schema={formConfig.schema} />
                        </FormLayout>
                      );
                    },
                  ).open({
                    initialValues,
                  });
                  if (values.title) {
                    schema.title = values.title;
                  }
                  const icon = _.get(values, 'x-component-props.icon') || null;
                  schema['x-component-props'] =
                    schema['x-component-props'] || {};
                  schema['x-component-props']['icon'] = icon;
                  field.componentProps['icon'] = icon;
                  refresh();
                  await updateSchema(schema);
                }}
              >
                <EditOutlined /> 修改{formConfig.title}
              </AntdMenu.Item>
              <AntdMenu.Item
                key={'move'}
                onClick={async () => {
                  let menuSchema: Schema;
                  let parent = schema.parent;
                  while (parent) {
                    if (parent['x-component'] === 'Menu') {
                      menuSchema = parent;
                      break;
                    }
                    parent = parent.parent;
                  }

                  console.log({ menuSchema });

                  const toTreeData = (s: Schema) => {
                    const items = [];
                    Object.keys(s.properties || {}).forEach((name) => {
                      const current = s.properties[name];
                      if (
                        !(current['x-component'] as string).startsWith('Menu.')
                      ) {
                        return;
                      }
                      // if (current.name === schema.name) {
                      //   return;
                      // }
                      items.push({
                        key: current['key'] || current.name,
                        label: current.title,
                        title: current.title,
                        value: getSchemaPath(current).join('.'),
                        children: toTreeData(current),
                      });
                    });
                    return items;
                  };

                  const dataSource = toTreeData(menuSchema);

                  const values = await FormDialog(
                    `将「${schema.title}」移动到`,
                    () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                path: {
                                  type: 'string',
                                  title: '目标位置',
                                  enum: dataSource,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'TreeSelect',
                                },
                                method: {
                                  type: 'string',
                                  default: 'insertAfter',
                                  enum: [
                                    { label: '之后', value: 'insertAfter' },
                                    { label: '之前', value: 'insertBefore' },
                                  ],
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Radio.Group',
                                },
                              },
                            }}
                          />
                        </FormLayout>
                      );
                    },
                  ).open({
                    effects(form) {
                      onFieldChange('path', (field) => {
                        const target = findPropertyByPath(
                          schema.root,
                          // @ts-ignore
                          field.value,
                        );
                        console.log({ field });
                        field.query('method').take((f) => {
                          // @ts-ignore
                          // f.value = 'insertAfter';
                          // @ts-ignore
                          f.dataSource =
                            target['x-component'] === 'Menu.SubMenu'
                              ? [
                                  { label: '之后', value: 'insertAfter' },
                                  { label: '之前', value: 'insertBefore' },
                                  { label: '组里', value: 'appendChild' },
                                ]
                              : [
                                  { label: '之后', value: 'insertAfter' },
                                  { label: '之前', value: 'insertBefore' },
                                ];
                        });
                      });
                    },
                  });
                  const methods = {
                    insertAfter,
                    insertBefore,
                    appendChild,
                  };
                  const data = schema.toJSON();
                  remove();
                  const source = methods[values.method](data, values.path);
                  await updateSchema(source);
                }}
              >
                <DragOutlined /> 移动到
              </AntdMenu.Item>
              <AntdMenu.Divider />
              <AntdMenu.SubMenu
                key={'insertBefore'}
                icon={<ArrowUpOutlined />}
                title={'当前菜单项之前'}
              >
                <AntdMenu.Item
                  key={'insertBefore.Menu.Link'}
                  icon={<MenuOutlined />}
                >
                  新建菜单项
                </AntdMenu.Item>
                <AntdMenu.Item
                  key={'insertBefore.Menu.SubMenu'}
                  icon={<GroupOutlined />}
                >
                  新建菜单分组
                </AntdMenu.Item>
                <AntdMenu.Item
                  key={'insertBefore.Menu.URL'}
                  icon={<LinkOutlined />}
                >
                  添加自定义链接
                </AntdMenu.Item>
              </AntdMenu.SubMenu>
              <AntdMenu.SubMenu
                key={'insertAfter'}
                icon={<ArrowDownOutlined />}
                title={'当前菜单项之后'}
              >
                <AntdMenu.Item
                  key={'insertAfter.Menu.Link'}
                  icon={<MenuOutlined />}
                >
                  新建菜单项
                </AntdMenu.Item>
                <AntdMenu.Item
                  key={'insertAfter.Menu.SubMenu'}
                  icon={<GroupOutlined />}
                >
                  新建菜单分组
                </AntdMenu.Item>
                <AntdMenu.Item
                  key={'insertAfter.Menu.URL'}
                  icon={<LinkOutlined />}
                >
                  添加自定义链接
                </AntdMenu.Item>
              </AntdMenu.SubMenu>
              {isSubMenu && (
                <AntdMenu.SubMenu
                  key={'appendChild'}
                  icon={<ArrowRightOutlined />}
                  title={'当前菜单分组里'}
                >
                  <AntdMenu.Item
                    key={'appendChild.Menu.Link'}
                    icon={<MenuOutlined />}
                  >
                    新建菜单项
                  </AntdMenu.Item>
                  <AntdMenu.Item
                    key={'appendChild.Menu.SubMenu'}
                    icon={<GroupOutlined />}
                  >
                    新建菜单分组
                  </AntdMenu.Item>
                  <AntdMenu.Item
                    key={'appendChild.Menu.URL'}
                    icon={<LinkOutlined />}
                  >
                    添加自定义链接
                  </AntdMenu.Item>
                </AntdMenu.SubMenu>
              )}
              <AntdMenu.Divider />
              <AntdMenu.Item
                key={'delete'}
                onClick={() => {
                  Modal.confirm({
                    title: '删除菜单',
                    content: '确认删除此菜单项吗？',
                    onOk: async () => {
                      const target = remove();
                      await removeSchema(target);
                    },
                  });
                }}
              >
                <DeleteOutlined /> 删除
              </AntdMenu.Item>
            </AntdMenu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </div>
    </div>
  );
};

export default Menu;
