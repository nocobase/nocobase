import { DesktopOutlined } from '@ant-design/icons';
import { observer, RecursionField, Schema, SchemaExpressionScopeContext, useFieldSchema } from '@formily/react';
import { Menu as AntdMenu } from 'antd';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { findKeysByUid, findMenuItem } from './util';

type ComposedMenu = React.FC<any> & {
  Item?: React.FC<any>;
  SubMenu?: React.FC<any>;
};

const MenuModeContext = createContext(null);

const useSideMenuRef = () => {
  const schema = useFieldSchema();
  const scope = useContext(SchemaExpressionScopeContext);
  const scopeKey = schema?.['x-component-props']?.['sideMenuRefScopeKey'];
  if (!scopeKey) {
    return;
  }
  return scope[scopeKey];
};

export const Menu: ComposedMenu = observer((props) => {
  let {
    onSelect,
    mode,
    defaultSelectedUid,
    sideMenuRefScopeKey,
    defaultSelectedKeys: dSelectedKeys,
    defaultOpenKeys: dOpenKeys,
    ...others
  } = props;
  const schema = useFieldSchema();
  const sideMenuRef = useSideMenuRef();
  const [defaultSelectedKeys, setDefaultSelectedKeys] = useState(() => {
    if (dSelectedKeys) {
      return dSelectedKeys;
    }
    if (defaultSelectedUid) {
      return findKeysByUid(schema, defaultSelectedUid);
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [defaultOpenKeys, setDefaultOpenKeys] = useState(() => {
    if (['inline', 'mix'].includes(mode)) {
      return dOpenKeys || defaultSelectedKeys;
    }
    return dOpenKeys;
  });
  const [sideMenuSchema, setSideMenuSchema] = useState<Schema>(() => {
    const key = defaultSelectedKeys?.[0] || null;
    if (mode === 'mix' && key) {
      const s = schema.properties?.[key];
      if (s['x-component'] === 'Menu.SubMenu') {
        return s;
      }
    }
    return null;
  });
  useEffect(() => {
    if (['inline', 'mix'].includes(mode)) {
      setDefaultOpenKeys(defaultSelectedKeys);
    }
  }, [defaultSelectedKeys]);
  useEffect(() => {
    const sideMenuElement = sideMenuRef?.current as HTMLElement;
    if (!sideMenuElement) {
      return;
    }
    sideMenuElement.style.display = sideMenuSchema?.properties ? 'block' : 'none';
  }, [sideMenuSchema?.properties, sideMenuRef]);
  return (
    <MenuModeContext.Provider value={mode}>
      <AntdMenu
        {...others}
        onSelect={(info: any) => {
          const s = schema.properties[info.key];
          if (mode === 'mix') {
            setSideMenuSchema(s);
            if (!s?.properties) {
              onSelect && onSelect(info);
            } else {
              const menuItemSchema = findMenuItem(s);
              if (!menuItemSchema) {
                return;
              }
              // TODO
              setLoading(true);
              const keys = findKeysByUid(schema, menuItemSchema['x-uid']);
              setDefaultSelectedKeys(keys);
              setTimeout(() => {
                setLoading(false);
              }, 100);
              onSelect &&
                onSelect({
                  key: menuItemSchema.name,
                  item: {
                    props: {
                      schema: menuItemSchema,
                    },
                  },
                });
            }
          } else {
            onSelect && onSelect(info);
          }
        }}
        mode={mode === 'mix' ? 'horizontal' : mode}
        defaultOpenKeys={defaultOpenKeys}
        defaultSelectedKeys={defaultSelectedKeys}
      >
        <RecursionField schema={schema} onlyRenderProperties />
      </AntdMenu>
      {loading
        ? null
        : mode === 'mix' &&
          sideMenuSchema?.properties &&
          sideMenuRef?.current?.firstChild &&
          createPortal(
            <MenuModeContext.Provider value={'inline'}>
              <AntdMenu
                mode={'inline'}
                defaultOpenKeys={defaultOpenKeys}
                defaultSelectedKeys={defaultSelectedKeys}
                onSelect={(info) => {
                  onSelect && onSelect(info);
                }}
              >
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
