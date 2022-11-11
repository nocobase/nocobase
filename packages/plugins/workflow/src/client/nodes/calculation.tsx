import React from 'react';
import { css } from '@emotion/css';
import { useTranslation } from 'react-i18next';

import { Calculation } from '../calculators';
import { NAMESPACE, useWorkflowTranslation } from '../locale';

export default {
  title: `{{t("Calculation", { ns: "${NAMESPACE}" })}}`,
  type: 'calculation',
  group: 'control',
  fieldset: {
    'config.calculation': {
      type: 'object',
      title: `{{t("Configure calculation", { ns: "${NAMESPACE}" })}}`,
      name: 'config.calculation',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'CalculationConfig',
    }
  },
  view: {

  },
  components: {
    CalculationConfig({ value, onChange }) {
      return (
        <Calculation {...value} onChange={onChange} />
      );
    }
  },
  getter() {
    const { t } = useWorkflowTranslation();
    return <div className={css`flex-shrink: 0`}>{t('Calculation result')}</div>;
  }
};
