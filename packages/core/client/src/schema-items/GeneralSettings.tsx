/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../schema-component';
import { SchemaSettingOptions } from '../application';
import { useSchemaToolbar } from '../application/schema-toolbar';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../collection-manager';
import { SchemaSettingsLinkageRules } from '../schema-settings';
import { useIsFieldReadPretty, useCompile } from '../schema-component';
import { useCollection } from '../data-source';

export const generalSettingsItems: SchemaSettingOptions['items'] = [
  {
    name: 'editFieldTitle',
    type: 'modal',
    useComponentProps() {
      const { t } = useTranslation();
      const { dn } = useDesignable();
      const compile = useCompile();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();
      const { getCollectionJoinField } = useCollectionManager_deprecated();
      const { getField } = useCollection_deprecated();
      const collectionField =
        getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);

      return {
        title: t('Edit field title'),
        schema: {
          type: 'object',
          title: t('Edit field title'),
          properties: {
            title: {
              title: t('Field title'),
              default: field?.title,
              description: `${t('Original field title: ')}${collectionField?.uiSchema?.title}`,
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {},
            },
          },
        } as ISchema,
        onSubmit({ title }) {
          const result = title.trim() === '' ? collectionField?.uiSchema?.title : title;
          field.title = compile(result);
          fieldSchema.title = title;
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              title: fieldSchema.title,
            },
          });

          dn.refresh();
        },
      };
    },
    useVisible() {
      const fieldSchema = useFieldSchema();
      const { getCollectionJoinField } = useCollectionManager_deprecated();
      const { getField } = useCollection_deprecated();
      const collectionField =
        getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
      return !!collectionField;
    },
  },
  {
    name: 'displayTitle',
    type: 'switch',
    useComponentProps() {
      const { t } = useTranslation();
      const { dn } = useDesignable();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();

      return {
        title: t('Display title'),
        checked: fieldSchema['x-decorator-props']?.['showTitle'] ?? true,
        onChange(checked) {
          fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
          fieldSchema['x-decorator-props']['showTitle'] = checked;
          field.decoratorProps.showTitle = checked;
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-decorator-props': {
                ...fieldSchema['x-decorator-props'],
                showTitle: checked,
              },
            },
          });
          dn.refresh();
        },
      };
    },
  },
  {
    name: 'editDescription',
    type: 'modal',
    useComponentProps() {
      const { t } = useTranslation();
      const { dn } = useDesignable();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();

      return {
        title: t('Edit description'),
        schema: {
          type: 'object',
          title: t('Edit description'),
          properties: {
            description: {
              // title: t('Description'),
              default: field?.description,
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea',
              'x-component-props': {},
            },
          },
        } as ISchema,
        onSubmit({ description }) {
          field.description = description;
          fieldSchema.description = description;
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              description: fieldSchema.description,
            },
          });
          dn.refresh();
        },
      };
    },
    useVisible() {
      const field = useField<Field>();
      return !field.readPretty;
    },
  },
  {
    name: 'editTooltip',
    type: 'modal',
    useComponentProps() {
      const { t } = useTranslation();
      const { dn } = useDesignable();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();

      return {
        title: t('Edit tooltip'),
        schema: {
          type: 'object',
          title: t('Edit tooltip'),
          properties: {
            tooltip: {
              default: fieldSchema?.['x-decorator-props']?.tooltip,
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea',
              'x-component-props': {},
            },
          },
        } as ISchema,
        onSubmit({ tooltip }) {
          field.decoratorProps.tooltip = tooltip;
          fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
          fieldSchema['x-decorator-props']['tooltip'] = tooltip;
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
          dn.refresh();
        },
      };
    },
    useVisible() {
      const field = useField<Field>();
      return field.readPretty;
    },
  },
  {
    name: 'required',
    type: 'switch',
    useComponentProps() {
      const { t } = useTranslation();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();
      const { dn, refresh } = useDesignable();

      return {
        title: t('Required'),
        checked: fieldSchema.required as boolean,
        onChange(required) {
          const schema = {
            ['x-uid']: fieldSchema['x-uid'],
          };
          field.required = required;
          fieldSchema['required'] = required;
          schema['required'] = required;
          dn.emit('patch', {
            schema,
          });
          refresh();
        },
      };
    },
    useVisible() {
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();
      const { required = true } = useSchemaToolbar();
      return !field.readPretty && fieldSchema['x-component'] !== 'FormField' && required;
    },
  },
  {
    name: 'style',
    Component: (props) => {
      const localProps = { ...props, category: 'style' };
      return <SchemaSettingsLinkageRules {...localProps} />;
    },
    useVisible() {
      const isFieldReadPretty = useIsFieldReadPretty();
      return isFieldReadPretty;
    },
    useComponentProps() {
      const { name } = useCollection();
      const { linkageRulesProps } = useSchemaToolbar();
      return {
        ...linkageRulesProps,
        collectionName: name,
      };
    },
  },
];
