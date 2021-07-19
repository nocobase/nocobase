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
} from '@ant-design/icons';
import { IconPicker } from '../../components/icon-picker';
import {
  createSchema,
  removeSchema,
  updateSchema,
  useDefaultAction,
  VisibleContext,
} from '..';
import { useMount } from 'ahooks';
import './style.less';
import { Link } from 'react-router-dom';
import { findPropertyByPath, useSchemaPath } from '@nocobase/client/lib';
import { request } from '../';
import defaultSchemas from './defaultSchemas';
import _, { cloneDeep, get, isNull } from 'lodash';
import { FormDialog, FormItem, FormLayout, Input } from '@formily/antd';
import deepmerge from 'deepmerge';

export const MenuModeContext = createContext(null);

const SideMenu = (props: any) => {
  const { selectedKey, onSelect, path } = props;
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
          <Button className={'nb-add-new-menu-item'} block type={'dashed'}>
            <PlusOutlined />
          </Button>
        </Menu.AddNew>
      </AntdMenu>
    </MenuModeContext.Provider>
  );
};

export const Menu: any = observer((props: any) => {
  const { mode, onSelect, sideMenuRef, ...others } = props;
  const { schema } = useDesignable();
  const [selectedKey, setSelectedKey] = useState(null);
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
            className={`nb-add-new-menu-item menu-mode-${mode === 'mix' ? 'horizontal' : mode}`}
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
              const keyPath = [selectedKey, ...info.keyPath];
              const selectedSchema = findPropertyByPath(schema, keyPath);
              console.log('keyPath', keyPath, selectedSchema);
              onSelect &&
                onSelect({ ...info, keyPath, schema: selectedSchema });
            }}
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
      <Link to={props.to}>{schema.title}</Link>
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
  const { appendChild } = useDesignable(props.path);

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
                const defaults = cloneDeep(defaultSchemas[info.key]);
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
      title: '修改菜单项',
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
      title: '修改菜单项',
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
      title: '修改菜单项',
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
      title: '修改菜单分组',
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
      title: '修改自定义链接',
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
  const { schema, remove, refresh, insertAfter, appendChild } = useDesignable();
  const formConfig = schemas[schema['x-component']];
  console.log({ formConfig, schema })
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
          // visible={visible}
          // onVisibleChange={(visible) => {
          //   setVisible(visible);
          // }}
          trigger={['click']}
          overlay={
            <AntdMenu>
              <AntdMenu.Item
                onClick={async () => {
                  const initialValues = {};
                  Object.keys(formConfig.schema.properties).forEach((name) => {
                    _.set(initialValues, name, get(schema, name));
                  });
                  const values = await FormDialog(formConfig.title, () => {
                    return (
                      <FormLayout layout={'vertical'}>
                        <SchemaField schema={formConfig.schema} />
                      </FormLayout>
                    );
                  }).open({
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
                  // const title = uid();
                  // field.componentProps['icon'] = 'DeleteOutlined';
                  
                  // schema['x-component-props']['icon'] = 'DeleteOutlined';
                  // schema.title = title;
                  // refresh();
                }}
              >
                {formConfig.title}
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={async () => {
                  const s = insertAfter({
                    ...defaultSchemas['Menu.Link'],
                    title: uid(),
                  });
                  await createSchema(s);
                }}
              >
                新建菜单项
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={async () => {
                  const s = insertAfter({
                    ...defaultSchemas['Menu.SubMenu'],
                    title: uid(),
                  });
                  await createSchema(s);
                }}
              >
                新建菜单分组
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={async () => {
                  const s = appendChild({
                    ...defaultSchemas['Menu.Link'],
                    title: uid(),
                  });
                  await createSchema(s);
                }}
              >
                在菜单组里新增
              </AntdMenu.Item>
              <AntdMenu.Item
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
                删除菜单
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
