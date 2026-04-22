/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Switch } from 'antd';
import { observer, tExpr } from '@nocobase/flow-engine';
import { useField, useForm } from '@formily/react';
import { Field } from '@formily/core';
import { SchemaComponent } from '@nocobase/client';
import { namespace, useT } from '../../../../locale';
import { useLLMServiceCatalog } from '../../../../llm-services/hooks/useLLMServiceCatalog';
import { getServiceByOverride } from '../../../../llm-services/utils';

const WebSearchSwitch: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const field = useField<Field>();
  const modelField = field.query('.model').take() as Field;
  const { services } = useLLMServiceCatalog();

  const selectedService = useMemo(
    () => getServiceByOverride(services, modelField?.value),
    [modelField?.value, services],
  );

  const formDisabled =
    form.disabled || field.disabled || field.pattern === 'disabled' || field.pattern === 'readPretty';
  const showWebSearchNotSupportedWarning = !!modelField.value && selectedService?.supportWebSearch === false;
  const isDisabled = formDisabled || showWebSearchNotSupportedWarning;

  useEffect(() => {
    if (isDisabled && field.value) {
      field.value = false;
    }
  }, [isDisabled, field]);

  return (
    <div>
      <Switch checked={!!field.value} disabled={isDisabled} onChange={(checked) => (field.value = checked)} />
      {showWebSearchNotSupportedWarning && (
        <div style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.45)' }}>{t('Web search not supported')}</div>
      )}
    </div>
  );
});

export const WebSearchOptions: React.FC = () => {
  return (
    <SchemaComponent
      components={{ WebSearchSwitch }}
      schema={{
        type: 'void',
        properties: {
          webSearch: {
            title: tExpr('Web search', { ns: namespace }),
            type: 'boolean',
            default: false,
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip: tExpr('Enable the LLM to use web search tools during task execution', { ns: namespace }),
            },
            'x-component': WebSearchSwitch,
          },
        },
      }}
    />
  );
};
