import { it, expect } from 'vitest';
import { ControlledBackend, runBackendContract } from '../src/testing/index.ts';
it('executes the framework-neutral public backend driver with a controlled test double', async () => {
  const held = new Map<string, string>();
  const result = await runBackendContract({
    createBackend: () =>
      new ControlledBackend({
        acquire: async (request, context) => {
          const key = JSON.stringify([
            request.resource.namespace,
            request.resource.kind,
            request.resource.name,
          ]);
          if (held.has(key)) return undefined;
          held.set(key, request.token);
          return {
            notAfter: context.clock.now() + request.resource.ttl,
            release: async () => {
              if (held.get(key) === request.token) held.delete(key);
            },
          };
        },
      }),
  });
  expect(result.cases.length).toBeGreaterThan(5);
  expect(held.size).toBe(0);
});
