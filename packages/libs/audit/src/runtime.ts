import type {
  Application,
  ApplicationConfig,
} from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  apiExecutionResultOf,
  declaredRouteActionOf,
  declaredRouteOf,
  enableApiExecutionResult,
  getClientAddress,
  getRequestId,
  matchForwardedApiRoute,
  observeForwardedApiContext,
  repositoryEndpointOf,
} from '@nocobase/app-server/router';
import { ServiceProvider } from '@nocobase/service-provider';

import { auditDefaults, type AuditConfig } from './config.js';
import { createTrustedAuditProxies } from './ip.js';
import locales from './locales/index.js';
import { auditMiddleware } from './request.js';
import { AuditCoordinator, auditServiceToken } from './service.js';

const namespace = '@nocobase/audit';

/** Installs request auditing in an application assembled with app-server. */
export class AuditProvider<
  TConfig extends ApplicationConfig = ApplicationConfig,
> extends ServiceProvider<Application<TConfig>> {
  public readonly name: string = namespace;
  private readonly coordinator: AuditCoordinator;

  public constructor(app: Application<TConfig>) {
    super(app);
    this.coordinator = new AuditCoordinator((message, destination) =>
      this.report(message, destination),
    );
    // Providers can register drivers in either register() or boot(). Introduce
    // the service during composition so audit can shut down before those providers.
    app.container.instance(auditServiceToken, this.coordinator);
    const { config, paths } = app;
    app.addApiMiddleware({
      name: namespace,
      register: async (router) => {
        const audit = config.get<AuditConfig>('audit');
        if (!(await this.coordinator.start(audit, paths))) return;
        const proxies = createTrustedAuditProxies(
          config.get('auth.advanced.ipAddress.trustedProxies'),
          (message) => {
            const logger = this.logger();
            if (logger) logger.warn(message);
            else console.warn(message);
          },
        );
        router.use(
          '*',
          auditMiddleware({
            host: {
              declaredRouteOf(context) {
                const spec = declaredRouteOf(context);
                return (
                  spec && { ...spec, repository: repositoryEndpointOf(spec) }
                );
              },
              declaredRouteActionOf,
              matchForwardedRoute: (context) =>
                matchForwardedApiRoute(context, app.forwardedApiRoutes.routers),
              observeForwardedContext: observeForwardedApiContext,
              enableExecutionResult: enableApiExecutionResult,
              executionResultOf: apiExecutionResultOf,
              getClientAddress,
              getRequestId,
            },
            service: this.coordinator,
            autoDetect: audit?.autoDetect ?? auditDefaults.autoDetect,
            proxies,
            ipAddressHeaders: config.get<readonly string[]>(
              'auth.advanced.ipAddress.ipAddressHeaders',
            ) ?? ['x-forwarded-for'],
            report: () => this.report('Could not collect audit event.'),
          }),
        );
      },
    });
  }

  public override register(): void {
    this.app.container
      .resolveIfCreated(i18nToken)
      ?.registerNamespace(namespace, locales);
  }

  public override async shutdown(): Promise<void> {
    await this.coordinator.close();
  }

  private logger() {
    return this.app.container
      .resolveIfCreated(loggingToken)
      ?.getLogger('audit');
  }

  private report(message: string, destination?: string): void {
    const logger = this.logger();
    if (logger) logger.error({ destination }, message);
    else
      console.error(
        destination ? `${message} Destination: ${destination}.` : message,
      );
  }
}
