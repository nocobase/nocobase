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
  DatePickerProvider,
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
  InheritanceCollectionMixin,
  useCompile,
  useDesignable,
  useFilterBlock,
  useGlobalTheme,
  useLinkageCollectionFilterOptions,
  useRecord,
  useSchemaSettingsItem,
  useSortFields,
  useCollectionV2,
  useCollectionManagerV2,
  CollectionManagerV2,
  CollectionFieldOptionsV2,
  CollectionProviderV2,
  CollectionManagerProviderV2,
} from '..';
import { BlockRequestContext, useFormBlockContext, useFormBlockType, useTableBlockContext } from '../block-provider';
import {
  FormActiveFieldsProvider,
  findFilterTargets,
  updateFilterTargets,
  useFormActiveFields,
} from '../block-provider/hooks';
import { useCollectionFilterOptionsV2 } from '../collection-manager/action-hooks';
import { SelectWithTitle, SelectWithTitleProps } from '../common/SelectWithTitle';
import {
  FilterBlockType,
  getSupportFieldsByAssociation,
  getSupportFieldsByForeignKey,
  isSameCollection,
  useSupportedBlocks,
} from '../filter-provider/utils';
import { FlagProvider, useFlag } from '../flag-provider';
import { useCollectMenuItem, useCollectMenuItems, useMenuItem } from '../hooks/useMenuItem';
import { getTargetKey } from '../schema-component/antd/association-filter/utilts';
import { DynamicComponentProps } from '../schema-component/antd/filter/DynamicComponent';
import { useSchemaTemplateManager } from '../schema-templates';
import { useBlockTemplateContext } from '../schema-templates/BlockTemplate';
import { useLocalVariables, useVariables } from '../variables';
import { isVariable } from '../variables/utils/isVariable';
import { FormDataTemplates } from './DataTemplates';
import { DateFormatCom, ExpiresRadio } from './DateFormat/ExpiresRadio';
import { EnableChildCollections } from './EnableChildCollections';
import { ChildDynamicComponent } from './EnableChildCollections/DynamicComponent';
import { FormLinkageRules } from './LinkageRules';
import { useLinkageCollectionFieldOptions } from './LinkageRules/action-hooks';
import { VariableInput, getShouldChange } from './VariableInput/VariableInput';
import { BaseVariableProvider, IsDisabledParams } from './VariableInput/hooks/useBaseVariable';
import { Option } from './VariableInput/type';
import { formatVariableScop } from './VariableInput/utils/formatVariableScop';
import { DataScopeProps } from './types';

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
  const collection = useCollectionV2();
  const template = getTemplateBySchema(fieldSchema);
  return (
    <SchemaSettingsContext.Provider value={{ collectionName: collection?.name, template, fieldSchema, ...others }}>
      {children}
    </SchemaSettingsContext.Provider>
  );
};

