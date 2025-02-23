/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { Application } from '../Application';
import { ApplicationContext } from '../context';
import { EventFlow } from '../eventflow';

export const useApp = () => {
  return useContext(ApplicationContext) || ({} as Application);
};

export const useEventFlowManager = () => {
  const app = useApp();
  return app.eventFlowManager;
};

export const useFlowEventsByGroup = () => {
  const eventFlowManager = useEventFlowManager();
  return useMemo(() => eventFlowManager.getEventsByGroup(), [eventFlowManager]);
};

export const useFlowActionsByGroup = () => {
  const eventFlowManager = useEventFlowManager();
  return useMemo(() => eventFlowManager.getActionsByGroup(), [eventFlowManager]);
};

export const useEventFlowList = () => {
  const app = useApp();
  return Object.values(app.eventFlowManager.getFlows()).filter(Boolean);
};

export const useEventFlowByRouteKey = () => {
  const { key } = useParams();
  const eventFlowManager = useEventFlowManager();
  return useMemo(() => {
    if (key === 'new') {
      const flow = new EventFlow({ key: uid() });
      flow.isNew = true;
      flow.setEventFlowManager(eventFlowManager);
      return flow;
    }
    return eventFlowManager.getFlow(key);
  }, [eventFlowManager, key]);
};

export const useEventFlowOptionsByRouteKey = () => {
  const { key } = useParams();
  const eventFlowManager = useEventFlowManager();
  return eventFlowManager.getFlow(key).getOptions();
};
