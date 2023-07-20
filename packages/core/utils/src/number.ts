import { getNumberPrecision, toFixed } from '@rc-component/mini-decimal';

export function toFixedByStep(value: any, step: string | number) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return '';
  }
  const precision = getNumberPrecision(step);
  // return parseFloat(String(value)).toFixed(precision);
  return toFixed(String(value), '.', precision);
}
