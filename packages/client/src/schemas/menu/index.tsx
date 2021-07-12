import React, {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
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
import get from 'lodash/get';
import { uid } from '@formily/shared';
import {
  MenuOutlined,
  GroupOutlined,
  PlusOutlined,
  LinkOutlined,
  AppstoreAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import './style.less';
import { Icon } from '../icon-picker';
import { useHistory } from 'react-router-dom';
import cls from 'classnames';
import ReactDOM from 'react-dom';
import { useMount } from 'ahooks';
import { useDesignable, SchemaRenderer } from '..';
import { Router } from 'react-router';
import { Action, useDefaultAction } from '../action';

export type MenuType = React.FC<MenuProps & { hideSubMenu?: boolean }> & {
  Item?: React.FC<MenuItemProps>;
  SubMenu?: React.FC<SubMenuProps>;
  Divider?: React.FC<DividerProps>;
  DesignableBar?: React.FC<any>;
  AddNew?: React.FC<any>;
  Link?: React.FC<MenuItemProps>;
  Action?: React.FC<MenuItemProps>;
  Url?: React.FC<MenuItemProps & { url: string }>;
};

export const MenuContext = createContext({
  mode: null,
  designableBar: null,
});

function useDesignableBar() {
  const { designableBar } = useContext(MenuContext);
  const options = useContext(SchemaOptionsContext);
  const DesignableBar = designableBar
    ? get(options.components, designableBar)
    : null;
  return DesignableBar || (() => null);
}

export const Menu: MenuType = observer((props: any) => {
  const {
    children,
    sideMenuRef,
    onSelect,
    mode,
    defaultSelectedKeys,
    ...others
  } = props;
  let defaultSelectedKey = defaultSelectedKeys ? defaultSelectedKeys[0] : null;
  const { schema, schema: designableSchema, refresh } = useDesignable();
  const designableBar = schema['x-designable-bar'];
  const history = useHistory();
  const renderSideMenu = (selectedKey) => {
    if ((mode as any) !== 'mix') {
      return;
    }
    if (!sideMenuRef || !sideMenuRef.current) {
      return;
    }
    if (!selectedKey || !schema.properties) {
      sideMenuRef.current.style.display = 'none';
      return;
    }
    const subSchema = schema.properties[selectedKey];
    if (!subSchema) {
      sideMenuRef.current.style.display = 'none';
      ReactDOM.render(null, sideMenuRef.current);
      return;
    }
    if (subSchema['x-component'] !== 'Menu.SubMenu') {
      sideMenuRef.current.style.display = 'none';
      return;
    }
    const properties = subSchema.properties || {};
    sideMenuRef.current.style.display = 'block';
    const newProps = {};
    Object.keys(properties || {}).forEach((name) => {
      newProps[name] = properties[name].toJSON();
    });
    ReactDOM.render(
      <Router history={history}>
        <SchemaRenderer
          key={`${Math.random()}`}
          onRefresh={(subSchema: Schema) => {
            const selected = designableSchema.properties[selectedKey];
            const diff = subSchema.properties[`${schema.name}.${selectedKey}`];
            Object.keys(selected.properties || {}).forEach((name) => {
              selected.properties[name].parent.removeProperty(name);
            });
            Object.keys(diff.properties).forEach((name) => {
              if (name.endsWith('-add-new')) {
                return;
              }
              console.log('diff', name);
              const current = diff.properties[name];
              selected.addProperty(current.name, current.toJSON());
            });
            console.log({ selected });
            refresh();
          }}
          schema={{
            type: 'void',
            name: `${schema.name}.${selectedKey}`,
            'x-component': 'Menu',
            'x-designable-bar': designableBar,
            'x-component-props': {
              mode: 'inline',
              onSelect,
            },
            properties: {
              ...newProps,
              [`${uid()}-add-new`]: {
                type: 'void',
                parentKey: subSchema['key'],
                'x-component': 'Menu.AddNew',
              },
            },
          }}
        />
      </Router>,
      sideMenuRef.current,
    );
  };
  useMount(() => {
    console.log({ defaultSelectedKey }, schema.properties);
    renderSideMenu(defaultSelectedKey);
  });
  const isEmpty = !Object.keys(designableSchema.properties || {}).length;
  console.log({ designableSchema });
  return (
    <MenuContext.Provider
      value={{
        mode,
        designableBar,
      }}
    >
      <AntdMenu
        defaultSelectedKeys={defaultSelectedKeys}
        {...others}
        onSelect={(info) => {
          console.log('info.key', info.key);
          renderSideMenu(info.key);
          onSelect && onSelect(info);
        }}
        mode={(mode as any) === 'mix' ? 'horizontal' : mode}
      >
        {!isEmpty ? (
          <RecursionField schema={schema} onlyRenderProperties />
        ) : (
          <SchemaRenderer
            onRefresh={(subSchema: Schema) => {
              Object.keys(subSchema.properties).forEach((name) => {
                if (name === 'add-new') {
                  return;
                }
                designableSchema.addProperty(
                  name,
                  subSchema.properties[name].toJSON(),
                );
              });
              refresh();
            }}
            schema={{
              type: 'object',
              properties: {
                'add-new': {
                  parentKey: schema['key'],
                  type: 'void',
                  'x-component': 'Menu.AddNew',
                },
              },
            }}
          />
        )}
      </AntdMenu>
    </MenuContext.Provider>
  );
});

const AddNewAction = () => {
  const { schema, insertBefore } = useDesignable();
  return (
    <Dropdown
      overlayStyle={{
        minWidth: 150,
      }}
      trigger={['click']}
      overlay={
        <AntdMenu>
          <AntdMenu.Item
            onClick={() => {
              const s = insertBefore({
                type: 'void',
                title: uid(),
                key: uid(),
                'x-component': 'Menu.Item',
              });
              console.log('s.s.s.s.s.s', s);
            }}
            style={{ minWidth: 150 }}
          >
            <MenuOutlined /> 新建菜单
          </AntdMenu.Item>
          <AntdMenu.Item
            onClick={() => {
              const s = insertBefore({
                type: 'void',
                key: uid(),
                title: uid(),
                'x-component': 'Menu.SubMenu',
              });
            }}
          >
            <GroupOutlined /> 新建分组
          </AntdMenu.Item>
          <AntdMenu.Item>
            <LinkOutlined /> 添加链接
          </AntdMenu.Item>
        </AntdMenu>
      }
    >
      <Button block type={'dashed'} icon={<PlusOutlined />}></Button>
    </Dropdown>
  );
};

Menu.AddNew = observer((props) => {
  const { designableBar } = useContext(MenuContext);
  return designableBar ? (
    <AntdMenu.ItemGroup
      key={'add-menu-item'}
      className={'menu-add'}
      title={<AddNewAction />}
    ></AntdMenu.ItemGroup>
  ) : null;
});

Menu.Url = observer((props) => {
  const DesignableBar = useDesignableBar();
  const { schema } = useDesignable();
  return (
    <AntdMenu.Item
      {...props}
      // @ts-ignore
      eventKey={schema.name}
      key={schema.name}
      onClick={(e) => {
        window.open(props.url);
      }}
      icon={props.icon ? <Icon type={props.icon as string} /> : undefined}
    >
      {schema.title}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Link = observer((props) => {
  const history = useHistory();
  const DesignableBar = useDesignableBar();
  const { schema } = useDesignable();
  return (
    <AntdMenu.Item
      {...props}
      // @ts-ignore
      eventKey={schema.name}
      key={schema.name}
      onClick={(e) => {
        history.push(schema.name as string);
      }}
      icon={props.icon ? <Icon type={props.icon as string} /> : undefined}
    >
      {schema.title}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Item = observer((props: any) => {
  const { useAction = useDefaultAction, ...others } = props;
  const { run } = useAction();
  const DesignableBar = useDesignableBar();
  const { schema } = useDesignable();
  return (
    <AntdMenu.Item
      {...others}
      onClick={async () => {
        await run();
      }}
      schema={schema}
      // @ts-ignore
      eventKey={schema.name}
      key={schema.name}
      icon={props.icon ? <Icon type={props.icon as string} /> : undefined}
    >
      {schema.title}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Action = observer((props: any) => {
  const { icon, ...others } = props;
  // const DesignableBar = useDesignableBar();
  const { schema } = useDesignable();
  return (
    <Action
      // @ts-ignore
      eventKey={schema.name}
      key={schema.name}
      icon={icon ? <Icon type={icon as string} /> : undefined}
      ButtonComponent={AntdMenu.Item}
      {...others}
    />
  );
});

Menu.SubMenu = observer((props) => {
  const DesignableBar = useDesignableBar();
  const { schema } = useDesignable();
  const { mode } = useContext(MenuContext);
  return mode === 'mix' ? (
    <Menu.Item {...props} />
  ) : (
    <AntdMenu.SubMenu
      {...props}
      // @ts-ignore
      schema={schema}
      title={
        <>
          {schema.title} <DesignableBar />
        </>
      }
      eventKey={schema.name}
      key={schema.name}
      icon={
        props.icon ? (
          <RecursionField
            name={schema.name}
            schema={
              new Schema({
                type: 'string',
                'x-read-pretty': true,
                default: props.icon,
                'x-component': 'IconPicker',
              })
            }
            onlyRenderProperties
          />
        ) : undefined
      }
    />
  );
});

Menu.Divider = observer(AntdMenu.Divider);

Menu.DesignableBar = (props) => {
  const field = useField();
  const [visible, setVisible] = useState(false);
  const { schema, remove, refresh, insertAfter, appendChild } = useDesignable();
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
                onClick={() => {
                  const title = uid();
                  field.componentProps['icon'] = 'DeleteOutlined';
                  schema['x-component-props'] =
                    schema['x-component-props'] || {};
                  schema['x-component-props']['icon'] = 'DeleteOutlined';
                  schema.title = title;
                  refresh();
                }}
              >
                修改标题
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={() => {
                  const s = insertAfter({
                    type: 'void',
                    key: uid(),
                    title: uid(),
                    'x-component': 'Menu.SubMenu',
                  });
                }}
              >
                新建分组
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={() => {
                  const s = insertAfter({
                    type: 'void',
                    key: uid(),
                    title: uid(),
                    'x-component': 'Menu.Item',
                  });
                }}
              >
                新建菜单
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={() => {
                  const s = appendChild({
                    type: 'void',
                    key: uid(),
                    title: uid(),
                    'x-component': 'Menu.Item',
                  });
                }}
              >
                在菜单组里新增
              </AntdMenu.Item>
              <AntdMenu.Item
                onClick={() => {
                  Modal.confirm({
                    title: '删除菜单',
                    content: '确认删除此菜单项吗？',
                    onOk: () => {
                      remove();
                    },
                  });
                }}
              >
                <DeleteOutlined /> 删除菜单
              </AntdMenu.Item>
              <AntdMenu.Item>
                <ModalButton />
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

function ModalButton() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <div
        onClick={() => {
          setVisible(true);
        }}
      >
        按钮
      </div>
      <Modal
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
      >
        aaa
      </Modal>
    </>
  );
}

export default Menu;
