import { marked } from 'marked';

export function markdown(text) {
  if (!text) {
    return '';
  }
  return marked.parse(text);
}
