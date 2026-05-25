/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { getLunarDay } from '../../../shared/calendar';
import { tExpr, useT } from '../../locale';

type CalendarToolbarProps = {
  date: Date;
  label: string;
  onNavigate: (action: string) => void;
  onView: (view: string) => void;
  view: string;
  views: string[];
  showLunar?: boolean;
};

const VIEW_LABELS = {
  month: tExpr('Month'),
  week: tExpr('Week'),
  day: tExpr('Day'),
};

export const CalendarToolbar = ({ date, label, onNavigate, onView, view, views, showLunar }: CalendarToolbarProps) => {
  const t = useT();
  const lunarLabel = useMemo(() => {
    if (!showLunar || view !== 'day') {
      return null;
    }

    return getLunarDay(dayjs(date));
  }, [date, showLunar, view]);

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" className="rbc-btn" onClick={() => onNavigate('TODAY')}>
          {t('Today')}
        </button>
      </span>
      <span className="rbc-btn-group">
        <button type="button" className="rbc-btn" onClick={() => onNavigate('PREV')}>
          <LeftOutlined />
        </button>
        <button type="button" className="rbc-btn" onClick={() => onNavigate('NEXT')}>
          <RightOutlined />
        </button>
      </span>
      <span className="rbc-toolbar-label">
        {label}
        {lunarLabel ? <span className="rbc-toolbar-lunar">{lunarLabel}</span> : null}
      </span>
      <span className="rbc-btn-group">
        {views.map((name) => (
          <button
            key={name}
            type="button"
            className={`rbc-btn${name === view ? ' rbc-active' : ''}`}
            onClick={() => onView(name)}
          >
            {VIEW_LABELS[name] || name}
          </button>
        ))}
      </span>
    </div>
  );
};
