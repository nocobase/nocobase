import React, { useState } from 'react';
import { InputNumber, Select } from 'antd';
import { observer, useForm, useFormEffects } from '@formily/react';
import { Cron } from 'react-js-cron';

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

function OnField({ value, onChange }) {
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


const RepeatOptions = [
  { value: 'none', text: 'No repeat' },
  { value: 60_000, text: 'By minute', unitText: 'Minutes' },
  { value: 3600_000, text: 'By hour', unitText: 'Hours' },
  { value: 86400_000, text: 'By day', unitText: 'Days' },
  { value: 604800_000, text: 'By week', unitText: 'Weeks' },
  // { value: 18144_000_000, text: 'By 30 days' },
  { value: 'cron', text: 'Advance' }
];

function getNumberOption(v) {
  const opts = RepeatOptions.filter(option => typeof option.value === 'number').reverse() as any[];
  return opts.find(item => !(v % item.value));
}

function getRepeatTypeValue(v) {
  switch (typeof v) {
    case 'number':
      const option = getNumberOption(v);
      return option ? option.value : 'none';
    case 'string':
      return 'cron';
    default:
      break;
  }
  return 'none';
}


function CommonRepeatField({ value, onChange }) {
  const { t } = useTranslation();
  const option = getNumberOption(value);

  return (
    <InputNumber
      value={value / option.value}
      onChange={v => onChange(v * option.value)}
      min={1}
      addonBefore={t('Every')}
      addonAfter={t(option.unitText)}
    />
  );
}

function RepeatField({ value = null, onChange }) {
  const { t } = useTranslation();
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

  return (
    <fieldset className={css`
      display: flex;
      flex-direction: ${typeValue === 'cron' ? 'column' : 'row'};
      align-items: flex-start;
      gap: .5em;

      .react-js-cron-field{
        margin-bottom: .5em;

        > span{
          margin: 0 .5em 0 0;
        }

        > .react-js-cron-select{
          margin: 0 .5em 0 0;
        }
      }
    `}>
      <Select
        value={typeValue}
        onChange={onTypeChange}
      >
        {RepeatOptions.map(item => (
          <Select.Option
            key={item.value}
            value={item.value}
          >
            {t(item.text)}
          </Select.Option>
        ))}
      </Select>
      {typeof typeValue === 'number'
        ? <CommonRepeatField value={value} onChange={onChange} />
        : null}
      {typeValue === 'cron'
        ? (
          <Cron
            value={value.trim().split(/\s+/).slice(1).join(' ')}
            setValue={v => onChange(`0 ${v}`)}
            clearButton={false}
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
    repeat: {
      type: 'string',
      name: 'repeat',
      title: '{{t("Repeat mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'RepeatField',
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
      'x-reactions': [
        {
          target: 'config.repeat',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          }
        }
      ],
      required: true
    },
    repeat: {
      type: 'string',
      name: 'repeat',
      title: '{{t("Repeat mode")}}',
      'x-decorator': 'FormItem',
      'x-component': 'RepeatField',
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
      clearFormGraph('config.repeat');
      clearFormGraph('config.endsOn');
      clearFormGraph('config.limit');
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
                    min-width: 6em;
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
          RepeatField,
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
