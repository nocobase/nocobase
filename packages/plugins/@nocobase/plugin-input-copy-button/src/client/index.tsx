/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import { Plugin, useColumnSchema, useDesignable, useToken } from '@nocobase/client';
import { Typography } from 'antd';
import _ from 'lodash';
import React, { FC, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Define namespace for i18n
const NAMESPACE = 'input-copy-button';

const InputCopyButton: FC = observer(
  () => {
    const field = useField<Field>();
    const { token } = useToken();
    const buttonRef = useRef<HTMLDivElement | null>(null);
    const [show, setShow] = React.useState(false);

    useEffect(() => {
      if (field.value && field.readPretty && buttonRef.current) {
        const handleMouseOver = (e: MouseEvent) => {
          setShow(true);
        };
        const handleMouseOut = (e: MouseEvent) => {
          setShow(false);
        };

        buttonRef.current.parentElement.addEventListener('mouseover', handleMouseOver);
        buttonRef.current.parentElement.addEventListener('mouseout', handleMouseOut);

        return () => {
          buttonRef.current?.parentElement.removeEventListener('mouseover', handleMouseOver);
          buttonRef.current?.parentElement.removeEventListener('mouseout', handleMouseOut);
        };
      }
    }, [field.readPretty, field.value]);

    const hidden = field.readPretty && (!field.value || !show);

    return (
      <Typography.Text
        ref={buttonRef}
        copyable={{
          text: field.value,
        }}
        style={{ marginLeft: token.marginXXS, opacity: hidden ? 0 : 1 }}
      />
    );
  },
  {
    displayName: 'InputCopyButton',
  },
);

class PluginFieldContentCopier extends Plugin {
  async load() {
    const copyButton = <InputCopyButton />;

    this.app.addScopes({
      InputCopyButton: copyButton,
    });

    // Add the schema settings to enable/disable the copy functionality
    this.app.schemaSettingsManager.addItem('fieldSettings:component:Input', 'enableCopier', {
      type: 'switch',
      useComponentProps() {
        const { t } = useTranslation(NAMESPACE);
        const { fieldSchema: tableFieldSchema } = useColumnSchema();
        const fieldSchema = useFieldSchema();
        const field = useField();
        const { dn } = useDesignable();

        const schema = tableFieldSchema || fieldSchema;

        return {
          title: t('Show copy button'),
          checked: !!schema['x-component-props']?.addonAfter,
          onChange: async (checked) => {
            if (checked) {
              field.componentProps.addonAfter = copyButton;
              _.set(schema, 'x-component-props.addonAfter', '{{InputCopyButton}}');
            } else {
              field.componentProps.addonAfter = null;
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
