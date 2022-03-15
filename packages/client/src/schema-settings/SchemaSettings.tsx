import { FormDialog, FormLayout } from '@formily/antd';
import { GeneralField } from '@formily/core';
import { ISchema, Schema, SchemaOptionsContext } from '@formily/react';
import { uid } from '@formily/shared';
import { Dropdown, Menu, MenuItemProps, Modal, Select, Switch } from 'antd';
import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionContext, Designable, SchemaComponent, SchemaComponentOptions, useActionContext } from '..';
import { useBlockTemplateContext } from '../schema-templates/BlockTemplate';

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
  setVisible?: any;
  visible?: any;
}

const SchemaSettingsContext = createContext<SchemaSettingsContextProps>(null);

export const useSchemaSettings = () => {
  return useContext(SchemaSettingsContext);
};

interface RemoveProps {
  confirm?: any;
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
  setVisible?: any;
  visible?: any;
}

export const SchemaSettingsProvider: React.FC<SchemaSettingsProviderProps> = (props) => {
  const { visible, setVisible, dn, field, fieldSchema, children } = props;
  return (
    <SchemaSettingsContext.Provider value={{ visible, setVisible, dn, field, fieldSchema }}>
      {children}
    </SchemaSettingsContext.Provider>
  );
};

export const SchemaSettings: React.FC<SchemaSettingsProps> & SchemaSettingsNested = (props) => {
  const { title, dn, field, fieldSchema } = props;
  const [visible, setVisible] = useState(false);
  const DropdownMenu = (
    <Dropdown
      visible={visible}
      onVisibleChange={(visible) => {
        setVisible(visible);
      }}
      overlay={<Menu>{props.children}</Menu>}
    >
      {typeof title === 'string' ? <span>{title}</span> : title}
    </Dropdown>
  );
  if (dn) {
    return (
      <SchemaSettingsProvider visible={visible} setVisible={setVisible} dn={dn} field={field} fieldSchema={fieldSchema}>
        {DropdownMenu}
      </SchemaSettingsProvider>
    );
  }
  return DropdownMenu;
};

SchemaSettings.Item = (props) => {
  const { eventKey } = props;
  return (
    <Menu.Item
      key={eventKey}
      eventKey={eventKey}
      {...props}
      onClick={(info) => {
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
  return <Menu.SubMenu {...props} />;
};

SchemaSettings.Divider = (props) => {
  return <Menu.Divider {...props} />;
};

SchemaSettings.Remove = (props: any) => {
  const { confirm, removeParentsIfNoChildren, breakRemoveOn } = props;
  const { dn, fieldSchema } = useSchemaSettings();
  const { t } = useTranslation();
  const ctx = useBlockTemplateContext();
  return (
    <SchemaSettings.Item
      onClick={() => {
        Modal.confirm({
          title: t('Delete block'),
          content: t('Are you sure you want to delete it?'),
          ...confirm,
          onOk() {
            const options = {
              removeParentsIfNoChildren,
              breakRemoveOn,
            };
            if (ctx?.dn) {
              ctx?.dn.remove(null, options);
            } else {
              dn.remove(null, options);
            }
          },
        });
      }}
    >
      {t('Delete')}
    </SchemaSettings.Item>
  );
};

SchemaSettings.SelectItem = (props) => {
  const { title, options, value, onChange, ...others } = props;
  return (
    <SchemaSettings.Item {...others}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <Select bordered={false} defaultValue={value} onChange={onChange} options={options} style={{ minWidth: 100 }} />
      </div>
    </SchemaSettings.Item>
  );
};

SchemaSettings.SwitchItem = (props) => {
  const { title, onChange, ...others } = props;
  const [checked, setChecked] = useState(!!props.checked);
  return (
    <SchemaSettings.Item
      {...others}
      onClick={() => {
        onChange?.(!checked);
        setChecked(!checked);
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <Switch size={'small'} checked={checked} />
      </div>
    </SchemaSettings.Item>
  );
};

SchemaSettings.PopupItem = (props) => {
  const { schema, ...others } = props;
  const [visible, setVisible] = useState(false);
  const ctx = useContext(SchemaSettingsContext);
  const actx = useActionContext();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <SchemaSettings.Item
        {...others}
        onClick={() => {
          // actx.setVisible(false);
          ctx.setVisible(false);
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

SchemaSettings.ModalItem = (props) => {
  const { title, components, scope, effects, schema, onSubmit, initialValues, ...others } = props;
  const options = useContext(SchemaOptionsContext);
  return (
    <SchemaSettings.Item
      {...others}
      onClick={() => {
        FormDialog(schema.title || title, () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={options.components}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent components={components} scope={scope} schema={schema} />
              </FormLayout>
            </SchemaComponentOptions>
          );
        })
          .open({
            initialValues,
            effects,
          })
          .then((values) => {
            onSubmit(values);
          });
      }}
    >
      {props.children || props.title}
    </SchemaSettings.Item>
  );
};
