import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMemoizedFn } from 'ahooks';

export const useDateVariable = ({ schema }) => {
  const { t: trans } = useTranslation();
  const t = useMemoizedFn(trans);
  const component = schema?.['x-component'];
  // const disabled = !['DatePicker', 'DatePicker.RangePicker'].includes(component);
  const disabled = false;
  const dateOptions = useMemo(
    () => [
      {
        key: 'now',
        value: 'now',
        label: t('Now'),
        disabled,
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
    ],
    [disabled, t],
  );

  const result = useMemo(
    () => ({
      label: t('Date variables'),
      value: '$nDate',
      key: '$nDate',
      disabled: dateOptions.every((option) => option.disabled),
      children: dateOptions,
    }),
    [dateOptions, t],
  );

  if (!schema) return null;

  return result;
};
