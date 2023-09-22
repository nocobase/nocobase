import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import mermaidPlugin from './markdown-it-plugins/mermaidPlugin';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

md.use(markdownItHighlightjs);
md.use(mermaidPlugin);
md.use(markdownItAnchor, {
  // permalink: markdownItAnchor.permalink.headerLink(),
});
export default md;
