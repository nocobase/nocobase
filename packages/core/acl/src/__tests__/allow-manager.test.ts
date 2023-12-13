import { ACL } from '..';
import { AllowManager } from '../allow-manager';
describe('allow manager', () => {
  let acl: ACL;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should allow star resource', async () => {
    const allowManager = new AllowManager(acl);

    allowManager.allow('*', 'download', 'public');

    expect(await allowManager.isAllowed('users', 'download', {})).toBeTruthy();
    expect(await allowManager.isAllowed('users', 'fake-method', {})).toBeFalsy();
    expect(await allowManager.isAllowed('users', 'other-method', {})).toBeFalsy();
  });
});
