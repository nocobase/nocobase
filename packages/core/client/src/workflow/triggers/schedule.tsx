import React, { useState } from 'react';
import { InputNumber, Select } from 'antd';
import { observer, useForm, useFormEffects } from '@formily/react';

import { useCollectionDataSource, useCollectionManager } from '../../collection-manager';
import { SchemaComponent, useCompile, DatePicker } from '../../schema-component';

import { useFlowContext } from '../WorkflowCanvas';
import { BaseTypeSet } from '../calculators';
import { collection } from '../schemas/collection';
import { useTranslation } from 'react-i18next';
import { onFieldValueChange } from '@formily/core';
import { css } from '@emotion/css';

const DateFieldsSelect: React.FC<any> = observer((props) => {
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { values } = useForm();
  const fields = getCollectionFields(values?.config?.collection);

  return (
    <Select {...props}>
      {fields
        .filter(field => (
          !field.hidden
          && (field.uiSchema ? field.type === 'date' : false)
        ))
        .map(field => (
          <Select.Option key={field.name} value={field.name}>{compile(field.uiSchema?.title)}</Select.Option>
        ))}
    </Select>
  );
});

const OnField = ({ value, onChange }) => {
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

function EndsByField({ value, onChange }) {
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

function parseCronRule(cron: string) {
  if (!cron) {
    return {
      mode: 0
    }
  }
  const rules = cron.split(/\s+/).slice(1).map(v => v.split('/'));
  let index = rules.findIndex(rule => rule[0] === '*');
  if (index === -1) {
    return {
      mode: 0
    }
  }
  // fix days of week
  if (index === 3 && rules[4][0] === '*') {
    index = 4;
  }
  return {
    mode: index + 1,
    step: rules[index][1] ?? 1
  };
}

const CronUnits = [
  { value: 1, option: 'By minute', unitText: 'Minutes' },
  { value: 2, option: 'By hour', unitText: 'Hours' },
  { value: 3, option: 'By date', unitText: 'Days', conflict: true, startFrom: 1 },
  { value: 4, option: 'By month', unitText: 'Months', startFrom: 1 },
  { value: 5, option: 'By day of week', unitText: 'Days', conflict: true },
];

function getChangedCron({ mode, step }) {
  const m = mode - 1;
  const left = [0, ...Array(m).fill(null).map((_, i) => {
    if (CronUnits[m].conflict && CronUnits[i].conflict) {
      return '?';
    }
    return i === 3 ? '*' : CronUnits[i].startFrom ?? 0;
  })].join(' ');
  const right = Array(5 - mode).fill(null).map((_, i) => {
    if (CronUnits[m].conflict && CronUnits[mode + i].conflict || mode === 4) {
      return '?';
    }
    return '*';
  }).join(' ');
  return `${left} ${!step || step == 1 ? '*' : `*/${step}`}${right ? ` ${right}` : ''}`;
}

const CronField = ({ value = '', onChange }) => {
  const { t } = useTranslation();
  const cron = parseCronRule(value);
  const unit = CronUnits[cron.mode - 1];
  return (
    <fieldset className={css`
      display: flex;
      gap: .5em;
    `}>
      <Select
        value={cron.mode}
        onChange={v => onChange(v ? getChangedCron({ step: cron.step, mode: v }) : '')}
      >
        <Select.Option value={0}>{t('No repeat')}</Select.Option>
        {CronUnits.map(item => (
          <Select.Option key={item.value} value={item.value}>{t(item.option)}</Select.Option>
        ))}
      </Select>
      {cron.mode
        ? (
          <InputNumber
            value={cron.step}
            onChange={v => onChange(getChangedCron({ step: v, mode: cron.mode }))}
            min={1}
            addonBefore={t('Every')}
            addonAfter={t(unit.unitText)}
          />
        )
        : null}
    </fieldset>
  );
}

const ModeFieldsets = {
  0: {
    startsOn: {
      type: 'datetime',
      name: 'startsOn',
      title: '{{t("Starts on")}}',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: true
      },
      required: true
    },
    cron: {
      type: 'string',
      name: 'cron',
      title: '{{t("Repeat mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CronField',
      'x-reactions': [
        {
          target: 'config.endsOn',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        },
        {
          target: 'config.limit',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        }
      ]
    },
    endsOn: {
      type: 'datetime',
      name: 'endsOn',
      title: '{{t("Ends on")}}',
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: true
      }
    },
    limit: {
      type: 'number',
      name: 'limit',
      title: '{{t("Repeat limit")}}',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        placeholder: '{{t("No limit")}}',
        min: 0
      }
    }
  },
  1: {
    collection: {
      ...collection,
      'x-reactions': [
        ...collection['x-reactions'],
        {
          // only full path works
          target: 'config.startsOn',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        }
      ]
    },
    startsOn: {
      type: 'object',
      title: '{{t("Starts on")}}',
      'x-decorator': 'FormItem',
      'x-component': 'OnField',
      required: true
    },
    cron: {
      type: 'string',
      name: 'cron',
      title: '{{t("Repeat mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'CronField',
      'x-reactions': [
        {
          target: 'config.endsOn',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        },
        {
          target: 'config.limit',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        }
      ]
    },
    endsOn: {
      type: 'object',
      title: '{{t("Ends on")}}',
      'x-decorator': 'FormItem',
      'x-component': 'EndsByField'
    },
    limit: {
      type: 'number',
      name: 'limit',
      title: '{{t("Repeat limit")}}',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        placeholder: '{{t("No limit")}}',
        min: 0
      }
    }
  }
};

