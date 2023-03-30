import React from 'react';
import { useCompile } from '../..';
import { useValues } from '../filter/useValues';
import { Variable } from '../variable';
import { useUserVariable } from './hooks/useUserVariable';

const useVariableTypes = () => {
  const { operator, schema } = useValues();
  const operatorValue = operator?.value || '';
  const userVariable = useUserVariable({ schema, operator });

  if (!operator || !schema) return [];

  const systemOptions = [
    {
      key: 'now',
      value: 'now',
      label: `{{t("Now")}}`,
      disabled: schema['x-component'] !== 'DatePicker' || operatorValue === '$dateBetween',
    },
  ];
  const disabled = !['DatePicker', 'DatePicker.RangePicker'].includes(schema['x-component']);
  const dateOptions = [
    {
      key: 'now',
      value: 'now',
      label: `{{t("Now")}}`,
      disabled: schema['x-component'] !== 'DatePicker' || operatorValue === '$dateBetween',
    },
    {
      key: 'yesterday',
      value: 'yesterday',
      label: `{{t("Yesterday")}}`,
      disabled,
    },
    {
      key: 'today',
      value: 'today',
      label: `{{t("Today")}}`,
      disabled,
    },
    {
      key: 'tomorrow',
      value: 'tomorrow',
      label: `{{t("Tomorrow")}}`,
      disabled,
    },
    {
      key: 'lastIsoWeek',
      value: 'lastIsoWeek',
      label: `{{t("Last week")}}`,
      disabled,
    },
    {
      key: 'thisIsoWeek',
      value: 'thisIsoWeek',
      label: `{{t("This week")}}`,
      disabled,
    },
    {
      key: 'nextIsoWeek',
      value: 'nextIsoWeek',
      label: `{{t("Next week")}}`,
      disabled,
    },
    {
      key: 'lastMonth',
      value: 'lastMonth',
      label: `{{t("Last month")}}`,
      disabled,
    },
    {
      key: 'thisMonth',
      value: 'thisMonth',
      label: `{{t("This month")}}`,
      disabled,
    },
    {
      key: 'nextMonth',
      value: 'nextMonth',
      label: `{{t("Next month")}}`,
      disabled,
    },
    {
      key: 'lastQuarter',
      value: 'lastQuarter',
      label: `{{t("Last quarter")}}`,
      disabled,
    },
    {
      key: 'thisQuarter',
      value: 'thisQuarter',
      label: `{{t("This quarter")}}`,
      disabled,
    },
    {
      key: 'nextQuarter',
      value: 'nextQuarter',
      label: `{{t("Next quarter")}}`,
      disabled,
    },
    {
      key: 'lastYear',
      value: 'lastYear',
      label: `{{t("Last year")}}`,
      disabled,
    },
    {
      key: 'thisYear',
      value: 'thisYear',
      label: `{{t("This year")}}`,
      disabled,
    },
    {
      key: 'nextYear',
      value: 'nextYear',
      label: `{{t("Next year")}}`,
      disabled,
    },
    {
      key: 'last7Days',
      value: 'last7Days',
      label: `{{t("Last 7 days")}}`,
      disabled,
    },
    {
      key: 'next7Days',
      value: 'next7Days',
      label: `{{t("Next 7 days")}}`,
      disabled,
    },
    {
      key: 'last30Days',
      value: 'last30Days',
      label: `{{t("Last 30 days")}}`,
      disabled,
    },
    {
      key: 'next30Days',
      value: 'next30Days',
      label: `{{t("Next 30 days")}}`,
      disabled,
    },
    {
      key: 'last90Days',
      value: 'last90Days',
      label: `{{t("Last 90 days")}}`,
      disabled,
    },
    {
      key: 'next90Days',
      value: 'next90Days',
      label: `{{t("Next 90 days")}}`,
      disabled,
    },
  ];

  return [
    userVariable,
    // {
    //   title: `{{t("System variables")}}`,
    //   value: '$system',
    //   disabled: systemOptions.every((option) => option.disabled),
    //   options: systemOptions,
    // },
    {
      title: `{{t("Date variables")}}`,
      value: '$date',
      disabled: dateOptions.every((option) => option.disabled),
      options: dateOptions,
    },
  ];
};

const useVariableOptions = () => {
  const compile = useCompile();
  const options = useVariableTypes().map((item) => {
    return {
      label: compile(item.title),
      value: item.value,
      key: item.value,
      children: compile(item.options),
      disabled: item.disabled,
    };
  });
  return options;
};

export function FilterDynamicComponent(props) {
  const { value, onChange, renderSchemaComponent } = props;
  const scope = useVariableOptions();
  return (
    <Variable.Input value={value} onChange={onChange} scope={scope}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
