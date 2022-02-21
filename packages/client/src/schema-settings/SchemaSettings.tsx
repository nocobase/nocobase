import { GeneralField } from '@formily/core';
import { ISchema, Schema } from '@formily/react';
import { uid } from '@formily/shared';
import { Dropdown, Menu, MenuItemProps, Modal } from 'antd';
import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionContext, Designable, SchemaComponent } from '..';

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
  Popup?: React.FC<MenuItemProps & { schema?: ISchema }>;
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
    <Menu.Item
      {...props}
      onClick={(info) => {
        //
        info.domEvent.preventDefault();
        info.domEvent.stopPropagation();
        props?.onClick?.(info);
      }}
      style={{ minWidth: 120 }}
    >
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
  const { confirm, removeParentsIfNoChildren, breakRemoveOn } = props;
  const { dn } = useSchemaSettings();
  const { t } = useTranslation();
  return (
    <SchemaSettings.Item
      onClick={() => {
        Modal.confirm({
          title: t('Delete block'),
          content: t('Are you sure you want to delete it?'),
          ...confirm,
          onOk() {
            dn.remove(null, {
              removeParentsIfNoChildren,
              breakRemoveOn,
            });
          },
        });
      }}
    >
      {t('Delete')}
    </SchemaSettings.Item>
  );
};

SchemaSettings.SelectItem = (props) => {
  return null;
};

SchemaSettings.SwitchItem = (props) => {
  return null;
};

SchemaSettings.Popup = (props) => {
  const { schema, ...others } = props;
  const [visible, setVisible] = useState(false);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <SchemaSettings.Item
        {...others}
        onClick={() => {
          setVisible(true);
        }}
      >
        {props.children || props.title}
      </SchemaSettings.Item>
      <SchemaComponent
        schema={{
          name: uid(),
          ...schema,
        }}
      />
    </ActionContext.Provider>
  );
};

SchemaSettings.DrawerItem = (props) => {
  const [visible, setVisible] = useState(false);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <SchemaSettings.Item {...props}>{props.children || props.title}</SchemaSettings.Item>
    </ActionContext.Provider>
  );
};
