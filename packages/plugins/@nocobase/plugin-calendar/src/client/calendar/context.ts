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
