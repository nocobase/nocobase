import React from 'react';
import { useCompile } from '../..';
import { Variable } from '../variable';

const useVariableTypes = () => {
  return [
    {
      title: `{{t("System variables")}}`,
      value: '$system',
      options: [
        {
          key: 'now',
          value: 'now',
          label: `{{t("Current time")}}`,
        },
      ],
    },
    {
      title: `{{t("Date variables")}}`,
      value: '$date',
      options: [
        {
          key: 'today',
          value: 'today',
          label: `{{t("Today")}}`,
        },
        {
          key: 'lastWeek',
          value: 'lastWeek',
          label: `{{t("Last Week")}}`,
        },
        {
          key: 'thisWeek',
          value: 'thisWeek',
          label: `{{t("This Week")}}`,
        },
        {
          key: 'nextWeek',
          value: 'nextWeek',
          label: `{{t("Next Week")}}`,
        },
        {
          key: 'lastMonth',
          value: 'lastMonth',
          label: `{{t("Last Month")}}`,
        },
        {
          key: 'thisMonth',
          value: 'thisMonth',
          label: `{{t("This Month")}}`,
        },
        {
          key: 'nextMonth',
          value: 'nextMonth',
          label: `{{t("Next Month")}}`,
        },
        {
          key: 'lastYear',
          value: 'lastYear',
          label: `{{t("Last Year")}}`,
        },
        {
          key: 'thisYear',
          value: 'thisYear',
          label: `{{t("This Year")}}`,
        },
        {
          key: 'nextYear',
          value: 'nextYear',
          label: `{{t("Next Year")}}`,
        },
        {
          key: 'last7Days',
          value: 'last7Days',
          label: `{{t("Last 7 Days")}}`,
        },
        {
          key: 'next7Days',
          value: 'next7Days',
          label: `{{t("Next 7 Days")}}`,
        },
        {
          key: 'last30Days',
          value: 'last30Days',
          label: `{{t("Last 30 Days")}}`,
        },
        {
          key: 'next30Days',
          value: 'next30Days',
          label: `{{t("Next 30 Days")}}`,
        },
        {
          key: 'last90Days',
          value: 'last90Days',
          label: `{{t("Last 90 Days")}}`,
        },
        {
          key: 'next90Days',
          value: 'next90Days',
          label: `{{t("Next 90 Days")}}`,
        },
      ],
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
      disabled: item.options && !item.options.length,
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
