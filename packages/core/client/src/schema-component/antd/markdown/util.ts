import { marked } from 'marked';

export function markdown(text) {
  if (!text) {
    return '';
  }
  return marked.parse(text);
}
export function convertToText(markdownText: string) {
  const content = markdown(markdownText);
  let temp = document.createElement('div');
  temp.innerHTML = content;
  const text = temp.innerText;
  temp = null;
  return text.replace(/[\n\r]/g, '');
}
