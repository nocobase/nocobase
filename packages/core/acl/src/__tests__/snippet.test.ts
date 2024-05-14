/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { ACL } from '..';
import SnippetManager from '../snippet-manager';
describe('nocobase snippet', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('snippet allowed', async () => {
    const testRole = app.acl.define({
      role: 'test',
    });

    testRole.snippets.add('!pm.users');
    testRole.snippets.add('pm.*');

    expect(
      app.acl.can({
        role: 'test',
        resource: 'users',
        action: 'list',
      }),
    ).toBeNull();
  });

  it('should allow all snippets', async () => {
    const testRole = app.acl.define({
      role: 'test',
    });

    testRole.snippets.add('!pm.acl.roles');
    testRole.snippets.add('pm.*');

    expect(
      app.acl.can({
        role: 'test',
        resource: 'users',
        action: 'list',
      }),
    ).toBeTruthy();
  });
});

describe('acl snippet', () => {
  let acl: ACL;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should replace invalid snippet name', () => {
    acl.registerSnippet({
      name: 'pm.users.*',
      actions: ['users:list'],
    });

    expect(acl.snippetManager.snippets.get('pm.users')).toBeDefined();
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

  it('should return true when last rule allowd', () => {
    acl.registerSnippet({
      name: 'sc.collection-manager.fields',
      actions: ['fields:list'],
    });

    acl.registerSnippet({
      name: 'sc.collection-manager.gi',
      actions: ['fields:list'],
    });

    acl.registerSnippet({
      name: 'sc.users',
      actions: ['users:*'],
    });

    const adminRole = acl.define({
      role: 'admin',
    });

    adminRole.snippets.add('!sc.collection-manager.gi');
    adminRole.snippets.add('!sc.users');
    adminRole.snippets.add('sc.*');

    expect(acl.can({ role: 'admin', resource: 'fields', action: 'list' })).toBeTruthy();
    expect(acl.can({ role: 'admin', resource: 'users', action: 'list' })).toBeNull();
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

    it('should not register snippet named with *', async () => {
      const snippetManager = new SnippetManager();

      let error;

      try {
        snippetManager.register({
          name: 'sc.collection-.*.manager.*',
          actions: ['collections:*'],
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });
  });
});
