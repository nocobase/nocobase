import { useEffect, useState } from 'react';
import './highlight-theme/default.less';
import './highlight-theme/table.less';

export async function parseMarkdown(text: string) {
  const m = await import('./md');
  return m.default.render(text);
}

export function useParseMarkdown(text: string) {
  const [html, setHtml] = useState<any>('');
  useEffect(() => {
    parseMarkdown(text).then((r) => {
      setHtml(r);
    });
  }, [text]);
  return html;
}

export function convertToText(markdownText: string) {
  const content = markdownText;
  let temp = document.createElement('div');
  temp.innerHTML = content;
  const text = temp.innerText;
  temp = null;
  return text.replace(/[\n\r]/g, '');
}
