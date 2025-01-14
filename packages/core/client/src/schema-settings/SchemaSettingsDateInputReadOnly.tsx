/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema, useField } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '..';
import { SchemaSettingsSwitchItem } from './SchemaSettings';

export const SchemaSettingsDateInputReadOnly = function DateInputReadOnlyConfig(props: { fieldSchema: Schema }) {
  const { fieldSchema } = props;
  const field: any = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  return (
    <SchemaSettingsSwitchItem
      title={t('Date Input Read only')}
      checked={fieldSchema['x-component-props']?.['inputReadOnly']}
      onChange={(checked) => {
        const schema: any = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        schema['x-component-props'] = field.componentProps || {};
        fieldSchema['x-component-props'] = {
          ...(field.componentProps || {}),
          inputReadOnly: checked,
        };
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = fieldSchema['x-component-props'];

        const parts = (field.path.entire as string).split('.');
        parts.pop();
        const modifiedString = parts.join('.');
        field.query(`${modifiedString}.*[0:].${fieldSchema.name}`).forEach((f) => {
          if (f.props.name === fieldSchema.name) {
            f.setComponentProps({
              inputReadOnly: checked,
            });
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
