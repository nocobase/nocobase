import { css } from '@emotion/css';
import { ArrayCollapse, ArrayItems, FormItem, FormLayout, Input } from '@formily/antd-v5';
import { Field, GeneralField, createForm } from '@formily/core';
import { ISchema, Schema, SchemaOptionsContext, useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { error } from '@nocobase/utils/client';
import {
  Alert,
  App,
  Button,
  Cascader,
  CascaderProps,
  Dropdown,
  Empty,
  MenuItemProps,
  MenuProps,
  Modal,
  Select,
  Space,
  Switch,
} from 'antd';
import _, { cloneDeep } from 'lodash';
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  // @ts-ignore
  useTransition as useReactTransition,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  APIClientProvider,
  ActionContextProvider,
  CollectionFieldOptions,
  CollectionManagerContext,
  CollectionProvider,
  Designable,
  FormDialog,
  FormProvider,
  RemoteSchemaComponent,
  SchemaComponent,
  SchemaComponentContext,
  SchemaComponentOptions,
  createDesignable,
  findFormBlock,
  useAPIClient,
  useActionContext,
  useBlockRequestContext,
  useCollection,
  useCollectionManager,
  useCompile,
  useDesignable,
  useFilterBlock,
  useGlobalTheme,
  useLinkageCollectionFilterOptions,
  useSortFields,
} from '..';
import { useTableBlockContext } from '../block-provider';
import { findFilterTargets, updateFilterTargets } from '../block-provider/hooks';
import {
  FilterBlockType,
  getSupportFieldsByAssociation,
  getSupportFieldsByForeignKey,
  isSameCollection,
  useSupportedBlocks,
} from '../filter-provider/utils';
import { useCollectMenuItem, useCollectMenuItems, useMenuItem } from '../hooks/useMenuItem';
import { getTargetKey } from '../schema-component/antd/association-filter/utilts';
import { getFieldDefaultValue } from '../schema-component/antd/form-item';
import { parseVariables, useVariablesCtx } from '../schema-component/common/utils/uitls';
import { useSchemaTemplateManager } from '../schema-templates';
import { useBlockTemplateContext } from '../schema-templates/BlockTemplate';
import { FormDataTemplates } from './DataTemplates';
import { DateFormatCom, ExpiresRadio } from './DateFormat/ExpiresRadio';
import { EnableChildCollections } from './EnableChildCollections';
import { ChildDynamicComponent } from './EnableChildCollections/DynamicComponent';
import { FormLinkageRules } from './LinkageRules';
import { useLinkageCollectionFieldOptions } from './LinkageRules/action-hooks';
import { VariableInput } from './VariableInput/VariableInput';

interface SchemaSettingsProps {
  title?: any;
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
  children?: ReactNode;
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
  const { Component, getMenuItems } = useMenuItem();
  const [isPending, startTransition] = useReactTransition();

  const changeMenu = (v: boolean) => {
    // 当鼠标快速滑过时，终止菜单的渲染，防止卡顿
    startTransition(() => {
      setVisible(v);
    });
  };

  const items = getMenuItems(() => props.children);

  const dropdownMenu = () => (
    <>
      <Component />
      <Dropdown
        open={visible}
        onOpenChange={(open) => {
          changeMenu(open);
        }}
        overlayClassName={css`
          .ant-dropdown-menu-item-group-list {
            max-height: 300px;
            overflow-y: auto;
          }
        `}
        menu={{ items }}
      >
        <div data-testid={props['data-testid']}>{typeof title === 'string' ? <span>{title}</span> : title}</div>
      </Dropdown>
    </>
  );

  if (dn) {
    return (
      <SchemaSettingsProvider visible={visible} setVisible={setVisible} dn={dn} {...others}>
        {dropdownMenu()}
      </SchemaSettingsProvider>
    );
  }
  return dropdownMenu();
};

