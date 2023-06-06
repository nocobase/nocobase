import { css } from '@emotion/css';
import { ArrayCollapse, ArrayItems, FormDialog, FormItem, FormLayout, Input } from '@formily/antd';
import { Field, GeneralField, createForm } from '@formily/core';
import { ISchema, Schema, SchemaOptionsContext, useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { error } from '@nocobase/utils/client';
import {
  Alert,
  Button,
  Cascader,
  CascaderProps,
  Dropdown,
  Empty,
  Menu,
  MenuItemProps,
  Modal,
  Select,
  Space,
  Switch,
} from 'antd';
import classNames from 'classnames';
import _, { cloneDeep } from 'lodash';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  APIClientProvider,
  ActionContext,
  CollectionFieldOptions,
  CollectionManagerContext,
  Designable,
  FormProvider,
  RemoteSchemaComponent,
  SchemaComponent,
  SchemaComponentContext,
  SchemaComponentOptions,
  createDesignable,
  findFormBlock,
  useAPIClient,
  useCollection,
  useCollectionManager,
  useCompile,
  useDesignable,
  useLinkageCollectionFilterOptions,
} from '..';
import { findFilterTargets, updateFilterTargets } from '../block-provider/hooks';
import { FilterBlockType, isSameCollection, useSupportedBlocks } from '../filter-provider/utils';
import { getTargetKey } from '../schema-component/antd/association-filter/utilts';
import { useSchemaTemplateManager } from '../schema-templates';
import { useBlockTemplateContext } from '../schema-templates/BlockTemplate';
import { FormDataTemplates } from './DataTemplates';
import { EnableChildCollections } from './EnableChildCollections';
import { FormLinkageRules } from './LinkageRules';
import { useLinkageCollectionFieldOptions } from './LinkageRules/action-hooks';

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
  SwitchItem?: React.FC<SwitchItemProps>;
  CascaderItem?: React.FC<CascaderProps<any> & Omit<MenuItemProps, 'title'> & { title: any }>;
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
      open={visible}
      onOpenChange={(visible) => {
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

SchemaSettings.Template = function Template(props) {
  const { componentName, collectionName, resourceName } = props;
  const { t } = useTranslation();
  const { getCollection } = useCollectionManager();
  const { dn, setVisible, template, fieldSchema } = useSchemaSettings();
  const compile = useCompile();
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
        const { title } = getCollection(collectionName);
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
                      default: `${compile(title)}_${t(componentName)}`,
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
        if (s['x-component'] === 'Grid' || s['x-component'] === 'BlockTemplate') {
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

SchemaSettings.FormItemTemplate = function FormItemTemplate(props) {
  const { insertAdjacentPosition = 'afterBegin', componentName, collectionName, resourceName } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const { getCollection } = useCollectionManager();
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
        const { title } = getCollection(collectionName);
        const gridSchema = findGridSchema(fieldSchema);
        const values = await FormDialog(t('Save as template'), () => {
          const componentTitle = {
            FormItem: t('Form'),
            ReadPrettyFormItem: t('Details'),
          };
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
                      default: `${compile(title)}_${componentTitle[componentName] || componentName}`,
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
      {t('Save as block template')}
    </SchemaSettings.Item>
  );
};

SchemaSettings.Item = function Item(props) {
  const { eventKey } = props;
  const key = useMemo(() => uid(), []);
  return (
    <Menu.Item
      key={key}
      eventKey={(eventKey as any) || key}
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

SchemaSettings.Remove = function Remove(props: any) {
  const { confirm, removeParentsIfNoChildren, breakRemoveOn } = props;
  const { dn, template } = useSchemaSettings();
  const { t } = useTranslation();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const ctx = useBlockTemplateContext();
  const form = useForm();
  return (
    <SchemaSettings.Item
      eventKey="remove"
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
            if (field && field.required) {
              field.required = false;
              fieldSchema['required'] = false;
            }
            if (template && ctx?.dn) {
              ctx?.dn.remove(null, options);
            } else {
              dn.remove(null, options);
            }
            delete form.values[fieldSchema.name];
          },
        });
      }}
    >
      {t('Delete')}
    </SchemaSettings.Item>
  );
};

SchemaSettings.ConnectDataBlocks = function ConnectDataBlocks(props: {
  type: FilterBlockType;
  emptyDescription?: string;
}) {
  const { type, emptyDescription } = props;
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const collection = useCollection();
  const dataBlocks = useSupportedBlocks(type);
  let { targets = [], uid } = findFilterTargets(fieldSchema);
  const compile = useCompile();

  const Content = dataBlocks.map((block) => {
    const title = `${compile(block.collection.title)} #${block.uid.slice(0, 4)}`;
    const onHover = () => {
      const dom = block.dom;
      const designer = dom.querySelector('.general-schema-designer') as HTMLElement;
      if (designer) {
        designer.style.display = 'block';
      }
      dom.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
      dom.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    };
    const onLeave = () => {
      const dom = block.dom;
      const designer = dom.querySelector('.general-schema-designer') as HTMLElement;
      if (designer) {
        designer.style.display = null;
      }
      dom.style.boxShadow = 'none';
    };
    if (isSameCollection(block.collection, collection)) {
      return (
        <SchemaSettings.SwitchItem
          key={block.uid}
          title={title}
          checked={targets.some((target) => target.uid === block.uid)}
          onChange={(checked) => {
            if (checked) {
              targets.push({ uid: block.uid });
            } else {
              targets = targets.filter((target) => target.uid !== block.uid);
              block.clearFilter(uid);
            }

            updateFilterTargets(fieldSchema, targets);
            dn.emit('patch', {
              schema: {
                ['x-uid']: uid,
                'x-filter-targets': targets,
              },
            }).catch(error);
            dn.refresh();
          }}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
        />
      );
    }

    const target = targets.find((target) => target.uid === block.uid);
    // 与筛选区块的数据表具有关系的表
    return (
      <SchemaSettings.SelectItem
        key={block.uid}
        title={title}
        value={target?.field || ''}
        options={[
          ...block.associatedFields
            .filter((field) => field.target === collection.name)
            .map((field) => {
              return {
                label: compile(field.uiSchema.title) || field.name,
                value: `${field.name}.${getTargetKey(field)}`,
              };
            }),
          {
            label: t('Unconnected'),
            value: '',
          },
        ]}
        onChange={(value) => {
          if (value === '') {
            targets = targets.filter((target) => target.uid !== block.uid);
            block.clearFilter(uid);
          } else {
            targets = targets.filter((target) => target.uid !== block.uid);
            targets.push({ uid: block.uid, field: value });
          }
          updateFilterTargets(fieldSchema, targets);
          dn.emit('patch', {
            schema: {
              ['x-uid']: uid,
              'x-filter-targets': targets,
            },
          });
          dn.refresh();
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      />
    );
  });

  return (
    <SchemaSettings.SubMenu title={t('Connect data blocks')}>
      {Content.length ? (
        Content
      ) : (
        <Empty
          style={{ width: 160, padding: '0 1em' }}
          description={emptyDescription}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </SchemaSettings.SubMenu>
  );
};

SchemaSettings.SelectItem = function SelectItem(props) {
  const { title, options, value, onChange, openOnHover, onClick: _onClick, ...others } = props;
  const [open, setOpen] = useState(false);

  const onClick = (...args) => {
    setOpen(false);
    _onClick?.(...args);
  };
  const onMouseEnter = useCallback(() => setOpen(true), []);

  // 鼠标 hover 时，打开下拉框
  const moreProps = openOnHover
    ? {
        onMouseEnter,
        open,
      }
    : {};

  return (
    <SchemaSettings.Item {...others}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <Select
          bordered={false}
          defaultValue={value}
          onChange={(...arg) => (setOpen(false), onChange(...arg))}
          options={options}
          style={{ textAlign: 'right', minWidth: 100 }}
          onClick={onClick}
          {...moreProps}
        />
      </div>
    </SchemaSettings.Item>
  );
};

SchemaSettings.CascaderItem = (props: CascaderProps<any> & { title: any }) => {
  const { title, options, value, onChange, ...others } = props;
  return (
    <SchemaSettings.Item {...(others as any)}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <Cascader
          bordered={false}
          defaultValue={value}
          onChange={onChange as any}
          options={options}
          style={{ textAlign: 'right', minWidth: 100 }}
        />
      </div>
    </SchemaSettings.Item>
  );
};

interface SwitchItemProps extends Omit<MenuItemProps, 'onChange'> {
  title: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}

SchemaSettings.SwitchItem = function SwitchItem(props) {
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

SchemaSettings.PopupItem = function PopupItem(props) {
  const { schema, ...others } = props;
  const [visible, setVisible] = useState(false);
  const ctx = useContext(SchemaSettingsContext);
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

SchemaSettings.ModalItem = function ModalItem(props) {
  const {
    hidden,
    title,
    components,
    scope,
    effects,
    schema,
    onSubmit,
    asyncGetInitialValues,
    initialValues,
    width = 'fit-content',
    ...others
  } = props;
  const options = useContext(SchemaOptionsContext);
  const cm = useContext(CollectionManagerContext);
  const apiClient = useAPIClient();
  if (hidden) {
    return null;
  }
  return (
    <SchemaSettings.Item
      {...others}
      onClick={async () => {
        const values = asyncGetInitialValues ? await asyncGetInitialValues() : initialValues;
        FormDialog({ title: schema.title || title, width }, () => {
          return (
            <CollectionManagerContext.Provider value={cm}>
              <SchemaComponentOptions scope={options.scope} components={options.components}>
                <FormLayout layout={'vertical'} style={{ minWidth: 520 }}>
                  <APIClientProvider apiClient={apiClient}>
                    <SchemaComponent components={components} scope={scope} schema={schema} />
                  </APIClientProvider>
                </FormLayout>
              </SchemaComponentOptions>
            </CollectionManagerContext.Provider>
          );
        })
          .open({
            initialValues: values,
            effects,
          })
          .then((values) => {
            onSubmit(values);
            return values;
          })
          .catch((err) => {
            console.error(err);
          });
      }}
    >
      {props.children || props.title}
    </SchemaSettings.Item>
  );
};

SchemaSettings.BlockTitleItem = function BlockTitleItem() {
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

SchemaSettings.DefaultSortingRules = function DefaultSortingRules(props) {
  const { sort, sortFields, onSubmit } = props;
  const { t } = useTranslation();

  return (
    <SchemaSettings.ModalItem
      title={t('Set default sorting rules')}
      components={{ ArrayItems }}
      schema={
        {
          type: 'object',
          title: t('Set default sorting rules'),
          properties: {
            sort: {
              type: 'array',
              default: sort,
              'x-component': 'ArrayItems',
              'x-decorator': 'FormItem',
              items: {
                type: 'object',
                properties: {
                  space: {
                    type: 'void',
                    'x-component': 'Space',
                    properties: {
                      sort: {
                        type: 'void',
                        'x-decorator': 'FormItem',
                        'x-component': 'ArrayItems.SortHandle',
                      },
                      field: {
                        type: 'string',
                        enum: sortFields,
                        required: true,
                        'x-decorator': 'FormItem',
                        'x-component': 'Select',
                        'x-component-props': {
                          style: {
                            width: 260,
                          },
                        },
                      },
                      direction: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Radio.Group',
                        'x-component-props': {
                          optionType: 'button',
                        },
                        enum: [
                          {
                            label: t('ASC'),
                            value: 'asc',
                          },
                          {
                            label: t('DESC'),
                            value: 'desc',
                          },
                        ],
                      },
                      remove: {
                        type: 'void',
                        'x-decorator': 'FormItem',
                        'x-component': 'ArrayItems.Remove',
                      },
                    },
                  },
                },
              },
              properties: {
                add: {
                  type: 'void',
                  title: t('Add sort field'),
                  'x-component': 'ArrayItems.Addition',
                },
              },
            },
          },
        } as ISchema
      }
      onSubmit={onSubmit}
    />
  );
};

SchemaSettings.LinkageRules = function LinkageRules(props) {
  const { collectionName } = props;
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { getTemplateById } = useSchemaTemplateManager();
  const type = ['Action', 'Action.Link'].includes(fieldSchema['x-component']) ? 'button' : 'field';
  const gridSchema = findGridSchema(fieldSchema) || fieldSchema;
  return (
    <SchemaSettings.ModalItem
      title={t('Linkage rules')}
      components={{ ArrayCollapse, FormLayout }}
      width={770}
      schema={
        {
          type: 'object',
          title: t('Linkage rules'),
          properties: {
            fieldReaction: {
              'x-component': FormLinkageRules,
              'x-component-props': {
                useProps: () => {
                  const options = useLinkageCollectionFilterOptions(collectionName);
                  return {
                    options,
                    defaultValues: gridSchema?.['x-linkage-rules'] || fieldSchema?.['x-linkage-rules'],
                    type,
                    linkageOptions: useLinkageCollectionFieldOptions(collectionName),
                    collectionName,
                  };
                },
              },
            },
          },
        } as ISchema
      }
      onSubmit={(v) => {
        const rules = [];
        for (const rule of v.fieldReaction.rules) {
          rules.push(_.pickBy(rule, _.identity));
        }
        const templateId = gridSchema['x-component'] === 'BlockTemplate' && gridSchema['x-component-props'].templateId;
        const uid = (templateId && getTemplateById(templateId).uid) || gridSchema['x-uid'];
        const schema = {
          ['x-uid']: uid,
        };

        gridSchema['x-linkage-rules'] = rules;
        schema['x-linkage-rules'] = rules;
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
};

export const useDataTemplates = (schema?: Schema) => {
  const fieldSchema = useFieldSchema();

  if (schema) {
    return {
      templateData: _.cloneDeep(schema['x-data-templates']),
    };
  }

  const formSchema = findFormBlock(fieldSchema) || fieldSchema;
  return {
    templateData: _.cloneDeep(formSchema?.['x-data-templates']),
  };
};

SchemaSettings.DataTemplates = function DataTemplates(props) {
  const designerCtx = useContext(SchemaComponentContext);
  const { collectionName } = props;
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const formSchema = findFormBlock(fieldSchema) || fieldSchema;
  const { templateData } = useDataTemplates();

  const schema = useMemo(
    () => ({
      type: 'object',
      title: t('Form data templates'),
      properties: {
        fieldReaction: {
          'x-component': FormDataTemplates,
          'x-component-props': {
            designerCtx,
            formSchema,
            useProps: () => {
              return {
                defaultValues: templateData,
                collectionName,
              };
            },
          },
        },
      },
    }),
    [templateData],
  );
  const onSubmit = useCallback((v) => {
    const data = { ...(formSchema['x-data-templates'] || {}), ...v.fieldReaction };

    // 当 Tree 组件开启 checkStrictly 属性时，会导致 checkedKeys 的值是一个对象，而不是数组，所以这里需要转换一下以支持旧版本
    data.items.forEach((item) => {
      item.fields = Array.isArray(item.fields) ? item.fields : item.fields.checked;
    });

    const schema = {
      ['x-uid']: formSchema['x-uid'],
      ['x-data-templates']: data,
    };
    formSchema['x-data-templates'] = data;
    dn.emit('patch', {
      schema,
    });
    dn.refresh();
  }, []);
  const title = useMemo(() => t('Form data templates'), []);
  const components = useMemo(() => ({ ArrayCollapse, FormLayout }), []);

  return (
    <SchemaSettings.ModalItem title={title} components={components} width={770} schema={schema} onSubmit={onSubmit} />
  );
};

SchemaSettings.EnableChildCollections = function EnableChildCollectionsItem(props) {
  const { collectionName } = props;
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const allowAddToCurrent = fieldSchema?.['x-allow-add-to-current'];
  return (
    <SchemaSettings.ModalItem
      title={t('Enable child collections')}
      components={{ ArrayItems, FormLayout }}
      width={600}
      schema={
        {
          type: 'object',
          title: t('Enable child collections'),
          properties: {
            enableChildren: {
              'x-component': EnableChildCollections,
              'x-component-props': {
                useProps: () => {
                  return {
                    defaultValues: fieldSchema?.['x-enable-children'],
                    collectionName,
                  };
                },
              },
            },
            allowAddToCurrent: {
              type: 'boolean',
              'x-content': "{{t('Allow adding records to the current collection')}}",
              'x-decorator': 'FormItem',
              'x-component': 'Checkbox',
              default: allowAddToCurrent === undefined ? true : allowAddToCurrent,
            },
          },
        } as ISchema
      }
      onSubmit={(v) => {
        const enableChildren = [];
        for (const item of v.enableChildren.childrenCollections) {
          enableChildren.push(_.pickBy(item, _.identity));
        }
        const uid = fieldSchema['x-uid'];
        const schema = {
          ['x-uid']: uid,
        };
        fieldSchema['x-enable-children'] = enableChildren;
        fieldSchema['x-allow-add-to-current'] = v.allowAddToCurrent;
        fieldSchema['x-component-props'] = {
          ...fieldSchema['x-component-props'],
          component: 'CreateRecordAction',
        };
        schema['x-enable-children'] = enableChildren;
        schema['x-allow-add-to-current'] = v.allowAddToCurrent;
        schema['x-component-props'] = {
          ...fieldSchema['x-component-props'],
          component: 'CreateRecordAction',
        };
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
};

// 是否显示默认值配置项
export const isShowDefaultValue = (collectionField: CollectionFieldOptions, getInterface) => {
  return (
    !['o2o', 'oho', 'obo', 'o2m', 'attachment', 'expression'].includes(collectionField?.interface) &&
    !isSystemField(collectionField, getInterface)
  );
};

// 是否是系统字段
export const isSystemField = (collectionField: CollectionFieldOptions, getInterface) => {
  const i = getInterface?.(collectionField?.interface);
  return i?.group === 'systemInfo';
};

export const isPatternDisabled = (fieldSchema: Schema) => {
  return fieldSchema?.['x-component-props']?.['pattern-disable'] == true;
};
