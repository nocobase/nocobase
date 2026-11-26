import type { I18nRuntime } from '@nocobase/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import type { ServiceContainer } from '@nocobase/service-provider';
import type { MiddlewareHandler } from 'hono';

import { auditDefaults, type AuditConfig } from './config.js';
import { createTrustedAuditProxies } from './ip.js';
import locales from './locales/index.js';
import { auditMiddleware, type AuditRequestHost } from './request.js';
import {
  AuditCoordinator,
  auditServiceToken,
  type AuditTransportContext,
} from './service.js';

export { describeRepositoryAudit } from './repository.js';

const namespace = '@nocobase/audit';

interface AuditLogger {
  error(fields: { destination?: string }, message: string): void;
  warn(message: string): void;
}

export interface AuditRuntimeOptions {
  readonly container: ServiceContainer;
  readonly config: { get<T = unknown>(path: string): T | undefined };
  readonly paths: AuditTransportContext['paths'];
  readonly router: AuditRequestHost;
  readonly logger: () => AuditLogger | undefined;
  readonly i18n: () => I18nRuntime | undefined;
}

export interface AuditRuntime {
  registerLocales(runtime: I18nRuntime): void;
  start(): Promise<MiddlewareHandler | undefined>;
  close(): Promise<void>;
}

/** Connect the audit service to the application's router and lifecycle. */
export function createAuditRuntime(options: AuditRuntimeOptions): AuditRuntime {
  const { config, paths, router } = options;
  const report = (message: string, destination?: string): void => {
    const logger = options.logger();
    if (logger) logger.error({ destination }, message);
    else
      console.error(
        destination ? `${message} Destination: ${destination}.` : message,
      );
  };
  const coordinator = new AuditCoordinator(report);
  options.container.instance(auditServiceToken, coordinator);
  return {
    registerLocales(runtime) {
      runtime.registerNamespace(namespace, locales);
    },
    async start() {
      const audit = config.get<AuditConfig>('audit');
      if (!(await coordinator.start(audit, paths))) return undefined;
      const proxies = createTrustedAuditProxies(
        config.get('auth.advanced.ipAddress.trustedProxies'),
        (message) => {
          const logger = options.logger();
          if (logger) logger.warn(message);
          else console.warn(message);
        },
      );
      return auditMiddleware({
        host: router,
        service: coordinator,
        autoDetect: audit?.autoDetect ?? auditDefaults.autoDetect,
        proxies,
        ipAddressHeaders: config.get<readonly string[]>(
          'auth.advanced.ipAddress.ipAddressHeaders',
        ) ?? ['x-forwarded-for'],
        translate: ({ ns, key }, fallback, context) => {
          const i18n = options.i18n();
          const locale = getRequestLocale(context) ?? i18n?.getDefaultLocale();
          const translated = i18n?.getFixedT(ns, locale)(key, {
            defaultValue: fallback,
          });
          return translated?.trim() || fallback;
        },
        report: () => report('Could not collect audit event.'),
      });
    },
    close: () => coordinator.close(),
  };
}
