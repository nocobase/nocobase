import { ArrayItems } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { useApp, useSchemaToolbar } from '../../application';
import { SchemaSettings } from '../../application/schema-settings/SchemaSettings';
import { mergeFilter, useFormBlockContext, useTableBlockContext } from '../../block-provider';
import { useCollection, useCollectionManager, useSortFields } from '../../collection-manager';
import { FilterBlockType } from '../../filter-provider';
import { isFileCollection, useIsFileField } from '../../schema-component';
import {
  AfterSuccess,
  AssignedFieldValues,
  ButtonEditor,
  RemoveButton,
  SecondConFirm,
} from '../../schema-component/antd/action/Action.Designer';
import { useAssociationFieldContext } from '../../schema-component/antd/association-field/hooks';
import { FilterableFieldsSchemaSettingsItem } from '../../schema-component/antd/filter/Filter.Action.Designer';
import { removeNullCondition } from '../../schema-component/antd/filter/useFilterActionProps';
import { FixedBlockDesignerItem } from '../../schema-component/antd/page/FixedBlock';
import { useColumnSchema } from '../../schema-component/antd/table-v2/Table.Column.Decorator';
import { useColorFields, useLabelFields } from '../../schema-component/antd/table-v2/Table.Column.Designer';
import { useDesignable, useFieldModeOptions } from '../../schema-component/hooks';
import { SchemaSettingOpenModeSchemaItems } from '../../schema-items';
import {
  SchemaSettingsBlockTitleItem,
  SchemaSettingsConnectDataBlocks,
  SchemaSettingsDataScope,
  SchemaSettingsDateFormat,
  SchemaSettingsDefaultValue,
  SchemaSettingsLinkageRules,
  SchemaSettingsSortingRule,
  SchemaSettingsTemplate,
  isPatternDisabled,
} from '../../schema-settings';
import useIsAllowToSetDefaultValue from '../../schema-settings/hooks/useIsAllowToSetDefaultValue';

