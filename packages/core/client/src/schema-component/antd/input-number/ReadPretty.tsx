import { isValid } from '@formily/shared';
import { toFixedByStep } from '@nocobase/utils/client';
import type { InputProps } from 'antd/es/input';
import type { InputNumberProps } from 'antd/es/input-number';
import * as math from 'mathjs';
import React from 'react';

function countDecimalPlaces(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;

  const decimalPart = String(number).split('.')[1];
  return decimalPart ? decimalPart.length : 0;
}

//分隔符换算
function formatNumberWithSeparator(number, format = '0,0.00', step) {
  let formattedNumber = '';
  const separators = {
    '0,0.00': { thousands: ',', decimal: '.' },
    '0.0,00': { thousands: '.', decimal: ',' },
    '0 0,00': { thousands: ' ', decimal: '.' },
    '0.00': { thousands: '', decimal: '.' }, // 没有千位分隔符
  };

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
function formatUnitConversion(value, operator = '*', multiplier) {
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

export const ReadPretty: React.FC<InputProps & InputNumberProps> = (props: any) => {
  const { step, value, addonBefore, addonAfter, unitConversion, unitConversionType, separator } = props;
  if (!isValid(props.value)) {
    return null;
  }
  //单位换算
  const unitData = formatUnitConversion(value, unitConversionType, unitConversion);
  //精度换算
  const preciationData = toFixedByStep(unitData, step);
  //分隔符换算
  const result = formatNumberWithSeparator(Number(preciationData), separator, countDecimalPlaces(step));
  if (!result) {
    return null;
  }
  return (
    <div className={'nb-read-pretty-input-number'}>
      {addonBefore}
      {result}
      {addonAfter}
    </div>
  );
};
