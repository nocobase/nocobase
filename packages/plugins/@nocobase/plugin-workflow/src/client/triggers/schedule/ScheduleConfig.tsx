import { onFieldValueChange } from '@formily/core';
import { useForm, useFormEffects, ISchema } from '@formily/react';
import { css, SchemaComponent } from '@nocobase/client';
import React, { useState } from 'react';
import { NAMESPACE } from '../../locale';
import { appends, collection } from '../../schemas/collection';
import { SCHEDULE_MODE } from './constants';
import { EndsByField } from './EndsByField';
import { OnField } from './OnField';
import { RepeatField } from './RepeatField';

const ModeFieldsets = {
  [SCHEDULE_MODE.STATIC]: {
    startsOn: {
      type: 'datetime',
      title: `{{t("Starts on", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: true,
      },
      required: true,
    },
    repeat: {
      type: 'string',
      title: `{{t("Repeat mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RepeatField',
      'x-reactions': [
        {
          target: 'endsOn',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          },
        },
        {
          target: 'limit',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          },
        },
      ],
    },
    endsOn: {
      type: 'datetime',
      title: `{{t("Ends on", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: true,
      },
    },
    limit: {
      type: 'number',
      title: `{{t("Repeat limit", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        placeholder: `{{t("No limit", { ns: "${NAMESPACE}" })}}`,
        min: 0,
      },
    },
  },
  [SCHEDULE_MODE.DATE_FIELD]: {
    collection: {
      ...collection,
      'x-component-props': {
        dataSourceFilter(item) {
          return item.options.key === 'main' || item.options.isDBInstance;
        },
      },
      'x-reactions': [
        ...collection['x-reactions'],
        {
          // only full path works
          target: 'startsOn',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
              value: '{{Object.create({})}}',
            },
          },
        },
      ],
    },
    startsOn: {
      type: 'object',
      title: `{{t("Starts on", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'OnField',
      'x-reactions': [
        {
          target: 'repeat',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          },
        },
      ],
      required: true,
    },
    repeat: {
      type: 'string',
      title: `{{t("Repeat mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RepeatField',
      'x-reactions': [
        {
          target: 'endsOn',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          },
        },
        {
          target: 'limit',
          fulfill: {
            state: {
              visible: '{{!!$self.value}}',
            },
          },
        },
      ],
    },
    endsOn: {
      type: 'object',
      title: `{{t("Ends on", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'EndsByField',
    },
    limit: {
      type: 'number',
      title: `{{t("Repeat limit", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        placeholder: `{{t("No limit", { ns: "${NAMESPACE}" })}}`,
        min: 0,
      },
    },
    appends: {
      ...appends,
      'x-reactions': [
        {
          dependencies: ['mode', 'collection'],
          fulfill: {
            state: {
              visible: `{{$deps[0] === ${SCHEDULE_MODE.DATE_FIELD} && $deps[1]}}`,
            },
          },
        },
      ],
    },
  },
};

const scheduleModeOptions = [
  { value: SCHEDULE_MODE.STATIC, label: `{{t("Based on certain date", { ns: "${NAMESPACE}" })}}` },
  {
    value: SCHEDULE_MODE.DATE_FIELD,
    label: `{{t("Based on date field of collection", { ns: "${NAMESPACE}" })}}`,
  },
];

export const ScheduleConfig = () => {
  const { values = {}, clearFormGraph } = useForm();
  const [mode, setMode] = useState(values.mode);
  useFormEffects(() => {
    onFieldValueChange('mode', (field) => {
      setMode(field.value);
      clearFormGraph('collection');
      clearFormGraph('startsOn');
      clearFormGraph('repeat');
      clearFormGraph('endsOn');
      clearFormGraph('limit');
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
            options: scheduleModeOptions,
          },
          required: true,
          default: SCHEDULE_MODE.STATIC,
        }}
      />
      <SchemaComponent
        schema={
          {
            type: 'void',
            properties: {
              [`mode-${mode}`]: {
                type: 'void',
                'x-component': 'fieldset',
                'x-component-props': {
                  className: css`
                    .ant-input-number {
                      width: auto;
                      min-width: 6em;
                    }

                    .ant-picker {
                      width: auto;
                    }
                  `,
                },
                properties: ModeFieldsets[mode],
              },
            },
          } as ISchema
        }
        components={{
          OnField,
          RepeatField,
          EndsByField,
        }}
      />
    </>
  );
};
