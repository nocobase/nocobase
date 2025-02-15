/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dayjs } from '../../dayjs';
import { QUnitType } from 'dayjs';

export function dateFormat(initialValue: any, format: string) {
  return dayjs.isDayjs(initialValue) ? initialValue.format(format) : dayjs(initialValue).format(format);
}

export function dateAdd(initialValue: any, number: number, unit: any) {
  const value = dayjs.isDayjs(initialValue) ? initialValue : dayjs(initialValue);
  return value.add(number, unit);
}

export function dateSubtract(initialValue: any, number: number, unit: any) {
  const value = dayjs.isDayjs(initialValue) ? initialValue : dayjs(initialValue);
  return value.subtract(number, unit);
}