const ScheduleConfig = () => {
  const { values = {}, clearFormGraph } = useForm();
  const { config = {} } = values;
  const [mode, setMode] = useState(config.mode);
  useFormEffects(() => {
    onFieldValueChange('config.mode', (field) => {
      setMode(field.value);
      clearFormGraph('config.collection');
      clearFormGraph('config.startsOn');
      clearFormGraph('config.cron');
      clearFormGraph('config.endsOn');
    })
  });

  return (
    <>
      <SchemaComponent
        schema={{
          type: 'number',
          title: '{{t("Trigger mode")}}',
          name: 'mode',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          'x-component-props': {
            options: [
              { value: 0, label: '{{t("Based on certain date")}}' },
              { value: 1, label: '{{t("Based on date field of collection")}}' },
            ]
          },
          required: true
        }}
      />
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            [`mode-${mode}`]: {
              type: 'void',
              'x-component': 'fieldset',
              'x-component-props': {
                className: css`
                  .ant-select{
                    width: auto;
                    min-width: 4em;
                  }

                  .ant-input-number{
                    width: 4em;
                  }

                  .ant-picker{
                    width: auto;
                  }
                `
              },
              properties: ModeFieldsets[mode]
            }
          }
        }}
        components={{
          DateFieldsSelect,
          OnField,
          CronField,
          EndsByField
        }}
      />
    </>
  );
};

export default {
  title: '{{t("Schedule event")}}',
  type: 'schedule',
  fieldset: {
    config: {
      type: 'object',
      name: 'config',
      'x-component': 'ScheduleConfig',
      'x-component-props': {
      }
    }
  },
  scope: {
    useCollectionDataSource
  },
  components: {
    // FieldsSelect
    ScheduleConfig
  },
  getter({ type, options, onChange }) {
    const { t } = useTranslation();
    const compile = useCompile();
    const { collections = [] } = useCollectionManager();
    const { workflow } = useFlowContext();
    const collection = collections.find(item => item.name === workflow.config.collection) ?? { fields: [] };

    return (
      <Select
        placeholder={t('Fields')}
        value={options?.path?.replace(/^data\./, '')}
        onChange={(path) => {
          onChange({ type, options: { ...options, path: `data.${path}` } });
        }}
      >
        {collection.fields
          .filter(field => BaseTypeSet.has(field?.uiSchema?.type))
          .map(field => (
          <Select.Option key={field.name} value={field.name}>{compile(field.uiSchema.title)}</Select.Option>
        ))}
      </Select>
    );
  }
};
