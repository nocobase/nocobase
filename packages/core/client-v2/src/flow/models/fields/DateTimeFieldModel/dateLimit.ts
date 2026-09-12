/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { autorun } from '@formily/reactive';
import { Form, type FormInstance } from 'antd';
import { resolveRunJSObjectValues, useFlowContext } from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import type { ConfigType, Dayjs } from 'dayjs';
import { first, last } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

type DateLimitProps = {
  _minDate?: unknown;
  _maxDate?: unknown;
  currentForm?: unknown;
};

type DisabledTimeConfig = {
  disabledHours: () => number[];
  disabledMinutes: (selectedHour: number) => number[];
  disabledSeconds: (selectedHour: number, selectedMinute: number) => number[];
};

type DisabledDate = (current: Dayjs) => boolean;
type DisabledTime = (current: Dayjs | null) => DisabledTimeConfig;

function isAntdFormInstance(value: unknown): value is FormInstance {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as Partial<FormInstance>).getFieldsValue === 'function';
}

function parseDateLimitValue(value: unknown): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value as ConfigType);
  return parsed.isValid() ? parsed : null;
}

export function useDateLimit(props: DateLimitProps) {
  const ctx = useFlowContext();
  const currentForm = isAntdFormInstance(props.currentForm) ? props.currentForm : undefined;
  const currentFormValues = Form.useWatch([], currentForm);
  const [minDate, setMinDate] = useState<Dayjs | null>(null);
  const [maxDate, setMaxDate] = useState<Dayjs | null>(null);
  const [disabledDate, setDisabledDate] = useState<DisabledDate | null>(null);
  const [disabledTime, setDisabledTime] = useState<DisabledTime | null>(null);
  const evaluationIdRef = useRef(0);

  const limitDate = useCallback(async () => {
    const evaluationId = ++evaluationIdRef.current;

    try {
      const runJSResolvedParams = await resolveRunJSObjectValues(ctx, {
        _minDate: props._minDate,
        _maxDate: props._maxDate,
      });
      const resolvedParams = (await ctx.resolveJsonTemplate({
        _minDate: runJSResolvedParams._minDate,
        _maxDate: runJSResolvedParams._maxDate,
      })) as { _minDate?: unknown; _maxDate?: unknown };

      if (evaluationId !== evaluationIdRef.current) return;

      const nextMinRaw = Array.isArray(resolvedParams?._minDate)
        ? first(resolvedParams._minDate)
        : resolvedParams?._minDate;
      const nextMaxRaw = Array.isArray(resolvedParams?._maxDate)
        ? last(resolvedParams._maxDate)
        : resolvedParams?._maxDate;
      const nextMinDate = parseDateLimitValue(nextMinRaw);
      const nextMaxDate = parseDateLimitValue(nextMaxRaw);

      setMinDate(nextMinDate);
      setMaxDate(nextMaxDate);

      const fullTimeArr = Array.from({ length: 60 }, (_, i) => i);

      const nextDisabledDate: DisabledDate = (current) => {
        if (!dayjs.isDayjs(current)) return false;

        const min = nextMinDate?.startOf('day') || null;
        const max = nextMaxDate?.endOf('day') || null;

        if (min && current.startOf('day').isBefore(min)) {
          return true;
        }
        if (max && current.startOf('day').isAfter(max)) {
          return true;
        }
        return false;
      };

      const nextDisabledTime: DisabledTime = (current) => {
        if (!current || (!nextMinDate && !nextMaxDate)) {
          return { disabledHours: () => [], disabledMinutes: () => [], disabledSeconds: () => [] };
        }

        const isCurrentMinDay = !!nextMinDate && current.isSame(nextMinDate, 'day');
        const isCurrentMaxDay = !!nextMaxDate && current.isSame(nextMaxDate, 'day');

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
    } catch (error) {
      if (evaluationId !== evaluationIdRef.current) return;

      ctx.logger?.warn?.({ err: error }, 'Failed to resolve date range limit');
      setMinDate(null);
      setMaxDate(null);
      setDisabledDate(null);
      setDisabledTime(null);
    }
  }, [ctx, props._maxDate, props._minDate]);

  useEffect(() => {
    const dispose = autorun(() => {
      limitDate();
    });

    return () => {
      evaluationIdRef.current += 1;
      dispose();
    };
  }, [currentFormValues, limitDate]);

  return {
    minDate,
    maxDate,
    disabledDate,
    disabledTime,
  };
}
