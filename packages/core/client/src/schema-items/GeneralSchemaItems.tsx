/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { ISchema, observer, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../collection-manager';
import { useDesignable, useCompile } from '../schema-component';
import { SchemaSettingsModalItem, SchemaSettingsSwitchItem } from '../schema-settings';
import { getTempFieldState } from '../schema-settings/LinkageRules/bindLinkageRulesToFiled';

export const GeneralSchemaItems: React.FC<{
  required?: boolean;
}> = observer(
  (props) => {
    const { required = true } = props;
    const { getCollectionJoinField } = useCollectionManager_deprecated();
    const { getField } = useCollection_deprecated();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { t } = useTranslation();
    const { dn, refresh } = useDesignable();
    const compile = useCompile();
    const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
    return (
      <>
        {collectionField && (
          <SchemaSettingsModalItem
            key="edit-field-title"
            title={t('Edit field title')}
            schema={
              {
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
              } as ISchema
            }
            onSubmit={({ title }) => {
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
            }}
          />
        )}
        <SchemaSettingsSwitchItem
          checked={fieldSchema['x-decorator-props']?.['showTitle'] ?? true}
          title={t('Display title')}
          onChange={(checked) => {
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
          }}
        ></SchemaSettingsSwitchItem>
        {!field.readPretty && (
          <SchemaSettingsModalItem
            key="edit-description"
            title={t('Edit description')}
            schema={
              {
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
              } as ISchema
            }
            onSubmit={({ description }) => {
              field.description = description;
              fieldSchema.description = description;
              dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  description: fieldSchema.description,
                },
              });
              dn.refresh();
            }}
          />
        )}
        {field.readPretty && (
          <SchemaSettingsModalItem
            key="edit-tooltip"
            title={t('Edit tooltip')}
            schema={
              {
                type: 'object',
                title: t('Edit description'),
                properties: {
                  tooltip: {
                    default: fieldSchema?.['x-decorator-props']?.tooltip,
                    'x-decorator': 'FormItem',
                    'x-component': 'Input.TextArea',
                    'x-component-props': {},
                  },
                },
              } as ISchema
            }
            onSubmit={({ tooltip }) => {
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
            }}
          />
        )}
        {/* TODO: FormField 好像被弃用了，应该删除掉 */}
        {!field.readPretty && fieldSchema['x-component'] !== 'FormField' && required && (
          <SchemaSettingsSwitchItem
            key="required"
            title={t('Required')}
            checked={fieldSchema.required as boolean}
            onChange={(required) => {
              const schema = {
                ['x-uid']: fieldSchema['x-uid'],
              };
              field.required = required;
              _.set(field, 'initStateOfLinkageRules.required', getTempFieldState(true, required));
              fieldSchema['required'] = required;
              schema['required'] = required;
              dn.emit('patch', {
                schema,
              });
              refresh();
            }}
          />
        )}
      </>
    );
  },
  { displayName: 'GeneralSchemaItems' },
);
