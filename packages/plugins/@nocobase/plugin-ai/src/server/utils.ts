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
import { getDateVars, parse, parseFilter } from '@nocobase/utils';
import { Context } from '@nocobase/actions';

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

async function getUser(ctx: Context, fields: string[]) {
  const userFields = fields.filter((f) => f && ctx.db.getFieldByPath('users.' + f));
  if (!ctx.state.currentUser) {
    return;
  }
  if (!userFields.length) {
    return;
  }
  const user = await ctx.db.getRepository('users').findOne({
    filterByTk: ctx.state.currentUser.id,
    fields: userFields,
  });
  return user;
}

export async function parseVariables(ctx: Context, value: string) {
  const re = /\{\{\$user\.([^}]+)\}\}/g;
  const userFieldsSet = new Set<string>();
  const matches = value.matchAll(re);
  for (const match of matches) {
    const key = match[1].trim();
    userFieldsSet.add(key);
  }
  const $user = await getUser(ctx, [...userFieldsSet.values()]);
  const dateVariables = getDateVars();
  const $nDate = {};
  for (const [key, value] of Object.entries(dateVariables)) {
    if (typeof value === 'function') {
      $nDate[key] = value({
        timezone: ctx.get('x-timezone'),
        now: new Date().toISOString(),
      });
    } else {
      $nDate[key] = value;
    }
  }
  return parse(value)({
    $user,
    $nRole: ctx.state.currentRole === '__union__' ? ctx.state.currentRoles : ctx.state.currentRole,
    $nLang: ctx.getCurrentLocale(),
    $nDate,
  });
}
