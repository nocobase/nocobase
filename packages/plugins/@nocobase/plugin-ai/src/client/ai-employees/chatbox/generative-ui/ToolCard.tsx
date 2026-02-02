/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { ComponentType } from 'react';
import { DefaultToolCard } from './DefaultToolCard';
import { ToolsUIProperties, toToolsMap, useTools } from '@nocobase/client';
import { ToolCall } from '../../types';
import { jsonrepair } from 'jsonrepair';
import { useToolCallActions } from '../hooks/useToolCallActions';

export const ToolCard: React.FC<{
  messageId: string;
  toolCalls: ToolCall[];
}> = ({ toolCalls, messageId }) => {
  const { tools, loading } = useTools();
  const toolsMap = toToolsMap(tools);
  const { getDecisionActions } = useToolCallActions({ messageId, tools });
  const toolsWithUI: ({ C: ComponentType<ToolsUIProperties> } & ToolsUIProperties)[] = [];
  const toolsWithoutUI: ToolCall[] = [];
  for (const t of toolCalls) {
    const toolCall = { ...t };
    if (typeof toolCall.args === 'string') {
      const trimmed = toolCall.args.trim();
      if (trimmed.length > 0) {
        try {
          const repaired = jsonrepair(trimmed);
          toolCall.args = JSON.parse(repaired);
        } catch (err) {
          console.error(err, toolCall.args);
          toolCall.args = {};
        }
      } else {
        toolCall.args = {};
      }
    }
    const toolEntry = toolsMap.get(toolCall.name);
    const C = toolEntry?.ui?.card;
    if (C) {
      toolsWithUI.push({
        C,
        messageId,
        tools: toolsMap.get(toolCall.name),
        toolCall,
        decisions: getDecisionActions(toolCall),
      });
    } else {
      toolsWithoutUI.push(toolCall);
    }
  }

  return (
    <>
      {loading ? (
        <></>
      ) : (
        <>
          {toolsWithoutUI.length > 0 ? (
            <DefaultToolCard messageId={messageId} tools={tools} toolCalls={toolsWithoutUI} />
          ) : null}
          {toolsWithUI.map(({ C, messageId, tools, toolCall, decisions }, index) => (
            <C key={index} messageId={messageId} tools={tools} toolCall={toolCall} decisions={decisions} />
          ))}
        </>
      )}
    </>
  );
};
