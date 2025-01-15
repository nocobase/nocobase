/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EventDefinition, EventSetting } from '../types';
import { useFieldSchema } from '@formily/react';
import { useApp, usePlugin, useSchemaSettings } from '@nocobase/client';
import React from 'react';
import { ISchema, useField } from '@formily/react';
import { EventFlowPlugin } from '..';

export const useEvent = () => {
  const eventFlowPlugin = usePlugin(EventFlowPlugin.name) as any;
  return {
    // 定义事件
    define: (events: EventDefinition[]) => {
      eventFlowPlugin.registerEvents(events);
    },
    // 注册事件
    register: (events: EventSetting[]) => {
      eventFlowPlugin.registerEvents(events);
    },
    // 触发事件
    emit: (event: EventDefinition) => {
      eventFlowPlugin.emit(event);
    },
  };
};
