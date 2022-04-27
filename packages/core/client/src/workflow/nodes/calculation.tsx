import { css } from '@emotion/css';
import React from 'react';
import { Calculation } from '../calculators';

export default {
  title: '运算',
  type: 'calculation',
  group: 'control',
  fieldset: {
    'config.calculation': {
      type: 'object',
      title: '配置计算',
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
    return <div className={css`flex-shrink: 0`}>计算值</div>;
  }
};
