// The request a manifest command makes, from the values given for its parameters: path parameters fill the route's
// `{field}` placeholders, query parameters the query string (an array repeats), body parameters the body's fields. It
// imports nothing, so a server that calls its own routes the way the CLI does (an online agent's tools) shares it.

/** The part of a manifest parameter the request needs. */
export interface RequestParameter {
  readonly field: string;
  readonly in: 'path' | 'query' | 'body' | 'file';
}

/** The part of a manifest command the request needs. */
export interface RequestCommand {
  readonly method: string;
  /** Below the server's origin, with `{field}` placeholders. */
  readonly path: string;
}

/** A command's request: its method, its path with the query string, and its body's fields. */
export interface FilledRequest {
  readonly method: string;
  readonly path: string;
  readonly fields: Record<string, unknown>;
}

/** A value as it goes into a path or a query string. */
export function requestText(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Fills `command`'s request with `values`, each a parameter and its value; `base` holds body fields the values then
 * override, such as a body read from a file. `file` parameters are left to the caller.
 */
export function fillRequest(
  command: RequestCommand,
  values: Iterable<readonly [RequestParameter, unknown]>,
  base: Readonly<Record<string, unknown>> = {},
): FilledRequest {
  let route = command.path;
  const query = new URLSearchParams();
  const fields: Record<string, unknown> = { ...base };
  for (const [parameter, value] of values) {
    if (value === undefined) continue;
    if (parameter.in === 'path')
      route = route.replace(
        `{${parameter.field}}`,
        encodeURIComponent(requestText(value)),
      );
    else if (parameter.in === 'query') {
      for (const item of Array.isArray(value) ? value : [value])
        query.append(parameter.field, requestText(item));
    } else if (parameter.in === 'body') fields[parameter.field] = value;
  }
  const search = query.toString();
  return {
    method: command.method,
    path: search ? `${route}?${search}` : route,
    fields,
  };
}
