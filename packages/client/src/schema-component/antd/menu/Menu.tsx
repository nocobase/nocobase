import React, { createContext, useContext, useEffect, useState } from 'react';
import { Menu as AntdMenu } from 'antd';
import { Schema, observer, useFieldSchema, useField, RecursionField } from '@formily/react';
import { DesktopOutlined } from '@ant-design/icons';
import { findKeysByUid } from './util';
import { createPortal } from 'react-dom';

type ComposedMenu = React.FC<any> & {
  Item?: React.FC<any>;
  SubMenu?: React.FC<any>;
};

const MenuModeContext = createContext(null);

export const Menu: ComposedMenu = observer((props) => {
  let { onSelect, sideMenuRef, mode, defaultSelectedUid, defaultSelectedKeys, defaultOpenKeys, ...others } = props;
  const schema = useFieldSchema();
  if (defaultSelectedUid) {
    defaultSelectedKeys = findKeysByUid(schema, defaultSelectedUid);
    if (['inline', 'mix'].includes(mode)) {
      defaultOpenKeys = defaultSelectedKeys;
    }
  }
  const [sideMenuSchema, setSideMenuSchema] = useState<Schema>(() => {
    if (mode === 'mix' && defaultSelectedKeys[0]) {
      const s = schema.properties?.[defaultSelectedKeys[0]];
      if (s['x-component'] === 'Menu.SubMenu') {
        return s;
      }
    }
    return null;
  });
  useEffect(() => {
    const sideMenuElement = sideMenuRef?.current as HTMLElement;
    if (!sideMenuElement) {
      return;
    }
    sideMenuElement.style.display = sideMenuSchema?.properties ? 'block' : 'none';
  }, [sideMenuSchema?.properties, sideMenuRef]);
  console.log({ sideMenuRef, defaultSelectedKeys, sideMenuSchema });
  return (
    <MenuModeContext.Provider value={mode}>
      <AntdMenu
        {...others}
        onSelect={(info) => {
          const s = schema.properties[info.key];
          if (mode === 'mix') {
            setSideMenuSchema(s);
          }
          onSelect && onSelect(info);
        }}
        mode={mode === 'mix' ? 'horizontal' : mode}
        defaultOpenKeys={defaultOpenKeys}
        defaultSelectedKeys={defaultSelectedKeys}
      >
        <RecursionField schema={schema} onlyRenderProperties />
      </AntdMenu>
      {mode === 'mix' &&
        sideMenuSchema.properties &&
        sideMenuRef.current?.firstChild &&
        createPortal(
          <MenuModeContext.Provider value={'inline'}>
            <AntdMenu mode={'inline'} defaultOpenKeys={defaultOpenKeys} defaultSelectedKeys={defaultSelectedKeys}>
              <RecursionField schema={sideMenuSchema} onlyRenderProperties />
            </AntdMenu>
          </MenuModeContext.Provider>,
          sideMenuRef.current.firstChild,
        )}
    </MenuModeContext.Provider>
  );
});

Menu.Item = observer((props) => {
  const schema = useFieldSchema();
  return (
    <AntdMenu.Item {...props} icon={<DesktopOutlined />} key={schema.name} eventKey={schema.name} schema={schema}>
      {schema.title}
    </AntdMenu.Item>
  );
});

Menu.SubMenu = observer((props) => {
  const schema = useFieldSchema();
  const mode = useContext(MenuModeContext);
  if (mode === 'mix') {
    return <Menu.Item {...props} />;
  }
  return (
    <AntdMenu.SubMenu
      {...props}
      icon={<DesktopOutlined />}
      title={schema.title}
      key={schema.name}
      eventKey={schema.name}
    >
      <RecursionField schema={schema} onlyRenderProperties />
    </AntdMenu.SubMenu>
  );
});
