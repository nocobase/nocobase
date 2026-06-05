/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { autorun } from '@formily/reactive';
import { Form } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import { first, last } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';

type DateLimitProps = {
  _minDate?: any;
  _maxDate?: any;
  currentForm?: any;
};

export function useDateLimit(props: DateLimitProps) {
  const ctx = useFlowContext();
  const isAntdFormInstance = typeof props.currentForm?.getFieldsValue === 'function';
  const currentFormValues = Form.useWatch([], isAntdFormInstance ? props.currentForm : undefined);
  const [minDate, setMinDate] = useState<dayjs.Dayjs | null>(null);
  const [maxDate, setMaxDate] = useState<dayjs.Dayjs | null>(null);
  const [disabledDate, setDisabledDate] = useState<any>(null);
  const [disabledTime, setDisabledTime] = useState<any>(null);
  const disposeRef = useRef<any>(null);

  useEffect(() => {
    if (disposeRef.current) {
      disposeRef.current();
    }

    disposeRef.current = autorun(() => {
      void limitDate();
    });

    return () => {
      disposeRef.current?.();
    };
  }, [ctx, currentFormValues, props._maxDate, props._minDate]);

  const limitDate = async () => {
    const resolvedParams = await ctx.resolveJsonTemplate({
      _minDate: props._minDate,
      _maxDate: props._maxDate,
    });

    const nextMinRaw = Array.isArray(resolvedParams?._minDate)
      ? first(resolvedParams._minDate)
      : resolvedParams?._minDate;
    const nextMaxRaw = Array.isArray(resolvedParams?._maxDate)
      ? last(resolvedParams._maxDate)
      : resolvedParams?._maxDate;
    const nextMinDate = nextMinRaw ? dayjs(nextMinRaw) : null;
    const nextMaxDate = nextMaxRaw ? dayjs(nextMaxRaw) : null;

    setMinDate(nextMinDate?.isValid?.() ? nextMinDate : null);
    setMaxDate(nextMaxDate?.isValid?.() ? nextMaxDate : null);

    const fullTimeArr = Array.from({ length: 60 }, (_, i) => i);

    const nextDisabledDate = (current: dayjs.Dayjs) => {
      if (!dayjs.isDayjs(current)) return false;

      const min = nextMinDate?.isValid?.() ? nextMinDate.startOf('day') : null;
      const max = nextMaxDate?.isValid?.() ? nextMaxDate.endOf('day') : null;

      if (min && current.startOf('day').isBefore(min)) {
        return true;
      }
      if (max && current.startOf('day').isAfter(max)) {
        return true;
      }
      return false;
    };

    const nextDisabledTime = (current: dayjs.Dayjs) => {
      if (!current || (!nextMinDate?.isValid?.() && !nextMaxDate?.isValid?.())) {
        return { disabledHours: () => [], disabledMinutes: () => [], disabledSeconds: () => [] };
      }

      const isCurrentMinDay = !!nextMinDate?.isValid?.() && current.isSame(nextMinDate, 'day');
      const isCurrentMaxDay = !!nextMaxDate?.isValid?.() && current.isSame(nextMaxDate, 'day');

      const disabledHours = () => {
        const hours = [];
        if (isCurrentMinDay && nextMinDate) {
          for (let hour = 0; hour < nextMinDate.hour(); hour++) {
            hours.push(hour);
          }
        }
        if (isCurrentMaxDay && nextMaxDate) {
          for (let hour = nextMaxDate.hour() + 1; hour < 24; hour++) {
            hours.push(hour);
          }
        }
        return hours;
      };

      const disabledMinutes = (selectedHour: number) => {
        if (isCurrentMinDay && nextMinDate && selectedHour === nextMinDate.hour()) {
          return fullTimeArr.filter((minute) => minute < nextMinDate.minute());
        }
        if (isCurrentMaxDay && nextMaxDate && selectedHour === nextMaxDate.hour()) {
          return fullTimeArr.filter((minute) => minute > nextMaxDate.minute());
        }
        return [];
      };

      const disabledSeconds = (selectedHour: number, selectedMinute: number) => {
        if (
          isCurrentMinDay &&
          nextMinDate &&
          selectedHour === nextMinDate.hour() &&
          selectedMinute === nextMinDate.minute()
        ) {
          return fullTimeArr.filter((second) => second < nextMinDate.second());
        }
        if (
          isCurrentMaxDay &&
          nextMaxDate &&
          selectedHour === nextMaxDate.hour() &&
          selectedMinute === nextMaxDate.minute()
        ) {
          return fullTimeArr.filter((second) => second > nextMaxDate.second());
        }
        return [];
      };

      return {
        disabledHours,
        disabledMinutes,
        disabledSeconds,
      };
    };

    setDisabledDate(() => nextDisabledDate);
    setDisabledTime(() => nextDisabledTime);
  };

  return {
    minDate,
    maxDate,
    disabledDate,
    disabledTime,
  };
}
