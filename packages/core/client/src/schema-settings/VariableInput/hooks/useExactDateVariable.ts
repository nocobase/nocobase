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
import { getDateExact } from '../../../schema-component/antd/date-picker/util';
import { datetime } from '../../../collection-manager/interfaces/properties/operators';
import { useFlag } from '../../../flag-provider';
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
  dateOnly?: boolean;
  utc?: boolean;
}

/**
 * 变量：`日期变量`的上下文
 * @returns
 */
export const useExactDateVariableContext = () => {
  const exactDateTimeCtx = useMemo(() => getDateExact(), []);

  return {
    exactDateTimeCtx,
  };
};

/**
 * 变量：`日期时刻变量`，主要用于赋值的场景
 * @param param0
 * @returns
 */
export const useExactDateVariable = ({ schema, targetFieldSchema }: Props = {}) => {
  const { collectionField } = useFlag();
  const { dateOnly, utc, accuracy, picker } = collectionField?.uiSchema?.['x-component-props'] || {};
  const { t } = useTranslation();
  // 根据传入的 utc 和 dateOnly 参数决定时区和日期格式
  const exactDateTimeSettings = useMemo(() => {
    // 获取字段的实际值，决定是否包含时区和是否为日期格式
    const getDateKeys = (key: string): string => {
      if (!picker) {
        // 如果 dateOnly 和 utc 都没有提供，则返回特定值
        if (key === 'now') return 'nowLocal';
        if (key === 'today') return 'todayDate';
        if (key === 'yesterday') return 'yesterdayDate';
        if (key === 'tomorrow') return 'tomorrowDate';
      }
      if (dateOnly) {
        if (key === 'now') {
          return null;
        }
        return `${key}Date`;
      }
      return `${key}${utc || accuracy ? 'Utc' : 'Local'}`;
    };

    const dateOptions = [
      {
        key: 'now',
        value: getDateKeys('now'), // 动态根据 utc 和 dateOnly 判断返回值
        label: t('Now'),
        operators: datetime,
      },
      {
        key: 'today',
        value: getDateKeys('today'),
        label: t('Today'),
        operators: datetime,
      },
      {
        key: 'yesterday',
        value: getDateKeys('yesterday'),
        label: t('Yesterday'),
        operators: datetime,
      },
      {
        key: 'tomorrow',
        value: getDateKeys('tomorrow'),
        label: t('Tomorrow'),
        operators: datetime,
      },
    ].filter((v) => v.value);
    return {
      label: t('Date variables'),
      value: '$nExactDate',
      key: '$nExactDate',
      children: dateOptions,
    };
  }, [schema?.['x-component'], targetFieldSchema]);

  const { exactDateTimeCtx } = useExactDateVariableContext();

  return {
    exactDateTimeSettings,
    exactDateTimeCtx,
    shouldDisplayExactDate: !!collectionField,
  };
};
