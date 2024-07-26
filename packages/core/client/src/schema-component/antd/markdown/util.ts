/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useState } from 'react';
import Handlebars from 'handlebars';
import { replaceVariableValue } from '../../../block-provider/hooks';

export async function parseMarkdown(text: string) {
  if (!text) {
    return text;
  }
  const m = await import('./md');
  return m.default.render(text);
}

export function useParseMarkdown(text: string) {
  const [html, setHtml] = useState<any>('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    parseMarkdown(text)
      .then((r) => {
        setHtml(r);
        setLoading(false);
      })
      .catch((error) => console.log(error));
  }, [text]);
  return { html, loading };
}

export function convertToText(markdownText: string) {
  const content = markdownText;
  let temp = document.createElement('div');
  temp.innerHTML = content;
  const text = temp.innerText;
  temp = null;
  return text?.replace(/[\n\r]/g, '') || '';
}

Handlebars.registerHelper('eq', function (arg1, arg2) {
  return arg1 == arg2;
});
Handlebars.registerHelper('toUpperCase', function (str) {
  return str.toUpperCase();
});

const getVariablesData = (localVariables) => {
  const data = {};
  localVariables.map((v) => {
    data[v.name] = v.ctx;
  });
  return data;
};

export async function getRenderContent(templateEngine, content, variables, localVariables) {
  if (templateEngine === 'handlebars') {
    const renderedContent = Handlebars.compile(content);
    // 处理渲染后的内容
    try {
      const data = getVariablesData(localVariables);
      return renderedContent({ ...variables.ctxRef.current, ...data });
    } catch (error) {
      console.log(error);
      return content;
    }
  } else {
    try {
      const html = await replaceVariableValue(content, variables, localVariables);
      return await parseMarkdown(html);
    } catch (error) {
      return content;
    }
  }
}
