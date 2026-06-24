/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Form, Radio, Tooltip } from 'antd';
import type { AIEmployeeApprovalMode, LegacyAIEmployeeApprovalValue } from '../../../types';
import { AI_EMPLOYEE_APPROVAL_MODES } from '../../../constants';
import { useT } from '../../../../locale';

type ApprovalRadioProps = {
  value?: LegacyAIEmployeeApprovalValue;
  onChange?: (value: AIEmployeeApprovalMode) => void;
};

function normalizeApprovalValue(value?: LegacyAIEmployeeApprovalValue): AIEmployeeApprovalMode {
  if (value === true) {
    return 'human_decision';
  }
  if (value === false || value == null) {
    return 'no_required';
  }
  return AI_EMPLOYEE_APPROVAL_MODES.includes(value) ? value : 'no_required';
}

export function ApprovalRadio({ value, onChange }: ApprovalRadioProps) {
  const t = useT();
  const normalizedValue = normalizeApprovalValue(value);

  useEffect(() => {
    if (value !== normalizedValue) {
      onChange?.(normalizedValue);
    }
  }, [normalizedValue, onChange, value]);

  return (
    <Radio.Group
      value={normalizedValue}
      onChange={(event) => onChange?.(event.target.value)}
      options={[
        {
          label: (
            <Tooltip title={t('Do not initiate approval')}>
              <span>{t('No required')}</span>
            </Tooltip>
          ),
          value: 'no_required',
        },
        {
          label: (
            <Tooltip title={t('Initiate approval when needed')}>
              <span>{t('AI decision')}</span>
            </Tooltip>
          ),
          value: 'ai_decision',
        },
        {
          label: (
            <Tooltip title={t('Always initiate approval')}>
              <span>{t('Human decision')}</span>
            </Tooltip>
          ),
          value: 'human_decision',
        },
      ]}
    />
  );
}

export function FeedbackSettings() {
  const t = useT();

  return (
    <Form.Item
      name={['config', 'requiresApproval']}
      label={t('Approval & Notice')}
      tooltip={t(
        'Configure whether task output should be sent to specified users for notification, carbon copy, or approval',
      )}
      initialValue="no_required"
    >
      <ApprovalRadio />
    </Form.Item>
  );
}

export default FeedbackSettings;
