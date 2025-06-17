/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable, Variable } from '../..';
import { GeneralSchemaDesigner, SchemaSettingsDivider, SchemaSettingsModalItem, SchemaSettingsRemove, useVariableOptions } from '../../../';

/**
 * 复制自自定义变量插件，因为这里还不支持可扩展，所以只能先复制过来
 * @returns 一个编辑徽章的组件
 */
const EditBadge: FC = () => {
  const { t } = useTranslation('custom-variables');
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();

  const schema = useMemo(() => {
    return {
      type: 'object',
      title: t('Edit badge'),
      properties: {
        count: {
          title: t('Badge'),
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            tooltip: t('You can enter numbers, text, variables, aggregation variables, expressions, etc.'),
          },
          'x-component': (props) => {
            const variables = useVariableOptions({} as any);
            return <Variable.TextArea {...props} scope={variables} />;
          },
          description: <span>{t('Syntax references: ')}<a href="https://docs.nocobase.com/handbook/calculation-engines/formula" target="_blank" rel="noreferrer">Formula.js</a></span>,
        },
        color: {
          title: t('Background color'),
          'x-decorator': 'FormItem',
          'x-component': 'ColorPicker',
          'x-component-props': {},
        },
        textColor: {
          title: t('Text color'),
          'x-decorator': 'FormItem',
          'x-component': 'ColorPicker',
          'x-component-props': {},
        },
        size: {
          title: t('Size'),
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: t('Default'), value: 'default' },
            { label: t('Small'), value: 'small' },
          ],
          default: 'default',
        },
        overflowCount: {
          title: t('Max number'),
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            tooltip: t('Maximum number to display when the badge is a number'),
          },
          'x-component': 'InputNumber',
          default: 99,
        },
        showZero: {
          title: t('Show zero'),
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            tooltip: t('Whether to show the badge when it is a number and the number is 0'),
          },
          'x-component': 'Checkbox',
          default: false,
        },
      },
    };
  }, [t]);

  const initialValues = useMemo(() => {
    return fieldSchema['x-component-props']?.badge;
  }, [fieldSchema['x-component-props']?.badge]);

  const onEditBadgeSubmit: (values: any) => void = useCallback(
    (badge) => {
      dn.emit('patch', {
        schema: {
          ['x-uid']: fieldSchema['x-uid'],
          ['x-component-props']: {
            ...fieldSchema['x-component-props'],
            badge: {
              ...fieldSchema['x-component-props']?.badge,
              ...badge,
              count: (badge.count == null || badge.count === '') ? undefined : badge.count,
            },
          },
        },
      });

    },
    [fieldSchema, dn],
  );

  return (
    <SchemaSettingsModalItem
      title={t('Edit badge')}
      eventKey="edit-badge"
      schema={schema as ISchema}
      initialValues={initialValues}
      onSubmit={onEditBadgeSubmit}
    />
  );
};

export const TabsDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettingsModalItem
        key="edit"
        title={t('Edit')}
        schema={
          {
            type: 'object',
            title: t('Edit tab'),
            properties: {
              title: {
                title: t('Tab name'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
              icon: {
                title: t('Icon'),
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        initialValues={{ title: field.title, icon: field.componentProps.icon }}
        onSubmit={({ title, icon }) => {
          const props = fieldSchema['x-component-props'] || {};
          fieldSchema.title = title;
          field.title = title;
          props.icon = icon;
          field.componentProps.icon = icon;
          fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
          fieldSchema['x-component-props'].icon = icon;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              title,
              ['x-component-props']: props,
            },
          });
        }}
      />
      <EditBadge />
      {/* if it is created by template, do not show remove button */}
      {fieldSchema['x-template-uid'] ? null : (
        <>
          <SchemaSettingsDivider />
          <SchemaSettingsRemove />
        </>
      )}
    </GeneralSchemaDesigner>
  );
};
