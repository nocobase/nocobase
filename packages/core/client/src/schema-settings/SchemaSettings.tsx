/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { ArrayCollapse, ArrayItems, FormItem, FormLayout, Input } from '@formily/antd-v5';
import { Field, GeneralField, createForm } from '@formily/core';
import { ISchema, Schema, SchemaOptionsContext, observer, useField, useFieldSchema, useForm } from '@formily/react';
import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import type { DropdownProps } from 'antd';
import {
  Alert,
  App,
  Button,
  Cascader,
  CascaderProps,
  ConfigProvider,
  Dropdown,
  Menu,
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
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  SchemaSettingsItemType,
  SchemaToolbarVisibleContext,
  VariablesContext,
  getZIndex,
  useCollection,
  useCollectionManager,
  useZIndexContext,
  zIndexContext,
} from '../';
import { APIClientProvider } from '../api-client/APIClientProvider';
import { useAPIClient } from '../api-client/hooks/useAPIClient';
import { ApplicationContext, LocationSearchContext, useApp, useLocationSearch } from '../application';
import {
  BlockContext,
  BlockRequestContext_deprecated,
  useBlockContext,
  useBlockRequestContext,
} from '../block-provider/BlockProvider';
import { CollectOperators, useOperators } from '../block-provider/CollectOperators';
import {
  FormBlockContext,
  findFormBlock,
  useFormBlockContext,
  useFormBlockType,
} from '../block-provider/FormBlockProvider';
import { FormActiveFieldsProvider, useFormActiveFields } from '../block-provider/hooks';
import { useLinkageCollectionFilterOptions, useSortFields } from '../collection-manager/action-hooks';
import { useCollectionManager_deprecated } from '../collection-manager/hooks/useCollectionManager_deprecated';
import { CollectionFieldOptions_deprecated } from '../collection-manager/types';
import { SelectWithTitle, SelectWithTitleProps } from '../common/SelectWithTitle';
import { useNiceDropdownMaxHeight } from '../common/useNiceDropdownHeight';
import {
  CollectionRecordProvider,
  useCollectionRecord,
} from '../data-source/collection-record/CollectionRecordProvider';
import { DataSourceApplicationProvider } from '../data-source/components/DataSourceApplicationProvider';
import { AssociationOrCollectionProvider, useDataBlockProps } from '../data-source/data-block/DataBlockProvider';
import { useDataSourceManager } from '../data-source/data-source/DataSourceManagerProvider';
import { useDataSourceKey } from '../data-source/data-source/DataSourceProvider';
import { useFilterBlock } from '../filter-provider/FilterProvider';
import { FlagProvider, useFlag } from '../flag-provider';
import { useGlobalTheme } from '../global-theme';
import { useCollectMenuItem, useCollectMenuItems, useMenuItem } from '../hooks/useMenuItem';
import {
  VariablePopupRecordProvider,
  useCurrentPopupRecord,
  useParentPopupRecord,
} from '../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { useRecord } from '../record-provider';
import { ActionContextProvider } from '../schema-component/antd/action/context';
import { SubFormProvider, useSubFormValue } from '../schema-component/antd/association-field/hooks';
import { FormDialog } from '../schema-component/antd/form-dialog';
import { AllDataBlocksContext } from '../schema-component/antd/page/AllDataBlocksProvider';
import { SchemaComponentContext } from '../schema-component/context';
import { FormProvider } from '../schema-component/core/FormProvider';
import { RemoteSchemaComponent } from '../schema-component/core/RemoteSchemaComponent';
import { SchemaComponent } from '../schema-component/core/SchemaComponent';
import { SchemaComponentOptions } from '../schema-component/core/SchemaComponentOptions';
import { useCompile } from '../schema-component/hooks/useCompile';
import { Designable, createDesignable, useDesignable } from '../schema-component/hooks/useDesignable';
import { useSchemaTemplateManager } from '../schema-templates';
import { useBlockTemplateContext } from '../schema-templates/BlockTemplateProvider';
import { useLocalVariables, useVariables } from '../variables';
import { FormDataTemplates } from './DataTemplates';
import { EnableChildCollections } from './EnableChildCollections';
import { ChildDynamicComponent } from './EnableChildCollections/DynamicComponent';
import { FormLinkageRules } from './LinkageRules';
import { useLinkageCollectionFieldOptions } from './LinkageRules/action-hooks';
import { LinkageRuleCategory, LinkageRuleDataKeyMap } from './LinkageRules/type';
import { CurrentRecordContextProvider, useCurrentRecord } from './VariableInput/hooks/useRecordVariable';
export interface SchemaSettingsProps {
  title?: any;
  dn?: Designable;
  field?: GeneralField;
  fieldSchema?: Schema;
  children?: ReactNode;
  mode?: 'inline' | 'dropdown';
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
SchemaSettingsContext.displayName = 'SchemaSettingsContext';

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
  const { children, fieldSchema } = props;
  const { getTemplateBySchema } = useSchemaTemplateManager();
  const collection = useCollection();
  const template = getTemplateBySchema(fieldSchema);
  const value = useMemo(
    () => ({
      ...props,
      collectionName: collection?.name,
      template,
      fieldSchema,
    }),
    [collection?.name, fieldSchema, props, template],
  );
  return <SchemaSettingsContext.Provider value={value}>{children}</SchemaSettingsContext.Provider>;
};

