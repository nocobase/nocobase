/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { EventFlowManager } from './eventflow-manager';

export const EventFlowManagerContext = createContext<{
  eventFlowManager: EventFlowManager;
}>(null);

export const useEventFlowManager = () => {
  const context = useContext(EventFlowManagerContext);
  if (!context) {
    throw new Error('useEventFlowManager must be used within a EventFlowManagerProvider');
  }
  return context.eventFlowManager;
};

export const EventFlowManagerProvider: React.FC<{
  children?: React.ReactNode;
  eventFlowManager: EventFlowManager;
}> = (props) => {
  return (
    <EventFlowManagerContext.Provider
      value={{
        eventFlowManager: props.eventFlowManager,
      }}
    >
      {props.children}
    </EventFlowManagerContext.Provider>
  );
}; 

EventFlowManagerProvider.displayName = 'EventFlowManagerProvider';
