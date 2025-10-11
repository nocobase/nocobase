/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import completions from './completions';
import { isHtmlTemplateContext } from './htmlCompletion';

export const javascriptCompletionSource = (context: CompletionContext): CompletionResult | null => {
  if (isHtmlTemplateContext(context)) {
    return null;
  }

  const word = context.matchBefore(/[a-zA-Z_][\w.]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const from = word.from;
  const to = word.to;

  return {
    from,
    to,
    options: completions,
  };
};

export const createJavascriptCompletion = () => javascriptCompletionSource;
