/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';

export type Transformer = (val: any, ...args: any[]) => string | number;
export type TransformerConfig =
  | Transformer
  | {
      label?: string;
      schema?: any;
      fn: Transformer;
    };

const transformers: {
  [key: string]: {
    [key: string]: TransformerConfig;
  };
} = {
  general: {
    Prefix: {
      schema: {
        'x-component': 'Input',
      },
      fn: (val: string, prefix: string) => (prefix ? `${prefix}${val}` : val),
    },
    Suffix: {
      schema: {
        'x-component': 'Input',
      },
      fn: (val: string, suffix: string) => (suffix ? `${val}${suffix}` : val),
    },
  },
  datetime: {
    Format: {
      schema: {
        'x-component': 'AutoComplete',
        'x-component-props': {
          allowClear: true,
          style: {
            minWidth: 200,
          },
        },
        enum: [
          { label: 'YYYY', value: 'YYYY' },
          { label: 'YYYY-MM', value: 'YYYY-MM' },
          { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
          { label: 'YYYY-MM-DD hh:mm', value: 'YYYY-MM-DD hh:mm' },
          { label: 'YYYY-MM-DD hh:mm:ss', value: 'YYYY-MM-DD hh:mm:ss' },
        ],
      },
      fn: (val: string, format: string) => dayjs(val).format(format),
    },
    YYYY: {
      label: 'YYYY (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('YYYY'),
    },
    MM: {
      label: 'MM (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('MM'),
    },
    DD: {
      label: 'DD (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('DD'),
    },
    'YYYY-MM': {
      label: 'YYYY-MM (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('YYYY-MM'),
    },
    'YYYY-MM-DD': {
      label: 'YYYY-MM-DD (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    'YYYY-MM-DD hh:mm': {
      label: 'YYYY-MM-DD hh:mm (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('YYYY-MM-DD hh:mm'),
    },
    'YYYY-MM-DD hh:mm:ss': {
      label: 'YYYY-MM-DD hh:mm:ss (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('YYYY-MM-DD hh:mm:ss'),
    },
  },
  date: {
    Format: {
      schema: {
        'x-component': 'AutoComplete',
        'x-component-props': {
          allowClear: true,
          style: {
            minWidth: 200,
          },
        },
        enum: [
          { label: 'YYYY', value: 'YYYY' },
          { label: 'MM', value: 'MM' },
          { label: 'DD', value: 'DD' },
          { label: 'YYYY-MM', value: 'YYYY-MM' },
          { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
        ],
      },
      fn: (val: string, format: string) => dayjs(val).format(format),
    },
    YYYY: {
      label: 'YYYY (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('YYYY'),
    },
    MM: {
      label: 'MM (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('MM'),
    },
    DD: {
      label: 'DD (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('DD'),
    },
    'YYYY-MM': {
      label: 'YYYY-MM (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('YYYY-MM'),
    },
    'YYYY-MM-DD': {
      label: 'YYYY-MM-DD (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
  },
  time: {
    Format: {
      schema: {
        'x-component': 'AutoComplete',
        'x-component-props': {
          allowClear: true,
          style: {
            minWidth: 200,
          },
        },
        enum: [
          { label: 'hh:mm:ss', value: 'hh:mm:ss' },
          { label: 'hh:mm', value: 'hh:mm' },
          { label: 'hh', value: 'hh' },
        ],
      },
      fn: (val: string, format: string) => dayjs(val).format(format),
    },
    'hh:mm:ss': {
      label: 'hh:mm:ss (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('hh:mm:ss'),
    },
    'hh:mm': {
      label: 'hh:mm (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('hh:mm'),
    },
    hh: {
      label: 'hh (Deprecated, use Format instead)',
      fn: (val: string) => dayjs(val).format('hh'),
    },
  },
  number: {
    Precision: {
      schema: {
        'x-component': 'Select',
        enum: [
          { label: '1', value: 0 },
          { label: '1.0', value: 1 },
          { label: '1.00', value: 2 },
          { label: '1.000', value: 3 },
        ],
      },
      fn: (val: number, precision: number) => Number(val.toFixed(precision)),
    },
    Divide: {
      schema: {
        'x-component': 'InputNumber',
        'x-component-props': {
          min: 1,
        },
      },
      fn: (val: number, divisor: number) => {
        if (!val || !divisor) return 0;
        return val / divisor;
      },
    },
    Multiply: {
      schema: {
        'x-component': 'InputNumber',
        'x-component-props': {
          min: 0,
        },
      },
      fn: (val: number, multiplier: number) => {
        if (!val || multiplier === undefined) return 0;
        return val * multiplier;
      },
    },
    Separator: {
      schema: {
        'x-component': 'Select',
        enum: [
          { label: '100,000.00', value: 'en-US' },
          { label: '100.000,00', value: 'de-DE' },
          { label: '100 000.00', value: 'ru-RU' },
        ],
      },
      fn: (val: number, separator: string) => {
        switch (separator) {
          case 'en-US':
            return val.toLocaleString('en-US', { minimumFractionDigits: 2 });
          case 'de-DE':
            return val.toLocaleString('de-DE', { minimumFractionDigits: 2 });
          case 'ru-RU':
            return val.toLocaleString('ru-RU', { minimumFractionDigits: 2 });
          default:
            return val;
        }
      },
    },
    Percent: (val: number) =>
      new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        val,
      ),
    Currency: {
      label: 'Currency (Deprecated, use Separator & Prefix instead)',
      fn: (val: number, locale = 'en-US') => {
        const currency =
          {
            'zh-CN': 'CNY',
            'en-US': 'USD',
            'ja-JP': 'JPY',
            'ko-KR': 'KRW',
            'pt-BR': 'BRL',
            'ru-RU': 'RUB',
            'tr-TR': 'TRY',
            'es-ES': 'EUR',
          }[locale] || 'USD';
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(val);
      },
    },
    Exponential: (val: number | string) => (+val)?.toExponential(),
    Abbreviation: {
      schema: {
        'x-component': 'Select',
        enum: [
          { label: 'en-US', value: 'en-US' },
          { label: 'zh-CN', value: 'zh-CN' },
        ],
      },
      fn: (val: number, locale = 'en-US') => new Intl.NumberFormat(locale, { notation: 'compact' }).format(val),
    },
  },
  string: {
    'Type conversion': {
      schema: {
        'x-component': 'Select',
        enum: [
          { label: 'Number', value: 'Number' },
          { label: 'Date', value: 'Date' },
        ],
      },
      fn: (val: number, targetType: string) => {
        try {
          return new Function(`return ${targetType}(${val})`)();
        } catch (err) {
          console.log(err);
          return val;
        }
      },
    },
  },
};

export default transformers;
