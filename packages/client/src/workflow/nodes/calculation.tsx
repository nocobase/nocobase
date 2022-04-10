import React from 'react';
import { Calculation } from '../calculators';

export default {
  title: '运算',
  type: 'calculation',
  group: 'control',
  fieldset: {
    calculation: {
      type: 'object',
      title: '配置计算',
      name: 'calculation',
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
    return <div>计算值</div>;
  }
};
