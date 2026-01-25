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
import { jsonrepair } from 'jsonrepair';

export const ToolCard: React.FC<{
  messageId: string;
  tools: ToolCall<unknown>[];
}> = ({ tools, messageId }) => {
  const plugin = usePlugin('ai') as PluginAIClient;
  const toolsWithUI = [];
  const toolsWithoutUI = [];
  for (const t of tools) {
    const tool = { ...t };
    if (typeof tool.args === 'string') {
      const trimmed = tool.args.trim();
      if (trimmed.length > 0) {
        try {
          const repaired = jsonrepair(trimmed);
          tool.args = JSON.parse(repaired);
        } catch (err) {
          console.error(err, tool.args);
          tool.args = {};
        }
      } else {
        tool.args = {};
      }
    }
    const toolOption = plugin.aiManager.tools.get(tool.name);
    const C = toolOption?.ui?.card;
    if (C) {
      toolsWithUI.push({ tool, C });
    } else {
      toolsWithoutUI.push(tool);
    }
  }
  return (
    <>
      {toolsWithoutUI.length > 0 ? <DefaultToolCard tools={toolsWithoutUI} messageId={messageId} /> : null}
      {toolsWithUI.map(({ tool, C }, index) => (
        <C key={index} messageId={messageId} tool={tool} />
      ))}
    </>
  );
};
