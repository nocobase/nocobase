import { css } from '@emotion/css';
import { ArrayCollapse, ArrayItems, FormItem, FormLayout, Input } from '@formily/antd-v5';
import { Field, GeneralField, createForm } from '@formily/core';
import { ISchema, Schema, SchemaOptionsContext, useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { error } from '@nocobase/utils/client';
import type { DropdownProps } from 'antd';
import {
  Alert,
  App,
  Button,
  Cascader,
  CascaderProps,
  ConfigProvider,
  Dropdown,
  Empty,
  MenuItemProps,
  MenuProps,
  Modal,
  ModalFuncProps,
  Space,
  Switch,
} from 'antd';
import _, { cloneDeep, get, set } from 'lodash';
import React, {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  // @ts-ignore
  useTransition as useReactTransition,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Router } from 'react-router-dom';
import {
  APIClientProvider,
  ActionContextProvider,
  AssociationOrCollectionProvider,
  CollectionFieldOptions_deprecated,
  DataSourceApplicationProvider,
  Designable,
  FormDialog,
  FormProvider,
  CollectionRecordProvider,
  RemoteSchemaComponent,
  SchemaComponent,
  SchemaComponentContext,
  SchemaComponentOptions,
  createDesignable,
  findFormBlock,
  useAPIClient,
  useBlockRequestContext,
  useCollectionManager_deprecated,
  useCollection_deprecated,
  useCompile,
  useDataBlockProps,
  useDesignable,
  useFilterBlock,
  useGlobalTheme,
  useLinkageCollectionFilterOptions,
  useCollectionRecord,
  useRecord,
  useSchemaSettingsItem,
  useSortFields,
} from '..';
import {
  BlockRequestContext_deprecated,
  useFormBlockContext,
  useFormBlockType,
  useTableBlockContext,
} from '../block-provider';
import {
  FormActiveFieldsProvider,
  findFilterTargets,
  updateFilterTargets,
  useFormActiveFields,
} from '../block-provider/hooks';
import { SelectWithTitle, SelectWithTitleProps } from '../common/SelectWithTitle';
import { useDataSourceManager } from '../data-source/data-source/DataSourceManagerProvider';
import { useDataSourceKey } from '../data-source/data-source/DataSourceProvider';
import { useNiceDropdownMaxHeight } from '../common/useNiceDropdownHeight';
import {
  FilterBlockType,
  getSupportFieldsByAssociation,
  getSupportFieldsByForeignKey,
  isSameCollection,
  useSupportedBlocks,
} from '../filter-provider/utils';
import { FlagProvider } from '../flag-provider';
import { useCollectMenuItem, useCollectMenuItems, useMenuItem } from '../hooks/useMenuItem';
import { SubFormProvider, useSubFormValue } from '../schema-component/antd/association-field/hooks';
import { getTargetKey } from '../schema-component/antd/association-filter/utilts';
import { useSchemaTemplateManager } from '../schema-templates';
import { useBlockTemplateContext } from '../schema-templates/BlockTemplate';
import { useLocalVariables, useVariables } from '../variables';
import { FormDataTemplates } from './DataTemplates';
import { EnableChildCollections } from './EnableChildCollections';
import { ChildDynamicComponent } from './EnableChildCollections/DynamicComponent';
import { FormLinkageRules } from './LinkageRules';
import { useLinkageCollectionFieldOptions } from './LinkageRules/action-hooks';

export interface SchemaSettingsProps {
  title?: any;
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
  children?: ReactNode;
}

interface SchemaSettingsContextProps<T = any> {
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
  setVisible?: any;
  visible?: any;
  template?: any;
  collectionName?: any;
  designer?: T;
}

const SchemaSettingsContext = createContext<SchemaSettingsContextProps>(null);

export function useSchemaSettings<T = any>() {
  return useContext(SchemaSettingsContext) as SchemaSettingsContextProps<T>;
}

interface SchemaSettingsProviderProps {
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
  setVisible?: any;
  visible?: any;
  template?: any;
  collectionName?: any;
  designer?: any;
}

export const SchemaSettingsProvider: React.FC<SchemaSettingsProviderProps> = (props) => {
  const { children, fieldSchema, ...others } = props;
  const { getTemplateBySchema } = useSchemaTemplateManager();
  const { name } = useCollection_deprecated();
  const template = getTemplateBySchema(fieldSchema);
  return (
    <SchemaSettingsContext.Provider value={{ collectionName: name, template, fieldSchema, ...others }}>
      {children}
    </SchemaSettingsContext.Provider>
  );
};

export const SchemaSettingsDropdown: React.FC<SchemaSettingsProps> = (props) => {
  const { title, dn, ...others } = props;
  const [visible, setVisible] = useState(false);
  const { Component, getMenuItems } = useMenuItem();
  const [, startTransition] = useReactTransition();
  const dropdownMaxHeight = useNiceDropdownMaxHeight([visible]);

  const changeMenu: DropdownProps['onOpenChange'] = useCallback((nextOpen: boolean, info) => {
    if (info.source === 'trigger' || nextOpen) {
      // 当鼠标快速滑过时，终止菜单的渲染，防止卡顿
      startTransition(() => {
        setVisible(nextOpen);
      });
    }
  }, []);

  const items = getMenuItems(() => props.children);

  return (
    <SchemaSettingsProvider visible={visible} setVisible={setVisible} dn={dn} {...others}>
      <Component />
      <Dropdown
        open={visible}
        onOpenChange={changeMenu}
        overlayClassName={css`
          .ant-dropdown-menu-item-group-list {
            max-height: 300px;
            overflow-y: auto;
          }
        `}
        menu={{ items, style: { maxHeight: dropdownMaxHeight, overflowY: 'auto' } }}
      >
        <div data-testid={props['data-testid']}>{typeof title === 'string' ? <span>{title}</span> : title}</div>
      </Dropdown>
    </SchemaSettingsProvider>
  );
};

export const SchemaSettingsTemplate = function Template(props) {
  const { componentName, collectionName, resourceName, needRender } = props;
  const { t } = useTranslation();
  const { getCollection } = useCollectionManager_deprecated();
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
      <SchemaSettingsItem
        title="Convert reference to duplicate"
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
      </SchemaSettingsItem>
    );
  }
  return (
    <SchemaSettingsItem
      title="Save as template"
      onClick={async () => {
        setVisible(false);
        const collection = collectionName && getCollection(collectionName);
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
                        default: collection
                          ? `${compile(collection?.title || collection?.name)}_${t(componentName)}`
                          : t(componentName),
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
          dataSourceKey: collection.dataSource,
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
    </SchemaSettingsItem>
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

export const SchemaSettingsFormItemTemplate = function FormItemTemplate(props) {
  const { insertAdjacentPosition = 'afterBegin', componentName, collectionName, resourceName } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const { getCollection } = useCollectionManager_deprecated();
  const { dn, setVisible, template, fieldSchema } = useSchemaSettings();
  const api = useAPIClient();
  const { saveAsTemplate, copyTemplateSchema } = useSchemaTemplateManager();
  const { theme } = useGlobalTheme();

  if (!collectionName) {
    return null;
  }
  if (template) {
    return (
      <SchemaSettingsItem
        title="Convert reference to duplicate"
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
      </SchemaSettingsItem>
    );
  }
  return (
    <SchemaSettingsItem
      title="Save as block template"
      onClick={async () => {
        setVisible(false);
        const collection = collectionName && getCollection(collectionName);
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
                        default: collection
                          ? `${compile(collection?.title || collection?.name)}_${t(
                              componentTitle[componentName] || componentName,
                            )}`
                          : t(componentTitle[componentName] || componentName),
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
    </SchemaSettingsItem>
  );
};

export interface SchemaSettingsItemProps extends Omit<MenuItemProps, 'title'> {
  title: string;
}
export const SchemaSettingsItem: FC<SchemaSettingsItemProps> = (props) => {
  const { pushMenuItem } = useCollectMenuItems();
  const { collectMenuItem } = useCollectMenuItem();
  const { eventKey, title } = props;
  const { name } = useSchemaSettingsItem();

  if (process.env.NODE_ENV !== 'production' && !title) {
    throw new Error('SchemaSettingsItem must have a title');
  }

  const item = {
    key: title,
    ..._.omit(props, ['children', 'name']),
    eventKey: eventKey as any,
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

export interface SchemaSettingsItemGroupProps {
  title: string;
  children: any[];
}
export const SchemaSettingsItemGroup: FC<SchemaSettingsItemGroupProps> = (props) => {
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

export interface SchemaSettingsSubMenuProps {
  title: string;
  eventKey?: string;
  children: any;
}

export const SchemaSettingsSubMenu = function SubMenu(props: SchemaSettingsSubMenuProps) {
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

export const SchemaSettingsDivider = function Divider() {
  const { pushMenuItem } = useCollectMenuItems();
  const key = useMemo(() => uid(), []);
  const item = {
    key,
    type: 'divider',
  } as MenuProps['items'][0];

  pushMenuItem(item);
  return null;
};

export interface SchemaSettingsRemoveProps {
  confirm?: ModalFuncProps;
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: ISchema | ((s: ISchema) => boolean);
}
export const SchemaSettingsRemove: FC<SchemaSettingsRemoveProps> = (props) => {
  const { confirm, removeParentsIfNoChildren, breakRemoveOn } = props;
  const { dn, template } = useSchemaSettings();
  const { t } = useTranslation();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const ctx = useBlockTemplateContext();
  const form = useForm();
  const { modal } = App.useApp();
  const { removeActiveFieldName } = useFormActiveFields() || {};

  return (
    <SchemaSettingsItem
      title="Delete"
      eventKey="remove"
      onClick={() => {
        modal.confirm({
          title: t('Delete block'),
          content: t('Are you sure you want to delete it?'),
          ...confirm,
          async onOk() {
            const options = {
              removeParentsIfNoChildren,
              breakRemoveOn,
            };
            if (field?.required) {
              field.required = false;
              fieldSchema['required'] = false;
            }
            if (template && ctx?.dn) {
              await ctx?.dn.remove(null, options);
            } else {
              await dn.remove(null, options);
            }
            await confirm?.onOk?.();
            delete form.values[fieldSchema.name];
            removeActiveFieldName?.(fieldSchema.name as string);
            if (field?.setInitialValue && field?.reset) {
              field.setInitialValue(null);
              field.reset();
            }
          },
        });
      }}
    >
      {t('Delete')}
    </SchemaSettingsItem>
  );
};

interface SchemaSettingsConnectDataBlocksProps {
  type: FilterBlockType;
  emptyDescription?: string;
}

export const SchemaSettingsConnectDataBlocks: FC<SchemaSettingsConnectDataBlocksProps> = (props) => {
  const { type, emptyDescription } = props;
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const collection = useCollection_deprecated();
  const { inProvider } = useFilterBlock();
  const dataBlocks = useSupportedBlocks(type);
  // eslint-disable-next-line prefer-const
  let { targets = [], uid } = findFilterTargets(fieldSchema);
  const compile = useCompile();
  const { getAllCollectionsInheritChain } = useCollectionManager_deprecated();

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
        <SchemaSettingsSwitchItem
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
      <SchemaSettingsSelectItem
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
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      />
    );
  });

  return (
    <SchemaSettingsSubMenu title={t('Connect data blocks')}>
      {Content.length ? (
        Content
      ) : (
        <SchemaSettingsItem title="empty">
          <Empty
            style={{ width: 160, padding: '0 1em' }}
            description={emptyDescription}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </SchemaSettingsItem>
      )}
    </SchemaSettingsSubMenu>
  );
};

export interface SchemaSettingsSelectItemProps
  extends Omit<SchemaSettingsItemProps, 'onChange' | 'onClick'>,
    Omit<SelectWithTitleProps, 'title' | 'defaultValue'> {
  value?: SelectWithTitleProps['defaultValue'];
}
export const SchemaSettingsSelectItem: FC<SchemaSettingsSelectItemProps> = (props) => {
  const { title, options, value, onChange, ...others } = props;

  return (
    <SchemaSettingsItem title={title} {...others}>
      <SelectWithTitle {...{ title, defaultValue: value, onChange, options }} />
    </SchemaSettingsItem>
  );
};

export type SchemaSettingsCascaderItemProps = CascaderProps<any> & Omit<MenuItemProps, 'title'> & { title: any };
export const SchemaSettingsCascaderItem: FC<SchemaSettingsCascaderItemProps> = (props) => {
  const { title, options, value, onChange, ...others } = props;
  return (
    <SchemaSettingsItem title={title} {...(others as any)}>
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
    </SchemaSettingsItem>
  );
};

export interface SchemaSettingsSwitchItemProps extends Omit<MenuItemProps, 'onChange'> {
  title: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}
export const SchemaSettingsSwitchItem: FC<SchemaSettingsSwitchItemProps> = (props) => {
  const { title, onChange, ...others } = props;
  const [checked, setChecked] = useState(!!props.checked);
  return (
    <SchemaSettingsItem
      title={title}
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
    </SchemaSettingsItem>
  );
};

export interface SchemaSettingsPopupProps extends SchemaSettingsItemProps {
  schema?: ISchema;
}
export const SchemaSettingsPopupItem: FC<SchemaSettingsPopupProps> = (props) => {
  const { schema, ...others } = props;
  const [visible, setVisible] = useState(false);
  const ctx = useContext(SchemaSettingsContext);
  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <SchemaSettingsItem
        title={props.title}
        {...others}
        onClick={() => {
          // actx.setVisible(false);
          ctx.setVisible(false);
          setVisible(true);
        }}
      >
        {props.children || props.title}
      </SchemaSettingsItem>
      <SchemaComponent
        schema={{
          name: uid(),
          ...schema,
        }}
      />
    </ActionContextProvider>
  );
};

export interface SchemaSettingsActionModalItemProps
  extends SchemaSettingsModalItemProps,
    Omit<SchemaSettingsItemProps, 'onSubmit' | 'onClick'> {
  uid?: string;
  initialSchema?: ISchema;
  schema?: ISchema;
  beforeOpen?: () => void;
  maskClosable?: boolean;
}
export const SchemaSettingsActionModalItem: FC<SchemaSettingsActionModalItemProps> = React.memo((props) => {
  const { title, onSubmit, initialValues, beforeOpen, initialSchema, schema, modalTip, components, scope, ...others } =
    props;
  const [visible, setVisible] = useState(false);
  const [schemaUid, setSchemaUid] = useState<string>(props.uid);
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const ctx = useContext(SchemaSettingsContext);
  const { dn } = useSchemaSettings();
  const compile = useCompile();
  const api = useAPIClient();
  const upLevelActiveFields = useFormActiveFields();

  const form = useMemo(
    () =>
      createForm({
        initialValues: cloneDeep(initialValues),
        values: cloneDeep(initialValues),
      }),
    [initialValues],
  );

  useEffect(() => {
    form.setInitialValues(cloneDeep(initialValues));
  }, [JSON.stringify(initialValues || {})]);

  const cancelHandler = useCallback(() => {
    setVisible(false);
    form.reset();
  }, [form]);

  const submitHandler = useCallback(async () => {
    await form.submit();
    onSubmit?.(cloneDeep(form.values));
    setVisible(false);
  }, [form, onSubmit]);

  const openAssignedFieldValueHandler = useCallback(async () => {
    if (!schemaUid && initialSchema?.['x-uid']) {
      fieldSchema['x-action-settings'].schemaUid = initialSchema['x-uid'];
      dn.emit('patch', { schema: fieldSchema });
      await api.resource('uiSchemas').insert({ values: initialSchema });
      setSchemaUid(initialSchema['x-uid']);
    }
    if (typeof beforeOpen === 'function') {
      beforeOpen?.();
    }
    ctx.setVisible(false);
    setVisible(true);
  }, [api, ctx, dn, fieldSchema, initialSchema, schemaUid]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLLIElement>): void => e.stopPropagation(), []);
  return (
    <>
      <SchemaSettingsItem
        title={compile(title)}
        {...others}
        onClick={openAssignedFieldValueHandler}
        onKeyDown={onKeyDown}
      >
        {props.children || props.title}
      </SchemaSettingsItem>
      {createPortal(
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
          <FormActiveFieldsProvider name="form" getActiveFieldsName={upLevelActiveFields?.getActiveFieldsName}>
            <FormProvider form={form}>
              <FormLayout layout={'vertical'}>
                {modalTip && <Alert message={modalTip} />}
                {modalTip && <br />}
                {visible && schemaUid && (
                  <RemoteSchemaComponent noForm components={components} scope={scope} uid={schemaUid} />
                )}
                {visible && schema && <SchemaComponent components={components} scope={scope} schema={schema} />}
              </FormLayout>
            </FormProvider>
          </FormActiveFieldsProvider>
        </Modal>,
        document.body,
      )}
    </>
  );
});
SchemaSettingsActionModalItem.displayName = 'SchemaSettingsActionModalItem';

export interface SchemaSettingsModalItemProps {
  title: string;
  onSubmit: (values: any) => void;
  initialValues?: any;
  schema?: ISchema | (() => ISchema);
  modalTip?: string;
  components?: any;
  hidden?: boolean;
  scope?: any;
  effects?: any;
  width?: string | number;
  children?: ReactNode;
  asyncGetInitialValues?: () => Promise<any>;
  eventKey?: string;
  hide?: boolean;
}
export const SchemaSettingsModalItem: FC<SchemaSettingsModalItemProps> = (props) => {
  const {
    hidden,
    title,
    components,
    scope,
    effects,
    onSubmit,
    asyncGetInitialValues,
    initialValues,
    width = 'fit-content',
    ...others
  } = props;
  const options = useContext(SchemaOptionsContext);
  const collection = useCollection_deprecated();
  const apiClient = useAPIClient();
  const { theme } = useGlobalTheme();
  const ctx = useBlockRequestContext();
  const upLevelActiveFields = useFormActiveFields();
  const { locale } = useContext(ConfigProvider.ConfigContext);
  const dm = useDataSourceManager();
  const dataSourceKey = useDataSourceKey();
  const record = useCollectionRecord();
  const { association } = useDataBlockProps() || {};

  // 解决变量`当前对象`值在弹窗中丢失的问题
  const { formValue: subFormValue } = useSubFormValue();

  if (hidden) {
    return null;
  }
  return (
    <SchemaSettingsItem
      title={title}
      {...others}
      onClick={async () => {
        const values = asyncGetInitialValues ? await asyncGetInitialValues() : initialValues;
        const schema = _.isFunction(props.schema) ? props.schema() : props.schema;
        FormDialog(
          { title: schema.title || title, width },
          () => {
            return (
              <CollectionRecordProvider record={record}>
                <SubFormProvider value={subFormValue}>
                  <FormActiveFieldsProvider name="form" getActiveFieldsName={upLevelActiveFields?.getActiveFieldsName}>
                    <Router location={location} navigator={null}>
                      <BlockRequestContext_deprecated.Provider value={ctx}>
                        <DataSourceApplicationProvider dataSourceManager={dm} dataSource={dataSourceKey}>
                          <AssociationOrCollectionProvider
                            allowNull
                            collection={collection.name}
                            association={association}
                          >
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
                                  <ConfigProvider locale={locale}>
                                    <SchemaComponent components={components} scope={scope} schema={schema} />
                                  </ConfigProvider>
                                </APIClientProvider>
                              </FormLayout>
                            </SchemaComponentOptions>
                          </AssociationOrCollectionProvider>
                        </DataSourceApplicationProvider>
                      </BlockRequestContext_deprecated.Provider>
                    </Router>
                  </FormActiveFieldsProvider>
                </SubFormProvider>
              </CollectionRecordProvider>
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
    </SchemaSettingsItem>
  );
};

export const SchemaSettingsBlockTitleItem = function BlockTitleItem() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();

  return (
    <SchemaSettingsModalItem
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

export const SchemaSettingsDefaultSortingRules = function DefaultSortingRules(props) {
  const { path = 'x-component-props.params.sort' } = props;
  const { t } = useTranslation();
  const { dn } = useDesignable();

  const fieldSchema = useFieldSchema();
  const field = useField();
  const title = props.title || t('Set default sorting rules');
  const { name } = useCollection_deprecated();
  const defaultSort = get(fieldSchema, path) || [];
  const sort = defaultSort?.map((item: string) => {
    return item.startsWith('-')
      ? {
          field: item.substring(1),
          direction: 'desc',
        }
      : {
          field: item,
          direction: 'asc',
        };
  });
  const sortFields = useSortFields(props.name || name);

  const onSubmit = async ({ sort }) => {
    if (props?.onSubmit) {
      return props.onSubmit({ sort });
    }
    const value = sort.map((item) => {
      return item.direction === 'desc' ? `-${item.field}` : item.field;
    });
    set(
      field,
      path.replace('x-component-props', 'componentProps').replace('x-decorator-props', 'decoratorProps'),
      value,
    );

    set(fieldSchema, path, value);
    await dn.emit('patch', {
      schema: fieldSchema,
    });
    return props.onSubmitAfter?.();
  };

  return (
    <SchemaSettingsModalItem
      title={title}
      components={{ ArrayItems }}
      schema={
        {
          type: 'object',
          title,
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

export const SchemaSettingsLinkageRules = function LinkageRules(props) {
  const { collectionName } = props;
  const fieldSchema = useFieldSchema();
  const { form } = useFormBlockContext();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { getTemplateById } = useSchemaTemplateManager();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const record = useRecord();
  const { type: formBlockType } = useFormBlockType();
  const type = props?.type || ['Action', 'Action.Link'].includes(fieldSchema['x-component']) ? 'button' : 'field';
  const gridSchema = findGridSchema(fieldSchema) || fieldSchema;
  const schema = useMemo<ISchema>(
    () => ({
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
                form,
                variables,
                localVariables,
                record,
                formBlockType,
              };
            },
          },
        },
      },
    }),
    [collectionName, fieldSchema, form, gridSchema, localVariables, record, t, type, variables],
  );
  const components = useMemo(() => ({ ArrayCollapse, FormLayout }), []);
  const onSubmit = useCallback(
    (v) => {
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
    },
    [dn, getTemplateById, gridSchema],
  );

  return (
    <SchemaSettingsModalItem
      title={t('Linkage rules')}
      components={components}
      width={770}
      schema={schema}
      onSubmit={onSubmit}
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

export const SchemaSettingsDataTemplates = function DataTemplates(props) {
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
          'x-decorator': (props) => <FlagProvider {...props} isInFormDataTemplate />,
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
    <SchemaSettingsModalItem title={title} components={components} width={770} schema={schema} onSubmit={onSubmit} />
  );
};

export function SchemaSettingsEnableChildCollections(props) {
  const { collectionName } = props;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const allowAddToCurrent = fieldSchema?.['x-allow-add-to-current'];
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const ctx = useBlockRequestContext();
  const collectionField = getCollectionJoinField(fieldSchema?.parent?.['x-collection-field']) || {};
  const isAssocationAdd = fieldSchema?.parent?.['x-component'] === 'CollectionField';
  return (
    <SchemaSettingsModalItem
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
}

export const defaultInputStyle = css`
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

export const SchemaSettingsSortField = () => {
  const { fields } = useCollection_deprecated();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const compile = useCompile();
  const { service } = useTableBlockContext();

  const options = fields
    .filter((field) => !field?.target && field.interface === 'sort')
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));

  return (
    <SchemaSettingsSelectItem
      key="sort-field"
      title={t('Drag and drop sorting field')}
      options={options}
      value={field.decoratorProps.dragSortBy}
      onChange={(dragSortBy) => {
        fieldSchema['x-decorator-props'].dragSortBy = dragSortBy;
        service.run({ ...service.params?.[0], sort: dragSortBy });
        field.decoratorProps.dragSortBy = dragSortBy;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': fieldSchema['x-decorator-props'],
          },
        });
        dn.refresh();
      }}
    />
  );
};

// 是否是系统字段
export const isSystemField = (collectionField: CollectionFieldOptions_deprecated, getInterface) => {
  const i = getInterface?.(collectionField?.interface);
  return i?.group === 'systemInfo';
};

export function getFieldDefaultValue(fieldSchema: ISchema, collectionField: CollectionFieldOptions_deprecated) {
  const result = fieldSchema?.default ?? collectionField?.defaultValue;
  return result;
}
