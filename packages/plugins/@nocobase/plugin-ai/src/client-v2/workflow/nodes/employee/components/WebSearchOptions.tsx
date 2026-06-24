/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Form, Space, Switch, Typography } from 'antd';
import { observer } from '@nocobase/flow-engine';
import type { AIEmployeeModelOverride } from '../../../types';
import { useAIConfigRepository } from '../../../../repositories/hooks/useAIConfigRepository';
import { useT } from '../../../../locale';

type WebSearchSwitchProps = {
  value?: boolean;
  onChange?: (value: boolean) => void;
};

function getServiceByOverride(
  services: Array<{ llmService: string; supportWebSearch?: boolean }>,
  override?: AIEmployeeModelOverride | null,
) {
  if (!override?.llmService) {
    return undefined;
  }
  return services.find((service) => service.llmService === override.llmService);
}

export const WebSearchSwitch: React.FC<WebSearchSwitchProps> = observer(({ value, onChange }) => {
  const t = useT();
  const form = Form.useFormInstance();
  const aiConfigRepository = useAIConfigRepository();
  const model = Form.useWatch(['config', 'model'], form) as AIEmployeeModelOverride | null | undefined;
  const selectedService = useMemo(
    () => getServiceByOverride(aiConfigRepository.llmServices, model),
    [aiConfigRepository.llmServices, model],
  );
  const isDisabled = !!model && selectedService?.supportWebSearch === false;

  useEffect(() => {
    aiConfigRepository.getLLMServices();
  }, [aiConfigRepository]);

  useEffect(() => {
    if (isDisabled && value) {
      onChange?.(false);
    }
  }, [isDisabled, onChange, value]);

  return (
    <Space direction="vertical">
      <Switch checked={!!value} disabled={isDisabled} onChange={(checked) => onChange?.(checked)} />
      {isDisabled ? <Typography.Text type="secondary">{t('Web search not supported')}</Typography.Text> : null}
    </Space>
  );
});

export function WebSearchOptions() {
  const t = useT();

  return (
    <Form.Item
      name={['config', 'webSearch']}
      label={`${t('Web search')}:`}
      tooltip={t('Enable the LLM to use web search tools during task execution')}
      initialValue={false}
    >
      <WebSearchSwitch />
    </Form.Item>
  );
}

export default WebSearchOptions;
