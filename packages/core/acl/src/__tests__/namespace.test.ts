import { ACL } from '@nocobase/acl';

describe('acl with namespace', () => {
  let acl: ACL;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should define strategy with namespace', async () => {
    acl.define({
      role: 'admin',
      strategy: {
        actions: ['db1|edit', 'db2|create', 'view', 'db1|destroy:own'],
      },
    });

    const canResult = acl.can({ role: 'admin', resource: 'posts', action: 'edit' });
    expect(canResult).toBeFalsy();

    const canResult2 = acl.can({ role: 'admin', resource: 'db1|posts', action: 'edit' });
    expect(canResult2).toBeTruthy();
  });

  it('should grant action with namespace', () => {
    acl.define({
      role: 'admin',
      actions: {
        'posts:edit': {
          testParams1: true,
        },

        'db1|posts:edit': {
          testParams2: true,
        },
      },
    });

    const canResult = acl.can({ role: 'admin', resource: 'posts', action: 'edit' });

    expect(canResult).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'edit',
      params: {
        testParams1: true,
      },
    });

    const canResult2 = acl.can({ role: 'admin', resource: 'db1|posts', action: 'edit' });
    expect(canResult2).toMatchObject({
      role: 'admin',
      resource: 'db1|posts',
      action: 'edit',
      params: {
        testParams2: true,
      },
    });
  });
});
