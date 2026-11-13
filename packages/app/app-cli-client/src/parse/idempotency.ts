import type { CliCommand, CliIdempotency } from './manifest.ts';

const reserved = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'content-type',
  'content-encoding',
  'content-disposition',
  'accept',
  'accept-encoding',
  'expect',
  'origin',
  'referer',
  'user-agent',
  'range',
  'if-match',
  'if-none-match',
  'if-modified-since',
  'if-unmodified-since',
  'if-range',
  'x-http-method-override',
  'x-method-override',
  'dnt',
  'via',
  'date',
  'x-api-key',
  'x-run-token',
  'x-request-id',
  'forwarded',
]);

/** Validate wire semantics even when a consumer uses the shared parser without the manifest reader. */
export function validateOperationCommand(
  command: Pick<CliCommand, 'idempotency'> &
    Partial<Pick<CliCommand, 'parameters' | 'body' | 'readBinding'>> & {
      readonly method: string;
    },
): void {
  const fail = (message: string): never => {
    throw new Error(`Unsupported CLI operation-key contract: ${message}`);
  };
  const spec = command.idempotency;
  if (!spec) return;
  if (
    Object.keys(spec).some(
      (key) => !['header', 'flag', 'minLength', 'maxLength'].includes(key),
    )
  )
    return fail('unknown idempotency semantics');
  if (
    spec.flag !== 'operation-key' ||
    !['POST', 'PUT', 'PATCH', 'DELETE'].includes(command.method)
  )
    return fail('invalid flag or method');
  const name = spec.header.toLowerCase();
  if (
    !/^[!#$%&'*+.^_`|~0-9a-z-]+$/u.test(name) ||
    reserved.has(name) ||
    /^(?:x-nocobase-|x-nb-|sec-|proxy-|x-forwarded-|access-control-request-)/u.test(
      name,
    )
  )
    return fail('reserved or invalid header');
  if (
    !Number.isSafeInteger(spec.minLength) ||
    spec.minLength < 1 ||
    spec.minLength > 50 ||
    (spec.maxLength !== undefined &&
      (!Number.isSafeInteger(spec.maxLength) || spec.maxLength < 50))
  )
    return fail(
      'constraints must accept a 50-character timestamp.UUID operation key',
    );
  if (
    command.readBinding ||
    command.parameters?.some(
      (parameter) => parameter.upload || parameter.ticket || parameter.changed,
    )
  )
    return fail('multi-request flows are not supported');
  const names =
    command.parameters?.flatMap((parameter) => [
      parameter.name,
      parameter.alias,
      ...(parameter.contentFile ? [`${parameter.name}-file`] : []),
    ]) ?? [];
  if (
    [...names, command.body?.file].some(
      (value) => value?.toLowerCase() === 'operation-key',
    )
  )
    return fail('--operation-key conflicts with an existing parameter');
}

/** Values are never trimmed, rewritten or echoed in validation failures. */
export function validateOperationKey(
  spec: CliIdempotency,
  value: string,
): void {
  // Restrict values to printable ASCII so transport encoding never rewrites a key.
  if (
    /[^\x20-\x7e]/u.test(value) ||
    value.length < spec.minLength ||
    value.length > (spec.maxLength ?? Infinity) ||
    value.trim() !== value
  )
    throw new Error(
      'Invalid --operation-key: use a printable ASCII value satisfying the declared length constraints, without surrounding whitespace.',
    );
}
