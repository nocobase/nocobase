import { sensitiveParameterName } from '../secrets/sensitive-name.js';

const rawLimit = 256 * 1024;
const snapshotLimit = 16 * 1024;
// A JSON stream may never finish. Collection must not hold the HTTP response open indefinitely.
const snapshotReadTimeout = 1000;
const masked = '******';
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

/** Replace sensitive values before applying the serialized size limit. */
export function auditSnapshot(
  value: unknown,
  fields: ReadonlySet<string>,
  paths: ReadonlySet<string>,
): unknown {
  if (value === undefined) return undefined;
  let budget = snapshotLimit;
  const seen = new Set<object>();
  const visit = (node: unknown, path: string, depth: number): unknown => {
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
        for (const item of node as unknown[]) {
          budget -= 1;
          if (budget <= 0) break;
          values.push(visit(item, path, depth + 1));
        }
        return values;
      }
      const result = Object.create(null) as Record<string, unknown>;
      for (const [name, entry] of Object.entries(
        node as Record<string, unknown>,
      )) {
        budget -= name.length + 1;
        if (budget <= 0) break;
        const key = path ? `${path}.${name}` : name;
        result[name] =
          sensitiveParameterName.test(name) ||
          fields.has(name) ||
          paths.has(key)
            ? masked
            : visit(entry, key, depth + 1);
      }
      return result;
    } finally {
      seen.delete(node);
    }
  };
  try {
    const copy = visit(value, '', 0);
    const json = JSON.stringify(copy);
    return budget <= 0 || (json && Buffer.byteLength(json) > snapshotLimit)
      ? truncated
      : copy;
  } catch {
    return truncated;
  }
}
