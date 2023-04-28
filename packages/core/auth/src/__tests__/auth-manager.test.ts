import { Context } from '@nocobase/actions';
import { Auth, AuthManager } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import { mockServer } from '@nocobase/test';

class MockStorer {
  elements: Map<string, any> = new Map();
  async set(name: string, value: any) {
    this.elements.set(name, value);
  }

  async get(name: string) {
    return this.elements.get(name);
  }
}

class BasicAuth extends Auth {
  public user: Model;

  async check() {
    return null;
  }

  async getIdentity() {
    return null;
  }
}

describe('auth-manager', () => {
  let authManager: AuthManager;
  beforeEach(() => {
    const app = mockServer();
    authManager = new AuthManager(app, {
      authKey: 'X-Authenticator',
    });

    const storer = new MockStorer();
    const authenticator = {
      name: 'basic-test',
      authType: 'basic',
      options: {},
    };
    storer.set(authenticator.name, authenticator);
    authManager.setStorer(storer);
  });

  it('should get authenticator', async () => {
    authManager.registerTypes('basic', BasicAuth);
    const authenticator = await authManager.get('basic-test', {} as Context);
    expect(authenticator).toBeInstanceOf(BasicAuth);
  });
});
