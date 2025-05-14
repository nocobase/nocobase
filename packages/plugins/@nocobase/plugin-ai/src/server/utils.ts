/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';

export function stripToolCallTags(content: string): string | null {
  if (typeof content !== 'string') {
    return content;
  }
  return content
    .replace(/<[|｜]tool▁(?:calls▁begin|calls▁end|call▁begin|call▁end|sep)[|｜]>/g, '')
    .replace(/function/, '');
}

export function parseResponseMessage(row: Model) {
  const { content: rawContent, messageId, metadata, role, toolCalls } = row;
  const content = {
    ...rawContent,
    content: stripToolCallTags(rawContent.content),
    messageId: messageId,
    metadata: metadata,
  };
  if (toolCalls) {
    content.tool_calls = toolCalls;
  }
  return {
    key: messageId,
    content,
    role,
  };
}