export const tableBlockSettings = new SchemaSettings({
  name: 'tableBlockSettings',
  items: [
    {
      name: 'editBlockTitle',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'treeTable',
      type: 'switch',
      useComponentProps: () => {
        const { getCollectionField, getCollection } = useCollectionManager();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { service } = useTableBlockContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const collection = useCollection();
        const { resource } = field.decoratorProps;
        const collectionField = resource && getCollectionField(resource);
        const treeCollection = resource?.includes('.')
          ? getCollection(collectionField?.target)?.tree
          : !!collection?.tree;

        return {
          title: t('Tree table'),
          defaultChecked: true,
          checked: treeCollection ? field.decoratorProps.treeTable !== false : false,
          onChange: (flag) => {
            field.decoratorProps.treeTable = flag;
            fieldSchema['x-decorator-props'].treeTable = flag;
            const params = {
              ...service.params?.[0],
              tree: flag ? true : null,
            };
            dn.emit('patch', {
              schema: fieldSchema,
            });
            dn.refresh();
            service.run(params);
          },
        };
      },
      useVisible: () => {
        const { getCollectionField } = useCollectionManager();
        const field = useField();
        const collection = useCollection();
        const { resource } = field.decoratorProps;
        const collectionField = resource && getCollectionField(resource);

        return collection?.tree && collectionField?.collectionName === collectionField?.target;
      },
    },
    {
      name: 'enableDragAndDropSorting',
      type: 'switch',
      useComponentProps: () => {
        const { getCollectionField } = useCollectionManager();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { service } = useTableBlockContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const { resource } = field.decoratorProps;
        const collectionField = resource && getCollectionField(resource);
        const api = useAPIClient();

        return {
          title: t('Enable drag and drop sorting'),
          checked: field.decoratorProps.dragSort,
          onChange: async (dragSort) => {
            if (dragSort && collectionField) {
              const { data } = await api.resource('collections.fields', collectionField.collectionName).update({
                filterByTk: collectionField.name,
                values: {
                  sortable: true,
                },
              });
              const sortBy = data?.data?.[0]?.sortBy;
              fieldSchema['x-decorator-props'].dragSortBy = sortBy;
            }
            field.decoratorProps.dragSort = dragSort;
            fieldSchema['x-decorator-props'].dragSort = dragSort;
            service.run({ ...service.params?.[0], sort: fieldSchema['x-decorator-props'].dragSortBy });
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
          },
        };
      },
      useVisible: () => {
        const { sortable } = useCollection();
        return !!sortable;
      },
    },
    {
      name: 'FixBlock',
      Component: FixedBlockDesignerItem,
    },
    {
      name: 'SetTheDataScope',
      Component: SchemaSettingsDataScope,
      useComponentProps: () => {
        const { name } = useCollection();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const { service } = useTableBlockContext();
        const { dn } = useDesignable();
        const onDataScopeSubmit = useCallback(
          ({ filter }) => {
            filter = removeNullCondition(filter);
            const params = field.decoratorProps.params || {};
            params.filter = filter;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            const filters = service.params?.[1]?.filters || {};
            service.run(
              { ...service.params?.[0], filter: mergeFilter([...Object.values(filters), filter]), page: 1 },
              { filters },
            );
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
          },
          [dn, field.decoratorProps, fieldSchema, service],
        );

        return {
          collectionName: name,
          defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
          form: form,
          onSubmit: onDataScopeSubmit,
        };
      },
    },
    {
      name: 'SetDefaultSortingRules',
      type: 'modal',
      useComponentProps() {
        const { name } = useCollection();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const sortFields = useSortFields(name);
        const { service } = useTableBlockContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const defaultSort = fieldSchema?.['x-decorator-props']?.params?.sort || [];
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

        return {
          title: t('Set default sorting rules'),
          components: { ArrayItems },
          schema: {
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
          } as ISchema,
          onSubmit: ({ sort }) => {
            const sortArr = sort.map((item) => {
              return item.direction === 'desc' ? `-${item.field}` : item.field;
            });
            const params = field.decoratorProps.params || {};
            params.sort = sortArr;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
            service.run({ ...service.params?.[0], sort: sortArr });
          },
        };
      },
      useVisible() {
        const field = useField();
        const { dragSort } = field.decoratorProps;

        return !dragSort;
      },
    },
    {
      name: 'RecordsPerPage',
      type: 'select',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { service } = useTableBlockContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Records per page'),
          value: field.decoratorProps?.params?.pageSize || 20,
          options: [
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 },
            { label: '100', value: 100 },
            { label: '200', value: 200 },
          ],
          onChange: (pageSize) => {
            const params = field.decoratorProps.params || {};
            params.pageSize = pageSize;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            service.run({ ...service.params?.[0], pageSize, page: 1 });
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
          },
        };
      },
    },
    {
      name: 'ConnectDataBlocks',
      Component: SchemaSettingsConnectDataBlocks,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          type: FilterBlockType.TABLE,
          emptyDescription: t('No blocks to connect'),
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
      useVisible: () => {
        const fieldSchema = useFieldSchema();
        const supportTemplate = !fieldSchema?.['x-decorator-props']?.disableTemplate;
        return supportTemplate;
      },
    },
    {
      name: 'ConvertReferenceToDuplicate',
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
        return {
          componentName: 'Table',
          collectionName: name,
          resourceName: defaultResource,
        };
      },
      useVisible: () => {
        const fieldSchema = useFieldSchema();
        const supportTemplate = !fieldSchema?.['x-decorator-props']?.disableTemplate;
        return supportTemplate;
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps: () => {
        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});

export const addNewActionSettings = new SchemaSettings({
  name: 'actionSettings:addNew',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'openMode',
      Component: SchemaSettingOpenModeSchemaItems,
      componentProps: {
        openMode: true,
        openSize: true,
      },
    },
    {
      name: 'delete',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});

export const refreshActionSettings = new SchemaSettings({
  name: 'actionSettings:refresh',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'secondConFirm',
      Component: SecondConFirm,
    },
    {
      name: 'delete',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});

export const bulkDeleteActionSettings = new SchemaSettings({
  name: 'actionSettings:bulkDelete',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'secondConFirm',
      Component: SecondConFirm,
    },
    {
      name: 'remove',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});

