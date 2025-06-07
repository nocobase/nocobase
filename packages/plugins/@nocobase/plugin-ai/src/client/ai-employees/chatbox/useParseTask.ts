/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useLocalVariables, useVariables } from '@nocobase/client';

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

export const useParseTask = () => {
  const variables = useVariables();
  const localVariables = useLocalVariables();

  const parseTask = async (task: {
    message: {
      user?: string;
      system?: string;
      attachments?: any[];
    };
  }) => {
    let userMessage: any;
    const { message } = task;
    if (message?.user) {
      const content = await replaceVariables(message.user, variables, localVariables);
      userMessage = {
        type: 'text',
        content,
      };
    }
    let systemMessage: string;
    if (message?.system) {
      systemMessage = await replaceVariables(message.system, variables, localVariables);
    }
    const attachments = [];
    if (message?.attachments?.length) {
      for (const attachment of message.attachments) {
        const obj = await variables?.parseVariable(attachment, localVariables).then(({ value }) => value);
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
    return { userMessage, systemMessage, attachments };
  };

  return { parseTask };
};
