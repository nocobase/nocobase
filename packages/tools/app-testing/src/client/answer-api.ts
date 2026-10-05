/** A request to the application's API as a test answers it: relative to the API root, with its JSON body read. */
export interface ApiCall {
  readonly method: string;
  /** The path below the API root, such as `hub/api-keys`. */
  readonly path: string;
  /** The query parameters, present only when the request has any. A repeated name lists every value. */
  readonly query?: Readonly<Record<string, string | readonly string[]>>;
  /** The parsed JSON body, present only when the request has one. */
  readonly json?: unknown;
}

/**
 * Turns a function from calls to bodies into the `fetch` option of `renderWithApp()`, so a test answers the API the
 * way a page uses it rather than by building responses. The handler returns, or resolves to, the body to send as JSON
 * with status 200, or a `Response` to send as it is, such as one with another status. A handler that throws answers
 * with status 500 and the error's message, which the API client reports as a failed request, as it would a server
 * error; so does a request whose JSON body cannot be parsed, as a server would refuse it.
 */
export function answerApi(
  handler: (call: ApiCall) => unknown,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    try {
      const answer = await handler(await readCall(request));
      return answer instanceof Response
        ? answer
        : Response.json(answer ?? null);
    } catch (error) {
      return Response.json(
        {
          error: {
            message: error instanceof Error ? error.message : String(error),
          },
        },
        { status: 500 },
      );
    }
  };
}

async function readCall(request: Request): Promise<ApiCall> {
  const url = new URL(request.url);
  const apiIndex = url.pathname.indexOf('/api/');
  const path =
    apiIndex === -1
      ? url.pathname.replace(/^\/+/u, '')
      : url.pathname.slice(apiIndex + '/api/'.length);
  const query: Record<string, string | string[]> = {};
  for (const name of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(name);
    query[name] = values.length === 1 ? (values[0] ?? '') : values;
  }
  const text = await request.text();
  const isJson = (request.headers.get('content-type') ?? '').includes('json');
  return {
    method: request.method,
    path,
    ...(Object.keys(query).length > 0 ? { query } : {}),
    ...(text && isJson ? { json: JSON.parse(text) as unknown } : {}),
  };
}
