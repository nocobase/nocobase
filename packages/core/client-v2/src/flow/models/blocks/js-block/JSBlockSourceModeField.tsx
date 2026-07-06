/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { Alert, Radio, Space } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import React from 'react';
import { useTranslation } from 'react-i18next';

const INLINE_SOURCE_MODE = 'inline';
const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';
export const JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD = 'JSBlockLightExtensionFullSourceField';

export interface JSBlockSourceModeFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export const JSBlockSourceModeField: React.FC<JSBlockSourceModeFieldProps> = (props) => {
  const ctx = useFlowContext<{
    engine?: {
      flowSettings?: {
        components?: Record<string, React.ElementType<JSBlockSourceModeFieldProps> | undefined>;
      };
    };
  }>();
  const FullSourceField = ctx?.engine?.flowSettings?.components?.[JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD];

  if (FullSourceField && FullSourceField !== JSBlockSourceModeField) {
    return <FullSourceField {...props} />;
  }

  return <JSBlockInlineSourceModeField {...props} />;
};

const JSBlockInlineSourceModeField: React.FC<JSBlockSourceModeFieldProps> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();
  const form = useForm();
  const sourceMode = value || form.values?.sourceMode || INLINE_SOURCE_MODE;

  React.useEffect(() => {
    if (form.values?.sourceMode) {
      return;
    }
    form.setValuesIn('sourceMode', INLINE_SOURCE_MODE);
    onChange?.(INLINE_SOURCE_MODE);
  }, [form, onChange]);

  const handleModeChange = (nextMode: string) => {
    form.setValuesIn('sourceMode', nextMode);
    onChange?.(nextMode);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Radio.Group
        disabled={disabled}
        value={sourceMode}
        optionType="button"
        buttonStyle="solid"
        onChange={(event) => handleModeChange(event.target.value)}
        options={[
          { label: t('Inline code'), value: INLINE_SOURCE_MODE },
          { label: t('Light extension'), value: LIGHT_EXTENSION_SOURCE_MODE, disabled: true },
        ]}
      />
      {sourceMode !== INLINE_SOURCE_MODE ? (
        <Alert
          type="warning"
          showIcon
          message={t('Light extension source is unavailable')}
          description={t('Enable the Light extension plugin to edit this source binding.')}
        />
      ) : null}
    </Space>
  );
};

export default JSBlockSourceModeField;
