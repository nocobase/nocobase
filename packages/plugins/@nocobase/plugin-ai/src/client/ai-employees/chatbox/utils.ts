/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, useLocalVariables, useVariables } from '@nocobase/client';
import { ContextItem, TaskMessage } from '../types';
import PluginAIClient from '../..';

async function replaceVariables(template, variables, localVariables = {}) {
  const regex = /\{\{\s*(.*?)\s*\}\}/g;
  let result = template;

  const matches = [...template.matchAll(regex)];

  if (matches.length === 0) {
    return template;
  }

  for (const match of matches) {
    const fullMatch = match[0];

    if (fullMatch.includes('$UISchema')) {
      continue;
    }

    try {
      let value = await variables?.parseVariable(fullMatch, localVariables).then(({ value }) => value);

      if (typeof value !== 'string') {
        try {
          value = JSON.stringify(value);
        } catch (error) {
          console.error(error);
        }
      }

      if (value) {
        if (value === 'null' || value === 'undefined') {
          value = '';
        }
        result = result.replace(fullMatch, value);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return result;
}

export const parseTask = async (task: { message: TaskMessage }) => {
  let userMessage: any;
  const { message } = task;
  if (message?.user) {
    userMessage = {
      type: 'text',
      content: message.user,
    };
  }
  let systemMessage: string;
  if (message?.system) {
    systemMessage = message.system;
  }
  const attachments = [];
  if (message?.attachments?.length) {
    for (const attachment of message.attachments) {
      const obj = attachment;
      if (!obj) {
        continue;
      }
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (item.filename) {
            attachments.push(item);
          }
        }
      } else {
        if (obj.filename) {
          attachments.push(obj);
        }
      }
    }
  }
  return { userMessage, systemMessage, attachments, workContext: message.workContext };
};

export const parseWorkContext = async (app: Application, workContext: ContextItem[]) => {
  const parsed = [];
  const plugin = app.pm.get('ai') as PluginAIClient;
  for (const context of workContext) {
    if (context.content) {
      parsed.push(context);
      continue;
    }
    const contextOptions = plugin.aiManager.getWorkContext(context.type);
    if (!(contextOptions && contextOptions.getContent)) {
      parsed.push(context);
      continue;
    }
    const content = await contextOptions.getContent(app, context);
    parsed.push({
      ...context,
      content,
    });
  }
  return parsed;
};

const publicPath = window['__nocobase_dev_public_path__'] || window['__nocobase_public_path__'] || '/';
const PLACEHOLDER_MAP = [
  { ext: /\.docx?$/i, icon: 'docx-200-200.png' },
  { ext: /\.pptx?$/i, icon: 'pptx-200-200.png' },
  { ext: /\.jpe?g$/i, icon: 'jpeg-200-200.png' },
  { ext: /\.pdf$/i, icon: 'pdf-200-200.png' },
  { ext: /\.png$/i, icon: 'png-200-200.png' },
  { ext: /\.eps$/i, icon: 'eps-200-200.png' },
  { ext: /\.ai$/i, icon: 'ai-200-200.png' },
  { ext: /\.gif$/i, icon: 'gif-200-200.png' },
  { ext: /\.svg$/i, icon: 'svg-200-200.png' },
  { ext: /\.xlsx?$/i, icon: 'xlsx-200-200.png' },
  { ext: /\.psd?$/i, icon: 'psd-200-200.png' },
  { ext: /\.(wav|aif|aiff|au|mp1|mp2|mp3|ra|rm|ram|mid|rmi)$/i, icon: 'audio-200-200.png' },
  { ext: /\.(avi|wmv|mpg|mpeg|vob|dat|3gp|mp4|mkv|rm|rmvb|mov|flv)$/i, icon: 'video-200-200.png' },
  { ext: /\.(zip|rar|arj|z|gz|iso|jar|ace|tar|uue|dmg|pkg|lzh|cab)$/i, icon: 'zip-200-200.png' },
];
export const UNKNOWN_FILE_ICON = publicPath + 'file-placeholder/unknown-200-200.png';

export function getFileIconByExt(fileName: string): string {
  for (const item of PLACEHOLDER_MAP) {
    if (item.ext.test(fileName)) {
      return publicPath + 'file-placeholder/' + item.icon;
    }
  }
  return UNKNOWN_FILE_ICON;
}
