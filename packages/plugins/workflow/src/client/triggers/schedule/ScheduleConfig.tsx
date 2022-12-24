import React, { useState } from 'react';
import { onFieldValueChange } from '@formily/core';
import { useForm, useFormEffects } from '@formily/react';
import { css } from '@emotion/css';

import { SchemaComponent } from '@nocobase/client';

import { collection } from '../../schemas/collection';
import { OnField } from './OnField';
import { EndsByField } from './EndsByField';
import { RepeatField } from './RepeatField';
import { SCHEDULE_MODE } from './constants';
import { NAMESPACE } from '../../locale';

const ModeFieldsets = {
  [SCHEDULE_MODE.STATIC]: {
    startsOn: {
      type: 'datetime',
      name: 'startsOn',
      title: `{{t("Starts on", { ns: "${NAMESPACE}" })}}`,
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
      title: `{{t("Repeat mode", { ns: "${NAMESPACE}" })}}`,
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
      title: `{{t("Ends on", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: true
      }
    },
    limit: {
      type: 'number',
      name: 'limit',
      title: `{{t("Repeat limit", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        placeholder: `{{t("No limit", { ns: "${NAMESPACE}" })}}`,
        min: 0
      }
    }
  },
  [SCHEDULE_MODE.COLLECTION_FIELD]: {
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
      title: `{{t("Starts on", { ns: "${NAMESPACE}" })}}`,
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
      title: `{{t("Repeat mode", { ns: "${NAMESPACE}" })}}`,
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
      title: `{{t("Ends on", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'EndsByField'
    },
    limit: {
      type: 'number',
      name: 'limit',
      title: `{{t("Repeat limit", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        placeholder: `{{t("No limit", { ns: "${NAMESPACE}" })}}`,
        min: 0
      }
    }
  }
};

const scheduleModeOptions = [
  { value: SCHEDULE_MODE.STATIC, label: `{{t("Based on certain date", { ns: "${NAMESPACE}" })}}` },
  { value: SCHEDULE_MODE.COLLECTION_FIELD, label: `{{t("Based on date field of collection", { ns: "${NAMESPACE}" })}}` },
];

export const ScheduleConfig = () => {
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
    });
  });

  return (
    <>
      <SchemaComponent
        schema={{
          type: 'number',
          title: `{{t("Trigger mode", { ns: "${NAMESPACE}" })}}`,
          name: 'mode',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          'x-component-props': {
            options: scheduleModeOptions
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
          OnField,
          RepeatField,
          EndsByField
        }}
      />
    </>
  );
};
