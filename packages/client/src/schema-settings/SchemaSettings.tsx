import { FormDialog, FormItem, FormLayout, Input } from '@formily/antd';
import { GeneralField } from '@formily/core';
import { ISchema, Schema, SchemaOptionsContext } from '@formily/react';
import { uid } from '@formily/shared';
import { Dropdown, Menu, MenuItemProps, Modal, Select, Switch } from 'antd';
import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionContext,
  createDesignable,
  Designable,
  SchemaComponent,
  SchemaComponentOptions,
  useActionContext,
  useAPIClient,
  useCollection
} from '..';
import { useSchemaTemplateManager } from '../schema-templates';
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
  template?: any;
  collectionName?: any;
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
  template?: any;
  collectionName?: any;
}

export const SchemaSettingsProvider: React.FC<SchemaSettingsProviderProps> = (props) => {
  const { children, fieldSchema, ...others } = props;
  const { getTemplateBySchemaId } = useSchemaTemplateManager();
  const { name } = useCollection();
  const template = getTemplateBySchemaId(fieldSchema['x-uid']);
  return (
    <SchemaSettingsContext.Provider value={{ collectionName: name, template, fieldSchema, ...others }}>
      {children}
    </SchemaSettingsContext.Provider>
  );
};

export const SchemaSettings: React.FC<SchemaSettingsProps> & SchemaSettingsNested = (props) => {
  const { title, dn, ...others } = props;
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
      <SchemaSettingsProvider visible={visible} setVisible={setVisible} dn={dn} {...others}>
        {DropdownMenu}
      </SchemaSettingsProvider>
    );
  }
  return DropdownMenu;
};

SchemaSettings.Template = (props) => {
  const { componentName, collectionName } = props;
  const { t } = useTranslation();
  const { dn, setVisible, template, fieldSchema } = useSchemaSettings();
  const api = useAPIClient();
  const { dn: tdn } = useBlockTemplateContext();
  const { saveAsTemplate, copyTemplateSchema } = useSchemaTemplateManager();
  if (!collectionName) {
    return null;
  }
  if (template) {
    return (
      <SchemaSettings.Item
        onClick={async () => {
          const schema = await copyTemplateSchema(template);
          const removed = tdn.removeWithoutEmit();
          tdn.insertAfterEnd(schema, {
            async onSuccess() {
              await api.request({
                url: `/uiSchemas:remove/${removed['x-uid']}`,
              });
            },
          });
        }}
      >
        {t('Convert reference to duplicate')}
      </SchemaSettings.Item>
    );
  }
  return (
    <SchemaSettings.Item
      onClick={async () => {
        setVisible(false);
        const values = await FormDialog('Save as template', () => {
          return (
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                components={{ Input, FormItem }}
                schema={{
                  type: 'object',
                  properties: {
                    name: {
                      title: '模板名称',
                      required: true,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                  },
                }}
              />
            </FormLayout>
          );
        }).open({});
        const sdn = createDesignable({
          api,
          refresh: dn.refresh.bind(dn),
          current: fieldSchema.parent,
        });
        sdn.loadAPIClientEvents();
        const { key } = await saveAsTemplate({
          collectionName,
          componentName,
          name: values.name,
          uid: fieldSchema['x-uid'],
        });
        sdn.removeWithoutEmit(fieldSchema);
        sdn.insertBeforeEnd({
          type: 'void',
          'x-component': 'BlockTemplate',
          'x-component-props': {
            templateId: key,
          },
        });
      }}
    >
      {t('Save as template')}
    </SchemaSettings.Item>
  );
};

SchemaSettings.Item = (props) => {
  let { eventKey } = props;
  return (
    <Menu.Item
      key={eventKey}
      eventKey={eventKey as any}
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
  return <Menu.ItemGroup {...props} />;
};

SchemaSettings.SubMenu = (props) => {
  return <Menu.SubMenu {...props} />;
};

SchemaSettings.Divider = (props) => {
  return <Menu.Divider {...props} />;
};

SchemaSettings.Remove = (props: any) => {
  const { confirm, removeParentsIfNoChildren, breakRemoveOn } = props;
  const { dn, template } = useSchemaSettings();
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
            if (template && ctx?.dn) {
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
        <Select
          bordered={false}
          defaultValue={value}
          onChange={onChange}
          options={options}
          style={{ textAlign: 'right', minWidth: 100 }}
        />
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
        <Switch size={'small'} checked={checked} style={{ marginLeft: 32 }} />
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
  const { hidden, title, components, scope, effects, schema, onSubmit, initialValues, ...others } = props;
  const options = useContext(SchemaOptionsContext);
  if (hidden) {
    return null;
  }
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
