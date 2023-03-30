import MarkdownIt from 'markdown-it';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import mermaidPlugin from './markdown-it-plugins/mermaidPlugin';
import './highlight-theme/default.less';
import './highlight-theme/table.less';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

md.use(markdownItHighlightjs);
md.use(mermaidPlugin);

export default md;