const InternalSchemaSettingsDropdown: React.FC<SchemaSettingsProps> = React.memo((props) => {
  const { title, dn, ...others } = props;
  const [visible, setVisible] = useState(false);
  const { Component, getMenuItems } = useMenuItem();
  const dropdownMaxHeight = useNiceDropdownMaxHeight([visible]);
  // 单测中需要在首次就把菜单渲染出来，否则不会触发菜单的渲染进而报错。原因未知。
  const [openDropdown, setOpenDropdown] = useState(process.env.__TEST__ ? true : false);
  const toolbarVisible = useContext(SchemaToolbarVisibleContext);

  useEffect(() => {
    if (toolbarVisible) {
      setOpenDropdown(false);
    }
  }, [toolbarVisible]);

  const changeMenu: DropdownProps['onOpenChange'] = (nextOpen: boolean, info) => {
    if (info.source === 'trigger' || nextOpen) {
      // 当鼠标快速滑过时，终止菜单的渲染，防止卡顿
      startTransition(() => {
        setVisible(nextOpen);
      });
    }
  };

  const handleMouseEnter = () => {
    setOpenDropdown(true);
  };

  // 从这里截断，可以保证每次显示时都是最新状态的菜单列表
  if (!openDropdown) {
    return (
      <div onMouseEnter={handleMouseEnter} data-testid={props['data-testid']}>
        {typeof title === 'string' ? <span>{title}</span> : title}
      </div>
    );
  }

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
        menu={
          {
            items,
            'data-testid': 'schema-settings-menu',
            style: { maxHeight: dropdownMaxHeight, overflowY: 'auto' },
          } as any
        }
      >
        <div data-testid={props['data-testid']}>{typeof title === 'string' ? <span>{title}</span> : title}</div>
      </Dropdown>
    </SchemaSettingsProvider>
  );
});

const InternalSchemaSettingsMenu: React.FC<SchemaSettingsProps> = React.memo((props) => {
  const { title, dn, ...others } = props;
  const [visible, setVisible] = useState(true);
  const { Component, getMenuItems } = useMenuItem();
  const items = getMenuItems(() => props.children);

  return (
    <SchemaSettingsProvider visible={visible} setVisible={setVisible} dn={dn} {...others}>
      <Component />
      <Menu items={items} />
    </SchemaSettingsProvider>
  );
});

