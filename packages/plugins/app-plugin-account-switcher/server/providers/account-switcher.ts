import {
  authenticationToken,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { resolveAccountSwitcherMode } from '../config.js';
import { createAccountSwitcherGuard } from '../middleware.js';
import { DefaultAccountSwitcherService } from '../services/account-switcher.js';
import { accountSwitcherServiceToken } from '../tokens.js';

export class AccountSwitcherProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-account-switcher';
  private removeSubstitution: (() => void) | undefined;

  public override register(): void {
    const { app } = this;
    const { container } = app;
    const mode = resolveAccountSwitcherMode(app.config, app.nodeEnv);
    if (mode === 'off') return;

    container.singleton(
      accountSwitcherServiceToken,
      () =>
        new DefaultAccountSwitcherService({
          mode,
          database: container.resolve(databaseManagerToken),
          users: container.resolve(userAdministrationServiceToken),
          authorization: () => container.resolve(authorizationToken),
          ...(container.has(realtimeServiceToken)
            ? { realtime: () => container.resolve(realtimeServiceToken) }
            : {}),
          logger: () =>
            container.has(loggingToken)
              ? container.resolve(loggingToken).getLogger('security')
              : undefined,
        }),
    );
    // The root router runs this before every route, including those contributed later.
    app.router.use(
      '*',
      createAccountSwitcherGuard({
        auth: () => container.resolve(authenticationToken),
        service: () => container.resolve(accountSwitcherServiceToken),
      }),
    );
  }

  public override async boot(): Promise<void> {
    await Promise.resolve();
    const { container } = this.app;
    if (!container.has(accountSwitcherServiceToken)) return;
    const service = container.resolve(accountSwitcherServiceToken);
    this.removeSubstitution = container
      .resolve(authenticationToken)
      .addSessionSubstitution((session) => service.substitute(session));
  }

  public override async shutdown(): Promise<void> {
    await Promise.resolve();
    this.removeSubstitution?.();
    this.removeSubstitution = undefined;
  }
}
