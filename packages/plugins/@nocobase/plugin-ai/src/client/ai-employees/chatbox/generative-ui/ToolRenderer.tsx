/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ToolCard } from './ToolCard';
import { usePlugin } from '@nocobase/client';
import { PluginAIClient } from '../../../';

export const ToolRenderer: React.FC<{
  messageId: string;
  tools: {
    name: string;
    args: any;
  }[];
  autoCallTools?: string[];
}> = ({ tools, messageId, autoCallTools }) => {
  const plugin = usePlugin('ai') as PluginAIClient;
  if (tools.length > 1) {
    return <ToolCard tools={tools} messageId={messageId} autoCallTools={autoCallTools} />;
  }
  const tool = tools[0];
  const toolOption = plugin.aiManager.tools.get(tool.name);
  if (toolOption?.Component) {
    const C = toolOption.Component;
    return <C tool={tool} />;
  }
  return <ToolCard tools={[tool]} messageId={messageId} autoCallTools={autoCallTools} />;
};
