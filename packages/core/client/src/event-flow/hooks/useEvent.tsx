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
import { getPageSchema, useApp, useLocalVariables, usePlugin, useVariables, useSchemaSettings } from '@nocobase/client';
import React, { useContext } from 'react';
import { ISchema, useField } from '@formily/react';
import { EventFlowPlugin } from '..';
import { useMemoizedFn } from 'ahooks';
import { eventContext } from '../EventSettingItem/components/EventProvider';

export const useEvent = () => {
  const fieldSchema = useFieldSchema();
  const context = useContext(eventContext);
  const pageUid = context.pageUid || getPageSchema(fieldSchema)?.['x-uid'];
  const blockUid = fieldSchema?.['x-uid'];
  const eventFlowPlugin: EventFlowPlugin = usePlugin(EventFlowPlugin.name) as any;
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: null });

  const define = useMemoizedFn((definition: EventDefinition[] | EventDefinition) => {
    if (!definition) {
      return;
    }
    const definitions = Array.isArray(definition) ? definition : [definition];
    definitions.forEach((item) => {
      item.pageUid = pageUid;
      item.blockUid = blockUid;
    });
    eventFlowPlugin?.define(definitions);
  });

  const register = useMemoizedFn((events: EventSetting[]) => {
    eventFlowPlugin?.register(events);
  });

  const emit = useMemoizedFn(async (p: { event: EventSetting['event']; params?: any }) => {
    await eventFlowPlugin?.emit({
      event: {
        ...p.event,
        pageUid,
        blockUid,
      },
      params: p.params,
      variables,
      localVariables,
    });
  });

  console.log('event pageUid', pageUid);

  return {
    definitions: eventFlowPlugin?.definitions.filter((item) => item.pageUid === pageUid || !item.pageUid),
    // 定义事件
    define,
    // 移除事件
    // removeDefinition: eventFlowPlugin?.removeDefinition,
    // 运行时事件注册
    register,
    // 触发事件
    emit,
  };
};
