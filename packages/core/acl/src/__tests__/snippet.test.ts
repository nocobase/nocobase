import { ACL } from '..';
import SnippetManager from '../snippet-manager';

describe('acl snippet', () => {
  let acl: ACL;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should register snippet', () => {
    acl.registerSnippet({
      name: 'sc.collection-manager.fields',
      actions: ['collections:list'],
    });

    acl.registerSnippet({
      name: 'sc.collection-manager.gi',
      actions: ['fields:list'],
    });

    const adminRole = acl.define({
      role: 'admin',
      strategy: {
        allowConfigure: true,
      },
    });

    expect(acl.can({ role: 'admin', resource: 'collections', action: 'list' })).not.toBeNull();

    adminRole.addSnippet('!sc.collection-manager.fields');

    expect(acl.can({ role: 'admin', resource: 'collections', action: 'list' })).toBeNull();
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
  });
});
