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
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 处理日期变量的上下文
 * @param value 日期值
 * @param context 日期变量的上下文配置
 */
export function processDateVariableContext(value: any, context?: { timezone?: string; dateFormat?: string }) {
  if (!value) return value;

  let date = dayjs(value);

  // 应用时区
  if (context?.timezone) {
    date = date.tz(context.timezone);
  }

  // 应用日期格式
  if (context?.dateFormat) {
    return date.format(context.dateFormat);
  }

  return date.toISOString();
}

/**
 * 创建日期变量的上下文配置
 * @param timezone 时区
 * @param dateFormat 日期格式
 */
export function createDateVariableContext(timezone?: string, dateFormat?: string) {
  return {
    type: 'date' as const,
    config: {
      timezone,
      dateFormat,
    },
  };
}
