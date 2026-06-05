/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import MarkdownIt from 'markdown-it';
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

export default md;
