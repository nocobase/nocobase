/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { getLunarDay } from '../utils';

const Header = ({ date, label, drilldownView, onDrillDown, showLunar = false, type, localizer, locale }) => {
  const lunarElement = useMemo(() => {
    if (!showLunar) {
      return;
    }
    return <span className="rbc-date-lunar">{getLunarDay(date)}</span>;
  }, [date, showLunar]);

  const child = useMemo(() => {
    if (type === 'week') {
      const dayLabel = localizer.format(date, 'd eee', locale);

      return (
        <>
          <span className="rbc-date-solar" style={{ fontSize: 14 }}>
            {dayLabel}
          </span>
          {lunarElement}
        </>
      );
    } else {
      return (
        <>
          <span className="rbc-date-solar">{label}</span>
          {lunarElement}
        </>
      );
    }
  }, [type]);

  const Wrapper = drilldownView ? 'a' : React.Fragment;

  return (
    <Wrapper onClick={onDrillDown} role="cell">
      {child}
    </Wrapper>
  );
};

export default Header;
