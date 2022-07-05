import { css } from '@emotion/css';
import { FormDialog, FormItem, FormLayout, Input } from '@formily/antd';
import { createForm, GeneralField } from '@formily/core';
import { ISchema, Schema, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Alert, Button, Dropdown, Menu, MenuItemProps, Modal, Select, Space, Switch } from 'antd';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  ActionContext,
  CollectionManagerContext,
  createDesignable,
  Designable,
  FormProvider,
  RemoteSchemaComponent,
  SchemaComponent,
  SchemaComponentOptions,
  useActionContext,
  useAPIClient,
  useCollection,
  useCompile,
  useDesignable
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
  const { getTemplateBySchema } = useSchemaTemplateManager();
  const { name } = useCollection();
  const template = getTemplateBySchema(fieldSchema);
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
      overlayClassName={classNames(
        'nb-schema-initializer-button-overlay',
        css`
          .ant-dropdown-menu-item-group-list {
            max-height: 40vh;
            overflow: auto;
          }
        `,
      )}
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
  const { componentName, collectionName, resourceName } = props;
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
        const values = await FormDialog(t('Save as template'), () => {
          return (
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                components={{ Input, FormItem }}
                schema={{
                  type: 'object',
                  properties: {
                    name: {
                      title: t('Template name'),
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
          t,
          api,
          refresh: dn.refresh.bind(dn),
          current: fieldSchema.parent,
        });
        sdn.loadAPIClientEvents();
        const { key } = await saveAsTemplate({
          collectionName,
          resourceName,
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

const findGridSchema = (fieldSchema) => {
  return fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'FormV2') {
      const f = s.reduceProperties((buf, s) => {
        if (s['x-component'] === 'Grid') {
          return s;
        }
        return buf;
      }, null);
      if (f) {
        return f;
      }
    }
    return buf;
  }, null);
};

const findBlockTemplateSchema = (fieldSchema) => {
  return fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'FormV2') {
      const f = s.reduceProperties((buf, s) => {
        if (s['x-component'] === 'BlockTemplate') {
          return s;
        }
        return buf;
      }, null);
      if (f) {
        return f;
      }
    }
    return buf;
  }, null);
};

SchemaSettings.FormItemTemplate = (props) => {
  const { insertAdjacentPosition = 'afterBegin', componentName, collectionName, resourceName } = props;
  const { t } = useTranslation();
  const { dn, setVisible, template, fieldSchema } = useSchemaSettings();
  const api = useAPIClient();
  const { saveAsTemplate, copyTemplateSchema } = useSchemaTemplateManager();
  if (!collectionName) {
    return null;
  }
  if (template) {
    return (
      <SchemaSettings.Item
        onClick={async () => {
          const schema = await copyTemplateSchema(template);
          const templateSchema = findBlockTemplateSchema(fieldSchema);
          const sdn = createDesignable({
            t,
            api,
            refresh: dn.refresh.bind(dn),
            current: templateSchema.parent,
          });
          sdn.loadAPIClientEvents();
          sdn.removeWithoutEmit(templateSchema);
          sdn.insertAdjacent(insertAdjacentPosition, schema, {
            async onSuccess() {
              await api.request({
                url: `/uiSchemas:remove/${templateSchema['x-uid']}`,
              });
            },
          });
          fieldSchema['x-template-key'] = null;
          await api.request({
            url: `uiSchemas:patch`,
            method: 'post',
            data: {
              'x-uid': fieldSchema['x-uid'],
              'x-template-key': null,
            },
          });
          dn.refresh();
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
        const gridSchema = findGridSchema(fieldSchema);
        const values = await FormDialog(t('Save as template'), () => {
          return (
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                components={{ Input, FormItem }}
                schema={{
                  type: 'object',
                  properties: {
                    name: {
                      title: t('Template name'),
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
          t,
          api,
          refresh: dn.refresh.bind(dn),
          current: gridSchema.parent,
        });
        sdn.loadAPIClientEvents();
        const { key } = await saveAsTemplate({
          collectionName,
          resourceName,
          componentName,
          name: values.name,
          uid: gridSchema['x-uid'],
        });
        sdn.removeWithoutEmit(gridSchema);
        sdn.insertAdjacent(insertAdjacentPosition, {
          type: 'void',
          'x-component': 'BlockTemplate',
          'x-component-props': {
            templateId: key,
          },
        });
        fieldSchema['x-template-key'] = key;
        await api.request({
          url: `uiSchemas:patch`,
          method: 'post',
          data: {
            'x-uid': fieldSchema['x-uid'],
            'x-template-key': key,
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

SchemaSettings.ActionModalItem = React.memo((props: any) => {
  const { title, onSubmit, initialValues, initialSchema, schema, modalTip, components, ...others } = props;
  const [visible, setVisible] = useState(false);
  const [schemaUid, setSchemaUid] = useState<string>(props.uid);
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const ctx = useContext(SchemaSettingsContext);
  const { dn } = useSchemaSettings();
  const compile = useCompile();
  const api = useAPIClient();

  const form = useMemo(
    () =>
      createForm({
        initialValues: cloneDeep(initialValues),
        values: cloneDeep(initialValues),
      }),
    [],
  );

  const cancelHandler = () => {
    setVisible(false);
  };

  const submitHandler = async () => {
    await form.submit();
    onSubmit?.(cloneDeep(form.values));
    setVisible(false);
  };

  const openAssignedFieldValueHandler = async () => {
    if (!schemaUid && initialSchema?.['x-uid']) {
      fieldSchema['x-action-settings'].schemaUid = initialSchema['x-uid'];
      dn.emit('patch', { schema: fieldSchema });
      await api.resource('uiSchemas').insert({ values: initialSchema });
      setSchemaUid(initialSchema['x-uid']);
    }

    ctx.setVisible(false);
    setVisible(true);
  };

  return (
    <>
      <SchemaSettings.Item {...others} onClick={openAssignedFieldValueHandler} onKeyDown={(e) => e.stopPropagation()}>
        {props.children || props.title}
      </SchemaSettings.Item>
      {createPortal(
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
        >
          <Modal
            width={'50%'}
            title={compile(title)}
            {...others}
            destroyOnClose
            visible={visible}
            onCancel={cancelHandler}
            footer={
              <Space>
                <Button onClick={cancelHandler}>{t('Cancel')}</Button>
                <Button type="primary" onClick={submitHandler}>
                  {t('Submit')}
                </Button>
              </Space>
            }
          >
            <FormProvider form={form}>
              <FormLayout layout={'vertical'}>
                {modalTip && <Alert message={modalTip} />}
                {modalTip && <br />}
                {visible && schemaUid && <RemoteSchemaComponent noForm components={components} uid={schemaUid} />}
                {visible && schema && <SchemaComponent components={components} schema={schema} />}
              </FormLayout>
            </FormProvider>
          </Modal>
        </div>,
        document.body,
      )}
    </>
  );
});

SchemaSettings.ModalItem = (props) => {
  const { hidden, title, components, scope, effects, schema, onSubmit, initialValues, ...others } = props;
  const options = useContext(SchemaOptionsContext);
  const cm = useContext(CollectionManagerContext);
  if (hidden) {
    return null;
  }
  return (
    <SchemaSettings.Item
      {...others}
      onClick={() => {
        FormDialog(schema.title || title, () => {
          return (
            <CollectionManagerContext.Provider value={cm}>
              <SchemaComponentOptions scope={options.scope} components={options.components}>
                <FormLayout layout={'vertical'}>
                  <SchemaComponent components={components} scope={scope} schema={schema} />
                </FormLayout>
              </SchemaComponentOptions>
            </CollectionManagerContext.Provider>
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

SchemaSettings.BlockTitleItem = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();

  return (
    <SchemaSettings.ModalItem
      title={t('Edit block title')}
      schema={
        {
          type: 'object',
          title: t('Edit block title'),
          properties: {
            title: {
              title: t('Block title'),
              type: 'string',
              default: fieldSchema?.['x-component-props']?.['title'],
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        } as ISchema
      }
      onSubmit={({ title }) => {
        const componentProps = fieldSchema['x-component-props'] || {};
        componentProps.title = title;
        fieldSchema['x-component-props'] = componentProps;
        field.componentProps.title = title;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
        dn.refresh();
      }}
    />
  );
};
