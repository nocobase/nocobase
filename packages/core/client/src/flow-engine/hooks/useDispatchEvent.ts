import { useCallback } from 'react';
import { FlowModel } from '@nocobase/client';
import { UserContext } from '../types';

export function useDispatchEvent(
  eventName: string,
  model: FlowModel,
  context?: UserContext
) {
  const dispatch = useCallback(() => {
    model.dispatchEvent(eventName, context);
  }, [model, eventName, context]);
  
  return { dispatch };
} 