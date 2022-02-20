import { GeneralField } from '@formily/core';
import { ISchema, Schema } from '@formily/react';
import { Dropdown, Menu, MenuItemProps } from 'antd';
import React, { createContext, useContext } from 'react';
import { Designable } from '..';

interface SchemaSettingsProps {
  title?: any;
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
}

interface SchemaSettingsContextProps {
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
}

const SchemaSettingsContext = createContext<SchemaSettingsContextProps>(null);

export const useSchemaSettings = () => {
  return useContext(SchemaSettingsContext);
};

interface RemoveProps {
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: ISchema | ((s: ISchema) => boolean);
}

type SchemaSettingsNested = {
  Remove?: React.FC<RemoveProps>;
  Item?: React.FC<MenuItemProps>;
  Divider?: React.FC;
  [key: string]: any;
};

interface SchemaSettingsProviderProps {
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
}

export const SchemaSettingsProvider: React.FC<SchemaSettingsProviderProps> = (props) => {
  const { dn, field, fieldSchema, children } = props;
  return <SchemaSettingsContext.Provider value={{ dn, field, fieldSchema }}>{children}</SchemaSettingsContext.Provider>;
};

export const SchemaSettings: React.FC<SchemaSettingsProps> & SchemaSettingsNested = (props) => {
  const { title, dn, field, fieldSchema } = props;
  const DropdownMenu = (
    <Dropdown overlay={<Menu>{props.children}</Menu>}>
      {typeof title === 'string' ? <span>{title}</span> : title}
    </Dropdown>
  );
  if (dn) {
    return (
      <SchemaSettingsProvider dn={dn} field={field} fieldSchema={fieldSchema}>
        {DropdownMenu}
      </SchemaSettingsProvider>
    );
  }
  return DropdownMenu;
};

SchemaSettings.Item = (props) => {
  return (
    <Menu.Item {...props} style={{ minWidth: 120 }}>
      {props.children || props.title}
    </Menu.Item>
  );
};

SchemaSettings.ItemGroup = (props) => {
  return <Menu.ItemGroup {...props}>{props.children || props.title}</Menu.ItemGroup>;
};

SchemaSettings.SubMenu = (props) => {
  return <Menu.SubMenu {...props}>{props.children || props.title}</Menu.SubMenu>;
};

SchemaSettings.Divider = (props) => {
  return <Menu.Divider {...props} />;
};

SchemaSettings.Remove = (props: any) => {
  const { removeParentsIfNoChildren, breakRemoveOn } = props;
  const { dn } = useSchemaSettings();
  return (
    <Menu.Item
      style={{ minWidth: 120 }}
      onClick={() => {
        dn.remove(null, {
          removeParentsIfNoChildren,
          breakRemoveOn,
        });
      }}
    >
      移除
    </Menu.Item>
  );
};

SchemaSettings.SelectItem = (props) => {
  return null;
};

SchemaSettings.SwitchItem = (props) => {
  return null;
};

SchemaSettings.ModalItem = (props) => {
  return null;
};

SchemaSettings.DrawerItem = (props) => {
  return null;
};
