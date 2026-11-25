import {
  defineAppConfig,
  type AppConfigFactory,
} from '../config/define-app-config.js';

export interface AuditDestinationConfig {
  readonly driver: string;
  readonly options?: Readonly<Record<string, unknown>>;
}

export interface AuditConfig {
  readonly enabled?: boolean;
  readonly autoDetect?: boolean;
  readonly transports?: Readonly<Record<string, AuditDestinationConfig>>;
}

export const auditDefaults: Required<
  Pick<AuditConfig, 'enabled' | 'autoDetect'>
> = {
  enabled: true,
  autoDetect: false,
};

const validName = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/u;

export function isAuditName(value: unknown): value is string {
  return typeof value === 'string' && validName.test(value);
}

function isMapping(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function validateAuditConfig(
  value: unknown,
  error: (path: string, message: string) => void,
): void {
  if (!isMapping(value)) {
    error('', 'must be a mapping.');
    return;
  }
  for (const key of Object.keys(value)) {
    if (!['enabled', 'autoDetect', 'transports'].includes(key))
      error(key, 'is not an audit setting.');
  }
  for (const key of ['enabled', 'autoDetect']) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean')
      error(key, 'must be a boolean.');
  }
  if (value.transports === undefined) return;
  if (!isMapping(value.transports)) {
    error('transports', 'must be a mapping.');
    return;
  }
  for (const [name, destination] of Object.entries(value.transports)) {
    if (!isAuditName(name)) {
      error('transports', 'contains an invalid destination name.');
      continue;
    }
    const path = `transports.${name}`;
    if (!isMapping(destination) || !isAuditName(destination.driver)) {
      error(path, 'requires a valid driver name.');
      continue;
    }
    if (
      Object.keys(destination).some(
        (key) => key !== 'driver' && key !== 'options',
      )
    )
      error(path, 'accepts only driver and options.');
    if (destination.options !== undefined && !isMapping(destination.options))
      error(`${path}.options`, 'must be a mapping.');
  }
}

export function defineAuditConfig(
  defaults: AuditConfig = {},
): AppConfigFactory<AuditConfig> {
  return defineAppConfig({
    defaults: { ...auditDefaults, ...defaults },
    validate: (value, context) =>
      validateAuditConfig(value, (path, message) =>
        context.error(path, message),
      ),
  });
}
