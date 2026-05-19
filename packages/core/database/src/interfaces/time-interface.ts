/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { BaseInterface } from './base-interface';
dayjs.extend(utc);

function isNumeric(value: any): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatExcelTimeSerial(value: number) {
  const normalized = ((value % 1) + 1) % 1;
  const totalSeconds = Math.round(normalized * 24 * 60 * 60) % (24 * 60 * 60);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export class TimeInterface extends BaseInterface {
  toValue(value: any, ctx?: any) {
    if (isNumeric(value)) {
      return formatExcelTimeSerial(value);
    }

    if (this.validate(value)) {
      const result = dayjs(value).format('HH:mm:ss');
      return result;
    }
    return value;
  }

  validate(value) {
    const result = dayjs(value).isValid();
    return result;
  }
}
