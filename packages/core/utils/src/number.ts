import { toFixed } from 'rc-input-number/lib/utils/MiniDecimal';
import { getNumberPrecision } from 'rc-input-number/lib/utils/numberUtil';

export function toFixedByStep(value: any, step: string | number) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return '';
  }
  const precision = getNumberPrecision(step);
  // return parseFloat(String(value)).toFixed(precision);
  return toFixed(String(value), '.', precision);
}
