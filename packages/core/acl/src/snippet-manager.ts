/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import minimatch from 'minimatch';

export type SnippetOptions = {
  name: string;
  actions: Array<string>;
};

class Snippet {
  constructor(
    public name: string,
    public actions: Array<string>,
  ) {}
}

export type SnippetGroup = {
  name: string;
  snippets: SnippetOptions[];
};

class SnippetManager {
  public snippets: Map<string, Snippet> = new Map();

  register(snippet: SnippetOptions) {
    snippet.name = snippet.name.replace('.*', '');

    // throw error if name include * or end with dot
    if (snippet.name.includes('*') || snippet.name.endsWith('.')) {
      throw new Error(`Invalid snippet name: ${snippet.name}, name should not include * or end with dot.`);
    }

    this.snippets.set(snippet.name, snippet);
  }

  allow(actionPath: string, snippetName: string) {
    const negated = snippetName.startsWith('!');
    snippetName = negated ? snippetName.slice(1) : snippetName;

    const snippet = this.snippets.get(snippetName);

    if (!snippet) {
      return null;
    }

    const matched = snippet.actions.some((action) => minimatch(actionPath, action));

    if (matched) {
      return negated ? false : true;
    }

    return null;
  }
}

export default SnippetManager;
