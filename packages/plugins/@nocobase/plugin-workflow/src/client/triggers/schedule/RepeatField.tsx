import { css } from '@nocobase/client';
import { InputNumber, Select } from 'antd';
import React from 'react';
import { Cron } from 'react-js-cron';
import { useWorkflowTranslation } from '../../locale';
import CronZhCN from './locale/Cron.zh-CN';

const languages = {
  'zh-CN': CronZhCN,
};

const RepeatOptions = [
  { value: 'none', text: 'No repeat' },
  { value: 60_000, text: 'By minute', unitText: 'Minutes' },
  { value: 3600_000, text: 'By hour', unitText: 'Hours' },
  { value: 86400_000, text: 'By day', unitText: 'Days' },
  { value: 604800_000, text: 'By week', unitText: 'Weeks' },
  // { value: 18144_000_000, text: 'By 30 days' },
  { value: 'cron', text: 'Advanced' },
];

function getNumberOption(v) {
  const opts = RepeatOptions.filter((option) => typeof option.value === 'number').reverse() as any[];
  return opts.find((item) => !(v % item.value));
}

function getRepeatTypeValue(v) {
  let option;
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

function CommonRepeatField({ value, onChange }) {
  const { t } = useWorkflowTranslation();
  const option = getNumberOption(value);

  return (
    <InputNumber
      value={value / option.value}
      onChange={(v) => onChange(v * option.value)}
      min={1}
      addonBefore={t('Every')}
      addonAfter={t(option.unitText)}
      className="auto-width"
    />
  );
}

export function RepeatField({ value = null, onChange }) {
  const { t } = useWorkflowTranslation();
  const typeValue = getRepeatTypeValue(value);
  function onTypeChange(v) {
    if (v === 'none') {
      onChange(null);
      return;
    }
    if (v === 'cron') {
      onChange('0 * * * * *');
      return;
    }
    onChange(v);
  }

  const locale = languages[localStorage.getItem('NOCOBASE_LOCALE') || 'en-US'];

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
            margin-bottom: 0.5em;

            > span {
              margin: 0 0.5em 0 0;
            }

            > .react-js-cron-select {
              margin: 0 0.5em 0 0;
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
      <Select value={typeValue} onChange={onTypeChange} className="auto-width">
        {RepeatOptions.map((item) => (
          <Select.Option key={item.value} value={item.value}>
            {t(item.text)}
          </Select.Option>
        ))}
      </Select>
      {typeof typeValue === 'number' ? <CommonRepeatField value={value} onChange={onChange} /> : null}
      {typeValue === 'cron' ? (
        <Cron
          value={value.trim().split(/\s+/).slice(1).join(' ')}
          setValue={(v) => onChange(`0 ${v}`)}
          clearButton={false}
          locale={locale}
        />
      ) : null}
    </fieldset>
  );
}
