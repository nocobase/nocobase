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
  const fieldSchema = useFieldSchema();
  const uid = fieldSchema?.['x-uid'];
  const eventFlowPlugin: EventFlowPlugin = usePlugin(EventFlowPlugin.name) as any;
  return {
    definitions: eventFlowPlugin.definitions,
    // 定义事件
    define: (definition: EventDefinition[] | EventDefinition) => {
      if (Array.isArray(definition)) {
        definition.forEach((item) => {
          item.uid = uid;
        });
      } else if (definition) {
        definition.uid = uid;
      }
      eventFlowPlugin.define(definition);
    },
    // 运行时事件注册
    register: (events: EventSetting[]) => {
      eventFlowPlugin.register(events);
    },
    // 触发事件
    emit: (definitionName: string, eventName: string, params: any) => {
      eventFlowPlugin.emit(definitionName, eventName, params);
    },
  };
};
