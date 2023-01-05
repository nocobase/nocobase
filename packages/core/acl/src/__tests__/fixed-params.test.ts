import { ACL } from '../acl';
import FixedParamsManager from '../fixed-params-manager';

describe('fixed params', () => {
  it('should merge params', async () => {
    const fixedParamsManager = new FixedParamsManager();

    fixedParamsManager.addParams('collections', 'destroy', () => {
      return {
        filter: {
          'name.$ne': 'users',
        },
      };
    });

    fixedParamsManager.addParams('collections', 'destroy', () => {
      return {
        filter: {
          'name.$ne': 'roles',
        },
      };
    });

    const params = fixedParamsManager.getParams('collections', 'destroy');
    expect(params).toEqual({
      filter: {
        $and: [
          {
            'name.$ne': 'users',
          },
          {
            'name.$ne': 'roles',
          },
        ],
      },
    });
  });

  it('should add fixed params to acl action', async () => {
    const acl = new ACL();

    const adminRole = acl.define({
      role: 'admin',
      actions: {
        'collections:destroy': {},
      },
    });

    let canResult = acl.can({
      role: 'admin',
      resource: 'collections',
      action: 'destroy',
    });

    expect(canResult).toEqual({ role: 'admin', resource: 'collections', action: 'destroy' });

    acl.addFixedParams('collections', 'destroy', () => {
      return {
        filter: {
          'name.$ne': 'users',
        },
      };
    });

    canResult = acl.can({
      role: 'admin',
      resource: 'collections',
      action: 'destroy',
    });

    expect(canResult).toEqual({
      role: 'admin',
      resource: 'collections',
      action: 'destroy',
      params: {
        filter: {
          'name.$ne': 'users',
        },
      },
    });
  });
});
