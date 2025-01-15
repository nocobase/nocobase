/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useApp, usePlugin, useSchemaSettings } from '@nocobase/client';
import React from 'react';
import { ISchema, useField } from '@formily/react';
import EventsSetting from '../components/EventsSetting';
import { EventFlowPlugin } from '..';

export const useEventFlow = () => {
  const fieldSchema = useFieldSchema();
  const eventFlowPlugin = usePlugin(EventFlowPlugin.name) as any;
  console.log('eventFlowPlugin', eventFlowPlugin, fieldSchema);
  eventFlowPlugin.registerEvents(fieldSchema?.['x-event-flow-setting'] || []);
};
