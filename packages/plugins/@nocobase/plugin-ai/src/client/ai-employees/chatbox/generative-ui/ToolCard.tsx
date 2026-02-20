/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { ComponentType, useEffect } from 'react';
import { DefaultToolCard } from './DefaultToolCard';
import { ToolsUIProperties, toToolsMap, useTools } from '@nocobase/client';
import { ToolCall } from '../../types';
import { jsonrepair } from 'jsonrepair';
import { useToolCallActions } from '../hooks/useToolCallActions';

export const ToolCard: React.FC<{
  messageId: string;
  toolCalls: ToolCall[];
  inlineActions?: React.ReactNode;
}> = ({ toolCalls, messageId, inlineActions }) => {
  const { tools, loading } = useTools();
  const toolsMap = toToolsMap(tools);
  const { getDecisionActions } = useToolCallActions({ messageId });
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
        tools: toolEntry,
        toolCall,
        decisions: getDecisionActions(toolCall),
      });
    } else {
      toolsWithoutUI.push(toolCall);
    }
  }

  useEffect(() => {
    if (!messageId) {
      return;
    }
    if (!toolCalls?.length) {
      return;
    }
    const task = async () => {
      for (const toolCall of toolCalls) {
        if (toolCall.invokeStatus === 'interrupted' && toolCall.auto === true) {
          const decision = getDecisionActions(toolCall);
          await decision.approve();
        }
      }
    };
    task();
  }, [messageId, toolCalls]);

  return (
    <>
      {loading ? (
        <></>
      ) : (
        <>
          {toolsWithoutUI.length > 0 ? (
            <DefaultToolCard
              messageId={messageId}
              tools={tools}
              toolCalls={toolsWithoutUI}
              inlineActions={toolsWithoutUI.length === 1 && toolsWithUI.length === 0 ? inlineActions : null}
            />
          ) : null}
          {toolsWithUI.map(({ C, messageId, tools, toolCall, decisions }, index) => (
            <C key={index} messageId={messageId} tools={tools} toolCall={toolCall} decisions={decisions} />
          ))}
        </>
      )}
    </>
  );
};
