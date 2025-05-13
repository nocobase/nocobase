/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { EventBus } from './event-bus';

export const EventFlowEventBusContext = createContext<{
  eventFlowEventBus: EventBus;
}>(null);

export const useEventFlowEventBus = () => {
  const context = useContext(EventFlowEventBusContext);
  if (!context) {
    throw new Error('useEventFlowEventBus must be used within a EventFlowEventBusProvider');
  }
  return context.eventFlowEventBus;
};

export const EventFlowEventBusProvider: React.FC<{
  children?: React.ReactNode;
  eventFlowEventBus: EventBus;
}> = (props) => {
  return (
    <EventFlowEventBusContext.Provider
      value={{
        eventFlowEventBus: props.eventFlowEventBus,
      }}
    >
      {props.children}
    </EventFlowEventBusContext.Provider>
  );
}; 