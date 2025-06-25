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
const NAMESPACE = 'text-copy';

const TextCopyButton: FC = observer(
  () => {
    const field = useField<Field>();
    const { token } = useToken();
    const buttonRef = useRef<HTMLDivElement | null>(null);
    const [show, setShow] = React.useState(false);

    useEffect(() => {
      if (field.value && field.readPretty && buttonRef.current) {
        const currentRef = buttonRef.current;
        const handleMouseOver = (e: MouseEvent) => {
          setShow(true);
        };
        const handleMouseOut = (e: MouseEvent) => {
          setShow(false);
        };

        currentRef?.parentElement?.addEventListener('mouseover', handleMouseOver);
        currentRef?.parentElement?.addEventListener('mouseout', handleMouseOut);

        return () => {
          currentRef?.parentElement?.removeEventListener('mouseover', handleMouseOver);
          currentRef?.parentElement?.removeEventListener('mouseout', handleMouseOut);
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
        style={{ marginLeft: field.readPretty ? token.marginXXS : 0, opacity: hidden ? 0 : 1 }}
      />
    );
  },
  {
    displayName: 'TextCopyButton',
  },
);

class PluginTextCopy extends Plugin {
  async load() {
    const copyButton = <TextCopyButton />;

    this.app.addScopes({
      TextCopyButton: copyButton,
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
          title: t('Display copy button'),
          checked: !!schema['x-component-props']?.addonAfter,
          onChange: async (checked) => {
            if (checked) {
              field.componentProps.addonAfter = copyButton;
              _.set(schema, 'x-component-props.addonAfter', '{{TextCopyButton}}');
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

export default PluginTextCopy;
