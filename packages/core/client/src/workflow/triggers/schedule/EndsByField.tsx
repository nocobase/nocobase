import { css } from "@emotion/css";
import { DatePicker, Select } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { OnField } from "./OnField";



export function EndsByField({ value, onChange }) {
  const { t } = useTranslation();
  const [type, setType] = useState(typeof value === 'object' && !(value instanceof Date) ? 'field' : 'date');
  return (
    <fieldset className={css`
      display: flex;
      gap: .5em;
    `}>
      <Select value={type} onChange={t => {
        onChange(t === 'field' ? {} : null);
        setType(t);
      }}>
        <Select.Option value={'field'}>{t('By field')}</Select.Option>
        <Select.Option value={'date'}>{t('By custom date')}</Select.Option>
      </Select>
      {type === 'field'
        ? (
          <OnField value={value} onChange={onChange} />
        )
        : (
          <DatePicker showTime value={value} onChange={onChange} />
        )
      }
    </fieldset>
  );
}
