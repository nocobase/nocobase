import { ACL } from '..';
import SnippetManager from '../snippet-manager';

describe('acl snippet', () => {
  let acl: ACL;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should get effective snipptes', () => {
    acl.registerSnippet({
      name: 'sc.collection-manager.fields',
      actions: ['fields:list'],
    });

    acl.registerSnippet({
      name: 'sc.collection-manager.gi',
      actions: ['fields:list', 'gi:list'],
    });

    acl.registerSnippet({
      name: 'sc.collection-manager.collections',
      actions: ['collections:list'],
    });

    const adminRole = acl.define({
      role: 'admin',
    });

    adminRole.snippets.add('sc.*');

    expect(adminRole.effectiveSnippets().allowed).toEqual([
      'sc.collection-manager.fields',
      'sc.collection-manager.gi',
      'sc.collection-manager.collections',
    ]);

    adminRole.snippets.add('!sc.collection-manager.gi');

    expect(adminRole.effectiveSnippets().allowed).toEqual([
      'sc.collection-manager.fields',
      'sc.collection-manager.collections',
    ]);
  });

  it('should register snippet', () => {
    acl.registerSnippet({
      name: 'sc.collection-manager.fields',
      actions: ['fields:list'],
    });

    acl.registerSnippet({
      name: 'sc.collection-manager.gi',
      actions: ['fields:list', 'gi:list'],
    });

    acl.registerSnippet({
      name: 'sc.collection-manager.collections',
      actions: ['collections:list'],
    });

    const adminRole = acl.define({
      role: 'admin',
    });

    adminRole.snippets.add('sc.*');
    expect(acl.can({ role: 'admin', resource: 'collections', action: 'list' })).not.toBeNull();
    expect(adminRole.snippetAllowed('collections:list')).toBe(true);

    adminRole.snippets.add('!sc.collection-manager.gi');
    expect(acl.can({ role: 'admin', resource: 'gi', action: 'list' })).toBeNull();
    expect(adminRole.snippetAllowed('gi:list')).toBe(false);

    expect(acl.can({ role: 'admin', resource: 'fields', action: 'list' })).not.toBeNull();
    expect(adminRole.snippetAllowed('fields:list')).toBe(true);

    expect(adminRole.snippetAllowed('other:list')).toBeNull();
  });
});

describe('snippet manager', () => {
  describe('allow method', () => {
    it('should return true when allowed', () => {
      const snippetManager = new SnippetManager();

      snippetManager.register({
        name: 'sc.collection-manager.fields',
        actions: ['collections:list'],
      });

      expect(snippetManager.allow('collections:list', 'sc.collection-manager.fields')).toBe(true);
    });

    it('should return true when allowed by wild match', () => {
      const snippetManager = new SnippetManager();

      snippetManager.register({
        name: 'sc.collection-manager.fields',
        actions: ['collections:*'],
      });

      expect(snippetManager.allow('collections:list', 'sc.collection-manager.fields')).toBe(true);
      expect(snippetManager.allow('collections:destroy', 'sc.collection-manager.fields')).toBe(true);
    });

    it('should return false when match negated rule', () => {
      const snippetManager = new SnippetManager();

      snippetManager.register({
        name: 'sc.collection-manager.fields',
        actions: ['collections:*'],
      });

      expect(snippetManager.allow('collections:list', 'sc.collection-manager.fields')).toBe(true);
      expect(snippetManager.allow('collections:destroy', '!sc.collection-manager.fields')).toBe(false);
    });

    it('should return null when not matched', () => {
      const snippetManager = new SnippetManager();

      snippetManager.register({
        name: 'sc.collection-manager.fields',
        actions: ['collections:*'],
      });

      expect(snippetManager.allow('fields:list', 'sc.collection-manager.fields')).toBeNull();
    });
  });
});