export const SchemaSettingsDropdown: React.FC<SchemaSettingsProps> = (props) => {
  const { title, dn, ...others } = props;
  const [visible, setVisible] = useState(false);
  const { Component, getMenuItems } = useMenuItem();
  const [, startTransition] = useReactTransition();

  const changeMenu: DropdownProps['onOpenChange'] = (nextOpen: boolean, info) => {
    // 在 antd v5.8.6 版本中，点击菜单项不会触发菜单关闭，但是升级到 v5.12.2 后会触发关闭。查阅文档发现
    // 在 v5.11.0 版本中增加了一个 info.source，可以通过这个来判断一下，如果是点击的是菜单项就不关闭菜单，
    // 这样就可以和之前的行为保持一致了。
    // 下面是模仿官方文档示例做的修改：https://ant.design/components/dropdown-cn
    if (info.source === 'trigger' || nextOpen) {
      // 当鼠标快速滑过时，终止菜单的渲染，防止卡顿
      startTransition(() => {
        setVisible(nextOpen);
      });
    }
  };

  const items = getMenuItems(() => props.children);

  return (
    <SchemaSettingsProvider visible={visible} setVisible={setVisible} dn={dn} {...others}>
      <Component />
      <Dropdown
        open={visible}
        onOpenChange={(open, info) => {
          changeMenu(open, info);
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
    </SchemaSettingsProvider>
  );
};

export const SchemaSettingsTemplate = function Template(props) {
  const { componentName, collectionName, resourceName, needRender } = props;
  const { t } = useTranslation();
  const cm = useCollectionManagerV2();
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
        const { title } = collectionName ? cm.getCollection(collectionName) : { title: '' };
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
  const cm = useCollectionManagerV2();
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
        const { title } = cm.getCollection(collectionName);
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
  const collection = useCollectionV2<InheritanceCollectionMixin>();
  const { inProvider } = useFilterBlock();
  const dataBlocks = useSupportedBlocks(type);
  // eslint-disable-next-line prefer-const
  let { targets = [], uid } = findFilterTargets(fieldSchema);
  const compile = useCompile();
  const cm = useCollectionManagerV2<InheritanceCollectionMixin>();

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
          ...getSupportFieldsByAssociation(collection.getAllCollectionsInheritChain(), block).map((field) => {
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
  const cm = useCollectionManagerV2();
  const collection = useCollectionV2();
  const apiClient = useAPIClient();
  const { theme } = useGlobalTheme();
  const ctx = useContext(BlockRequestContext);
  const upLevelActiveFields = useFormActiveFields();
  const { locale } = useContext(ConfigProvider.ConfigContext);

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
              <FormActiveFieldsProvider name="form" getActiveFieldsName={upLevelActiveFields?.getActiveFieldsName}>
                <Router location={location} navigator={null}>
                  <BlockRequestContext.Provider value={ctx}>
                    <CollectionManagerProviderV2 collectionManager={cm}>
                      <CollectionProviderV2 name={collection.name}>
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
                      </CollectionProviderV2>
                    </CollectionManagerProviderV2>
                  </BlockRequestContext.Provider>
                </Router>
              </FormActiveFieldsProvider>
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
  const collection = useCollectionV2();
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

export const SchemaSettingsEnableChildCollections = function EnableChildCollectionsItem(props) {
  const { collectionName } = props;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const allowAddToCurrent = fieldSchema?.['x-allow-add-to-current'];
  const cm = useCollectionManagerV2();
  const ctx = useBlockRequestContext();
  const collectionField = cm.getCollectionField(fieldSchema?.parent?.['x-collection-field']) || {};
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
};

export const SchemaSettingsDataFormat = function DateFormatConfig(props: { fieldSchema: Schema }) {
  const { fieldSchema } = props;
  const field = useField();
  const form = useForm();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const cm = useCollectionManagerV2();
  const collectionField = cm.getCollectionField(fieldSchema?.['x-collection-field']) || {};
  const isShowTime = fieldSchema?.['x-component-props']?.showTime;
  const dateFormatDefaultValue =
    fieldSchema?.['x-component-props']?.dateFormat ||
    collectionField?.uiSchema?.['x-component-props']?.dateFormat ||
    'YYYY-MM-DD';
  const timeFormatDefaultValue =
    fieldSchema?.['x-component-props']?.timeFormat || collectionField?.uiSchema?.['x-component-props']?.timeFormat;
  return (
    <SchemaSettingsModalItem
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

export const SchemaSettingsDefaultValue = function DefaultValueConfigure(props: { fieldSchema?: Schema }) {
  const currentSchema = useFieldSchema();
  const fieldSchema = props?.fieldSchema ?? currentSchema;
  const field: Field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const actionCtx = useActionContext();
  let targetField;

  const collection = useCollectionV2();
  const cm = useCollectionManagerV2<InheritanceCollectionMixin>();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const record = useRecord();
  const { form } = useFormBlockContext();
  const { getFields } = useCollectionFilterOptionsV2(collection);
  const { isInSubForm, isInSubTable } = useFlag() || {};

  const { name } = collection;
  const collectionField = useMemo(
    () => collection.getField(fieldSchema['name']) || cm.getCollectionField(fieldSchema['x-collection-field']),
    [fieldSchema, cm.getCollectionField, collection],
  );
  const fieldSchemaWithoutRequired = _.omit(fieldSchema, 'required');
  if (collectionField?.target) {
    targetField = cm.getCollectionField(
      `${collectionField.target}.${fieldSchema['x-component-props']?.fieldNames?.label || 'id'}`,
    );
  }

  const parentFieldSchema = collectionField?.interface === 'm2o' && findParentFieldSchema(fieldSchema);
  const parentCollectionField = parentFieldSchema && cm.getCollectionField(parentFieldSchema?.['x-collection-field']);
  const tableCtx = useTableBlockContext();
  const isAllowContextVariable =
    actionCtx?.fieldSchema?.['x-action'] === 'customize:create' &&
    (collectionField?.interface === 'm2m' ||
      (parentCollectionField?.type === 'hasMany' && collectionField?.interface === 'm2o'));

  const returnScope = useCallback(
    (scope: Option[]) => {
      const currentForm = scope.find((item) => item.value === '$nForm');
      const fields = cm.getCollectionFields(name);

      // fix https://nocobase.height.app/T-1355
      // 工作流人工节点的 `自定义表单` 区块，与其它表单区块不同，根据它的数据表名称，获取到的字段列表为空，所以需要在这里特殊处理一下
      if (!fields?.length && currentForm) {
        currentForm.children = formatVariableScop(getFields());
      }

      return scope;
    },
    [getFields, name],
  );

  const DefaultValueComponent: any = useMemo(() => {
    return {
      ArrayCollapse,
      FormLayout,
      VariableInput: (props) => {
        return (
          <FlagProvider isInSubForm={isInSubForm} isInSubTable={isInSubTable} isInSetDefaultValueDialog>
            <VariableInput {...props} />
          </FlagProvider>
        );
      },
    };
  }, [isInSubForm, isInSubTable]);

  const schema = useMemo(() => {
    return {
      type: 'object',
      title: t('Set default value'),
      properties: {
        default: {
          'x-decorator': 'FormItem',
          'x-component': 'VariableInput',
          'x-component-props': {
            ...(fieldSchema?.['x-component-props'] || {}),
            collectionField,
            contextCollectionName: isAllowContextVariable && tableCtx.collection,
            schema: collectionField?.uiSchema,
            targetFieldSchema: fieldSchema,
            className: defaultInputStyle,
            form,
            record,
            returnScope,
            shouldChange: getShouldChange({
              collectionField,
              variables,
              localVariables,
              collectionManager: cm,
            }),
            renderSchemaComponent: function Com(props) {
              const s = _.cloneDeep(fieldSchemaWithoutRequired) || ({} as Schema);
              s.title = '';
              s.name = 'default';
              s['x-read-pretty'] = false;
              s['x-disabled'] = false;

              const defaultValue = getFieldDefaultValue(s, collectionField);

              if (collectionField.target && s['x-component-props']) {
                s['x-component-props'].mode = 'Select';
              }

              if (collectionField?.uiSchema.type) {
                s.type = collectionField.uiSchema.type;
              }

              if (collectionField?.uiSchema['x-component'] === 'Checkbox') {
                s['x-component-props'].defaultChecked = defaultValue;

                // 在这里如果不设置 type 为 void，会导致设置的默认值不生效
                // 但是我不知道为什么必须要设置为 void ？
                s.type = 'void';
              }

              const schema = {
                ...(s || {}),
                'x-decorator': 'FormItem',
                'x-component-props': {
                  ...s['x-component-props'],
                  collectionName: collectionField?.collectionName,
                  targetField,
                  onChange: props.onChange,
                  defaultValue: isVariable(defaultValue) ? '' : defaultValue,
                  style: {
                    width: '100%',
                    verticalAlign: 'top',
                    minWidth: '200px',
                  },
                },
                default: isVariable(defaultValue) ? '' : defaultValue,
              } as ISchema;

              return (
                <FormProvider>
                  <SchemaComponent schema={schema} />
                </FormProvider>
              );
            },
          },
          title: t('Default value'),
          default: getFieldDefaultValue(fieldSchema, collectionField),
        },
      },
    } as ISchema;
  }, [
    cm,
    collectionField,
    fieldSchema,
    fieldSchemaWithoutRequired,
    form,
    isAllowContextVariable,
    localVariables,
    record,
    returnScope,
    t,
    tableCtx.collection,
    targetField,
    variables,
  ]);
  const handleSubmit: (values: any) => void = useCallback(
    (v) => {
      const schema: ISchema = {
        ['x-uid']: fieldSchema['x-uid'],
      };
      fieldSchema.default = v.default;
      if (!v.default && v.default !== 0) {
        field.value = null;
      }
      schema.default = v.default;
      dn.emit('patch', {
        schema,
        currentSchema,
      });
    },
    [currentSchema, dn, field, fieldSchema],
  );

  return (
    <SchemaSettingsModalItem
      title={t('Set default value')}
      components={DefaultValueComponent}
      width={800}
      schema={schema}
      onSubmit={handleSubmit}
    />
  );
};

export const SchemaSettingsSortingRule = function SortRuleConfigure(props) {
  const field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const currentSchema = useFieldSchema();
  const collection = useCollectionV2();
  const cm = useCollectionManagerV2();
  const fieldSchema = props?.fieldSchema ?? currentSchema;
  const collectionField =
    collection.getField(fieldSchema['name']) || cm.getCollectionField(fieldSchema['x-collection-field']);
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
    <SchemaSettingsModalItem
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

export const SchemaSettingsDataScope: FC<DataScopeProps> = function DataScopeConfigure(props) {
  const { t } = useTranslation();
  const { getFields } = useCollectionFilterOptionsV2(props.collectionName);
  const record = useRecord();
  const { form } = useFormBlockContext();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const cm = useCollectionManagerV2<InheritanceCollectionMixin>();
  const { isInSubForm, isInSubTable } = useFlag() || {};

  const dynamicComponent = useCallback(
    (props: DynamicComponentProps) => {
      return (
        <DatePickerProvider value={{ utc: false }}>
          <VariableInput
            {...props}
            form={form}
            record={record}
            shouldChange={getShouldChange({
              collectionField: props.collectionField,
              variables,
              localVariables,
              collectionManager: cm,
            })}
          />
        </DatePickerProvider>
      );
    },
    [form, cm, localVariables, record, variables],
  );

  const getSchema = () => {
    return {
      type: 'object',
      title: t('Set the data scope'),
      properties: {
        filter: {
          enum: props.collectionFilterOption || getFields(),
          'x-decorator': (props) => (
            <BaseVariableProvider {...props}>
              <FlagProvider isInSubForm={isInSubForm} isInSubTable={isInSubTable}>
                {props.children}
              </FlagProvider>
            </BaseVariableProvider>
          ),
          'x-decorator-props': {
            isDisabled,
          },
          'x-component': 'Filter',
          'x-component-props': {
            collectionName: props.collectionName,
            dynamicComponent: props.dynamicComponent || dynamicComponent,
          },
        },
      },
    };
  };

  return (
    <SchemaSettingsModalItem
      title={t('Set the data scope')}
      initialValues={{ filter: props.defaultFilter }}
      schema={getSchema as () => ISchema}
      onSubmit={props.onSubmit}
    />
  );
};

// 是否是系统字段
export const isSystemField = (collectionField: CollectionFieldOptionsV2, collectionManager: CollectionManagerV2) => {
  const i = collectionManager.getCollectionFieldInterface?.(collectionField?.interface);
  return i?.group === 'systemInfo';
};

export const isPatternDisabled = (fieldSchema: Schema) => {
  return fieldSchema?.['x-component-props']?.['pattern-disable'] == true;
};

function getFieldDefaultValue(fieldSchema: ISchema, collectionField: CollectionFieldOptionsV2) {
  const result = fieldSchema?.default ?? collectionField?.defaultValue;
  return result;
}

function isDisabled(params: IsDisabledParams) {
  const { option, collectionField, uiSchema } = params;

  if (!uiSchema || !collectionField) {
    return true;
  }

  // json 类型的字段，允许设置任意类型的值
  if (collectionField.interface === 'json') {
    return false;
  }

  // 数据范围支持选择 `对多` 、`对一` 的关系字段
  if (option.target) {
    return false;
  }

  if (['input', 'markdown', 'richText', 'textarea', 'username'].includes(collectionField.interface)) {
    return !['string', 'number'].includes(option.schema?.type);
  }

  if (collectionField.interface && option.interface) {
    return collectionField.interface !== option.interface;
  }

  if (uiSchema?.['x-component'] !== option.schema?.['x-component']) {
    return true;
  }

  return false;
}