export const SchemaSettingsDropdown: React.FC<SchemaSettingsProps> = React.memo((props) => {
  const { mode } = props;
  return mode === 'inline' ? <InternalSchemaSettingsMenu {...props} /> : <InternalSchemaSettingsDropdown {...props} />;
});

SchemaSettingsDropdown.displayName = 'SchemaSettingsDropdown';

const findGridSchema = (fieldSchema) => {
  return fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'FormV2' || s['x-component'] === 'Details') {
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
    if (s['x-component'] === 'FormV2' || s['x-component'] === 'Details') {
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
  const cm = useCollectionManager();
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
      title={t('Save as reference template')}
      onClick={async () => {
        setVisible(false);
        const collection = collectionName && cm?.getCollection(collectionName);
        const gridSchema = findGridSchema(fieldSchema);
        const values = await FormDialog(
          t('Save as reference template'),
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
          current: gridSchema.parent,
        });
        sdn.loadAPIClientEvents();
        const { key } = await saveAsTemplate({
          collectionName,
          resourceName,
          componentName,
          dataSourceKey: collection.dataSource,
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
        dn.refresh();
      }}
    >
      {t('Save as reference template')}
    </SchemaSettingsItem>
  );
};

export interface SchemaSettingsItemProps extends Omit<MenuItemProps, 'title'> {
  title: string | ReactNode;
}
export const SchemaSettingsItem: FC<SchemaSettingsItemProps> = (props) => {
  const { pushMenuItem } = useCollectMenuItems();
  const { collectMenuItem } = useCollectMenuItem();
  const { eventKey, title } = props;

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
  disabled?: boolean;
  title?: string;
  confirm?: ModalFuncProps;
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: ISchema | ((s: ISchema) => boolean);
}
export const SchemaSettingsRemove: FC<SchemaSettingsRemoveProps> = (props) => {
  const { disabled, confirm, title, removeParentsIfNoChildren, breakRemoveOn } = props;
  const { dn, template } = useSchemaSettings();
  const { t } = useTranslation();
  const field = useField<Field>();
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  const ctx = useBlockTemplateContext();
  const form = useForm();
  const { modal } = App.useApp();
  const { removeActiveFieldName } = useFormActiveFields() || {};
  const { removeDataBlock } = useFilterBlock();

  return (
    <SchemaSettingsItem
      disabled={disabled}
      title="Delete"
      eventKey="remove"
      onClick={() => {
        modal.confirm({
          title: title ? compile(title) : t('Delete block'),
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
            if (template && template.uid === fieldSchema['x-uid'] && ctx?.dn) {
              await ctx?.dn.remove(null, options);
            } else {
              await dn.remove(null, options);
            }
            await confirm?.onOk?.();
            delete form.values[fieldSchema.name];
            dn.refresh({ refreshParentSchema: true });
            removeActiveFieldName?.(fieldSchema.name as string);
            form?.query(new RegExp(`${fieldSchema.parent.name}.${fieldSchema.name}$`)).forEach((field: Field) => {
              // 如果字段被删掉，那么在提交的时候不应该提交这个字段
              field.setValue?.(undefined);
              field.setInitialValue?.(undefined);
            });
            removeDataBlock(fieldSchema['x-uid']);
          },
        });
      }}
    >
      {t('Delete')}
    </SchemaSettingsItem>
  );
};

export interface SchemaSettingsSelectItemProps
  extends Omit<SchemaSettingsItemProps, 'onChange' | 'onClick'>,
    Omit<SelectWithTitleProps, 'title' | 'defaultValue'> {
  value?: SelectWithTitleProps['defaultValue'];
  optionRender?: (option: any, info: { index: number }) => React.ReactNode;
}
export const SchemaSettingsSelectItem: FC<SchemaSettingsSelectItemProps> = (props) => {
  const { title, options, value, onChange, optionRender, ...others } = props;

  return (
    <SchemaSettingsItem title={title} {...others}>
      <SelectWithTitle {...{ title, defaultValue: value, onChange, options, optionRender }} />
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
          multiple={props.multiple}
        />
      </div>
    </SchemaSettingsItem>
  );
};

