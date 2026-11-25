import { aliyunSmsService } from './providers/aliyun.js';
import { tencentSmsService } from './providers/tencent.js';
import { SmsProviderRegistry, type SmsProviderDefinition } from './provider.js';
import type { SmsChannelConfig } from './types.js';

/** The services built in. */
export const builtInSmsServices: readonly SmsProviderDefinition[] = [
  aliyunSmsService as unknown as SmsProviderDefinition,
  tencentSmsService as unknown as SmsProviderDefinition,
];

export function createSmsProviderRegistry(): SmsProviderRegistry {
  return new SmsProviderRegistry(builtInSmsServices);
}

const RESERVED_KEYS = new Set([
  'type',
  'provider',
  'enabled',
  'service',
  'signName',
  'templates',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Checks what does not depend on which services are registered: the shape of the channel, its templates and, for a
 * built-in service, its settings. A service another package registers is checked when the channel is created.
 */
export function validateSmsChannelConfig(
  config: SmsChannelConfig,
  registry: SmsProviderRegistry = createSmsProviderRegistry(),
  options: { readonly requireRegistered?: boolean } = {},
): void {
  if (typeof config.service !== 'string' || !config.service.trim())
    throw new Error(
      'SMS channel service is required, such as aliyun or tencent.',
    );
  if (RESERVED_KEYS.has(config.service))
    throw new Error(`SMS channel service "${config.service}" is not valid.`);
  if (typeof config.signName !== 'string' || !config.signName.trim())
    throw new Error('SMS channel signName is required.');
  if (config.signName.length > 64)
    throw new Error('SMS channel signName is too long.');
  if (!isRecord(config.templates) || !Object.keys(config.templates).length)
    throw new Error('SMS channel templates must name at least one template.');
  for (const [name, template] of Object.entries(config.templates)) {
    if (!isRecord(template))
      throw new Error(`SMS template "${name}" must be an object.`);
    if (typeof template.templateId !== 'string' || !template.templateId.trim())
      throw new Error(`SMS template "${name}" needs a templateId.`);
    const params: unknown = template.params;
    if (
      params !== undefined &&
      (!isRecord(params) ||
        Object.values(params).some(
          (value) => typeof value !== 'string' || !value,
        ))
    )
      throw new Error(
        `SMS template "${name}" params must map provider variable names to message variable names.`,
      );
  }
  const definition = registry.get(config.service);
  if (!definition) {
    if (options.requireRegistered)
      throw new Error(
        `SMS service "${config.service}" is not registered. Registered: ${registry.list().join(', ')}.`,
      );
    return;
  }
  const settings = config[config.service];
  if (settings !== undefined && !isRecord(settings))
    throw new Error(`SMS channel ${config.service} must be an object.`);
  definition.validate(isRecord(settings) ? settings : {});
}
