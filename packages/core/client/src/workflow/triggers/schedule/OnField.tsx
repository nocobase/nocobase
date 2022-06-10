import React, { useState } from "react";
import { css } from "@emotion/css";
import { InputNumber, Select } from "antd";
import { useTranslation } from "react-i18next";

import { DateFieldsSelect } from "./DateFieldsSelect";



export function OnField({ value, onChange }) {
  const { t } = useTranslation();
  const [dir, setDir] = useState(value.offset ? value.offset / Math.abs(value.offset) : 0);

  return (
    <fieldset className={css`
      display: flex;
      gap: .5em;
    `}>
      <DateFieldsSelect value={value.field} onChange={field => onChange({ ...value, field })} />
      {value.field
        ? (
          <Select value={dir} onChange={(v) => {
            setDir(v);
            onChange({ ...value, offset: Math.abs(value.offset) * v });
          }}>
            <Select.Option value={0}>{t('Exactly at')}</Select.Option>
            <Select.Option value={-1}>{t('Before')}</Select.Option>
            <Select.Option value={1}>{t('After')}</Select.Option>
          </Select>
        )
        : null}
      {dir
        ? (
          <>
            <InputNumber value={Math.abs(value.offset)} onChange={(v) => onChange({ ...value, offset: v * dir })}/>
            <Select value={value.unit || 86400000} onChange={unit => onChange({ ...value, unit })}>
              <Select.Option value={86400000}>{t('Days')}</Select.Option>
              <Select.Option value={3600000}>{t('Hours')}</Select.Option>
              <Select.Option value={60000}>{t('Minutes')}</Select.Option>
              <Select.Option value={1000}>{t('Seconds')}</Select.Option>
            </Select>
          </>
        )
        : null}
    </fieldset>
  );
}
