/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { ISchema, Schema, useField } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getPickerFormat } from '@nocobase/utils/client';
import { useCollectionManager_deprecated, useDesignable } from '..';
import { DateFormatCom, ExpiresRadio } from '../schema-component';
import { SchemaSettingsModalItem } from './SchemaSettings';

export const SchemaSettingsTimeFormat = function TimeFormatConfig(props: { fieldSchema: Schema }) {
  const { fieldSchema } = props;
  const field: any = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionField = getCollectionJoinField(fieldSchema?.['x-collection-field']) || {};
  const timeFormatDefaultValue =
    fieldSchema?.['x-component-props']?.format ||
    collectionField?.uiSchema?.['x-component-props']?.format ||
    'HH:mm:ss';

  return (
    <SchemaSettingsModalItem
      title={t('Time format')}
      scope={{ getPickerFormat }}
      schema={
        {
          type: 'object',
          properties: {
            format: {
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
        const schema: any = {
          ['x-uid']: fieldSchema['x-uid'],
        };

        schema['x-component-props'] = field.componentProps || {};
        fieldSchema['x-component-props'] = {
          ...(field.componentProps || {}),
          ...data,
        };
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = fieldSchema['x-component-props'];
        //子表格/表格区块
        const parts = (field.path.entire as string).split('.');
        parts.pop();
        const modifiedString = parts.join('.');
        field.query(`${modifiedString}.*[0:].${fieldSchema.name}`).forEach((f) => {
          if (f.props.name === fieldSchema.name) {
            f.setComponentProps({ ...data });
          }
        });
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
};