SchemaSettings.Template = function Template(props) {
  const { componentName, collectionName, resourceName, needRender } = props;
  const { t } = useTranslation();
  const { getCollection } = useCollectionManager();
  const { dn, setVisible, template, fieldSchema } = useSchemaSettings();
  const compile = useCompile();
  const api = useAPIClient();
  const { dn: tdn } = useBlockTemplateContext();
  const { saveAsTemplate, copyTemplateSchema } = useSchemaTemplateManager();
  const { theme } = useGlobalTheme();

  if (!collectionName && !needRender) {
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
        const { title } = collectionName ? getCollection(collectionName) : { title: '' };
        const values = await FormDialog(
          t('Save as template'),
          () => {
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
                        default: title ? `${compile(title)}_${t(componentName)}` : t(componentName),
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                      },
                    },
                  }}
                />
              </FormLayout>
            );
          },
          theme,
        ).open({});
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
  const { theme } = useGlobalTheme();

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
        const values = await FormDialog(
          t('Save as template'),
          () => {
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
          },
          theme,
        ).open({});
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
  const { pushMenuItem } = useCollectMenuItems();
  const { collectMenuItem } = useCollectMenuItem();
  const { eventKey } = props;
  const key = useMemo(() => uid(), []);
  const item = {
    ..._.omit(props, ['children']),
    key,
    eventKey: (eventKey as any) || key,
    onClick: (info) => {
      info.domEvent.preventDefault();
      info.domEvent.stopPropagation();
      props?.onClick?.(info);
    },
    style: { minWidth: 120 },
    label: props.children || props.title,
    title: props.title,
  } as MenuProps['items'][0];

  pushMenuItem?.(item);
  collectMenuItem?.(item);
  return null;
};

SchemaSettings.ItemGroup = function ItemGroup(props) {
  const { Component, getMenuItems } = useMenuItem();
  const { pushMenuItem } = useCollectMenuItems();
  const key = useMemo(() => uid(), []);
  const item = {
    key,
    type: 'group',
    title: props.title,
    label: props.title,
    children: getMenuItems(() => props.children),
  } as MenuProps['items'][0];

  pushMenuItem(item);
  return <Component />;
};

SchemaSettings.SubMenu = function SubMenu(props) {
  const { Component, getMenuItems } = useMenuItem();
  const { pushMenuItem } = useCollectMenuItems();
  const key = useMemo(() => uid(), []);
  const item = {
    key,
    label: props.title,
    title: props.title,
    children: getMenuItems(() => props.children),
  } as MenuProps['items'][0];

  pushMenuItem(item);
  return <Component />;
};

SchemaSettings.Divider = function Divider() {
  const { pushMenuItem } = useCollectMenuItems();
  const key = useMemo(() => uid(), []);
  const item = {
    key,
    type: 'divider',
  } as MenuProps['items'][0];

  pushMenuItem(item);
  return null;
};

