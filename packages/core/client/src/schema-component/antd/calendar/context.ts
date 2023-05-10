import { createContext, useContext } from 'react';
import type { ToolbarProps } from './types';

export const CalendarToolbarContext = createContext<ToolbarProps>(null);
export const CalendarContext = createContext(null);
export const DeleteEventContext = createContext(null);

export const useDeleteEvent = () => {
  return useContext(DeleteEventContext);
};
