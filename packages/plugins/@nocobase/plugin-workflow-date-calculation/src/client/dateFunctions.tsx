import React, { useEffect, useMemo, useState } from 'react';
import { Flex, Select, Tag } from 'antd';
import { connect } from '@formily/react';
import { css, useCompile } from '@nocobase/client';
import { groupBy, filter } from 'lodash';
import { NAMESPACE, useLang } from '../locale';
import { DATA_TYPES_OPTION_MAP, unitOptions } from './constants';
import { MenuItemGroupType } from 'antd/es/menu/interface';

function mapValueToOption(v) {
  return { value: v, label: v };
}

function useTimezoneOptions() {
  const [timezones, setTimezones] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    function dispose() {
      mounted = false;
    }
    if (Intl?.supportedValuesOf) {
      const options = Intl.supportedValuesOf('timeZone').map(mapValueToOption);
      setTimezones(options);
      return dispose;
    }
    import('moment-timezone')
      .then((moment) => {
        if (mounted) {
          const options = moment.tz.names().map(mapValueToOption);
          setTimezones(options);
        }
      })
      .catch(console.error);

    return dispose;
  }, []);

  return timezones;
}

function TimezoneSelect(props) {
  const options = useTimezoneOptions();
  return <Select {...props} options={options} />;
}

export function useFunctionOptions(inputType = 'date') {
  const compile = useCompile();

  return useMemo(() => {
    const config = filter(functions, (o) => o.inputType === inputType);
    const group = groupBy(config, 'groupKey');

    const items = Object.keys(group).map((key) => {
      const groupConfig = groups.find((v) => v.key === key);
      const groupItem: MenuItemGroupType = {
        key,
        label: compile(groupConfig.label),
        type: 'group',
        children: group[key].map((item) => ({
          key: item.key,
          title: compile(item.title),
          label: (
            <Flex justify="space-between" align="center" gap="large">
              {compile(item.title)}
              <Tag
                color={DATA_TYPES_OPTION_MAP[item.outputType].color}
                className={css`
                  margin-inline-end: 0;
                `}
              >
                {compile(DATA_TYPES_OPTION_MAP[item.outputType].label)}
              </Tag>
            </Flex>
          ),
          // label: item.title,
        })),
      };
      return groupItem;
    });

    return items;
  }, [compile, inputType]);
}

const groups = [
  {
    key: 'toDate',
    label: `{{t("To another date", { ns: "${NAMESPACE}" })}}`,
  },
  {
    key: 'getter',
    label: `{{t("Get value", { ns: "${NAMESPACE}" })}}`,
  },
  {
    key: 'converter',
    label: `{{t("Value conversion", { ns: "${NAMESPACE}" })}}`,
  },
  {
    key: 'toString',
    label: `{{t("Format", { ns: "${NAMESPACE}" })}}`,
  },
];

const unitFromSecondOptions = {
  groupKey: 'toDate',
  inputType: 'date',
  outputType: 'date',
  fieldset: {
    unit: {
      type: 'string',
      'x-component': 'Select',
      'x-component-props': {
        placeholder: `{{t('Unit', { ns: "${NAMESPACE}" })}}`,
        className: 'auto-width',
      },
      enum: unitOptions.filter((v) => v.value !== 'millisecond'),
      default: 'day',
    },
  },
  defaultParams: () => ({
    unit: 'day',
  }),
};

