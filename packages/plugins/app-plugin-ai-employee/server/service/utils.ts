import { forbiddenError, notFoundError, validationError } from '../types.js';
import type { ConversationManagementActor } from '../types.js';

export function requireConversationReadAccess(
  actor: ConversationManagementActor,
): void {
  if (
    actor.id === 'anonymous' ||
    !String(actor.id) ||
    actor.canReadAllConversations !== true
  ) {
    throw forbiddenError('AI settings access is required');
  }
}

export type ResourceInput = Record<string, any>;

export function asRecord(value: unknown): ResourceInput | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as ResourceInput)
    : undefined;
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function requiredString(value: unknown, name: string): string {
  const normalized = optionalString(value);
  if (normalized) return normalized;
  throw badRequest(`${name} is required`);
}

export function resourceI18n(
  value: unknown,
): { namespace: string } | undefined {
  if (value === undefined) return undefined;
  const record = asRecord(value);
  if (!record) throw badRequest('i18n must be an object');
  return { namespace: requiredString(record.namespace, 'i18n.namespace') };
}

export function badRequest(message: string): Error {
  return validationError(message);
}

/** A resource the request names does not exist. */
export function notFound(reason: string, message: string): Error {
  return notFoundError(message, reason);
}

export function redactSecrets(value: unknown, parentKey = ''): unknown {
  if (isSecretKey(parentKey))
    return value == null || value === '' ? value : '***';
  if (Array.isArray(value)) return value.map((item) => redactSecrets(item));
  const record = asRecord(value);
  if (!record) return value;
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [
      key,
      redactSecrets(item, key),
    ]),
  );
}

export function isSerializableObject(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isSecretKey(key: string): boolean {
  return /api.?key|token|secret|password|authorization|cookie|credential/i.test(
    key,
  );
}
