import { afterEach, expect, it, vi } from 'vitest';
import { createLogger } from '@nocobase/logging';
import { createResendProviderDefinition } from '../src/email/index.js';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('does not let SDK diagnostics leak raw provider responses in development', async () => {
  const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            name: 'validation_error',
            statusCode: 400,
            message:
              'private@example.test https://example.test/reset?token=private-token',
          }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        ),
      ),
    ),
  );
  const provider = await createResendProviderDefinition().createProvider(
    {
      logger: createLogger({ level: 'silent' }),
      now: () => Promise.resolve(new Date().toISOString()),
    },
    { provider: 'resend', apiKey: 'test-api-key', from: 'system@example.test' },
  );
  const result = await provider.send({
    notificationId: 'n',
    deliveryId: 'd',
    attemptId: 'a',
    deadline: new Date(Date.now() + 1000).toISOString(),
    signal: new AbortController().signal,
    message: {
      to: 'receiver@example.test',
      content: { to: 'receiver@example.test', subject: 'Test', text: 'Test' },
    },
  });
  expect(result.status).toBe('failed');
  expect(diagnostic).not.toHaveBeenCalled();
  expect(JSON.stringify(result)).not.toContain('private-token');
  expect(JSON.stringify(result)).not.toContain('private@example.test');
});
