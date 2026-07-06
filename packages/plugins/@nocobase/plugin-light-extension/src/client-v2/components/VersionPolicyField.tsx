/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Radio } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type { LightExtensionSourceBindingVersionPolicy } from '../../shared/types';

export interface VersionPolicyFieldProps {
  value?: LightExtensionSourceBindingVersionPolicy;
  disabled?: boolean;
  onChange?: (value: LightExtensionSourceBindingVersionPolicy) => void;
}

export const VersionPolicyField: React.FC<VersionPolicyFieldProps> = ({ value = 'pinned', disabled, onChange }) => {
  const { t } = useTranslation(NAMESPACE);

  return (
    <Radio.Group
      disabled={disabled}
      optionType="button"
      buttonStyle="solid"
      value={value}
      onChange={(event) => onChange?.(event.target.value as LightExtensionSourceBindingVersionPolicy)}
      options={[
        {
          label: t('Pinned publication'),
          value: 'pinned',
        },
        {
          label: t('Follow active publication'),
          value: 'follow-active',
        },
      ]}
    />
  );
};

export default VersionPolicyField;
