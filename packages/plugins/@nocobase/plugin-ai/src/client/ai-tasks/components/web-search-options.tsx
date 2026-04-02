/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Switch, Alert } from 'antd';
import { observer, tExpr } from '@nocobase/flow-engine';
import { useField } from '@formily/react';
import { Field } from '@formily/core';
import { useLLMServiceCatalog } from '../../llm-services/hooks/useLLMServiceCatalog';
import { namespace, useT } from '../../locale';
import { getServiceByOverride } from '../../llm-services/utils';
import { SchemaComponent } from '@nocobase/client';

const WebSearchSwitch: React.FC = observer(() => {
  const t = useT();
  const field = useField<Field>();
  const modelField = field.query('.model').take() as Field;
  const { services } = useLLMServiceCatalog();

  const selectedService = useMemo(
    () => getServiceByOverride(services, modelField?.value),
    [modelField?.value, services],
  );

  const supportWebSearch = selectedService?.supportWebSearch;
  const isDisabled = !!modelField?.value && supportWebSearch === false;
  const showConflictWarning = !!field.value && !!selectedService?.isToolConflict;

  useEffect(() => {
    if (isDisabled && field.value) {
      field.value = false;
    }
  }, [isDisabled, field]);

  return (
    <div>
      <Switch checked={!!field.value} disabled={isDisabled} onChange={(checked) => (field.value = checked)} />
      {isDisabled && <div style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.45)' }}>{t('Web search not supported')}</div>}
      {showConflictWarning && (
        <Alert style={{ marginTop: 8 }} type="warning" showIcon={true} message={t('Search disables tools')} />
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
            'x-component': WebSearchSwitch,
          },
        },
      }}
    />
  );
};
