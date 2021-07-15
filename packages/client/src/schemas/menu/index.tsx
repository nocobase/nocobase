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
import { useDesignable } from '../../components/schema-renderer';
import { MenuOutlined } from '@ant-design/icons';
import { IconPicker } from '../../components/icon-picker';
import { VisibleContext } from '..';
import { useMount } from 'ahooks';
import './style.less';

export const MenuModeContext = createContext(null);

const SideMenu = (props: any) => {
  const { visible, selectedKey, onSelect } = props;
  const { schema } = useDesignable();
  if (!selectedKey || !visible) {
    return null;
  }
  const child = schema.properties && schema.properties[selectedKey];
  if (!child || child['x-component'] !== 'Menu.SubMenu') {
    return null;
  }

  return (
    <AntdMenu mode={'inline'} onSelect={onSelect}>
      <RecursionField schema={child} onlyRenderProperties />
      <AntdMenu.Item key={uid()}>{selectedKey}</AntdMenu.Item>
    </AntdMenu>
  );
};

export const Menu: any = observer((props: any) => {
  const { mode, onSelect, sideMenuRef, ...others } = props;
  const { schema } = useDesignable();
  const [selectedKey, setSelectedKey] = useState(null);
  const ref = useRef();

  useMount(() => {
    if (mode !== 'mix') {
      return;
    }
    const sideMenuElement = sideMenuRef && (sideMenuRef.current as HTMLElement);
    if (sideMenuElement && ref.current) {
      sideMenuElement.querySelector(':scope > div').appendChild(ref.current);
    }
  });

  return (
    <MenuModeContext.Provider value={mode}>
      <AntdMenu
        {...others}
        mode={mode === 'mix' ? 'horizontal' : mode}
        onSelect={(info) => {
          if (mode === 'mix') {
            setSelectedKey(info.key);
          }
          onSelect && onSelect(info);
        }}
      >
        <RecursionField schema={schema} onlyRenderProperties />
        <AntdMenu.ItemGroup title={
          <div>新增</div>
        }></AntdMenu.ItemGroup>
      </AntdMenu>
      {mode === 'mix' && (
        <div ref={ref}>
          <SideMenu
            onSelect={onSelect}
            visible={mode === 'mix'}
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

Menu.Action = observer((props: any) => {
  const { icon } = props;
  const { schema, DesignableBar } = useDesignable();
  const [visible, setVisible] = useState(false);
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <AntdMenu.Item
        {...props}
        key={schema.name}
        eventKey={schema.name}
        icon={<IconPicker type={icon} />}
        onClick={() => {
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
