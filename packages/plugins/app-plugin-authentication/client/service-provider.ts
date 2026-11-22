import { ServiceProvider } from '@nocobase/service-provider';
import type { ClientApplication } from '@nocobase/app-client';
import { resolveAppUrl } from '@nocobase/app-client';
import type {
  ClientServiceProviderConstructor,
  ClientServiceProviderContext,
} from '@nocobase/app-client/plugins';

import {
  createAuthClient,
  type AuthConfig,
  type AuthClient,
} from './auth-client.js';
import {
  authenticationClientSettingsToken,
  authenticationClientToken,
} from './tokens.js';

export class AuthenticationServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-authentication/client';

  public constructor(
    app: ClientApplication,
    private readonly context:
      ClientServiceProviderContext | undefined = undefined,
  ) {
    super(app);
  }

  public override boot(): Promise<void> {
    const apiBaseURL =
      this.app.config.get<string>('api.baseURL') ?? resolveAppUrl('/api');
    const authClient = createAuthClient({
      baseURL: new URL(
        `${apiBaseURL.replace(/\/+$/u, '')}/auth`,
        window.location.origin,
      ).href,
      ...this.app.config.get<AuthConfig>('auth'),
    });
    const options = (this.context?.options ?? {}) as {
      readonly signInButtons?: readonly string[];
    };
    this.app.container.singleton(authenticationClientSettingsToken, () => ({
      signInButtons: options.signInButtons ?? [],
    }));
    this.app.container.singleton(
      authenticationClientToken,
      () => authClient as AuthClient,
    );
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  AuthenticationServiceProvider,
];

export default serviceProviders;
