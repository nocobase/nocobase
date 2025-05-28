/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import { Plugin, useColumnSchema, useDesignable, useToken } from '@nocobase/client';
import { Typography } from 'antd';
import _ from 'lodash';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

// Define namespace for i18n
const NAMESPACE = 'field-content-copier';

const InputCopyButton: FC = observer(
  () => {
    const field = useField<{ value: string }>();
    const { token } = useToken();

    return <Typography.Text copyable={{ text: field.value }} style={{ marginLeft: token.marginXXS }} />;
  },
  {
    displayName: 'InputCopyButton',
  },
);

class PluginFieldContentCopier extends Plugin {
  async load() {
    this.app.addScopes({
      InputCopyButton: <InputCopyButton />,
    });

    // Add the schema settings to enable/disable the copy functionality
    this.app.schemaSettingsManager.addItem('fieldSettings:component:Input', 'enableCopier', {
      type: 'switch',
      useComponentProps() {
        const { t } = useTranslation(NAMESPACE);
        const { fieldSchema: tableFieldSchema } = useColumnSchema();
        const fieldSchema = useFieldSchema();
        const formField = useField();
        const { dn } = useDesignable();

        const schema = tableFieldSchema || fieldSchema;

        return {
          title: t('Enable content copier'),
          checked: !!schema['x-component-props']?.addonAfter,
          onChange: async (checked) => {
            if (checked) {
              formField.componentProps.addonAfter = '{{InputCopyButton}}';
              _.set(schema, 'x-component-props.addonAfter', '{{InputCopyButton}}');
            } else {
              formField.componentProps.addonAfter = undefined;
              _.unset(schema, 'x-component-props.addonAfter');
            }

            await dn.emit('patch', {
              schema: {
                'x-uid': schema['x-uid'],
                'x-component-props': {
                  ...schema['x-component-props'],
                },
              },
            });
          },
        };
      },
    });
  }
}

export default PluginFieldContentCopier;
