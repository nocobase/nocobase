import { ACL } from './acl';
import minimatch from 'minimatch';

export type SnippetOptions = {
  name: string;
  actions: Array<string>;
};

class Snippet {
  constructor(public name: string, public actions: Array<string>) {}
}

export type SnippetGroup = {
  name: string;
  snippets: SnippetOptions[];
};

class SnippetManager {
  protected snippets: Map<string, Snippet> = new Map();

  register(snippet: SnippetOptions) {
    this.snippets.set(snippet.name, snippet);
  }

  allow(actionPath: string, snippetName: string) {
    const negated = snippetName.startsWith('!');
    snippetName = negated ? snippetName.slice(1) : snippetName;

    const snippet = this.snippets.get(snippetName);

    if (!snippet) {
      throw new Error(`Snippet ${snippetName} not found`);
    }

    const matched = snippet.actions.some((action) => minimatch(actionPath, action));

    if (matched) {
      return negated ? false : true;
    }

    return null;
  }

  getActions(snippetPattern: string) {
    if (snippetPattern.startsWith('!')) {
      snippetPattern = snippetPattern.slice(1);
    }

    const matchedSnippets = [];

    for (const [name, snippet] of this.snippets) {
      if (minimatch(name, snippetPattern)) {
        matchedSnippets.push(snippet);
      }
    }

    return matchedSnippets.map((snippet) => snippet.actions).flat();
  }
}

export default SnippetManager;
