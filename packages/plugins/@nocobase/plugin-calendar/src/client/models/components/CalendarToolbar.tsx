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
import { i18nt, useTranslation } from '../../../locale';
import { getLunarDay } from '../../calendar/utils';

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
  month: i18nt('Month'),
  week: i18nt('Week'),
  day: i18nt('Day'),
};

export const CalendarToolbar = ({ date, label, onNavigate, onView, view, views, showLunar }: CalendarToolbarProps) => {
  const { t } = useTranslation();
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
        {lunarLabel ? <span style={{ marginLeft: 8 }}>{lunarLabel}</span> : null}
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