const ml32 = { marginLeft: 32 };
const MenuItemSwitch: FC<{ state: { checked: boolean } }> = observer(({ state }) => {
  return <Switch size={'small'} checked={state.checked} style={ml32} />;
});

MenuItemSwitch.displayName = 'MenuItemSwitch';

export interface SchemaSettingsSwitchItemProps extends Omit<MenuItemProps, 'onChange'> {
  title: string | ReactNode;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}
export const SchemaSettingsSwitchItem: FC<SchemaSettingsSwitchItemProps> = (props) => {
  const { title, onChange, ...others } = props;
  const [state] = useState(() => observable({ checked: !!props.checked }));
  return (
    <SchemaSettingsItem
      title={title}
      {...others}
      onClick={() => {
        onChange?.(!state.checked);
        state.checked = !state.checked;
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <MenuItemSwitch state={state} />
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

export interface SchemaSettingsActionModalItemProps extends SchemaSettingsModalItemProps {
  uid?: string;
  initialSchema?: ISchema;
  schema?: ISchema;
  beforeOpen?: () => void;
  maskClosable?: boolean;
  width?: string | number;
}
export const SchemaSettingsActionModalItem: FC<SchemaSettingsActionModalItemProps> = React.memo((props) => {
  const {
    title,
    onSubmit,
    width = '50%',
    initialValues,
    beforeOpen,
    initialSchema,
    schema,
    modalTip,
    components,
    scope,
    ...others
  } = props;
  const [visible, setVisible] = useState(false);
  const [schemaUid, setSchemaUid] = useState<string>(props.uid);
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const ctx = useContext(SchemaSettingsContext);
  const { dn } = useSchemaSettings();
  const compile = useCompile();
  const api = useAPIClient();
  const upLevelActiveFields = useFormActiveFields();
  const parentZIndex = useZIndexContext();

  const zIndex = getZIndex('modal', parentZIndex + 10, 0);

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
    try {
      const allValues = form.values;
      // 过滤掉那些在表单 Schema 中未定义的字段
      const visibleValues = Object.keys(allValues).reduce((result, key) => {
        if (form.query(key).take()) {
          result[key] = allValues[key];
        }
        return result;
      }, {});
      setVisible(false);
      await onSubmit?.(cloneDeep(visibleValues));
    } catch (err) {
      console.error(err);
    }
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
    <zIndexContext.Provider value={zIndex}>
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
          width={width}
          title={compile(title)}
          {...others}
          destroyOnClose
          open={visible}
          onCancel={cancelHandler}
          zIndex={zIndex}
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
    </zIndexContext.Provider>
  );
});
SchemaSettingsActionModalItem.displayName = 'SchemaSettingsActionModalItem';

export interface SchemaSettingsModalItemProps {
  title: string;
  onSubmit: (values: any) => Promise<any> | void;
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
  /** 上下文中不需要当前记录 */
  noRecord?: boolean;
  /** 自定义 Modal 上下文 */
  ModalContextProvider?: React.FC;
  dialogRootClassName?: string;
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
    noRecord = false,
    ModalContextProvider = (props) => <>{props.children}</>,
    dialogRootClassName,
    ...others
  } = props;
  const options = useContext(SchemaOptionsContext);
  const collection = useCollection();
  const apiClient = useAPIClient();
  const app = useApp();
  const { theme } = useGlobalTheme();
  const ctx = useBlockRequestContext();
  const upLevelActiveFields = useFormActiveFields();
  const { locale } = useContext(ConfigProvider.ConfigContext);
  const dm = useDataSourceManager();
  const dataSourceKey = useDataSourceKey();
  const record = useCollectionRecord();
  const { association } = useDataBlockProps() || {};
  const currentRecordCtx = useCurrentRecord();
  const formCtx = useFormBlockContext();
  const blockOptions = useBlockContext();
  const { getOperators } = useOperators();
  const locationSearch = useLocationSearch();
  const variableOptions = useVariables();
  const allDataBlocks = useContext(AllDataBlocksContext);

  // 解决变量`当前对象`值在弹窗中丢失的问题
  const { formValue: subFormValue, collection: subFormCollection, parent } = useSubFormValue();

  // 解决弹窗变量丢失的问题
  const popupRecordVariable = useCurrentPopupRecord();
  const parentPopupRecordVariable = useParentPopupRecord();

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
          { title: schema.title || title, width, rootClassName: dialogRootClassName },
          () => {
            return (
              <AllDataBlocksContext.Provider value={allDataBlocks}>
                <ModalContextProvider>
                  <CollectOperators defaultOperators={getOperators()}>
                    <VariablesContext.Provider value={variableOptions}>
                      <BlockContext.Provider value={blockOptions}>
                        <VariablePopupRecordProvider
                          recordData={popupRecordVariable?.value}
                          collection={popupRecordVariable?.collection}
                          parent={{
                            recordData: parentPopupRecordVariable?.value,
                            collection: parentPopupRecordVariable?.collection,
                          }}
                        >
                          <CollectionRecordProvider record={noRecord ? null : record}>
                            <CurrentRecordContextProvider {...currentRecordCtx}>
                              <FormBlockContext.Provider value={formCtx}>
                                <SubFormProvider value={{ value: subFormValue, collection: subFormCollection, parent }}>
                                  <FormActiveFieldsProvider
                                    name="form"
                                    getActiveFieldsName={upLevelActiveFields?.getActiveFieldsName}
                                  >
                                    <LocationSearchContext.Provider value={locationSearch}>
                                      <BlockRequestContext_deprecated.Provider value={ctx}>
                                        <DataSourceApplicationProvider
                                          dataSourceManager={dm}
                                          dataSource={dataSourceKey}
                                        >
                                          <AssociationOrCollectionProvider
                                            allowNull
                                            collection={collection?.name}
                                            association={association}
                                          >
                                            <SchemaComponentOptions
                                              scope={options.scope}
                                              components={options.components}
                                            >
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
                                                <ApplicationContext.Provider value={app}>
                                                  <APIClientProvider apiClient={apiClient}>
                                                    <ConfigProvider locale={locale}>
                                                      <SchemaComponent
                                                        components={components}
                                                        scope={scope}
                                                        schema={schema}
                                                      />
                                                    </ConfigProvider>
                                                  </APIClientProvider>
                                                </ApplicationContext.Provider>
                                              </FormLayout>
                                            </SchemaComponentOptions>
                                          </AssociationOrCollectionProvider>
                                        </DataSourceApplicationProvider>
                                      </BlockRequestContext_deprecated.Provider>
                                    </LocationSearchContext.Provider>
                                  </FormActiveFieldsProvider>
                                </SubFormProvider>
                              </FormBlockContext.Provider>
                            </CurrentRecordContextProvider>
                          </CollectionRecordProvider>
                        </VariablePopupRecordProvider>
                      </BlockContext.Provider>
                    </VariablesContext.Provider>
                  </CollectOperators>
                </ModalContextProvider>
              </AllDataBlocksContext.Provider>
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

export const SchemaSettingsDefaultSortingRules = function DefaultSortingRules(props) {
  const { path = 'x-component-props.params.sort' } = props;
  const { t } = useTranslation();
  const { dn } = useDesignable();

  const fieldSchema = useFieldSchema();
  const field = useField();
  const title = props.title || t('Set default sorting rules');
  const collection = useCollection();
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
  const sortFields = useSortFields(props.name || collection?.name);

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
  const { collectionName, readPretty, Component, afterSubmit, title: settingTitle, returnScope } = props;
  const fieldSchema = useFieldSchema();
  const { form } = useFormBlockContext();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { getTemplateById } = useSchemaTemplateManager();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const record = useRecord();
  const { type: formBlockType } = useFormBlockType();
  const category = props?.category ?? LinkageRuleCategory.default;
  const elementType =
    props?.type ||
    (fieldSchema?.['x-action'] || ['Action', 'Action.Link'].includes(fieldSchema['x-component']) ? 'button' : 'field');

  const gridSchema = findGridSchema(fieldSchema) || fieldSchema;
  const options = useLinkageCollectionFilterOptions(collectionName);
  const linkageOptions = useLinkageCollectionFieldOptions(collectionName, readPretty);
  const titleMap = {
    [LinkageRuleCategory.default]: t('Linkage rules'),
    [LinkageRuleCategory.style]: t('Style'),
  };
  const dataKey = LinkageRuleDataKeyMap[category];
  const getRules = useCallback(() => {
    return gridSchema?.[dataKey] || fieldSchema?.[dataKey] || [];
  }, [gridSchema, fieldSchema, dataKey]);
  const title = settingTitle || titleMap[category] || t('Linkage rules');
  const flagVales = useFlag();
  const schema = useMemo<ISchema>(
    () => ({
      type: 'object',
      title,
      properties: {
        fieldReaction: {
          'x-component': Component || FormLinkageRules,
          'x-use-component-props': () => {
            return {
              options,
              defaultValues: getRules(),
              linkageOptions,
              category,
              elementType,
              collectionName,
              form,
              variables,
              localVariables,
              record,
              formBlockType,
              returnScope,
            };
          },
        },
      },
    }),
    [collectionName, fieldSchema, form, gridSchema, localVariables, record, t, variables, getRules, Component],
  );
  const components = useMemo(() => ({ ArrayCollapse, FormLayout }), []);
  const onSubmit = useCallback(
    (v) => {
      const rules = [];
      for (const rule of v.fieldReaction.rules) {
        rules.push(_.omit(_.pickBy(rule, _.identity), ['conditionBasic', 'conditionAdvanced']));
      }
      const templateId = gridSchema['x-component'] === 'BlockTemplate' && gridSchema['x-component-props']?.templateId;
      const uid =
        category !== LinkageRuleCategory.block
          ? (templateId && getTemplateById(templateId).uid) || gridSchema['x-uid']
          : fieldSchema['x-uid'];
      const schema = {
        ['x-uid']: uid,
      };
      gridSchema[dataKey] = rules;
      schema[dataKey] = rules;
      fieldSchema[dataKey] = rules;
      dn.emit('patch', {
        schema,
      });
      dn.refresh();
      afterSubmit?.();
    },
    [dn, getTemplateById, gridSchema, dataKey, afterSubmit, category],
  );

  return (
    <SchemaSettingsModalItem
      title={title}
      components={components}
      width={960}
      schema={schema}
      onSubmit={onSubmit}
      ModalContextProvider={(props) => {
        return <FlagProvider {...flagVales}>{props.children}</FlagProvider>;
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
          'x-use-component-props': () => {
            return {
              defaultValues: templateData,
              collectionName,
            };
          },
          'x-component-props': {
            designerCtx,
            formSchema,
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
              'x-use-component-props': () => {
                return {
                  defaultValues: fieldSchema?.['x-enable-children'],
                  collectionName,
                };
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

export const schemaSettingsLabelLayout: SchemaSettingsItemType = {
  name: 'formLabelLayout',
  type: 'select',
  useComponentProps() {
    const field = useField();
    const fieldSchema = useFieldSchema();
    const { t } = useTranslation();
    const { dn } = useDesignable();
    return {
      title: t('Layout'),
      value: field.componentProps?.layout || 'vertical',
      options: [
        { label: t('Vertical'), value: 'vertical' },
        { label: t('Horizontal'), value: 'horizontal' },
      ],
      onChange: (layout) => {
        field.componentProps = field.componentProps || {};
        field.componentProps.layout = layout;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['layout'] = layout;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
      },
    };
  },
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
