import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { multiAppProvisioningPolicyToken } from '@nocobase/app-plugin-multi-app/server';
/** Presentation configuration is applied to one new instance, never shared mutable business state. */
export default class TemplatePolicy extends ServiceProvider<Application> {
  readonly name = 'example/template-policy';
  override register(): void {
    this.app.container.instance(multiAppProvisioningPolicyToken, {
      validate: async () => {},
      configuration: async (input) =>
        JSON.stringify({
          client: { app: { title: input.name } },
          i18n: { defaultLocale: 'zh-CN' },
        }),
    });
  }
}
