import { css } from '@emotion/css';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Calculation } from '../calculators';

export default {
  title: '{{t("Calculation")}}',
  type: 'calculation',
  group: 'control',
  fieldset: {
    'config.calculation': {
      type: 'object',
      title: '{{t("Configure calculation")}}',
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
    const { t } = useTranslation();
    return <div className={css`flex-shrink: 0`}>{t('Calculation result')}</div>;
  }
};
