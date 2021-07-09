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

import { useLifecycle } from 'beautiful-react-hooks';
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

export const MenuContainerContext = createContext({
  sideMenuRef: null,
});

export const MenuContext = createContext({
  mode: null,
  designableBar: null,
});

function Blank() {
  return null;
}

function useDesignableBar() {
  const { designableBar } = useContext(MenuContext);

  const options = useContext(SchemaOptionsContext);
  const DesignableBar = designableBar
    ? get(options.components, designableBar)
    : null;

  return {
    DesignableBar: DesignableBar || Blank,
  };
}

export const Menu: MenuType = observer((props: any) => {
  const { sideMenuRef, onSelect, mode, defaultSelectedKeys, ...others } = props;
  let defaultSelectedKey = defaultSelectedKeys ? defaultSelectedKeys[0] : null;
  const schema = useFieldSchema();
  const { schema: designableSchema, refresh } = useDesignable();
  const designableBar = schema['x-designable-bar'];
  const history = useHistory();
  const renderSideMenu = (selectedKey) => {
    if (!selectedKey) {
      return;
    }
    if ((mode as any) !== 'mix') {
      return;
    }
    if (!sideMenuRef || !sideMenuRef.current) {
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
      />
    </MenuContext.Provider>
  );
});

const AddNewAction = () => {
  const { insertBefore } = useDesignable();
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
              insertBefore({
                type: 'void',
                title: uid(),
                'x-component': 'Menu.Item',
              });
            }}
            style={{ minWidth: 150 }}
          >
            <MenuOutlined /> 新建菜单
          </AntdMenu.Item>
          <AntdMenu.Item>
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
  const field = useField();
  const schema = useFieldSchema();
  const { DesignableBar } = useDesignableBar();
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
      {field.title}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Link = observer((props) => {
  const history = useHistory();
  const field = useField();
  const schema = useFieldSchema();
  const { DesignableBar } = useDesignableBar();
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
      {field.title}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Item = observer((props: any) => {
  const { useAction = useDefaultAction, ...others } = props;
  const { run } = useAction();
  const field = useField();
  const schema = useFieldSchema();
  const { DesignableBar } = useDesignableBar();
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
      {field.title}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.Action = observer((props: any) => {
  const { icon, ...others } = props;
  const schema = useFieldSchema();
  const { DesignableBar } = useDesignableBar();
  return (
    <Action
      // @ts-ignore
      eventKey={schema.name}
      key={schema.name}
      icon={icon ? <Icon type={icon as string} /> : undefined}
      ButtonComponent={AntdMenu.Item}
      {...others}
    />
    // <Action {...others}/>
    // <DesignableBar />
    // </AntdMenu.Item>
  );
});

Menu.SubMenu = observer((props) => {
  const { DesignableBar } = useDesignableBar();
  const schema = useFieldSchema();
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

function useDesigner() {
  const field = useField();
}

Menu.DesignableBar = (props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const [visible, setVisible] = useState(false);
  const { schema, remove, refresh } = useDesignable();
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
                  field.title = title;
                  field.componentProps['icon'] = 'DeleteOutlined';
                  schema['x-component-props'] =
                    schema['x-component-props'] || {};
                  schema['x-component-props']['icon'] = 'DeleteOutlined';
                  schema.title = title;
                  fieldSchema.title = title;
                  fieldSchema['x-component-props'] =
                    fieldSchema['x-component-props'] || {};
                  fieldSchema['x-component-props']['icon'] = 'DeleteOutlined';
                  refresh();
                }}
              >
                修改标题
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
