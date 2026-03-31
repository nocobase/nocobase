/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayItems } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useCollectionManager_deprecated, useSortFields } from '../../../../collection-manager';
import { useFieldComponentName } from '../../../../common/useFieldComponentName';
import { useCollectionManager, useRerenderDataBlock, useCollectionField } from '../../../../data-source';
import { FlagProvider } from '../../../../flag-provider/FlagProvider';
import { withDynamicSchemaProps } from '../../../../hoc/withDynamicSchemaProps';
import {
  useDesignable,
  useFieldModeOptions,
  useIsAddNewForm,
  useIsFieldReadPretty,
} from '../../../../schema-component';
import { isSubMode } from '../../../../schema-component/antd/association-field/util';
import { useIsAssociationField } from '../../../../schema-component/antd/form-item';
import { FormLinkageRules } from '../../../../schema-settings/LinkageRules';
import { SchemaSettingsLinkageRules } from '../../../../schema-settings/SchemaSettings';
import { useColumnSchema } from '../../../../schema-component';
import { SchemaSettingsItemType } from '../../../../application';

const enabledIndexColumn: SchemaSettingsItemType = {
  name: 'enableIndexColumn',
  type: 'switch',
  useComponentProps: () => {
    const field = useField();
    const fieldSchema = useFieldSchema();
    const { t } = useTranslation();
    const { dn } = useDesignable();
    return {
      title: t('Enable index column'),
      checked: field.componentProps.enableIndexColumn !== false,
      onChange: async (enableIndexColumn) => {
        field.componentProps = field.componentProps || {};
        field.componentProps.enableIndexColumn = enableIndexColumn;
        fieldSchema['x-component-props'].enableIndexColumn = enableIndexColumn;
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
const fieldComponent: any = {
  name: 'fieldComponent',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const fieldModeOptions = useFieldModeOptions();
    const isAddNewForm = useIsAddNewForm();
    const fieldComponentName = useFieldComponentName();
    const { dn } = useDesignable();

    return {
      title: t('Field component'),
      options: fieldModeOptions,
      value: fieldComponentName,
      onChange(mode) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['mode'] = mode;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = field.componentProps || {};
        field.componentProps.mode = mode;

        // 子表单状态不允许设置默认值
        if (isSubMode(fieldSchema) && isAddNewForm) {
          // @ts-ignore
          schema.default = null;
          fieldSchema.default = null;
          field.setInitialValue(null);
          field.setValue(null);
        }

        void dn.emit('patch', {
          schema,
        });
        dn.refresh();
      },
    };
  },
};
export const allowSelectExistingRecord = {
  name: 'allowSelectExistingRecord',
  type: 'switch',
  useVisible() {
    const fieldSchema = useFieldSchema();
    const { multiple } = fieldSchema['x-component-props'];
    const readPretty = useIsFieldReadPretty();
    const collectionField = useCollectionField();
    return !readPretty && multiple !== false && ['hasMany', 'belongsToMany'].includes(collectionField?.type);
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { dn, refresh } = useDesignable();
    return {
      title: t('Allow selection of existing records'),
      checked: fieldSchema['x-component-props']?.allowSelectExistingRecord,
      onChange(value) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        field.componentProps.allowSelectExistingRecord = value;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].allowSelectExistingRecord = value;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        dn.emit('patch', {
          schema,
        });
        refresh();
      },
    };
  },
};

const allowDisassociation = {
  name: 'allowDisassociation',
  type: 'switch',
  useVisible() {
    const readPretty = useIsFieldReadPretty();
    return !readPretty;
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { dn, refresh } = useDesignable();
    return {
      title: t('Allow disassociation'),
      checked: fieldSchema['x-component-props']?.allowDisassociation !== false,
      onChange(value) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        field.componentProps.allowDisassociation = value;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].allowDisassociation = value;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        dn.emit('patch', {
          schema,
        });
        refresh();
      },
    };
  },
};

export const setDefaultSortingRules = {
  name: 'SetDefaultSortingRules',
  type: 'modal',
  useComponentProps() {
    const { getCollectionJoinField } = useCollectionManager_deprecated();
    const field = useField();
    const fieldSchema = useFieldSchema();
    const association = fieldSchema['x-collection-field'];
    const { target } = getCollectionJoinField(association) || {};
    const sortFields = useSortFields(target);
    const { t } = useTranslation();
    const { dn } = useDesignable();
    const defaultSort = field.componentProps.sortArr || [];
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
        field.componentProps.sortArr = sortArr;
        fieldSchema['x-component-props'].sortArr = sortArr;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
      },
    };
  },
  useVisible() {
    const { getCollectionJoinField } = useCollectionManager_deprecated();
    const fieldSchema = useFieldSchema();
    const association = fieldSchema['x-collection-field'];
    const { interface: targetInterface } = getCollectionJoinField(association) || {};
    const readPretty = useIsFieldReadPretty();
    return readPretty && ['m2m', 'o2m'].includes(targetInterface);
  },
};

export const allowAddNewData = {
  name: 'allowAddNewData',
  type: 'switch',
  useVisible() {
    const readPretty = useIsFieldReadPretty();
    const isAssociationField = useIsAssociationField();
    return !readPretty && isAssociationField;
  },
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { dn, refresh } = useDesignable();
    return {
      title: t('Allow add new'),
      checked: fieldSchema['x-component-props']?.allowAddnew !== (false as boolean),
      onChange(value) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        field.componentProps.allowAddnew = value;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].allowAddnew = value;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        dn.emit('patch', {
          schema,
        });
        refresh();
      },
    };
  },
};

const LinkageRulesComponent = withDynamicSchemaProps(
  (props) => {
    return (
      // the purpose is to display the `Current object` variable in the linkage rule configuration dialog
      <FlagProvider isInSubForm>
        <FormLinkageRules {...props} />
      </FlagProvider>
    );
  },
  { displayName: 'LinkageRulesComponent' },
);

export const linkageRules = {
  name: 'linkageRules',
  Component: SchemaSettingsLinkageRules,
  useComponentProps() {
    const field = useField();
    const schema = useFieldSchema();
    const { fieldSchema: columnSchema } = useColumnSchema();
    const fieldSchema = columnSchema || schema;
    const cm = useCollectionManager();
    const collectionField = cm.getCollectionField(fieldSchema['x-collection-field']);
    const { rerenderDataBlock } = useRerenderDataBlock();
    return {
      collectionName: collectionField?.target,
      Component: LinkageRulesComponent,
      readPretty: field.readPretty,
      afterSubmit: rerenderDataBlock,
    };
  },
};

export const recordPerPage = {
  name: 'recordsPerPage',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { dn } = useDesignable();
    const pageSizeOptions = [10, 20, 50, 100];

    return {
      title: t('Records per page'),
      value: field.componentProps?.pageSize || 10,
      options: pageSizeOptions.map((v) => ({ value: v })),
      onChange: (pageSize) => {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        field.componentProps = field.componentProps || {};
        field.componentProps.pageSize = pageSize;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].pageSize = pageSize;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        dn.emit('patch', {
          schema,
        });
      },
    };
  },
};

export const subTablePopoverComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:SubTable',
  items: [
    fieldComponent,
    allowAddNewData,
    allowSelectExistingRecord,
    allowDisassociation,
    setDefaultSortingRules,
    enabledIndexColumn,
    linkageRules,
    recordPerPage,
  ],
});
