import { sensitiveParameterName } from '@nocobase/secrets';

export interface AuditRedactRules {
  /** Exact field names matched at any depth. */
  readonly fields?: readonly string[];
  /** Exact dotted paths relative to the object being redacted. */
  readonly paths?: readonly string[];
}

export function validateAuditRedactRules(
  value: unknown,
  error: (path: string, message: string) => void,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    error('', 'must be a mapping.');
    return;
  }
  for (const [key, rules] of Object.entries(value)) {
    if (key !== 'fields' && key !== 'paths') {
      error(key, 'is not an audit redaction setting.');
      continue;
    }
    if (rules === undefined) continue;
    if (
      !Array.isArray(rules) ||
      Array.from(rules).some(
        (rule: unknown) => typeof rule !== 'string' || !rule.trim(),
      )
    )
      error(key, 'must be an array of non-blank strings.');
  }
}

export function copyAuditRedactRules(
  rules: AuditRedactRules,
): AuditRedactRules {
  validateAuditRedactRules(rules, (path, message) => {
    throw new TypeError(`redact${path ? `.${path}` : ''} ${message}`);
  });
  return Object.freeze({
    fields: rules.fields && Object.freeze([...rules.fields]),
    paths: rules.paths && Object.freeze([...rules.paths]),
  });
}

const rawLimit = 256 * 1024;
const snapshotLimit = 16 * 1024;
// A JSON stream may never finish. Collection must not hold the HTTP response open indefinitely.
const snapshotReadTimeout = 1000;
const masked = '******';
const arrayIndexSegment = /^(?:0|[1-9]\d*)(?:\.|$)/u;
const truncated = Object.freeze({ truncated: true });

/** Capture a bounded JSON copy without consuming or changing the handler's body. */
export async function readAuditBody(
  message: Request | Response,
): Promise<unknown> {
  if (
    !message.body ||
    !/^application\/(?:json|[^; ]+\+json)(?:\s*;|$)/iu.test(
      message.headers.get('content-type') ?? '',
    )
  )
    return undefined;
  const length = Number(message.headers.get('content-length'));
  if (length > rawLimit) return { ...truncated, size: length };
  try {
    const stream: ReadableStream<Uint8Array> | null = message.clone().body;
    if (!stream) return undefined;
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    let timedOut = false;
    const cancel = () => {
      void reader.cancel().catch(() => undefined);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      cancel();
    }, snapshotReadTimeout);
    timer.unref();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > rawLimit) return truncated;
        chunks.push(value);
      }
      if (timedOut) return truncated;
      const parsed: unknown = JSON.parse(
        Buffer.concat(chunks).toString('utf8'),
      );
      return parsed && typeof parsed === 'object' ? parsed : undefined;
    } finally {
      // A tee's cancel promise waits for the other branch. The route still owns that branch.
      clearTimeout(timer);
      cancel();
    }
  } catch {
    return undefined;
  }
}

function pathsBelow(
  paths: readonly string[],
  segment: string,
): readonly string[] {
  if (paths.length === 0) return paths;
  const prefix = `${segment}.`;
  return paths
    .filter((path) => path.startsWith(prefix))
    .map((path) => path.slice(prefix.length));
}

/** Replace sensitive values before applying the serialized size limit. */
export function auditSnapshot(
  value: unknown,
  rules?: AuditRedactRules,
): unknown {
  if (value === undefined) return undefined;
  const fields = new Set(rules?.fields);
  const paths = rules?.paths ?? [];
  let budget = snapshotLimit;
  const seen = new Set<object>();
  const visit = (
    node: unknown,
    paths: readonly string[],
    depth: number,
  ): unknown => {
    if (depth > 32 || budget <= 0) return truncated;
    if (node === null || typeof node !== 'object') {
      if (typeof node === 'function' || typeof node === 'symbol')
        return undefined;
      if (typeof node === 'bigint') node = String(node);
      if (typeof node === 'string') budget -= node.length;
      return node;
    }
    if (seen.has(node)) return truncated;
    seen.add(node);
    try {
      if (node instanceof Date) return node.toJSON();
      if (Array.isArray(node)) {
        const values: unknown[] = [];
        // A named segment crosses an array; a numeric segment selects its position here.
        const unindexed = paths.length
          ? paths.filter((path) => !arrayIndexSegment.test(path))
          : paths;
        for (const [index, item] of (node as unknown[]).entries()) {
          budget -= 1;
          if (budget <= 0) break;
          const position = String(index);
          const indexed = pathsBelow(paths, position);
          values.push(
            paths.includes(position)
              ? masked
              : visit(
                  item,
                  indexed.length
                    ? [...new Set([...unindexed, ...indexed])]
                    : unindexed,
                  depth + 1,
                ),
          );
        }
        return values;
      }
      const result = Object.create(null) as Record<string, unknown>;
      for (const [name, entry] of Object.entries(
        node as Record<string, unknown>,
      )) {
        budget -= name.length + 1;
        if (budget <= 0) break;
        result[name] =
          sensitiveParameterName.test(name) ||
          fields.has(name) ||
          paths.includes(name)
            ? masked
            : visit(entry, pathsBelow(paths, name), depth + 1);
      }
      return result;
    } finally {
      seen.delete(node);
    }
  };
  try {
    const copy = visit(value, paths, 0);
    const json = JSON.stringify(copy);
    return budget <= 0 || (json && Buffer.byteLength(json) > snapshotLimit)
      ? truncated
      : copy;
  } catch {
    return truncated;
  }
}
