import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getDateRanges } from '../../../schema-component/antd/date-picker/util';

interface Props {
  operator?: {
    value: string;
  };
  schema?: any;
  /**
   * 不需要禁用选项，一般会在表达式中使用
   */
  noDisabled?: boolean;
}

/**
 * @deprecated
 * 该 hook 已废弃，请使用 `useDatetimeVariable` 代替
 *
 * 变量：`日期变量`
 * @param param0
 * @returns
 */
export const useDateVariable = ({ operator, schema, noDisabled }: Props) => {
  const { t } = useTranslation();
  const operatorValue = operator?.value || '';
  const disabled = noDisabled ? false : !['DatePicker', 'DatePicker.RangePicker'].includes(schema?.['x-component']);
  const dateOptions = [
    {
      key: 'now',
      value: 'now',
      label: t('Current time'),
      disabled: noDisabled ? false : schema?.['x-component'] !== 'DatePicker' || operatorValue === '$dateBetween',
    },
    {
      key: 'yesterday',
      value: 'yesterday',
      label: t('Yesterday'),
      disabled,
    },
    {
      key: 'today',
      value: 'today',
      label: t('Today'),
      disabled,
    },
    {
      key: 'tomorrow',
      value: 'tomorrow',
      label: t('Tomorrow'),
      disabled,
    },
    {
      key: 'lastIsoWeek',
      value: 'lastIsoWeek',
      label: t('Last week'),
      disabled,
    },
    {
      key: 'thisIsoWeek',
      value: 'thisIsoWeek',
      label: t('This week'),
      disabled,
    },
    {
      key: 'nextIsoWeek',
      value: 'nextIsoWeek',
      label: t('Next week'),
      disabled,
    },
    {
      key: 'lastMonth',
      value: 'lastMonth',
      label: t('Last month'),
      disabled,
    },
    {
      key: 'thisMonth',
      value: 'thisMonth',
      label: t('This month'),
      disabled,
    },
    {
      key: 'nextMonth',
      value: 'nextMonth',
      label: t('Next month'),
      disabled,
    },
    {
      key: 'lastQuarter',
      value: 'lastQuarter',
      label: t('Last quarter'),
      disabled,
    },
    {
      key: 'thisQuarter',
      value: 'thisQuarter',
      label: t('This quarter'),
      disabled,
    },
    {
      key: 'nextQuarter',
      value: 'nextQuarter',
      label: t('Next quarter'),
      disabled,
    },
    {
      key: 'lastYear',
      value: 'lastYear',
      label: t('Last year'),
      disabled,
    },
    {
      key: 'thisYear',
      value: 'thisYear',
      label: t('This year'),
      disabled,
    },
    {
      key: 'nextYear',
      value: 'nextYear',
      label: t('Next year'),
      disabled,
    },
    {
      key: 'last7Days',
      value: 'last7Days',
      label: t('Last 7 days'),
      disabled,
    },
    {
      key: 'next7Days',
      value: 'next7Days',
      label: t('Next 7 days'),
      disabled,
    },
    {
      key: 'last30Days',
      value: 'last30Days',
      label: t('Last 30 days'),
      disabled,
    },
    {
      key: 'next30Days',
      value: 'next30Days',
      label: t('Next 30 days'),
      disabled,
    },
    {
      key: 'last90Days',
      value: 'last90Days',
      label: t('Last 90 days'),
      disabled,
    },
    {
      key: 'next90Days',
      value: 'next90Days',
      label: t('Next 90 days'),
      disabled,
    },
  ];

  const result = useMemo(() => {
    return {
      label: t('Date variables'),
      value: '$nDate',
      key: '$nDate',
      disabled: dateOptions.every((option) => option.disabled),
      children: dateOptions,
    };
  }, [schema?.['x-component']]);

  if (!schema) return null;

  return result;
};

/**
 * 变量：`日期变量`
 * @param param0
 * @returns
 */
export const useDatetimeVariable = ({ operator, schema, noDisabled }: Props = {}) => {
  const { t } = useTranslation();
  const datetimeSettings = useMemo(() => {
    const operatorValue = operator?.value || '';
    const disabled = noDisabled ? false : !['DatePicker', 'DatePicker.RangePicker'].includes(schema?.['x-component']);
    const dateOptions = [
      {
        key: 'now',
        value: 'now',
        label: t('Current time'),
        disabled: noDisabled ? false : schema?.['x-component'] !== 'DatePicker' || operatorValue === '$dateBetween',
      },
      {
        key: 'yesterday',
        value: 'yesterday',
        label: t('Yesterday'),
        disabled,
      },
      {
        key: 'today',
        value: 'today',
        label: t('Today'),
        disabled,
      },
      {
        key: 'tomorrow',
        value: 'tomorrow',
        label: t('Tomorrow'),
        disabled,
      },
      {
        key: 'lastIsoWeek',
        value: 'lastIsoWeek',
        label: t('Last week'),
        disabled,
      },
      {
        key: 'thisIsoWeek',
        value: 'thisIsoWeek',
        label: t('This week'),
        disabled,
      },
      {
        key: 'nextIsoWeek',
        value: 'nextIsoWeek',
        label: t('Next week'),
        disabled,
      },
      {
        key: 'lastMonth',
        value: 'lastMonth',
        label: t('Last month'),
        disabled,
      },
      {
        key: 'thisMonth',
        value: 'thisMonth',
        label: t('This month'),
        disabled,
      },
      {
        key: 'nextMonth',
        value: 'nextMonth',
        label: t('Next month'),
        disabled,
      },
      {
        key: 'lastQuarter',
        value: 'lastQuarter',
        label: t('Last quarter'),
        disabled,
      },
      {
        key: 'thisQuarter',
        value: 'thisQuarter',
        label: t('This quarter'),
        disabled,
      },
      {
        key: 'nextQuarter',
        value: 'nextQuarter',
        label: t('Next quarter'),
        disabled,
      },
      {
        key: 'lastYear',
        value: 'lastYear',
        label: t('Last year'),
        disabled,
      },
      {
        key: 'thisYear',
        value: 'thisYear',
        label: t('This year'),
        disabled,
      },
      {
        key: 'nextYear',
        value: 'nextYear',
        label: t('Next year'),
        disabled,
      },
      {
        key: 'last7Days',
        value: 'last7Days',
        label: t('Last 7 days'),
        disabled,
      },
      {
        key: 'next7Days',
        value: 'next7Days',
        label: t('Next 7 days'),
        disabled,
      },
      {
        key: 'last30Days',
        value: 'last30Days',
        label: t('Last 30 days'),
        disabled,
      },
      {
        key: 'next30Days',
        value: 'next30Days',
        label: t('Next 30 days'),
        disabled,
      },
      {
        key: 'last90Days',
        value: 'last90Days',
        label: t('Last 90 days'),
        disabled,
      },
      {
        key: 'next90Days',
        value: 'next90Days',
        label: t('Next 90 days'),
        disabled,
      },
    ];

    return {
      label: t('Date variables'),
      value: '$nDate',
      key: '$nDate',
      disabled: dateOptions.every((option) => option.disabled),
      children: dateOptions,
    };
  }, [schema?.['x-component']]);

  const datetimeCtx = useMemo(() => getDateRanges(), []);

  return {
    datetimeSettings,
    datetimeCtx,
  };
};
