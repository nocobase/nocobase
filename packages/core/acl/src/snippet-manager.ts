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

    const actions = snippet.actions.map((action) => {
      return action;
    });

    const matched = actions.some((action) => minimatch(actionPath, action));

    return negated ? !matched : matched;
  }
}

export default SnippetManager;
