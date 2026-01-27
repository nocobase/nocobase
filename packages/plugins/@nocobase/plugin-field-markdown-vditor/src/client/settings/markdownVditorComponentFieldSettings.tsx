/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useDesignable, SchemaSettingsItemType } from '@nocobase/client';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from '../locale';

export const editModeSettingsItem: SchemaSettingsItemType = {
  name: 'editMode',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const { dn } = useDesignable();
    const field = useField();
    const fieldSchema = useFieldSchema();

    return {
      title: t('Default Edit Mode', { ns: NAMESPACE }),
      options: [
        { label: t('What You See Is What You Get', { ns: NAMESPACE }), value: 'wysiwyg' },
        { label: t('Instant Rendering', { ns: NAMESPACE }), value: 'ir' },
        { label: t('Split View', { ns: NAMESPACE }), value: 'sv' },
      ],
      value: fieldSchema['x-component-props']?.editMode || 'ir',
      onChange(value) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['editMode'] = value;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = field.componentProps || {};
        field.componentProps.editMode = value;
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      },
    };
  },
};
