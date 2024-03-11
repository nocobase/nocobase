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
