/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';

// export const GanttToolbarContext = createContext<any>(null);
export const CalendarContext = createContext(null);
CalendarContext.displayName = 'CalendarContext';
export const DeleteEventContext = createContext(null);
DeleteEventContext.displayName = 'DeleteEventContext';
