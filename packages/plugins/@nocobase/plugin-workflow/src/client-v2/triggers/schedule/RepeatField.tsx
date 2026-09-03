/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { useMemoizedFn } from 'ahooks';
import { InputNumber, Select } from 'antd';
import React from 'react';
import { Cron, type Locale } from 'react-js-cron';
import 'react-js-cron/dist/styles.css';
import { useWorkflowTranslation } from '../../locale';

declare global {
  interface Window {
    cronLocale?: Locale;
  }
}

type RepeatValue = number | string | null;
type RepeatOption = { value: 'none' | 'cron' | number; text: string; unitText?: string };

const RepeatOptions: RepeatOption[] = [
  { value: 'none', text: 'No repeat' },
  { value: 60_000, text: 'By minute', unitText: 'Minutes' },
  { value: 3600_000, text: 'By hour', unitText: 'Hours' },
  { value: 86400_000, text: 'By day', unitText: 'Days' },
  { value: 604800_000, text: 'By week', unitText: 'Weeks' },
  // { value: 18144_000_000, text: 'By 30 days' },
  { value: 'cron', text: 'Advanced' },
];

function getNumberOption(v?: RepeatValue) {
  const opts = RepeatOptions.filter(
    (option): option is RepeatOption & { value: number } => typeof option.value === 'number',
  ).reverse();
  return opts.find((item) => typeof v === 'number' && !(v % item.value));
}

function getRepeatTypeValue(v?: RepeatValue) {
  let option: RepeatOption | undefined;
  switch (typeof v) {
    case 'number':
      option = getNumberOption(v);
      return option ? option.value : 'none';
    case 'string':
      return 'cron';
    default:
      break;
  }
  return 'none';
}

function CommonRepeatField({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange?: (value: RepeatValue) => void;
  disabled?: boolean;
}) {
  const { t } = useWorkflowTranslation();
  const option = getNumberOption(value) as RepeatOption & { value: number; unitText: string };

  return (
    <InputNumber
      value={value / option.value}
      onChange={(v) => {
        if (!v) {
          return;
        }
        onChange?.(v * option.value);
      }}
      min={1}
      addonBefore={t('Every')}
      addonAfter={t(option.unitText)}
      className="auto-width"
      disabled={disabled}
    />
  );
}

export function RepeatField({
  value = null,
  onChange,
  disabled,
}: {
  value?: RepeatValue;
  onChange?: (value: RepeatValue) => void;
  disabled?: boolean;
}) {
  const { t } = useWorkflowTranslation();
  const typeValue = getRepeatTypeValue(value);
  const onTypeChange = useMemoizedFn((v: RepeatValue | 'none' | 'cron') => {
    if (v === 'none') {
      onChange?.(null);
      return;
    }
    if (v === 'cron') {
      onChange?.('0 * * * * *');
      return;
    }
    onChange?.(typeof typeValue === 'number' ? Math.round(((value as number) / typeValue) * (v as number)) : v);
  });

  return (
    <fieldset
      className={css`
        display: flex;
        flex-direction: ${typeValue === 'cron' ? 'column' : 'row'};
        align-items: flex-start;
        gap: 0.5em;

        .react-js-cron {
          width: 100%;
          padding: 0.5em 0.5em 0 0.5em;
          border: 1px dashed #ccc;

          .react-js-cron-field {
            flex-shrink: 0;
            margin-bottom: 0.5em;

            > span {
              flex-shrink: 0;
              margin: 0 0.5em 0 0;
            }

            > .react-js-cron-select {
              margin: 0 0.5em 0 0;

              .ant-select-selection-overflow {
                align-items: center;
                flex: initial;
              }
            }
          }

          .react-js-cron-week-days {
            > span {
              min-width: 2em;
            }
          }
        }
      `}
    >
      <Select value={typeValue} onChange={onTypeChange} className="auto-width" disabled={disabled}>
        {RepeatOptions.map((item) => (
          <Select.Option key={item.value} value={item.value}>
            {t(item.text)}
          </Select.Option>
        ))}
      </Select>
      {typeof typeValue === 'number' ? (
        <CommonRepeatField value={value as number} onChange={onChange} disabled={disabled} />
      ) : null}
      {typeValue === 'cron' ? (
        <Cron
          value={(value as string).trim().split(/\s+/).slice(1).join(' ')}
          setValue={(v) => onChange?.(`0 ${v}`)}
          clearButton={false}
          locale={window['cronLocale']}
          disabled={disabled}
        />
      ) : null}
    </fieldset>
  );
}

export default RepeatField;
