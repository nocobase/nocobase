/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOperators } from '../../../block-provider/CollectOperators';
import { useDatePickerContext } from '../../../schema-component/antd/date-picker/DatePicker';
import { getDateRanges } from '../../../schema-component/antd/date-picker/util';
import { datetime } from '../../../collection-manager/interfaces/properties/operators';
interface Props {
  operator?: {
    value: string;
  };
  schema?: any;
  /**
   * 不需要禁用选项，一般会在表达式中使用
   */
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
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
      operators: datetime,
      schema: {},
    },
    {
      key: 'yesterday',
      value: 'yesterday',
      label: t('Yesterday'),
      disabled,
      operators: datetime,
    },
    {
      key: 'today',
      value: 'today',
      label: t('Today'),
      disabled,
      operators: datetime,
    },
    {
      key: 'tomorrow',
      value: 'tomorrow',
      label: t('Tomorrow'),
      disabled,
      operators: datetime,
    },
    {
      key: 'lastIsoWeek',
      value: 'lastIsoWeek',
      label: t('Last week'),
      disabled,
      operators: datetime,
    },
    {
      key: 'thisIsoWeek',
      value: 'thisIsoWeek',
      label: t('This week'),
      disabled,
      operators: datetime,
    },
    {
      key: 'nextIsoWeek',
      value: 'nextIsoWeek',
      label: t('Next week'),
      disabled,
      operators: datetime,
    },
    {
      key: 'lastMonth',
      value: 'lastMonth',
      label: t('Last month'),
      disabled,
      operators: datetime,
    },
    {
      key: 'thisMonth',
      value: 'thisMonth',
      label: t('This month'),
      disabled,
      operators: datetime,
    },
    {
      key: 'nextMonth',
      value: 'nextMonth',
      label: t('Next month'),
      disabled,
      operators: datetime,
    },
    {
      key: 'lastQuarter',
      value: 'lastQuarter',
      label: t('Last quarter'),
      disabled,
      operators: datetime,
    },
    {
      key: 'thisQuarter',
      value: 'thisQuarter',
      label: t('This quarter'),
      disabled,
      operators: datetime,
    },
    {
      key: 'nextQuarter',
      value: 'nextQuarter',
      label: t('Next quarter'),
      disabled,
      operators: datetime,
    },
    {
      key: 'lastYear',
      value: 'lastYear',
      label: t('Last year'),
      disabled,
      operators: datetime,
    },
    {
      key: 'thisYear',
      value: 'thisYear',
      label: t('This year'),
      disabled,
      operators: datetime,
    },
    {
      key: 'nextYear',
      value: 'nextYear',
      label: t('Next year'),
      disabled,
      operators: datetime,
    },
    {
      key: 'last7Days',
      value: 'last7Days',
      label: t('Last 7 days'),
      disabled,
      operators: datetime,
    },
    {
      key: 'next7Days',
      value: 'next7Days',
      label: t('Next 7 days'),
      disabled,
      operators: datetime,
    },
    {
      key: 'last30Days',
      value: 'last30Days',
      label: t('Last 30 days'),
      disabled,
      operators: datetime,
    },
    {
      key: 'next30Days',
      value: 'next30Days',
      label: t('Next 30 days'),
      disabled,
      operators: datetime,
    },
    {
      key: 'last90Days',
      value: 'last90Days',
      label: t('Last 90 days'),
      disabled,
      operators: datetime,
    },
    {
      key: 'next90Days',
      value: 'next90Days',
      label: t('Next 90 days'),
      disabled,
      operators: datetime,
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
 * 变量：`日期变量`的上下文
 * @returns
 */
export const useDatetimeVariableContext = () => {
  const { utc = true } = useDatePickerContext();
  const datetimeCtx = useMemo(() => getDateRanges({ shouldBeString: true, utc }), [utc]);

  return {
    datetimeCtx,
  };
};

/**
 * 变量：`日期变量`，主要用于筛选、联动规则条件场景
 * @param param0
 * @returns
 */
export const useDatetimeVariable = ({ operator, schema, noDisabled, targetFieldSchema }: Props = {}) => {
  const { t } = useTranslation();
  const { getOperator } = useOperators();

  const datetimeSettings = useMemo(() => {
    const operatorValue = operator?.value || getOperator(targetFieldSchema?.name) || '';
    const disabled = noDisabled
      ? false
      : !['DatePicker.RangePicker'].includes(schema?.['x-component']) && !operatorValue;
    const dateOptions = [
      {
        key: 'now',
        value: 'now',
        label: t('Current time'),
        disabled: noDisabled ? false : schema?.['x-component'] !== 'DatePicker' || operatorValue === '$dateBetween',
        operators: datetime,
      },
      {
        key: 'yesterday',
        value: 'yesterday',
        label: t('Yesterday'),
        disabled,
        operators: datetime,
      },
      {
        key: 'today',
        value: 'today',
        label: t('Today'),
        disabled,
        operators: datetime,
      },
      {
        key: 'tomorrow',
        value: 'tomorrow',
        label: t('Tomorrow'),
        disabled,
        operators: datetime,
      },
      {
        key: 'lastIsoWeek',
        value: 'lastIsoWeek',
        label: t('Last week'),
        disabled,
        operators: datetime,
      },
      {
        key: 'thisIsoWeek',
        value: 'thisIsoWeek',
        label: t('This week'),
        disabled,
        operators: datetime,
      },
      {
        key: 'nextIsoWeek',
        value: 'nextIsoWeek',
        label: t('Next week'),
        disabled,
        operators: datetime,
      },
      {
        key: 'lastMonth',
        value: 'lastMonth',
        label: t('Last month'),
        disabled,
        operators: datetime,
      },
      {
        key: 'thisMonth',
        value: 'thisMonth',
        label: t('This month'),
        disabled,
        operators: datetime,
      },
      {
        key: 'nextMonth',
        value: 'nextMonth',
        label: t('Next month'),
        disabled,
        operators: datetime,
      },
      {
        key: 'lastQuarter',
        value: 'lastQuarter',
        label: t('Last quarter'),
        disabled,
        operators: datetime,
      },
      {
        key: 'thisQuarter',
        value: 'thisQuarter',
        label: t('This quarter'),
        disabled,
        operators: datetime,
      },
      {
        key: 'nextQuarter',
        value: 'nextQuarter',
        label: t('Next quarter'),
        disabled,
        operators: datetime,
      },
      {
        key: 'lastYear',
        value: 'lastYear',
        label: t('Last year'),
        disabled,
        operators: datetime,
      },
      {
        key: 'thisYear',
        value: 'thisYear',
        label: t('This year'),
        disabled,
        operators: datetime,
      },
      {
        key: 'nextYear',
        value: 'nextYear',
        label: t('Next year'),
        disabled,
        operators: datetime,
      },
      {
        key: 'last7Days',
        value: 'last7Days',
        label: t('Last 7 days'),
        disabled,
        operators: datetime,
      },
      {
        key: 'next7Days',
        value: 'next7Days',
        label: t('Next 7 days'),
        disabled,
        operators: datetime,
      },
      {
        key: 'last30Days',
        value: 'last30Days',
        label: t('Last 30 days'),
        disabled,
        operators: datetime,
      },
      {
        key: 'next30Days',
        value: 'next30Days',
        label: t('Next 30 days'),
        disabled,
        operators: datetime,
      },
      {
        key: 'last90Days',
        value: 'last90Days',
        label: t('Last 90 days'),
        disabled,
        operators: datetime,
      },
      {
        key: 'next90Days',
        value: 'next90Days',
        label: t('Next 90 days'),
        disabled,
        operators: datetime,
      },
    ];

    return {
      label: t('Date variables'),
      value: '$nDate',
      key: '$nDate',
      disabled: dateOptions.every((option) => option.disabled),
      children: dateOptions,
    };
  }, [schema?.['x-component'], targetFieldSchema]);

  const { datetimeCtx } = useDatetimeVariableContext();

  return {
    datetimeSettings,
    datetimeCtx,
  };
};
