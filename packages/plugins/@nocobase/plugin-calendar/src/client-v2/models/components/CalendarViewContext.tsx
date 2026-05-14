/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import type { View } from 'react-big-calendar';

export type CalendarNavigationAction = 'TODAY' | 'PREV' | 'NEXT';

export type CalendarViewContextValue = {
  date: Date;
  label: string;
  navigate: (action: CalendarNavigationAction) => void;
  showLunar?: boolean;
  view: View;
  views: View[];
  setView: (view: View) => void;
};

const CalendarViewContext = createContext<CalendarViewContextValue | null>(null);
CalendarViewContext.displayName = 'CalendarViewContext';

export const CalendarViewProvider = CalendarViewContext.Provider;

export const useCalendarViewContext = () => {
  return useContext(CalendarViewContext);
};
