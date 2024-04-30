/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';
import type { ToolbarProps } from './types';

export const CalendarToolbarContext = createContext<ToolbarProps>(null);
CalendarToolbarContext.displayName = 'CalendarToolbarContext';
export const CalendarContext = createContext(null);
CalendarContext.displayName = 'CalendarContext';
export const DeleteEventContext = createContext(null);
DeleteEventContext.displayName = 'DeleteEventContext';

export const useDeleteEvent = () => {
  return useContext(DeleteEventContext);
};
