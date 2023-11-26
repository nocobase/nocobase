import React from 'react';
import { InputNumber, Select } from 'antd';
import { css } from '@nocobase/client';

import { JOB_STATUS } from '../constants';
import { NAMESPACE, lang } from '../locale';

const UnitOptions = [
  { value: 1_000, label: 'Seconds' },
  { value: 60_000, label: 'Minutes' },
  { value: 3600_000, label: 'Hours' },
  { value: 86400_000, label: 'Days' },
  { value: 604800_000, label: 'Weeks' },
];

function getNumberOption(v) {
  return UnitOptions.slice()
    .reverse()
    .find((item) => !(v % item.value));
}

function Duration({ value = 60000, onChange }) {
  const option = getNumberOption(value);
  const quantity = Math.round(value / option.value);

  return (
    <fieldset
      className={css`
        display: flex;
        gap: 0.5em;
      `}
    >
      <InputNumber
        min={1}
        value={quantity}
        onChange={(v) => onChange(Math.round(v * option.value))}
        className="auto-width"
      />
      <Select
        // @ts-ignore
        role="button"
        data-testid="select-time-unit"
        popupMatchSelectWidth={false}
        value={option.value}
        onChange={(unit) => onChange(Math.round(quantity * unit))}
        className="auto-width"
      >
        {UnitOptions.map((item) => (
          <Select.Option key={item.value} value={item.value}>
            {lang(item.label)}
          </Select.Option>
        ))}
      </Select>
    </fieldset>
  );
}

export default {
  title: `{{t("Delay", { ns: "${NAMESPACE}" })}}`,
  type: 'delay',
  group: 'control',
  description: `{{t("Delay a period of time and then continue or exit the process. Can be used to set wait or timeout times in parallel branches.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    duration: {
      type: 'number',
      title: `{{t("Duration", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Duration',
      default: 60000,
      required: true,
    },
    endStatus: {
      type: 'number',
      title: `{{t("End Status", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: `{{t("Succeed and continue", { ns: "${NAMESPACE}" })}}`, value: JOB_STATUS.RESOLVED },
        { label: `{{t("Fail and exit", { ns: "${NAMESPACE}" })}}`, value: JOB_STATUS.FAILED },
      ],
      required: true,
      default: JOB_STATUS.RESOLVED,
    },
  },
  view: {},
  scope: {},
  components: {
    Duration,
  },
};
