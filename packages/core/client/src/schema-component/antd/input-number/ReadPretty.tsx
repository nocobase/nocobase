import { isValid } from '@formily/shared';
import { toFixedByStep } from '@nocobase/utils/client';
import type { InputProps } from 'antd/es/input';
import type { InputNumberProps } from 'antd/es/input-number';
import { format } from 'd3-format';
import * as math from 'mathjs';
import React, { useMemo } from 'react';

function countDecimalPlaces(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;

  const decimalPart = String(number).split('.')[1];
  return decimalPart ? decimalPart.length : 0;
}
const separators = {
  '0,0.00': { thousands: ',', decimal: '.' },
  '0.0,00': { thousands: '.', decimal: ',' },
  '0 0,00': { thousands: ' ', decimal: '.' },
  '0.00': { thousands: '', decimal: '.' }, // 没有千位分隔符
};
//分隔符换算
export function formatNumberWithSeparator(number, format = '0.00', step = 1) {
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

//单位换算
export function formatUnitConversion(value, operator = '*', multiplier) {
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
export function scientificNotation(number, decimalPlaces, separator = '.') {
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

export function formatNumber(props) {
  const { step, formatStyle, value, unitConversion, unitConversionType, separator = '0.00' } = props;

  if (!isValid(value)) {
    return null;
  }

  //单位换算
  const unitData = formatUnitConversion(value, unitConversionType, unitConversion);
  //精度换算
  const preciationData = toFixedByStep(unitData, step);
  let result;
  //分隔符换算
  result = formatNumberWithSeparator(Number(preciationData), separator, countDecimalPlaces(step));
  if (formatStyle === 'scientifix') {
    //科学计数显示
    result = scientificNotation(Number(unitData), countDecimalPlaces(step), separators?.[separator]?.['decimal']);
  }
  return result;
}

export const ReadPretty: React.FC<InputProps & InputNumberProps> = (props: any) => {
  const { step, formatStyle, value, addonBefore, addonAfter, unitConversion, unitConversionType, separator } = props;

  const result = useMemo(() => {
    return formatNumber({ step, formatStyle, value, unitConversion, unitConversionType, separator });
  }, [step, formatStyle, value, unitConversion, unitConversionType, separator]);

  if (!isValid(result)) {
    return null;
  }

  return (
    <div className={'nb-read-pretty-input-number'}>
      {addonBefore}
      <span dangerouslySetInnerHTML={{ __html: result }} />
      {addonAfter}
    </div>
  );
};