export const functions = {
  add: {
    key: 'add',
    title: `{{t("Add a range", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'toDate',
    inputType: 'date',
    outputType: 'date',
    fieldset: {
      compact: {
        type: 'void',
        'x-component': 'Space.Compact',
        properties: {
          number: {
            'x-component-props': {
              changeOnSelect: true,
              useTypedConstant: [['number', { precision: 0 }]],
            },
            'x-component': 'WorkflowVariableInput',
            default: 1,
          },
          unit: {
            type: 'string',
            'x-component': 'Select',
            'x-component-props': {
              className: 'auto-width',
            },
            enum: unitOptions,
            default: 'day',
          },
        },
      },
    },
    defaultParams: () => ({
      number: 1,
      unit: 'day',
    }),
  },
  subtract: {
    key: 'subtract',
    title: `{{t("Subtract a range", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'toDate',
    inputType: 'date',
    outputType: 'date',
    fieldset: {
      compact: {
        type: 'void',
        'x-component': 'Space.Compact',
        properties: {
          number: {
            'x-component-props': {
              changeOnSelect: true,
              useTypedConstant: [['number', { precision: 0 }]],
            },
            'x-component': 'WorkflowVariableInput',
            default: 1,
          },
          unit: {
            type: 'string',
            'x-component': 'Select',
            'x-component-props': {
              className: 'auto-width',
            },
            enum: unitOptions,
          },
        },
      },
    },
    defaultParams: () => ({
      number: 1,
      unit: 'day',
    }),
  },
  diff: {
    key: 'diff',
    title: `{{t("Get difference with another date value", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'getter',
    inputType: 'date',
    outputType: 'number',
    fieldset: {
      date: {
        type: 'string',
        'x-component': 'WorkflowVariableInput',
        'x-component-props': {
          useTypedConstant: ['date'],
          variableOptions: { types: ['date'] },
        },
      },
      unit: {
        type: 'string',
        'x-component': 'Select',
        'x-component-props': {
          placeholder: `{{t('Unit', { ns: "${NAMESPACE}" })}}`,
          className: 'auto-width',
        },
        enum: unitOptions,
      },
      isAbs: {
        type: 'boolean',
        'x-component': 'Checkbox',
        'x-component-props': {
          className: css`
            display: inline-flex;
            align-items: center;
          `,
        },
        'x-content': `{{t('Absolute value', { ns: "${NAMESPACE}" })}}`,
      },
      round: {
        type: 'select',
        'x-component': 'Select',
        'x-component-props': {
          allowClear: false,
          placeholder: '小数',
          className: 'auto-width',
        },
        enum: [
          { value: false, label: `{{t('Keep decimals', { ns: "${NAMESPACE}" })}}` },
          { value: 0, label: `{{t('Round', { ns: "${NAMESPACE}" })}}` },
          { value: 1, label: `{{t('Round up', { ns: "${NAMESPACE}" })}}` },
          { value: -1, label: `{{t('Round down', { ns: "${NAMESPACE}" })}}` },
        ],
      },
    },
    defaultParams: () => ({
      date: new Date(),
      unit: 'day',
      isAbs: false,
      round: false,
    }),
  },
  get: {
    key: 'get',
    title: `{{t("Get value on specific unit of input date", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'getter',
    inputType: 'date',
    outputType: 'number',
    fieldset: {
      unit: {
        type: 'string',
        'x-component': 'Select',
        'x-component-props': {
          placeholder: `{{t('Unit', { ns: "${NAMESPACE}" })}}`,
          className: 'auto-width',
        },
        enum: unitOptions,
        default: 'day',
      },
    },
    defaultParams: () => ({
      unit: 'day',
    }),
  },
  toTimestamp: {
    key: 'toTimestamp',
    title: `{{t("From date to timestamp", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'converter',
    inputType: 'date',
    outputType: 'number',
    fieldset: {
      unitBeforeText: {
        type: 'void',
        'x-component': 'div',
        'x-content': `{{t("To", { ns: "${NAMESPACE}" })}}`,
      },
      unit: {
        type: 'string',
        'x-component': 'Select',
        'x-component-props': {
          placeholder: `{{t('Unit', { ns: "${NAMESPACE}" })}}`,
          className: 'auto-width',
        },
        enum: unitOptions.filter((v) => v.value === 'millisecond' || v.value === 'second'),
        default: 'second',
      },
    },
  },
  tsToDate: {
    key: 'tsToDate',
    title: `{{t("From timestamp to date", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'converter',
    inputType: 'number',
    outputType: 'date',
    fieldset: {
      unitBeforeText: {
        type: 'void',
        'x-component': 'div',
        'x-content': `{{t("From", { ns: "${NAMESPACE}" })}}`,
      },
      unit: {
        type: 'string',
        'x-component': 'Select',
        'x-component-props': {
          placeholder: `{{t('Unit', { ns: "${NAMESPACE}" })}}`,
          className: 'auto-width',
        },
        enum: unitOptions.filter((v) => v.value === 'millisecond' || v.value === 'second'),
        default: 'second',
      },
    },
  },
  startOfTime: {
    ...unitFromSecondOptions,
    key: 'startOfTime',
    title: `{{t("Set to time of unit start", { ns: "${NAMESPACE}" })}}`,
  },
  endOfTime: {
    ...unitFromSecondOptions,
    key: 'endOfTime',
    title: `{{t("Set to time of unit end", { ns: "${NAMESPACE}" })}}`,
  },
  isLeapYear: {
    key: 'isLeapYear',
    title: `{{t("Is leap year", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'getter',
    inputType: 'date',
    outputType: 'boolean',
    fieldset: {},
  },
  format: {
    key: 'format',
    title: `{{t("Format to string", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'toString',
    inputType: 'date',
    outputType: 'string',
    fieldset: {
      format: {
        type: 'string',
        'x-component': 'Input',
        'x-component-props': {
          placeholder: `{{t("Pattern", { ns: "${NAMESPACE}" })}}`,
        },
        default: 'YYYY-MM-DD',
      },
    },
    defaultParams: () => ({
      format: 'YYYY-MM-DD',
    }),
  },
  transDuration: {
    key: 'transDuration',
    title: `{{t("Convert unit", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'converter',
    inputType: 'number',
    outputType: 'number',
    fieldset: {
      unitBeforeText: {
        type: 'void',
        'x-component': 'div',
        'x-content': `{{t("From", { ns: "${NAMESPACE}" })}}`,
      },
      unitBefore: {
        type: 'string',
        'x-component': 'Select',
        'x-component-props': {
          placeholder: `{{t('Unit', { ns: "${NAMESPACE}" })}}`,
          className: 'auto-width',
        },
        enum: unitOptions.filter((v) => v.value !== 'quarter'),
        default: 'day',
      },
      unitAfterText: {
        type: 'void',
        'x-component': 'div',
        'x-content': `{{t("To", { ns: "${NAMESPACE}" })}}`,
      },
      unitAfter: {
        type: 'string',
        'x-component': 'Select',
        'x-component-props': {
          placeholder: `{{t('Unit', { ns: "${NAMESPACE}" })}}`,
          className: 'auto-width',
        },
        enum: unitOptions.filter((v) => v.value !== 'quarter'),
        default: 'day',
      },
      round: {
        type: 'select',
        'x-component': 'Select',
        'x-component-props': {
          allowClear: false,
          className: 'auto-width',
        },
        enum: [
          { value: false, label: `{{t('Keep decimals', { ns: "${NAMESPACE}" })}}` },
          { value: 0, label: `{{t('Round', { ns: "${NAMESPACE}" })}}` },
          { value: 1, label: `{{t('Round up', { ns: "${NAMESPACE}" })}}` },
          { value: -1, label: `{{t('Round down', { ns: "${NAMESPACE}" })}}` },
        ],
      },
    },
    defaultParams: () => ({
      unitBefore: 'day',
      unitAfter: 'day',
      round: false,
    }),
  },
  changeTimezone: {
    key: 'changeTimezone',
    title: `{{t("Change timezone", { ns: "${NAMESPACE}" })}}`,
    groupKey: 'toDate',
    inputType: 'date',
    outputType: 'date',
    fieldset: {
      timezone: {
        type: 'string',
        'x-component': connect(TimezoneSelect),
        'x-component-props': {
          placeholder: `{{t("Target timezone", { ns: "${NAMESPACE}" })}}`,
          showSearch: true,
        },
      },
    },
  },
};
