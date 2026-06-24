/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import { Checkbox, Flex, Form, Input, Select, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { RadioWithTooltip, WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';
import type { TypedConstantSpec } from '@nocobase/client-v2';
import { dataTypeOptionMap, functionGroupLabelKeys, functionGroupOrder, unitOptionKeys } from './constants';
import type { DateCalculationGroupKey, DateCalculationInputType, DateCalculationOutputType } from './constants';
import { useT } from './locale';

type StepName = number;

type StepArguments = Record<string, unknown>;

type DateCalculationFunctionConfig = {
  key: string;
  titleKey: string;
  groupKey: DateCalculationGroupKey;
  inputType: DateCalculationInputType;
  outputType: DateCalculationOutputType;
  defaultParams?: () => StepArguments;
};

const integerOnlyType: TypedConstantSpec[] = [['number', { precision: 0 }]];
const dateOnlyType: TypedConstantSpec[] = ['date'];
const inputDateOrNumberTypes: TypedConstantSpec[] = ['date', 'number'];
const autoWidthClassName = css`
  &.ant-select {
    width: auto;
    min-width: 6em;
    flex-shrink: 0;
  }
`;

function stepArgumentName(stepName: StepName, key: string) {
  return [stepName, 'arguments', key];
}

function mapValueToOption(value: string) {
  return { value, label: value };
}

function useTimezoneOptions() {
  const [timezones, setTimezones] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    let mounted = true;

    if (Intl?.supportedValuesOf) {
      setTimezones(Intl.supportedValuesOf('timeZone').map(mapValueToOption));
      return () => {
        mounted = false;
      };
    }

    import('moment-timezone')
      .then((moment) => {
        if (mounted) {
          setTimezones(moment.tz.names().map(mapValueToOption));
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return timezones;
}

function TimezoneSelect(props: { value?: string; onChange?: (value: string) => void; className?: string }) {
  const t = useT();
  const options = useTimezoneOptions();

  return (
    <Select
      {...props}
      options={options}
      showSearch
      popupMatchSelectWidth={false}
      placeholder={t('Target timezone')}
      className={cx(autoWidthClassName, props.className)}
    />
  );
}

function UnitSelect({
  value,
  onChange,
  options = unitOptionKeys,
  className,
}: {
  value?: string;
  onChange?: (value: string) => void;
  options?: ReadonlyArray<{ labelKey: string; value: string }>;
  className?: string;
}) {
  const t = useT();

  return (
    <Select
      value={value}
      onChange={onChange}
      popupMatchSelectWidth={false}
      className={cx(autoWidthClassName, className)}
      options={options.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
    />
  );
}

function RoundSelect(props: {
  value?: boolean | number;
  onChange?: (value: boolean | number) => void;
  className?: string;
}) {
  const t = useT();

  return (
    <Select
      {...props}
      allowClear={false}
      popupMatchSelectWidth={false}
      className={cx(autoWidthClassName, props.className)}
      options={[
        { value: false, label: t('Keep decimals') },
        { value: 0, label: t('Round') },
        { value: 1, label: t('Round up') },
        { value: -1, label: t('Round down') },
      ]}
    />
  );
}

export const dateFunctions = {
  add: {
    key: 'add',
    titleKey: 'Add a range',
    groupKey: 'toDate',
    inputType: 'date',
    outputType: 'date',
    defaultParams: () => ({
      number: 1,
      unit: 'day',
    }),
  },
  subtract: {
    key: 'subtract',
    titleKey: 'Subtract a range',
    groupKey: 'toDate',
    inputType: 'date',
    outputType: 'date',
    defaultParams: () => ({
      number: 1,
      unit: 'day',
    }),
  },
  diff: {
    key: 'diff',
    titleKey: 'Get difference with another date value',
    groupKey: 'getter',
    inputType: 'date',
    outputType: 'number',
    defaultParams: () => ({
      date: new Date(),
      unit: 'day',
      isAbs: false,
      round: false,
    }),
  },
  get: {
    key: 'get',
    titleKey: 'Get value on specific unit of input date',
    groupKey: 'getter',
    inputType: 'date',
    outputType: 'number',
    defaultParams: () => ({
      unit: 'day',
    }),
  },
  toTimestamp: {
    key: 'toTimestamp',
    titleKey: 'From date to timestamp',
    groupKey: 'converter',
    inputType: 'date',
    outputType: 'number',
    defaultParams: () => ({
      unit: 'second',
    }),
  },
  tsToDate: {
    key: 'tsToDate',
    titleKey: 'From timestamp to date',
    groupKey: 'converter',
    inputType: 'number',
    outputType: 'date',
    defaultParams: () => ({
      unit: 'second',
    }),
  },
  startOfTime: {
    key: 'startOfTime',
    titleKey: 'Set to time of unit start',
    groupKey: 'toDate',
    inputType: 'date',
    outputType: 'date',
    defaultParams: () => ({
      unit: 'day',
    }),
  },
  endOfTime: {
    key: 'endOfTime',
    titleKey: 'Set to time of unit end',
    groupKey: 'toDate',
    inputType: 'date',
    outputType: 'date',
    defaultParams: () => ({
      unit: 'day',
    }),
  },
  isLeapYear: {
    key: 'isLeapYear',
    titleKey: 'Is leap year',
    groupKey: 'getter',
    inputType: 'date',
    outputType: 'boolean',
  },
  format: {
    key: 'format',
    titleKey: 'Format to string',
    groupKey: 'toString',
    inputType: 'date',
    outputType: 'string',
    defaultParams: () => ({
      format: 'YYYY-MM-DD',
    }),
  },
  transDuration: {
    key: 'transDuration',
    titleKey: 'Convert unit',
    groupKey: 'converter',
    inputType: 'number',
    outputType: 'number',
    defaultParams: () => ({
      unitBefore: 'day',
      unitAfter: 'day',
      round: false,
    }),
  },
  changeTimezone: {
    key: 'changeTimezone',
    titleKey: 'Change timezone',
    groupKey: 'toDate',
    inputType: 'date',
    outputType: 'date',
    defaultParams: () => ({}),
  },
} as const satisfies Record<string, DateCalculationFunctionConfig>;

export type DateCalculationFunctionKey = keyof typeof dateFunctions;

export function isDateCalculationFunctionKey(key: unknown): key is DateCalculationFunctionKey {
  return typeof key === 'string' && key in dateFunctions;
}

export function isDateCalculationInputType(type: unknown): type is DateCalculationInputType {
  return type === 'date' || type === 'number';
}

export function getDateCalculationDefaultParams(functionKey: DateCalculationFunctionKey): StepArguments {
  const config = dateFunctions[functionKey] as DateCalculationFunctionConfig;
  return config.defaultParams?.() ?? {};
}

export function useDateFunctionMenuItems(inputType?: DateCalculationInputType | null): NonNullable<MenuProps['items']> {
  const t = useT();

  if (!inputType) {
    return [];
  }

  return functionGroupOrder.flatMap((groupKey) => {
    const candidates = Object.values(dateFunctions).filter(
      (item) => item.inputType === inputType && item.groupKey === groupKey,
    );

    if (!candidates.length) {
      return [];
    }

    return [
      {
        key: groupKey,
        label: t(functionGroupLabelKeys[groupKey]),
        type: 'group' as const,
        children: candidates.map((item) => ({
          key: item.key,
          label: (
            <Flex justify="space-between" align="center" gap="small">
              <span>{t(item.titleKey)}</span>
              <Tag color={dataTypeOptionMap[item.outputType].color}>
                {t(dataTypeOptionMap[item.outputType].labelKey)}
              </Tag>
            </Flex>
          ),
        })),
      },
    ];
  });
}

function DateOrNumberInput({ stepName }: { stepName: StepName }) {
  return (
    <Space.Compact block>
      <Form.Item name={stepArgumentName(stepName, 'number')} noStyle>
        <WorkflowTypedVariableInput types={integerOnlyType} />
      </Form.Item>
      <Form.Item name={stepArgumentName(stepName, 'unit')} noStyle>
        <UnitSelect />
      </Form.Item>
    </Space.Compact>
  );
}

function DifferenceFields({ stepName }: { stepName: StepName }) {
  const t = useT();

  return (
    <Space wrap>
      <Form.Item name={stepArgumentName(stepName, 'date')} noStyle>
        <WorkflowTypedVariableInput types={dateOnlyType} variableOptions={{ types: ['date'] }} />
      </Form.Item>
      <Form.Item name={stepArgumentName(stepName, 'unit')} noStyle>
        <UnitSelect />
      </Form.Item>
      <Form.Item name={stepArgumentName(stepName, 'isAbs')} valuePropName="checked" noStyle>
        <Checkbox>{t('Absolute value')}</Checkbox>
      </Form.Item>
      <Form.Item name={stepArgumentName(stepName, 'round')} noStyle>
        <RoundSelect />
      </Form.Item>
    </Space>
  );
}

function ConversionFields({
  stepName,
  mode,
}: {
  stepName: StepName;
  mode: 'toTimestamp' | 'tsToDate' | 'transDuration';
}) {
  const t = useT();
  const secondUnits = unitOptionKeys.filter((option) => option.value === 'millisecond' || option.value === 'second');
  const durationUnits = unitOptionKeys.filter((option) => option.value !== 'quarter');

  if (mode === 'transDuration') {
    return (
      <Space wrap>
        <Typography.Text>{t('From')}</Typography.Text>
        <Form.Item name={stepArgumentName(stepName, 'unitBefore')} noStyle>
          <UnitSelect options={durationUnits} />
        </Form.Item>
        <Typography.Text>{t('To')}</Typography.Text>
        <Form.Item name={stepArgumentName(stepName, 'unitAfter')} noStyle>
          <UnitSelect options={durationUnits} />
        </Form.Item>
        <Form.Item name={stepArgumentName(stepName, 'round')} noStyle>
          <RoundSelect />
        </Form.Item>
      </Space>
    );
  }

  return (
    <Space wrap>
      <Typography.Text>{t(mode === 'toTimestamp' ? 'To' : 'From')}</Typography.Text>
      <Form.Item name={stepArgumentName(stepName, 'unit')} noStyle>
        <UnitSelect options={secondUnits} />
      </Form.Item>
    </Space>
  );
}

export function DateCalculationInputField(props: React.ComponentProps<typeof WorkflowTypedVariableInput>) {
  return <WorkflowTypedVariableInput {...props} types={inputDateOrNumberTypes} />;
}

export function DateCalculationStepArguments({ stepName, functionKey }: { stepName: StepName; functionKey?: string }) {
  const t = useT();

  if (!isDateCalculationFunctionKey(functionKey)) {
    return null;
  }

  switch (functionKey) {
    case 'add':
    case 'subtract':
      return <DateOrNumberInput stepName={stepName} />;
    case 'diff':
      return <DifferenceFields stepName={stepName} />;
    case 'get':
    case 'startOfTime':
    case 'endOfTime':
      return (
        <Form.Item name={stepArgumentName(stepName, 'unit')} noStyle>
          <UnitSelect />
        </Form.Item>
      );
    case 'toTimestamp':
    case 'tsToDate':
      return <ConversionFields stepName={stepName} mode={functionKey} />;
    case 'isLeapYear':
      return null;
    case 'format':
      return (
        <Form.Item name={stepArgumentName(stepName, 'format')} noStyle>
          <Input placeholder={t('Pattern')} />
        </Form.Item>
      );
    case 'transDuration':
      return <ConversionFields stepName={stepName} mode="transDuration" />;
    case 'changeTimezone':
      return (
        <Form.Item name={stepArgumentName(stepName, 'timezone')} noStyle>
          <TimezoneSelect />
        </Form.Item>
      );
    default:
      return null;
  }
}

export function DateCalculationInputTypeField(props: React.ComponentProps<typeof RadioWithTooltip>) {
  const t = useT();

  return (
    <RadioWithTooltip
      {...props}
      options={[
        {
          label: 'Date type',
          value: 'date',
          tooltip: t(
            'Input value will be converted from its original type to date type to do futher calculation by Day.js constructor.',
          ),
        },
        {
          label: 'Number type',
          value: 'number',
          tooltip: t('Only calculation functions with numeric input value are supported.'),
        },
      ]}
    />
  );
}

export function StepOutputTag({ functionKey }: { functionKey?: string }) {
  const t = useT();

  if (!isDateCalculationFunctionKey(functionKey)) {
    return null;
  }

  const outputType = dateFunctions[functionKey].outputType;
  const option = dataTypeOptionMap[outputType];

  return <Tag color={option.color}>{t(option.labelKey)}</Tag>;
}
