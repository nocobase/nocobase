import React from "react";
import { InputNumber, Select } from "antd";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";

const UnitOptions = [
  { value: 1_000, label: 'Seconds' },
  { value: 60_000, label: 'Minutes' },
  { value: 3600_000, label: 'Hours' },
  { value: 86400_000, label: 'Days' },
  { value: 604800_000, label: 'Weeks' },
];

function getNumberOption(v) {
  return UnitOptions.slice().reverse().find(item => !(v % item.value));
}

export default function ({ value = 60000, onChange }) {
  const { t } = useTranslation();
  const option = getNumberOption(value);
  const quantity = Math.round(value / option.value);

  return (
    <fieldset className={css`
      display: flex;
      gap: .5em;
    `}>
      <InputNumber min={1} value={quantity} onChange={(v) => onChange(Math.round(v * option.value))}/>
      <Select value={option.value} onChange={unit => onChange(Math.round(quantity * unit))}>
        {UnitOptions.map(item => (
          <Select.Option key={item.value} value={item.value}>{t(item.label)}</Select.Option>
        ))}
      </Select>
    </fieldset>
  );
}
