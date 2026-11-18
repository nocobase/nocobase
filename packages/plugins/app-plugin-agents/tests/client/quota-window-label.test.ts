import { expect, it } from 'vitest';
import { quotaWindowLabel } from '../../client/lib/format.js';

it.each([
  ['43200m', '30d'],
  ['10080m', '7d'],
  ['4320m', '3d'],
  ['1440m', '1d'],
  ['300m', '5h'],
  ['60m', '1h'],
  ['90m', '90m'],
  ['0m', '0m'],
  ['primary', 'primary'],
  ['seven_day', '7d'],
  ['seven_day_overage_included', '7d · Fable'],
])(
  'formats quota window %s as %s without changing its duration',
  (value, label) => {
    expect(quotaWindowLabel(value)).toBe(label);
  },
);
