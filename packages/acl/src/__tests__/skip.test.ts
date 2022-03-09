import { ACL } from '..';

describe('skip', () => {
  let acl: ACL;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should skip action', async () => {
    expect(acl.isSkipped('user', 'login')).toBeFalsy();
    acl.skip('user', 'login');
    expect(acl.isSkipped('user', 'login')).toBeTruthy();

    expect(acl.isSkipped('user', 'logout')).toBeFalsy();
  });

  it('should skip action with global resource', async () => {
    expect(acl.isSkipped('user', 'login')).toBeFalsy();
    acl.skip('*', 'login');
    expect(acl.isSkipped('user', 'login')).toBeTruthy();

    expect(acl.isSkipped('user', 'logout')).toBeFalsy();
  });

  it('should skip action with global action', async () => {
    expect(acl.isSkipped('user', 'login')).toBeFalsy();
    acl.skip('user', '*');
    expect(acl.isSkipped('user', 'login')).toBeTruthy();
    expect(acl.isSkipped('admin', 'logout')).toBeFalsy();
  });
});
