/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { Button, message } from 'antd';
import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { Input, Plugin, useColumnSchema, useDesignable } from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { CopyOutlined } from '@ant-design/icons';
import { LoadingOutlined } from '@ant-design/icons';

// Define namespace for i18n
const NAMESPACE = 'field-content-copier';

// Create a copy button component that can be used in both input and read-pretty modes
const CopyButton = ({ value }) => {
  const { t } = useTranslation(NAMESPACE);

  const handleCopy = () => {
    if (value) {
      navigator.clipboard
        .writeText(String(value))
        .then(() => {
          message.success(t('Copied to clipboard'));
        })
        .catch((err) => {
          console.error('Could not copy text: ', err);
          message.error(t('Failed to copy'));
        });
    } else {
      message.info(t('No content to copy'));
    }
  };

  return (
    <Button
      size="small"
      onClick={handleCopy}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      icon={<CopyOutlined />}
      title={t('Copy to clipboard')}
    />
  );
};

// Create the read-pretty component to display content with a copy button
const InputWithCopierReadPretty = (props) => {
  const { value, enableCopier, ...otherProps } = props;
  const prefixCls = 'nb-description-input';
  const [enter, setEnter] = useState(false);
  const compile = (value) => value; // This is a simplification, NocoBase has its own compile function

  // Format the content similar to NocoBase's ReadPretty component
  const content = useMemo(() => (value && typeof value === 'object' ? JSON.stringify(value) : compile(value)), [value]);

  // Create the copy button if the feature is enabled
  const copyButton = enableCopier && enter ? <CopyButton value={value} /> : null;

  return (
    <div
      className={`${prefixCls} ${props.className || ''}`}
      style={{ overflowWrap: 'break-word', whiteSpace: 'normal', ...props.style }}
      onMouseEnter={() => {
        setEnter(true);
      }}
      onMouseLeave={() => {
        setEnter(false);
      }}
    >
      {props.addonBefore}
      {props.prefix}
      <div style={{ position: 'relative' }}>
        {/* Use the original content rendering but with our copy button */}
        <span>{content}</span>
        {copyButton && <span style={{ right: 0, position: 'absolute' }}>{copyButton}</span>}
      </div>
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

// Connect the input component with the copy functionality
const InputWithCopier = connect(
  (props) => {
    const { value, enableCopier, ...restProps } = props;

    // Preserve all existing props
    const inputProps = {
      ...restProps,
      value,
    };

    // Add the copy button without overriding existing addonAfter
    if (enableCopier) {
      const originalAddonAfter = inputProps.addonAfter;
      inputProps.addonAfter = (
        <>
          {originalAddonAfter}
          <CopyButton value={value} />
        </>
      );
    }

    return <Input {...inputProps} />;
  },
  mapProps((props, field) => {
    return {
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty(InputWithCopierReadPretty),
);

class PluginFieldContentCopier extends Plugin {
  async load() {
    // Get the original Input component to extend it
    const OriginalInput = this.app.components.Input;

    // Create a HOC that wraps the original Input component with our copy functionality
    const EnhancedInput = (props) => {
      // If copier is enabled, enhance the component with our functionality
      if (props.enableCopier) {
        return <InputWithCopier {...props} />;
      }
      // Otherwise, use the original component
      return <OriginalInput {...props} />;
    };

    // Register our enhanced Input component
    this.app.addComponents({
      Input: Object.assign(EnhancedInput, OriginalInput),
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
          checked: !!schema['x-component-props']?.enableCopier,
          onChange: async (checked) => {
            formField.componentProps.enableCopier = checked;

            _.set(schema, 'x-component-props.enableCopier', checked);

            await dn.emit('patch', {
              schema: {
                'x-uid': schema['x-uid'],
                'x-component-props': {
                  ...schema['x-component-props'],
                  enableCopier: checked,
                },
              },
            });
          },
        };
      },
    });

    // Plugin loaded successfully
  }
}

export default PluginFieldContentCopier;
