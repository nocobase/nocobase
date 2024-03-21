import { createContext, useContext } from 'react';

// export const GanttToolbarContext = createContext<any>(null);
export const CalendarContext = createContext(null);
CalendarContext.displayName = 'CalendarContext';
export const DeleteEventContext = createContext(null);
DeleteEventContext.displayName = 'DeleteEventContext';