SchemaSettings.Remove = function Remove(props: any) {
  const { confirm, removeParentsIfNoChildren, breakRemoveOn } = props;
  const { dn, template } = useSchemaSettings();
  const { t } = useTranslation();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const ctx = useBlockTemplateContext();
  const form = useForm();
  const { modal } = App.useApp();

  return (
    <SchemaSettings.Item
      eventKey="remove"
      onClick={() => {
        modal.confirm({
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
  const { inProvider } = useFilterBlock();
  const dataBlocks = useSupportedBlocks(type);
  // eslint-disable-next-line prefer-const
  let { targets = [], uid } = findFilterTargets(fieldSchema);
  const compile = useCompile();
  const { getAllCollectionsInheritChain } = useCollectionManager();

  if (!inProvider) {
    return null;
  }

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
          ...getSupportFieldsByAssociation(getAllCollectionsInheritChain(collection.name), block).map((field) => {
            return {
              label: compile(field.uiSchema.title) || field.name,
              value: `${field.name}.${getTargetKey(field)}`,
            };
          }),
          ...getSupportFieldsByForeignKey(collection, block).map((field) => {
            return {
              label: `${compile(field.uiSchema.title) || field.name} [${t('Foreign key')}]`,
              value: field.name,
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
        <SchemaSettings.Item>
          <Empty
            style={{ width: 160, padding: '0 1em' }}
            description={emptyDescription}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </SchemaSettings.Item>
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
          data-testid="antd-select"
          popupMatchSelectWidth={false}
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
          {...props}
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
    <ActionContextProvider value={{ visible, setVisible }}>
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
    </ActionContextProvider>
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
            open={visible}
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
SchemaSettings.ActionModalItem.displayName = 'SchemaSettings.ActionModalItem';

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
  const collection = useCollection();
  const apiClient = useAPIClient();
  const { theme } = useGlobalTheme();

  if (hidden) {
    return null;
  }
  return (
    <SchemaSettings.Item
      {...others}
      onClick={async () => {
        const values = asyncGetInitialValues ? await asyncGetInitialValues() : initialValues;
        FormDialog(
          { title: schema.title || title, width },
          () => {
            return (
              <CollectionManagerContext.Provider value={cm}>
                <CollectionProvider collection={collection}>
                  <SchemaComponentOptions scope={options.scope} components={options.components}>
                    <FormLayout
                      layout={'vertical'}
                      className={css`
                        // screen > 576px
                        @media (min-width: 576px) {
                          min-width: 520px;
                        }

                        // screen <= 576px
                        @media (max-width: 576px) {
                          min-width: 320px;
                        }
                      `}
                    >
                      <APIClientProvider apiClient={apiClient}>
                        <SchemaComponent components={components} scope={scope} schema={schema} />
                      </APIClientProvider>
                    </FormLayout>
                  </SchemaComponentOptions>
                </CollectionProvider>
              </CollectionManagerContext.Provider>
            );
          },
          theme,
        )
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
  const field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const allowAddToCurrent = fieldSchema?.['x-allow-add-to-current'];
  const form = useForm();
  const { getCollectionJoinField } = useCollectionManager();
  const ctx = useBlockRequestContext();
  const collectionField = getCollectionJoinField(fieldSchema?.parent?.['x-collection-field']) || {};
  const isAssocationAdd = fieldSchema?.parent?.['x-component'] === 'CollectionField';
  return (
    <SchemaSettings.ModalItem
      title={t('Enable child collections')}
      components={{ ArrayItems, FormLayout }}
      scope={{ isAssocationAdd }}
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
            linkageFromForm: {
              type: 'string',
              title: "{{t('Linkage with form fields')}}",
              'x-visible': '{{isAssocationAdd}}',
              'x-decorator': 'FormItem',
              'x-component': ChildDynamicComponent,
              'x-component-props': {
                rootCollection: ctx.props.collection || ctx.props.resource,
                form,
                collectionField,
              },
              default: fieldSchema?.['x-component-props']?.['linkageFromForm'],
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
          linkageFromForm: v?.linkageFromForm,
        };
        schema['x-enable-children'] = enableChildren;
        schema['x-allow-add-to-current'] = v.allowAddToCurrent;
        schema['x-component-props'] = {
          ...fieldSchema['x-component-props'],
          component: 'CreateRecordAction',
          linkageFromForm: v?.linkageFromForm,
        };
        field.componentProps['linkageFromForm'] = v.linkageFromForm;
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
};

SchemaSettings.DataFormat = function DateFormatConfig(props: { fieldSchema: Schema }) {
  const { fieldSchema } = props;
  const field = useField();
  const form = useForm();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { getCollectionJoinField } = useCollectionManager();
  const collectionField = getCollectionJoinField(fieldSchema?.['x-collection-field']) || {};
  const isShowTime = fieldSchema?.['x-component-props']?.showTime;
  const dateFormatDefaultValue =
    fieldSchema?.['x-component-props']?.dateFormat ||
    collectionField?.uiSchema?.['x-component-props']?.dateFormat ||
    'YYYY-MM-DD';
  const timeFormatDefaultValue =
    fieldSchema?.['x-component-props']?.timeFormat || collectionField?.uiSchema?.['x-component-props']?.timeFormat;
  return (
    <SchemaSettings.ModalItem
      title={t('Date display format')}
      schema={
        {
          type: 'object',
          properties: {
            dateFormat: {
              type: 'string',
              title: '{{t("Date format")}}',
              'x-component': ExpiresRadio,
              'x-decorator': 'FormItem',
              'x-decorator-props': {},
              'x-component-props': {
                className: css`
                  .ant-radio-wrapper {
                    display: flex;
                    margin: 5px 0px;
                  }
                `,
                defaultValue: 'dddd',
                formats: ['MMMMM Do YYYY', 'YYYY-MM-DD', 'MM/DD/YY', 'YYYY/MM/DD', 'DD/MM/YYYY'],
              },
              default: dateFormatDefaultValue,
              enum: [
                {
                  label: DateFormatCom({ format: 'MMMMM Do YYYY' }),
                  value: 'MMMMM Do YYYY',
                },
                {
                  label: DateFormatCom({ format: 'YYYY-MM-DD' }),
                  value: 'YYYY-MM-DD',
                },
                {
                  label: DateFormatCom({ format: 'MM/DD/YY' }),
                  value: 'MM/DD/YY',
                },
                {
                  label: DateFormatCom({ format: 'YYYY/MM/DD' }),
                  value: 'YYYY/MM/DD',
                },
                {
                  label: DateFormatCom({ format: 'DD/MM/YYYY' }),
                  value: 'DD/MM/YYYY',
                },
                {
                  label: 'custom',
                  value: 'custom',
                },
              ],
            },
            showTime: {
              default:
                isShowTime === undefined ? collectionField?.uiSchema?.['x-component-props']?.showTime : isShowTime,
              type: 'boolean',
              'x-decorator': 'FormItem',
              'x-component': 'Checkbox',
              'x-content': '{{t("Show time")}}',
              'x-reactions': [
                `{{(field) => {
              field.query('.timeFormat').take(f => {
                f.display = field.value ? 'visible' : 'none';
              });
            }}}`,
              ],
            },
            timeFormat: {
              type: 'string',
              title: '{{t("Time format")}}',
              'x-component': ExpiresRadio,
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                className: css`
                  margin-bottom: 0px;
                `,
              },
              'x-component-props': {
                className: css`
                  color: red;
                  .ant-radio-wrapper {
                    display: flex;
                    margin: 5px 0px;
                  }
                `,
                defaultValue: 'h:mm a',
                formats: ['hh:mm:ss a', 'HH:mm:ss'],
                timeFormat: true,
              },
              default: timeFormatDefaultValue,
              enum: [
                {
                  label: DateFormatCom({ format: 'hh:mm:ss a' }),
                  value: 'hh:mm:ss a',
                },
                {
                  label: DateFormatCom({ format: 'HH:mm:ss' }),
                  value: 'HH:mm:ss',
                },
                {
                  label: 'custom',
                  value: 'custom',
                },
              ],
            },
          },
        } as ISchema
      }
      onSubmit={(data) => {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        schema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'] = {
          ...(fieldSchema['x-component-props'] || {}),
          ...data,
        };
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = fieldSchema['x-component-props'];
        field.query(`.*.${fieldSchema.name}`).forEach((f) => {
          f.componentProps = fieldSchema['x-component-props'];
        });
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
};

const defaultInputStyle = css`
  & > .nb-form-item {
    flex: 1;
  }
`;

export const findParentFieldSchema = (fieldSchema: Schema) => {
  let parent = fieldSchema.parent;
  while (parent) {
    if (parent['x-component'] === 'CollectionField') {
      return parent;
    }
    parent = parent.parent;
  }
};

SchemaSettings.DefaultValue = function DefaultValueConfigure(props) {
  const variablesCtx = useVariablesCtx();
  const currentSchema = useFieldSchema();
  const fieldSchema = props?.fieldSchema ?? currentSchema;
  const field = useField<Field>();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const actionCtx = useActionContext();
  let targetField;
  const { getField } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const fieldSchemaWithoutRequired = _.omit(fieldSchema, 'required');
  if (collectionField?.target) {
    targetField = getCollectionJoinField(
      `${collectionField.target}.${fieldSchema['x-component-props']?.fieldNames?.label || 'id'}`,
    );
  }
  const parentFieldSchema = collectionField?.interface === 'm2o' && findParentFieldSchema(fieldSchema);
  const parentCollectionField = parentFieldSchema && getCollectionJoinField(parentFieldSchema?.['x-collection-field']);
  const tableCtx = useTableBlockContext();
  const isAllowContexVariable =
    actionCtx?.fieldSchema?.['x-action'] === 'customize:create' &&
    (collectionField?.interface === 'm2m' ||
      (parentCollectionField?.type === 'hasMany' && collectionField?.interface === 'm2o'));
  return (
    <SchemaSettings.ModalItem
      title={t('Set default value')}
      components={{ ArrayCollapse, FormLayout, VariableInput }}
      width={800}
      schema={
        {
          type: 'object',
          title: t('Set default value'),
          properties: {
            default: {
              'x-decorator': 'FormItem',
              'x-component': 'VariableInput',
              'x-component-props': {
                ...(fieldSchema?.['x-component-props'] || {}),
                collectionField,
                contextCollectionName: isAllowContexVariable && tableCtx.collection,
                schema: collectionField?.uiSchema,
                className: defaultInputStyle,
                renderSchemaComponent: function Com(props) {
                  const s = _.cloneDeep(fieldSchemaWithoutRequired) || ({} as Schema);
                  s.title = '';

                  // 任何一个非空字符串都可以
                  s.name = 'default';

                  s['x-read-pretty'] = false;
                  s['x-disabled'] = false;
                  const schema = {
                    ...(s || {}),
                    'x-decorator': 'FormItem',
                    'x-component-props': {
                      ...s['x-component-props'],
                      collectionName: collectionField?.collectionName,
                      targetField,
                      onChange: collectionField?.interface !== 'richText' ? props.onChange : null,
                      defaultValue: getFieldDefaultValue(s, collectionField),
                      style: {
                        width: '100%',
                        verticalAlign: 'top',
                        minWidth: '200px',
                      },
                    },
                  };
                  return <SchemaComponent schema={schema} />;
                },
              },
              title: t('Default value'),
              default: getFieldDefaultValue(fieldSchema, collectionField),
            },
          },
        } as ISchema
      }
      onSubmit={(v) => {
        const schema: ISchema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        if (field.value !== v.default) {
          field.value = parseVariables(v.default, variablesCtx);
        }
        fieldSchema.default = v.default;
        schema.default = v.default;
        dn.emit('patch', {
          schema,
          currentSchema,
        });
        dn.refresh();
      }}
    />
  );
};

SchemaSettings.SortingRule = function SortRuleConfigure(props) {
  const field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const currentSchema = useFieldSchema();
  const { getField } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = props?.fieldSchema ?? currentSchema;
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const sortFields = useSortFields(collectionField?.target);
  const defaultSort = fieldSchema['x-component-props']?.service?.params?.sort || [];
  const sort = defaultSort?.map((item: string) => {
    return item?.startsWith('-')
      ? {
          field: item.substring(1),
          direction: 'desc',
        }
      : {
          field: item,
          direction: 'asc',
        };
  });
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
      onSubmit={({ sort }) => {
        const sortArr = sort.map((item) => {
          return item.direction === 'desc' ? `-${item.field}` : item.field;
        });
        _.set(field.componentProps, 'service.params.sort', sortArr);
        props?.onSubmitCallBack?.(sortArr);
        fieldSchema['x-component-props'] = field.componentProps;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': field.componentProps,
          },
        });
      }}
    />
  );
};
// 是否显示默认值配置项
export const isShowDefaultValue = (collectionField: CollectionFieldOptions, getInterface) => {
  return (
    ![
      'o2o',
      'oho',
      'obo',
      'o2m',
      'attachment',
      'expression',
      'point',
      'lineString',
      'circle',
      'polygon',
      'sequence',
    ].includes(collectionField?.interface) && !isSystemField(collectionField, getInterface)
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
