import { emotionCss, antd, reactI18nNext } from '@nocobase/client';
const { css } = emotionCss;
const { useTranslation } = reactI18nNext;

import { DatePicker, Select } from 'antd';
import moment from 'moment';
import React, { useState } from 'react';

import { OnField } from './OnField';

export function EndsByField({ value, onChange }) {
  const { t } = useTranslation();
  const [type, setType] = useState(typeof value === 'object' && !(value instanceof Date) ? 'field' : 'date');

  return (
    <fieldset
      className={css`
        display: flex;
        gap: 0.5em;
      `}
    >
      <Select
        value={type}
        onChange={(t) => {
          onChange(t === 'field' ? {} : null);
          setType(t);
        }}
      >
        <Select.Option value={'field'}>{t('By field')}</Select.Option>
        <Select.Option value={'date'}>{t('By custom date')}</Select.Option>
      </Select>
      {type === 'field' ? (
        <OnField value={value} onChange={onChange} />
      ) : (
        <DatePicker showTime value={moment(value)} onChange={onChange} />
      )}
    </fieldset>
  );
}
