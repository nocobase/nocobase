import { useEffect, useState } from 'react';

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
    parseMarkdown(text).then((r) => {
      setHtml(r);
      setLoading(false);
    });
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
