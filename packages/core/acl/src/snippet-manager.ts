import { ACL } from './acl';

export type Snippet = {
  name: string;
  actions: Array<string>;
};

export type SnippetGroup = {
  name: string;
  snippets: Snippet[];
};

class SnippetManager {
  protected snippets: Map<string, Snippet> = new Map();

  constructor(public acl: ACL) {}

  register(snippet: Snippet) {
    this.snippets.set(snippet.name, snippet);
  }
}

export default SnippetManager;
