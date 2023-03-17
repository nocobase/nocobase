import MarkdownIt from 'markdown-it';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import mermaidPlugin from './markdown-it-plugins/mermaidPlugin';

import './highlight-theme/default.less';
import './highlight-theme/table.less';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});
md.use(markdownItHighlightjs);
md.use(mermaidPlugin);

export function markdown(text) {
  if (!text) {
    return '';
  }
  return md.render(text);
}
export function convertToText(markdownText: string) {
  const content = markdown(markdownText);
  let temp = document.createElement('div');
  temp.innerHTML = content;
  const text = temp.innerText;
  temp = null;
  return text.replace(/[\n\r]/g, '');
}
