/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

export function stripToolCallTags(content: string): string | null {
  if (typeof content !== 'string') {
    return content;
  }
  return content
    .replace(/<[|｜]tool▁(?:calls▁begin|calls▁end|call▁begin|call▁end|sep)[|｜]>/g, '')
    .replace(/function/, '');
}

export function parseResponseMessage(row: Model) {
  const { content: rawContent, messageId, metadata, role, toolCalls, attachments } = row;
  const content = {
    ...rawContent,
    content: stripToolCallTags(rawContent.content),
    messageId,
    metadata,
    attachments,
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

export async function encodeLocalFile(url: string) {
  url = path.join(process.cwd(), url);
  const data = await fs.promises.readFile(url);
  return Buffer.from(data).toString('base64');
}

export async function encodeFile(url: string) {
  if (!url.startsWith('http')) {
    return encodeLocalFile(url);
  }
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data).toString('base64');
}
