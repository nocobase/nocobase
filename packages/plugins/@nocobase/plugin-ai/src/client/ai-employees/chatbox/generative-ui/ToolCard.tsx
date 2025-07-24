/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DefaultToolCard } from './DefaultToolCard';
import { usePlugin } from '@nocobase/client';
import { PluginAIClient } from '../../../';
import { ToolCall } from '../../types';

export const ToolCard: React.FC<{
  messageId: string;
  tools: ToolCall<unknown>[];
}> = ({ tools, messageId }) => {
  const plugin = usePlugin('ai') as PluginAIClient;
  if (tools.length > 1) {
    return <DefaultToolCard tools={tools} messageId={messageId} />;
  }
  const tool = tools[0];
  const toolOption = plugin.aiManager.tools.get(tool.name);
  const C = toolOption?.ui?.card;
  if (C) {
    return <C messageId={messageId} tool={tool} />;
  }
  return <DefaultToolCard tools={[tool]} messageId={messageId} />;
};
