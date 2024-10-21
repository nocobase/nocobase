/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useFormBlockContext } from '../../../../block-provider/FormBlockProvider';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../../collection-manager';
import { useCollection } from '../../../../data-source';
import { useCollectionManager } from '../../../../data-source/collection/CollectionManagerProvider';
import { useCompile, useDesignable } from '../../../../schema-component';
import { SchemaSettingsDefaultSortingRules, SchemaSettingsDefaultValue } from '../../../../schema-settings';
import { SchemaSettingsDataScope } from '../../../../schema-settings/SchemaSettingsDataScope';

export const filterCollapseItemFieldSettings = new SchemaSettings({
  name: 'fieldSettings:FilterCollapseItem',
  items: [
    {
      name: 'decoratorOptions',
      type: 'itemGroup',
      hideIfNoChildren: true,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          title: t('Generic properties'),
        };
      },
      useChildren() {
        return [
          {
            name: 'customTitle',
            type: 'modal',
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const { t } = useTranslation();
              const { getCollectionJoinField } = useCollectionManager_deprecated();
              const { getField } = useCollection_deprecated();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
              const { dn } = useDesignable();

              return {
                title: t('Custom title'),
                schema: {
                  type: 'object',
                  title: t('Custom title'),
                  properties: {
                    title: {
                      default: fieldSchema?.title,
                      description: `${t('Original title: ')}${collectionField?.uiSchema?.title || fieldSchema?.title}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit: ({ title }) => {
                  if (title) {
                    // field.title = title;
                    fieldSchema.title = title;
                    dn.emit('patch', {
                      schema: {
                        'x-uid': fieldSchema['x-uid'],
                        title: fieldSchema.title,
                      },
                    });
                  }
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'defaultCollapse',
            type: 'switch',
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const field = useField();
              const { t } = useTranslation();
              const { dn } = useDesignable();

              return {
                title: t('Default collapse'),
                checked: field.componentProps.defaultCollapse,
                onChange: (v) => {
                  field.componentProps.defaultCollapse = v;
                  _.set(fieldSchema, 'x-component-props.defaultCollapse', v);
                  dn.emit('patch', {
                    schema: {
                      ['x-uid']: fieldSchema['x-uid'],
                      'x-component-props': fieldSchema['x-component-props'],
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'setTheDataScope',
            Component: SchemaSettingsDataScope,
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const { form } = useFormBlockContext();
              const field = useField();
              const { getCollectionJoinField } = useCollectionManager_deprecated();
              const { getField } = useCollection_deprecated();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
              const { dn } = useDesignable();

              return {
                collectionName: collectionField?.target,
                defaultFilter: fieldSchema?.['x-component-props']?.params?.filter || {},
                form: form,
                onSubmit: ({ filter }) => {
                  _.set(field.componentProps, 'params', {
                    ...field.componentProps?.params,
                    filter,
                  });
                  fieldSchema['x-component-props']['params'] = field.componentProps.params;
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
              const fieldSchema = useFieldSchema();
              const collection = useCollection();
              const collectionField = collection.getField(fieldSchema['name']);
              return !!collectionField?.target;
            },
          },
          {
            name: 'setDefaultSortingRules',
            Component: SchemaSettingsDefaultSortingRules,
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const { getCollectionJoinField } = useCollectionManager_deprecated();
              const { getField } = useCollection_deprecated();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);

              return {
                name: collectionField?.target,
              };
            },
            useVisible() {
              const fieldSchema = useFieldSchema();
              const collection = useCollection();
              const collectionField = collection.getField(fieldSchema['name']);
              return !!collectionField?.target;
            },
          },
          {
            name: 'titleField',
            type: 'select',
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const { t } = useTranslation();
              const { getCollectionJoinField } = useCollectionManager_deprecated();
              const { getField } = useCollection_deprecated();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
              const cm = useCollectionManager();
              const compile = useCompile();
              const { dn } = useDesignable();
              const targetFields = collectionField?.target ? cm.getCollectionFields(collectionField?.target) : [];
              const options = targetFields
                .filter((field) => !field?.target && field.type !== 'boolean')
                .map((field) => ({
                  value: field?.name,
                  label: compile(field?.uiSchema?.title) || field?.name,
                }));
              const onTitleFieldChange = (label) => {
                const schema = {
                  ['x-uid']: fieldSchema['x-uid'],
                };
                const fieldNames = {
                  ...collectionField?.uiSchema?.['x-component-props']?.['fieldNames'],
                  ...fieldSchema['x-component-props']?.['fieldNames'],
                  label,
                };
                fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
                fieldSchema['x-component-props']['fieldNames'] = fieldNames;
                schema['x-component-props'] = fieldSchema['x-component-props'];
                dn.emit('patch', {
                  schema,
                });
                dn.refresh();
              };

              return {
                key: 'title-field',
                title: t('Title field'),
                options: options,
                value: fieldSchema['x-component-props']?.fieldNames?.label,
                onChange: onTitleFieldChange,
              };
            },
            useVisible() {
              const fieldSchema = useFieldSchema();
              const collection = useCollection();
              const collectionField = collection.getField(fieldSchema['name']);
              return !!collectionField?.target;
            },
          },
          {
            name: 'setDefaultValue',
            Component: SchemaSettingsDefaultValue,
            componentProps: {
              hideVariableButton: true,
            },
          } as any,
        ];
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
