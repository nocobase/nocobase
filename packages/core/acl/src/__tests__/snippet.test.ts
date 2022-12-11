import { ACL } from '..';

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
      allowConfigure: true,
    });

    expect(acl.can({ role: 'admin', resource: 'collections', action: 'list' })).not.toBeNull();

    adminRole.addSnippet('!sc.collection-manager.fields');

    expect(acl.can({ role: 'admin', resource: 'collections', action: 'list' })).toBeNull();
  });
});
