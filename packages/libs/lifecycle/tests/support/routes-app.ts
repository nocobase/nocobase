// A runtime with the ticket fixture behind the routes the React client
// expects, answered in process: `{ data }` on success and the standard error
// body built from lifecycleErrorFields() on a refusal, as a plugin's routes
// answer them.
import {
  LifecycleError,
  lifecycleDescriptionView,
  lifecycleErrorFields,
  LifecycleRuntime,
  MemoryLifecycleStore,
  type JsonObject,
  type LifecycleActor,
} from '../../src/index.js';
import type { LifecycleRequest, LifecycleTransport } from '../../src/react.js';
import { ticketLifecycle } from '../fixtures/ticket.js';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function routesApp() {
  const store = new MemoryLifecycleStore();
  const sent: string[] = [];
  const runtime = new LifecycleRuntime({ store });
  runtime.register(ticketLifecycle, {
    services: { mail: { send: (to) => void sent.push(to) } },
  });
  const ticket = store.insertRecord('tickets', {
    customerEmail: 'a@example.com',
    status: 'open',
    statusChangedAt: '2026-10-01T09:00:00.000Z',
    lifecycleVersion: 0,
  });

  /** One request: the path below the base path, and who sends it. */
  async function answer(
    request: LifecycleRequest,
    actor: LifecycleActor,
  ): Promise<unknown> {
    const [lifecycle = '', id = '', ...rest] = request.path
      .replace(/^\/+/, '')
      .split('/')
      .map(decodeURIComponent);
    const body = isObject(request.json) ? request.json : {};
    if (id === 'lifecycle') return lifecycleDescriptionView(runtime, lifecycle);
    if (!rest.length) return runtime.view(lifecycle, id, actor);
    if (rest[0] === 'fire') {
      const result = await runtime.fire(
        lifecycle,
        id,
        String(body.transition),
        {
          actor,
          input: (body.input ?? {}) as JsonObject,
          requestId: String(body.requestId),
          ...(body.expectVersion === undefined
            ? {}
            : { expect: { version: body.expectVersion as number | null } }),
        },
      );
      return {
        ...(await runtime.view(lifecycle, id, actor)),
        replayed: result.replayed === true,
      };
    }
    const [, runId = '', action] = rest;
    if (action === 'retry')
      await runtime.retryRun(runId, { force: body.force === true });
    else if (action === 'continue') await runtime.continueRun(runId);
    else await runtime.cancelRun(runId);
    return runtime.view(lifecycle, id, actor);
  }

  const transport = (actor: string): LifecycleTransport => ({
    async request<T>(request: LifecycleRequest): Promise<T> {
      try {
        return { data: await answer(request, { id: actor }) } as T;
      } catch (error) {
        const fields =
          error instanceof LifecycleError
            ? lifecycleErrorFields(error, { inputField: 'input' })
            : undefined;
        if (!fields) throw error;
        // The shape an application's API client rejects with.
        throw Object.assign(new Error(fields.message), {
          payload: { error: { ...fields, domain: 'test' } },
        });
      }
    },
  });
  return { runtime, store, sent, id: String(ticket.id), transport };
}
