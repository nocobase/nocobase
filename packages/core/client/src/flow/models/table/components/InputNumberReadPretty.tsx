/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isValid } from '@formily/shared';
import { toFixedByStep } from '@nocobase/utils/client';
import BigNumber from 'bignumber.js';
import { format } from 'd3-format';
import * as math from 'mathjs';
import React, { useMemo } from 'react';
import { toString } from 'lodash';
import { connect, mapProps } from '@formily/react';

function countDecimalPlaces(value) {
  const strValue = toString(value);

  // 检查是否包含小数点
  if (!strValue.includes('.')) return 0;

  // 获取小数部分并去除末尾的零
  const decimalPart = strValue.split('.')[1].replace(/0+$/, '');

  return decimalPart.length;
}
const separators = {
  '0,0.00': { thousands: ',', decimal: '.' },
  '0.0,00': { thousands: '.', decimal: ',' },
  '0 0,00': { thousands: ' ', decimal: '.' },
  '0.00': { thousands: '', decimal: '.' }, // 没有千位分隔符
};
//分隔符换算
function formatNumberWithSeparator(value, format = '0.00', step = 1, formatStyle?) {
  if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
    return formatBigNumberWithSeparator(value, format, step, formatStyle);
  }
  let number = value;

  if (formatStyle) {
    number = Number(value);
  }
  let formattedNumber = '';

  if (separators[format]) {
    const { thousands, decimal } = separators[format];
    formattedNumber = number
      .toLocaleString('en-US', {
        style: 'decimal',
        minimumFractionDigits: step,
        maximumFractionDigits: step,
      })
      .replace(/,/g, 'comma_placeholder')
      .replace(/\./g, 'dot_placeholder')
      .replace(/comma_placeholder/g, thousands)
      .replace(/dot_placeholder/g, decimal);
  } else {
    formattedNumber = number.toString();
  }
  return formattedNumber;
}
//大字段分隔符换算
function formatBigNumberWithSeparator(value, format = '0.00', step = 1, formatStyle?) {
  let number = value;

  if (formatStyle) {
    number = new BigNumber(value).toString();
  }

  let formattedNumber = '';
  if (separators[format]) {
    const { thousands, decimal } = separators[format];
    const [integerPart, initFractionalPart] = number.toString().split('.');
    let fractionalPart = initFractionalPart;
    // 格式化整数部分
    const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    // 处理小数部分
    if (fractionalPart && step) {
      fractionalPart = fractionalPart.substring(0, step);
      formattedNumber = `${formattedIntegerPart}${decimal}${fractionalPart}`;
    } else {
      formattedNumber = formattedIntegerPart;
    }
  } else {
    formattedNumber = number.toString();
  }
  return formattedNumber;
}

//单位换算
function formatUnitConversion(value, operator = '*', multiplier?: number) {
  if (!multiplier) {
    return value;
  }
  let result;

  if (operator === '*') {
    result = value * multiplier;
  } else if (operator === '/') {
    if (multiplier !== 0) {
      result = value / multiplier;
    } else {
      console.error('Error: Division by zero.');
      return null;
    }
  } else {
    console.error("Error: Invalid operator. Use '*' for multiplication or '/' for division.");
    return null;
  }

  return math.round(result, 9);
}

//科学计数法显示
function scientificNotation(number, decimalPlaces, separator = '.') {
  const formatter = format(`.${decimalPlaces}e`);
  const formattedNumber = formatter(number).replace('.', separator);

  // 匹配科学计数法中的指数部分，判断正负情况
  const result = formattedNumber.replace(/e([+-]?\d+)/, (match, exponent) => {
    if (exponent.startsWith('+')) {
      // 正数指数，不显示符号
      return `×10<sup>${exponent.slice(1)}</sup>`;
    } else {
      // 负数指数，显示 "-" 符号
      return `×10<sup>-${exponent.slice(1)}</sup>`;
    }
  });

  return result;
}

function formatNumber(props) {
  const { step, formatStyle = 'normal', value, unitConversion, unitConversionType, separator = '0,0.00' } = props;

  if (!isValid(value)) {
    return null;
  }
  //单位换算
  const unitData = formatUnitConversion(value, unitConversionType, unitConversion);
  //精度换算
  const precisionData = toFixedByStep(unitData, step);
  let result;
  //分隔符换算
  result = formatNumberWithSeparator(precisionData, separator, countDecimalPlaces(step), formatStyle);
  if (formatStyle === 'scientifix') {
    //科学计数显示
    result = scientificNotation(Number(unitData), countDecimalPlaces(step), separators?.[separator]?.['decimal']);
  }
  return result;
}

interface InputNumberReadPrettyProps {
  formatStyle?: 'normal' | 'scientifix';
  unitConversion?: number;
  /**
   * @default '*'
   */
  unitConversionType?: '*' | '/';
  /**
   * @default '0.00'
   */
  separator?: '0,0.00' | '0.0,00' | '0 0,00' | '0.00';
  step?: number;
  value?: any;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
}

export const InputNumberReadPretty = connect(
  (props: InputNumberReadPrettyProps) => {
    const { step, formatStyle, value, addonBefore, addonAfter, unitConversion, unitConversionType, separator } = props;

    const result = useMemo(() => {
      return formatNumber({ step, formatStyle, value, unitConversion, unitConversionType, separator });
    }, [step, formatStyle, value, unitConversion, unitConversionType, separator]);

    if (!result) {
      return null;
    }

    return (
      <div>
        {addonBefore}
        <span dangerouslySetInnerHTML={{ __html: result }} />
        {addonAfter}
      </div>
    );
  },
  mapProps((props) => {
    return {
      ...props,
    };
  }),
);
