import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { lifecycleExampleServiceToken } from '@nocobase/app-plugin-lifecycle-example/server';
import { ServiceProvider } from '@nocobase/service-provider';
import { onboardingLifecycle } from '../lifecycles/onboarding.js';
import { ONBOARDING_ACCESS } from '../../shared/onboarding.js';
import metadata from '../../package.json' with { type: 'json' };

export default class OnboardingRegistration extends ServiceProvider<Application> {
  readonly name = 'examples/onboarding';
  override async boot(): Promise<void> {
    this.app.container
      .resolve(lifecycleExampleServiceToken)
      .runtime.register(onboardingLifecycle);
    const authz = this.app.container.resolve(authorizationToken);
    authz.settings.add({
      id: ONBOARDING_ACCESS.id,
      title: { key: 'onboarding.title', ns: metadata.name },
      actions: ['coordinate', 'view'].map((name) => ({
        name,
        title: { key: `onboarding.${name}`, ns: metadata.name },
      })),
    });
    authz.ui.place(ONBOARDING_ACCESS, { section: 'workflow-management' });
    // The existing page permission registry contributes access; no wildcard role assignment.
  }
}