export const filterActionSettings = new SchemaSettings({
  name: 'actionSettings:filter',
  items: [
    {
      name: 'FilterableFields',
      Component: FilterableFieldsSchemaSettingsItem,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'EditButton',
      type: 'modal',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        const { t } = useTranslation();

        return {
          title: t('Edit button'),
          schema: {
            type: 'object',
            title: t('Edit button'),
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: t('Button title'),
                default: fieldSchema.title,
                'x-component-props': {},
              },
              icon: {
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                title: t('Button icon'),
                default: fieldSchema?.['x-component-props']?.icon,
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ title, icon }) => {
            fieldSchema.title = title;
            field.title = title;
            field.componentProps.icon = icon;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].icon = icon;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                title,
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: (s) => {
          return s['x-component'] === 'Space' || s['x-component'] === 'ActionBar';
        },
      },
    },
  ],
});

export const customizeAddRecordActionSettings = new SchemaSettings({
  name: 'actionSettings:addRecord',
  items: [
    {
      name: 'title',
      type: 'itemGroup',
      componentProps: {
        title: 'Customize > Add record',
      },
      children: [
        {
          name: 'editButton',
          Component: ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaToolbar();
            return buttonEditorProps;
          },
        },
        {
          name: 'openMode',
          Component: SchemaSettingOpenModeSchemaItems,
          componentProps: {
            openMode: true,
            openSize: true,
          },
        },
        {
          name: 'delete',
          sort: 100,
          Component: RemoveButton as any,
          useComponentProps() {
            const { removeButtonProps } = useSchemaToolbar();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});

export const viewActionSettings = new SchemaSettings({
  name: 'actionSettings:view',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
    },
    {
      name: 'openMode',
      Component: SchemaSettingOpenModeSchemaItems,
      componentProps: {
        openMode: true,
        openSize: true,
      },
    },
    {
      name: 'remove',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});

export const editActionSettings = new SchemaSettings({
  name: 'actionSettings:edit',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
    },
    {
      name: 'openMode',
      Component: SchemaSettingOpenModeSchemaItems,
      componentProps: {
        openMode: true,
        openSize: true,
      },
    },
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

export const deleteActionSettings = new SchemaSettings({
  name: 'actionSettings:delete',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
    },
    {
      name: 'secondConFirm',
      Component: SecondConFirm,
    },
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

export const customizePopupActionSettings = new SchemaSettings({
  name: 'actionSettings:popup',
  items: [
    {
      name: 'title',
      type: 'itemGroup',
      componentProps: {
        title: 'Customize > Popup',
      },
      children: [
        {
          name: 'editButton',
          Component: ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaToolbar();
            return buttonEditorProps;
          },
        },
        {
          name: 'linkageRules',
          Component: SchemaSettingsLinkageRules,
          useComponentProps() {
            const { name } = useCollection();
            const { linkageRulesProps } = useSchemaToolbar();
            return {
              ...linkageRulesProps,
              collectionName: name,
            };
          },
        },
        {
          name: 'openMode',
          Component: SchemaSettingOpenModeSchemaItems,
          componentProps: {
            openMode: true,
            openSize: true,
          },
        },
        {
          name: 'remove',
          sort: 100,
          Component: RemoveButton as any,
          useComponentProps() {
            const { removeButtonProps } = useSchemaToolbar();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});

export const customizeUpdateRecordActionSettings = new SchemaSettings({
  name: 'actionSettings:updateRecord',
  items: [
    {
      name: 'title',
      type: 'itemGroup',
      componentProps: {
        title: 'Customize > Update record',
      },
      children: [
        {
          name: 'editButton',
          Component: ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaToolbar();
            return buttonEditorProps;
          },
        },
        {
          name: 'linkageRules',
          Component: SchemaSettingsLinkageRules,
          useComponentProps() {
            const { name } = useCollection();
            const { linkageRulesProps } = useSchemaToolbar();
            return {
              ...linkageRulesProps,
              collectionName: name,
            };
          },
        },
        {
          name: 'secondConFirm',
          Component: SecondConFirm,
        },
        {
          name: 'assignFieldValues',
          Component: AssignedFieldValues,
        },
        {
          name: 'afterSuccessfulSubmission',
          Component: AfterSuccess,
        },
        {
          name: 'delete',
          sort: 100,
          Component: RemoveButton as any,
          useComponentProps() {
            const { removeButtonProps } = useSchemaToolbar();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});

export const tableBlockColumnSettings = new SchemaSettings({
  name: 'columnSettings:tableBlock',
  items: [
    {
      name: 'builtInOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Built-in options',
      },
      useChildren() {
        return [
          {
            name: 'customColumnTitle',
            type: 'modal',
            useComponentProps() {
              const { fieldSchema, collectionField } = useColumnSchema();
              const field: any = useField();
              const { t } = useTranslation();
              const columnSchema = useFieldSchema();
              const { dn } = useDesignable();

              return {
                title: t('Custom column title'),
                schema: {
                  type: 'object',
                  title: t('Custom column title'),
                  properties: {
                    title: {
                      title: t('Column title'),
                      default: columnSchema?.title,
                      description: `${t('Original field title: ')}${
                        collectionField?.uiSchema?.title || fieldSchema?.title
                      }`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit: ({ title }) => {
                  if (title) {
                    field.title = title;
                    columnSchema.title = title;
                    dn.emit('patch', {
                      schema: {
                        'x-uid': columnSchema['x-uid'],
                        title: columnSchema.title,
                      },
                    });
                  }
                  dn.refresh();
                },
              };
            },
          },
        ];
      },
    },
    {
      name: 'decoratorOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Decorator options',
      },
      useChildren() {
        return [];
      },
    },
    {
      name: 'componentOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Component options',
      },
      useChildren() {
        const app = useApp();
        const fieldComponentName = useFieldComponentName();
        const componentSettings = app.schemaSettingsManager.get(`columnSettings:component:${fieldComponentName}`);
        console.log('fieldComponentName', fieldComponentName);
        return componentSettings?.items || [];
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      sort: 100,
      useComponentProps() {
        const { t } = useTranslation();

        return {
          removeParentsIfNoChildren: true,
          confirm: {
            title: t('Delete field'),
          },
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});

export const subTableColumnSettings = new SchemaSettings({
  name: 'columnSettings:subTable',
  items: [
    {
      name: 'builtInOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Built-in options',
      },
      useChildren() {
        return [
          {
            name: 'customColumnTitle',
            type: 'modal',
            useComponentProps() {
              const { fieldSchema, collectionField } = useColumnSchema();
              const field: any = useField();
              const { t } = useTranslation();
              const columnSchema = useFieldSchema();
              const { dn } = useDesignable();

              return {
                title: t('Custom column title'),
                schema: {
                  type: 'object',
                  title: t('Custom column title'),
                  properties: {
                    title: {
                      title: t('Column title'),
                      default: columnSchema?.title,
                      description: `${t('Original field title: ')}${
                        collectionField?.uiSchema?.title || fieldSchema?.title
                      }`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit: ({ title }) => {
                  if (title) {
                    field.title = title;
                    columnSchema.title = title;
                    dn.emit('patch', {
                      schema: {
                        'x-uid': columnSchema['x-uid'],
                        title: columnSchema.title,
                      },
                    });
                  }
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'required',
            type: 'switch',
            useVisible() {
              const { uiSchema, fieldSchema } = useColumnSchema();
              const field: any = useField();
              const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);
              return isSubTableColumn && !field.readPretty && !uiSchema?.['x-read-pretty'];
            },
            useComponentProps() {
              const { fieldSchema } = useColumnSchema();
              const field: any = useField();
              const { t } = useTranslation();
              const { dn } = useDesignable();

              return {
                key: 'required',
                title: t('Required'),
                checked: fieldSchema.required as boolean,
                onChange: (required) => {
                  const schema = {
                    ['x-uid']: fieldSchema['x-uid'],
                  };
                  fieldSchema['required'] = required;
                  schema['required'] = required;
                  const path = field.path?.splice(field.path?.length - 1, 1);
                  field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                    f.required = required;
                  });
                  dn.emit('patch', {
                    schema,
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'pattern',
            type: 'select',
            useVisible() {
              const { fieldSchema, collectionField } = useColumnSchema();
              const field: any = useField();
              const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);

              return (
                isSubTableColumn &&
                !field?.readPretty &&
                collectionField?.interface !== 'o2m' &&
                !isPatternDisabled(fieldSchema)
              );
            },
            useComponentProps() {
              const { fieldSchema } = useColumnSchema();
              const field: any = useField();
              const { t } = useTranslation();
              const { dn } = useDesignable();
              let readOnlyMode = 'editable';
              if (fieldSchema['x-disabled'] === true) {
                readOnlyMode = 'readonly';
              }
              if (fieldSchema['x-read-pretty'] === true) {
                readOnlyMode = 'read-pretty';
              }

              return {
                key: 'pattern',
                title: t('Pattern'),
                options: [
                  { label: t('Editable'), value: 'editable' },
                  { label: t('Readonly'), value: 'readonly' },
                  { label: t('Easy-reading'), value: 'read-pretty' },
                ],
                value: readOnlyMode,
                onChange: (v) => {
                  const schema: ISchema = {
                    ['x-uid']: fieldSchema['x-uid'],
                  };
                  const path = field.path?.splice(field.path?.length - 1, 1);
                  switch (v) {
                    case 'readonly': {
                      fieldSchema['x-read-pretty'] = false;
                      fieldSchema['x-disabled'] = true;
                      schema['x-read-pretty'] = false;
                      schema['x-disabled'] = true;
                      field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                        f.readonly = true;
                        f.disabled = true;
                      });
                      break;
                    }
                    case 'read-pretty': {
                      fieldSchema['x-read-pretty'] = true;
                      fieldSchema['x-disabled'] = false;
                      schema['x-read-pretty'] = true;
                      schema['x-disabled'] = false;
                      field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                        f.readPretty = true;
                      });
                      break;
                    }
                    default: {
                      fieldSchema['x-read-pretty'] = false;
                      fieldSchema['x-disabled'] = false;
                      schema['x-read-pretty'] = false;
                      schema['x-disabled'] = false;
                      field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                        f.readPretty = false;
                        f.disabled + false;
                      });
                      break;
                    }
                  }

                  dn.emit('patch', {
                    schema,
                  });

                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'setDefaultValue',
            Component: SchemaSettingsDefaultValue,
            useVisible() {
              const { fieldSchema, collectionField } = useColumnSchema();
              const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);
              const { isAllowToSetDefaultValue } = useIsAllowToSetDefaultValue({ collectionField, fieldSchema });
              return isAllowToSetDefaultValue(isSubTableColumn);
            },
            useComponentProps() {
              const { fieldSchema } = useColumnSchema();
              return {
                fieldSchema,
              };
            },
          },
        ];
      },
    },
    {
      name: 'decoratorOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Decorator options',
      },
      useChildren() {
        return [];
      },
    },
    {
      name: 'componentOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Component options',
      },
      useChildren() {
        const app = useApp();
        const fieldComponentName = useFieldComponentName();
        const componentSettings = app.schemaSettingsManager.get(`columnSettings:component:${fieldComponentName}`);
        console.log('fieldComponentName', fieldComponentName);
        return componentSettings?.items || [];
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      sort: 100,
      useComponentProps() {
        const { t } = useTranslation();

        return {
          removeParentsIfNoChildren: true,
          confirm: {
            title: t('Delete field'),
          },
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});

export const columnPercentComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Percent',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnIconPickerComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:IconPicker',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnColorPickerComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:ColorPicker',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnPasswordComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Password',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnInputNumberComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:InputNumber',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnInputURLComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Input.URL',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnInputComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Input',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnCollectionSelectComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:CollectionSelect',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnInputJSONComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Input.JSON',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnFormulaResultComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Formula.Result',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnInputTextAreaComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Input.TextArea',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnTimePickerComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:TimePicker',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnDatePickerComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:DatePicker',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'dateDisplayFormat',
      Component: SchemaSettingsDateFormat as any,
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        return { fieldSchema };
      },
    },
  ],
});

export const columnUploadAttachmentComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Upload.Attachment',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnRichTextComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:RichText',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnMarkdownComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Markdown',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnSelectComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Select',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'enableLink',
      type: 'switch',
      useVisible() {
        const { collectionField, fieldSchema } = useColumnSchema();
        return collectionField?.target && fieldSchema['x-read-pretty'];
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Enable link'),
          checked: fieldSchema['x-component-props']?.enableLink !== false,
          onChange: (flag) => {
            fieldSchema['x-component-props'] = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            field.componentProps = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema?.['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'titleField',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { uiSchema, fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const fieldNames =
          fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
        const options = useLabelFields(collectionField?.target ?? collectionField?.targetCollection);

        return {
          title: t('Title field'),
          options: options,
          value: fieldNames?.['label'],
          onChange: (label) => {
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']['fieldNames'],
              ...fieldSchema?.['x-component-props']?.['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'fieldComponent',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const { getCollection } = useCollectionManager();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const targetCollection = getCollection(collectionField?.target);
        const isFileField = isFileCollection(targetCollection as any);
        const fieldModeOptions = useFieldModeOptions({ fieldSchema });
        const fieldMode = fieldSchema?.['x-component-props']?.['mode'] || 'Select';

        return {
          key: 'field-mode',
          title: t('Field component'),
          options: fieldSchema['x-read-pretty']
            ? [
                { label: t('Title'), value: 'Select' },
                isFileField && { label: t('File manager'), value: 'FileManager' },
                { label: t('Tag'), value: 'Tag' },
              ].filter(Boolean)
            : fieldModeOptions,
          value: fieldMode,
          onChange: (mode) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'setDefaultSortingRules',
      Component: SchemaSettingsSortingRule,
      useVisible() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);

        return (
          isSubTableColumn &&
          !field?.readPretty &&
          ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface)
        );
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();

        return {
          fieldSchema,
          onSubmitCallBack: (sortArr) => {
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.service = f.componentProps.service || { params: {} };
              f.componentProps.service.params.sort = sortArr;
            });
          },
        };
      },
    },
  ],
});

export const columnNesterComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Nester',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'enableLink',
      type: 'switch',
      useVisible() {
        const { collectionField, fieldSchema } = useColumnSchema();
        return collectionField?.target && fieldSchema['x-read-pretty'];
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Enable link'),
          checked: fieldSchema['x-component-props']?.enableLink !== false,
          onChange: (flag) => {
            fieldSchema['x-component-props'] = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            field.componentProps = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema?.['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'titleField',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { uiSchema, fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const fieldNames =
          fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
        const options = useLabelFields(collectionField?.target ?? collectionField?.targetCollection);

        return {
          title: t('Title field'),
          options: options,
          value: fieldNames?.['label'],
          onChange: (label) => {
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']['fieldNames'],
              ...fieldSchema?.['x-component-props']?.['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'fieldComponent',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const { getCollection } = useCollectionManager();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const targetCollection = getCollection(collectionField?.target);
        const isFileField = isFileCollection(targetCollection as any);
        const fieldModeOptions = useFieldModeOptions({ fieldSchema });
        const fieldMode = fieldSchema?.['x-component-props']?.['mode'] || 'Select';

        return {
          key: 'field-mode',
          title: t('Field component'),
          options: fieldSchema['x-read-pretty']
            ? [
                { label: t('Title'), value: 'Select' },
                isFileField && { label: t('File manager'), value: 'FileManager' },
                { label: t('Tag'), value: 'Tag' },
              ].filter(Boolean)
            : fieldModeOptions,
          value: fieldMode,
          onChange: (mode) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'setDefaultSortingRules',
      Component: SchemaSettingsSortingRule,
      useVisible() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);

        return (
          isSubTableColumn &&
          !field?.readPretty &&
          ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface)
        );
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();

        return {
          fieldSchema,
          onSubmitCallBack: (sortArr) => {
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.service = f.componentProps.service || { params: {} };
              f.componentProps.service.params.sort = sortArr;
            });
          },
        };
      },
    },
  ],
});

export const columnSubTableComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:SubTable',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'enableLink',
      type: 'switch',
      useVisible() {
        const { collectionField, fieldSchema } = useColumnSchema();
        return collectionField?.target && fieldSchema['x-read-pretty'];
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Enable link'),
          checked: fieldSchema['x-component-props']?.enableLink !== false,
          onChange: (flag) => {
            fieldSchema['x-component-props'] = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            field.componentProps = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema?.['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'titleField',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { uiSchema, fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const fieldNames =
          fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
        const options = useLabelFields(collectionField?.target ?? collectionField?.targetCollection);

        return {
          title: t('Title field'),
          options: options,
          value: fieldNames?.['label'],
          onChange: (label) => {
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']['fieldNames'],
              ...fieldSchema?.['x-component-props']?.['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'fieldComponent',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const { getCollection } = useCollectionManager();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const targetCollection = getCollection(collectionField?.target);
        const isFileField = isFileCollection(targetCollection as any);
        const fieldModeOptions = useFieldModeOptions({ fieldSchema });
        const fieldMode = fieldSchema?.['x-component-props']?.['mode'] || 'Select';

        return {
          key: 'field-mode',
          title: t('Field component'),
          options: fieldSchema['x-read-pretty']
            ? [
                { label: t('Title'), value: 'Select' },
                isFileField && { label: t('File manager'), value: 'FileManager' },
                { label: t('Tag'), value: 'Tag' },
              ].filter(Boolean)
            : fieldModeOptions,
          value: fieldMode,
          onChange: (mode) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'setDefaultSortingRules',
      Component: SchemaSettingsSortingRule,
      useVisible() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);

        return (
          isSubTableColumn &&
          !field?.readPretty &&
          ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface)
        );
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();

        return {
          fieldSchema,
          onSubmitCallBack: (sortArr) => {
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.service = f.componentProps.service || { params: {} };
              f.componentProps.service.params.sort = sortArr;
            });
          },
        };
      },
    },
  ],
});

export const columnPickerComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Picker',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'enableLink',
      type: 'switch',
      useVisible() {
        const { collectionField, fieldSchema } = useColumnSchema();
        return collectionField?.target && fieldSchema['x-read-pretty'];
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Enable link'),
          checked: fieldSchema['x-component-props']?.enableLink !== false,
          onChange: (flag) => {
            fieldSchema['x-component-props'] = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            field.componentProps = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema?.['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'titleField',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { uiSchema, fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const fieldNames =
          fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
        const options = useLabelFields(collectionField?.target ?? collectionField?.targetCollection);

        return {
          title: t('Title field'),
          options: options,
          value: fieldNames?.['label'],
          onChange: (label) => {
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']['fieldNames'],
              ...fieldSchema?.['x-component-props']?.['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'fieldComponent',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const { getCollection } = useCollectionManager();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const targetCollection = getCollection(collectionField?.target);
        const isFileField = isFileCollection(targetCollection as any);
        const fieldModeOptions = useFieldModeOptions({ fieldSchema });
        const fieldMode = fieldSchema?.['x-component-props']?.['mode'] || 'Select';

        return {
          key: 'field-mode',
          title: t('Field component'),
          options: fieldSchema['x-read-pretty']
            ? [
                { label: t('Title'), value: 'Select' },
                isFileField && { label: t('File manager'), value: 'FileManager' },
                { label: t('Tag'), value: 'Tag' },
              ].filter(Boolean)
            : fieldModeOptions,
          value: fieldMode,
          onChange: (mode) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'setDefaultSortingRules',
      Component: SchemaSettingsSortingRule,
      useVisible() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);

        return (
          isSubTableColumn &&
          !field?.readPretty &&
          ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface)
        );
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();

        return {
          fieldSchema,
          onSubmitCallBack: (sortArr) => {
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.service = f.componentProps.service || { params: {} };
              f.componentProps.service.params.sort = sortArr;
            });
          },
        };
      },
    },
  ],
});

export const columnPopoverNesterComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:PopoverNester',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'enableLink',
      type: 'switch',
      useVisible() {
        const { collectionField, fieldSchema } = useColumnSchema();
        return collectionField?.target && fieldSchema['x-read-pretty'];
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Enable link'),
          checked: fieldSchema['x-component-props']?.enableLink !== false,
          onChange: (flag) => {
            fieldSchema['x-component-props'] = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            field.componentProps = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema?.['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'titleField',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { uiSchema, fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const fieldNames =
          fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
        const options = useLabelFields(collectionField?.target ?? collectionField?.targetCollection);

        return {
          title: t('Title field'),
          options: options,
          value: fieldNames?.['label'],
          onChange: (label) => {
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']['fieldNames'],
              ...fieldSchema?.['x-component-props']?.['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'fieldComponent',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const { getCollection } = useCollectionManager();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const targetCollection = getCollection(collectionField?.target);
        const isFileField = isFileCollection(targetCollection as any);
        const fieldModeOptions = useFieldModeOptions({ fieldSchema });
        const fieldMode = fieldSchema?.['x-component-props']?.['mode'] || 'Select';

        return {
          key: 'field-mode',
          title: t('Field component'),
          options: fieldSchema['x-read-pretty']
            ? [
                { label: t('Title'), value: 'Select' },
                isFileField && { label: t('File manager'), value: 'FileManager' },
                { label: t('Tag'), value: 'Tag' },
              ].filter(Boolean)
            : fieldModeOptions,
          value: fieldMode,
          onChange: (mode) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'setDefaultSortingRules',
      Component: SchemaSettingsSortingRule,
      useVisible() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);

        return (
          isSubTableColumn &&
          !field?.readPretty &&
          ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface)
        );
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();

        return {
          fieldSchema,
          onSubmitCallBack: (sortArr) => {
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.service = f.componentProps.service || { params: {} };
              f.componentProps.service.params.sort = sortArr;
            });
          },
        };
      },
    },
  ],
});

export const columnTagComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Tag',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'enableLink',
      type: 'switch',
      useVisible() {
        const { collectionField, fieldSchema } = useColumnSchema();
        return collectionField?.target && fieldSchema['x-read-pretty'];
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Enable link'),
          checked: fieldSchema['x-component-props']?.enableLink !== false,
          onChange: (flag) => {
            fieldSchema['x-component-props'] = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            field.componentProps = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema?.['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'titleField',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { uiSchema, fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const fieldNames =
          fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
        const options = useLabelFields(collectionField?.target ?? collectionField?.targetCollection);

        return {
          title: t('Title field'),
          options: options,
          value: fieldNames?.['label'],
          onChange: (label) => {
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']['fieldNames'],
              ...fieldSchema?.['x-component-props']?.['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'fieldComponent',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const { getCollection } = useCollectionManager();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const targetCollection = getCollection(collectionField?.target);
        const isFileField = isFileCollection(targetCollection as any);
        const fieldModeOptions = useFieldModeOptions({ fieldSchema });
        const fieldMode = fieldSchema?.['x-component-props']?.['mode'] || 'Select';

        return {
          key: 'field-mode',
          title: t('Field component'),
          options: fieldSchema['x-read-pretty']
            ? [
                { label: t('Title'), value: 'Select' },
                isFileField && { label: t('File manager'), value: 'FileManager' },
                { label: t('Tag'), value: 'Tag' },
              ].filter(Boolean)
            : fieldModeOptions,
          value: fieldMode,
          onChange: (mode) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'tagColorField',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const colorFieldOptions = useColorFields(collectionField?.target ?? collectionField?.targetCollection);

        return {
          key: 'title-field',
          title: t('Tag color field'),
          options: colorFieldOptions,
          value: fieldSchema?.['x-component-props']?.tagColorField,
          onChange: (tagColorField) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };

            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['tagColorField'] = tagColorField;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps.tagColorField = tagColorField;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnRadioGroupComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Radio.Group',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnCascaderComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Cascader',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnCheckboxGroupComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Checkbox.Group',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export const columnCheckboxComponentFieldSettings = new SchemaSettings({
  name: 'columnSettings:component:Checkbox',
  items: [
    {
      name: 'columnWidth',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Column width'),
          schema: {
            type: 'object',
            title: t('Column width'),
            properties: {
              width: {
                default: columnSchema?.['x-component-props']?.['width'] || 200,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ width }) => {
            const props = columnSchema['x-component-props'] || {};
            props['width'] = width;
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            columnSchema['x-component-props'] = props;
            field.componentProps.width = width;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'sortable',
      type: 'switch',
      useVisible() {
        const { collectionField } = useColumnSchema();
        const { getInterface } = useCollectionManager();
        const interfaceCfg = getInterface(collectionField?.interface);
        const { currentMode } = useAssociationFieldContext();

        return interfaceCfg?.sortable === true && !currentMode;
      },
      useComponentProps() {
        const field: any = useField();
        const { t } = useTranslation();
        const columnSchema = useFieldSchema();
        const { dn } = useDesignable();

        return {
          title: t('Sortable'),
          checked: field.componentProps.sorter,
          onChange: (v) => {
            const schema: ISchema = {
              ['x-uid']: columnSchema['x-uid'],
            };
            columnSchema['x-component-props'] = {
              ...columnSchema['x-component-props'],
              sorter: v,
            };
            schema['x-component-props'] = columnSchema['x-component-props'];
            field.componentProps.sorter = v;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

function useFieldComponentName(): string {
  const { fieldSchema, collectionField } = useColumnSchema();
  const field = useField<Field>();
  const isFileField = useIsFileField();
  const map = {
    // AssociationField 的 mode 默认值是 Select
    AssociationField: 'Select',
  };
  const fieldComponentName =
    field?.componentProps?.['mode'] ||
    (isFileField ? 'FileManager' : '') ||
    collectionField?.uiSchema?.['x-component'] ||
    fieldSchema?.['x-component'];
  return map[fieldComponentName] || fieldComponentName;
}
