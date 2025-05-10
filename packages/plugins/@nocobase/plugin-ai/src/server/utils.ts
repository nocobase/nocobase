/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';

export function parseResponseMessage(row: Model) {
  const { content: rawContent, messageId, metadata, role, toolCalls } = row;
  const autoCallTool = metadata?.autoCallTool;
  const content = {
    ...rawContent,
    messageId: messageId,
    metadata: metadata,
  };
  if (!autoCallTool && toolCalls) {
    content.tool_calls = toolCalls;
  }
  if (autoCallTool) {
    const hasText = content.content;
    if (!hasText && toolCalls?.length) {
      content.content = 'I’m trying to use my skills to complete the task...';
    }
  }
  return {
    key: messageId,
    content,
    role,
  };
}
