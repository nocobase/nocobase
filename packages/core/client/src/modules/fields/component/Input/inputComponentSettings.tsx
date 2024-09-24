/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsItemType } from '../../../../application/schema-settings/types';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { useDesignable } from '../../../../schema-component/hooks/useDesignable';

export const ellipsisSettingsItem: SchemaSettingsItemType = {
  name: 'ellipsis',
  type: 'switch',
  useComponentProps() {
    const { fieldSchema: tableFieldSchema, filedInstanceList } = useColumnSchema();
    const fieldSchema = useFieldSchema();
    const formField = useField();
    const { dn } = useDesignable();
    const { t } = useTranslation();

    const schema = tableFieldSchema || fieldSchema;
    const hidden = tableFieldSchema ? !filedInstanceList[0].readPretty : !formField.readPretty;

    return {
      title: t('Ellipsis overflow content'),
      checked: !!schema['x-component-props']?.ellipsis,
      hidden,
      onChange: async (checked) => {
        await dn.emit('patch', {
          schema: {
            'x-uid': schema['x-uid'],
            'x-component-props': {
              ...schema['x-component-props'],
              ellipsis: checked,
            },
          },
        });

        if (tableFieldSchema && filedInstanceList) {
          filedInstanceList.forEach((fieldInstance) => {
            fieldInstance.componentProps.ellipsis = checked;
          });
        } else {
          formField.componentProps.ellipsis = checked;
        }
      },
    };
  },
};

export const inputComponentSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input',
  items: [ellipsisSettingsItem],
});
