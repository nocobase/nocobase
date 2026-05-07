/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { getLunarDay } from '../../calendar/utils';

type CalendarHeaderProps = {
  date: Date;
  label: string;
  drilldownView?: string;
  onDrillDown?: () => void;
  showLunar?: boolean;
  type?: 'week' | 'month';
  localizer?: any;
  locale?: string;
};

export const CalendarHeader = ({
  date,
  label,
  drilldownView,
  onDrillDown,
  showLunar = false,
  type,
  localizer,
  locale,
}: CalendarHeaderProps) => {
  const lunarElement = useMemo(() => {
    if (!showLunar) {
      return null;
    }
    return <span className="rbc-date-lunar">{getLunarDay(dayjs(date))}</span>;
  }, [date, showLunar]);

  const child = useMemo(() => {
    if (type === 'week') {
      const dayLabel = localizer?.format?.(date, 'd eee', locale) || label;

      return (
        <>
          <span className="rbc-date-solar" style={{ fontSize: 14 }}>
            {dayLabel}
          </span>
          {lunarElement}
        </>
      );
    }

    return (
      <>
        <span className="rbc-date-solar">{label}</span>
        {lunarElement}
      </>
    );
  }, [date, label, locale, localizer, lunarElement, type]);

  const Wrapper = drilldownView ? 'a' : React.Fragment;

  return (
    <Wrapper onClick={onDrillDown} role="cell">
      {child}
    </Wrapper>
  );
};
