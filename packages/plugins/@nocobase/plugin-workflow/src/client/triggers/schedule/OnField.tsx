import { css } from '@nocobase/client';
import { InputNumber, Select } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FieldsSelect } from '../../components/FieldsSelect';
import { lang } from '../../locale';

function dateFieldFilter(field) {
  return !field.hidden && (field.uiSchema ? field.type === 'date' : false);
}

export function OnField({ value: propsValue, onChange }) {
  const value = propsValue ?? {};
  const { t } = useTranslation();
  const [dir, setDir] = useState(value.offset ? value.offset / Math.abs(value.offset) : 0);

  return (
    <fieldset
      className={css`
        display: flex;
        gap: 0.5em;
      `}
    >
      <FieldsSelect
        value={value.field}
        onChange={(field) => onChange({ ...value, field })}
        filter={dateFieldFilter}
        placeholder={t('Select field')}
        className="auto-width"
      />
      {value.field ? (
        <Select
          value={dir}
          onChange={(v) => {
            setDir(v);
            onChange({ ...value, offset: Math.abs(value.offset) * v });
          }}
          options={[
            { value: 0, label: lang('Exactly at') },
            { value: -1, label: t('Before') },
            { value: 1, label: t('After') },
          ]}
          className="auto-width"
        />
      ) : null}
      {dir ? (
        <>
          <InputNumber
            value={Math.abs(value.offset)}
            onChange={(v) => onChange({ ...value, offset: (v ?? 0) * dir })}
          />
          <Select
            value={value.unit || 86400000}
            onChange={(unit) => onChange({ ...value, unit })}
            options={[
              { value: 86400000, label: lang('Days') },
              { value: 3600000, label: lang('Hours') },
              { value: 60000, label: lang('Minutes') },
              { value: 1000, label: lang('Seconds') },
            ]}
            className="auto-width"
          />
        </>
      ) : null}
    </fieldset>
  );
}
