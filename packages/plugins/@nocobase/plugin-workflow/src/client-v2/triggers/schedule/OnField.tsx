/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { InputNumber, Select } from 'antd';
import React, { useState } from 'react';

import { useWorkflowTranslation } from '../../locale';
import { FieldsSelect } from './FieldsSelect';
import { isDateField } from './collectionUtils';

export type ScheduleOnFieldValue = {
  field?: string;
  offset?: number;
  unit?: 1000 | 60000 | 3600000 | 86400000;
};

export function OnField({
  collection,
  value: propsValue,
  onChange,
}: {
  collection?: string;
  value?: ScheduleOnFieldValue;
  onChange?: (value: ScheduleOnFieldValue) => void;
}) {
  const value = propsValue ?? {};
  const { t } = useWorkflowTranslation();
  const [dir, setDir] = useState(value.offset ? value.offset / Math.abs(value.offset) : 0);
  const emitChange = (nextValue: ScheduleOnFieldValue) => onChange?.(nextValue);

  return (
    <fieldset
      className={css`
        display: flex;
        gap: 0.5em;
      `}
    >
      <FieldsSelect
        collection={collection}
        value={value.field}
        onChange={(field) => emitChange({ ...value, field })}
        filter={isDateField}
        placeholder={t('Select field')}
        className="auto-width"
      />
      {value.field ? (
        <Select
          value={dir}
          onChange={(v) => {
            setDir(v);
            emitChange({ ...value, offset: Math.abs(value.offset ?? 0) * v });
          }}
          options={[
            { value: 0, label: t('Exactly at') },
            { value: -1, label: t('Before') },
            { value: 1, label: t('After') },
          ]}
          className="auto-width"
        />
      ) : null}
      {dir ? (
        <>
          <InputNumber
            value={Math.abs(value.offset ?? 0)}
            onChange={(v) => emitChange({ ...value, offset: (v ?? 0) * dir })}
          />
          <Select
            value={value.unit || 86400000}
            onChange={(unit) => emitChange({ ...value, unit })}
            options={[
              { value: 86400000, label: t('Days') },
              { value: 3600000, label: t('Hours') },
              { value: 60000, label: t('Minutes') },
              { value: 1000, label: t('Seconds') },
            ]}
            className="auto-width"
          />
        </>
      ) : null}
    </fieldset>
  );
}

export default OnField;
