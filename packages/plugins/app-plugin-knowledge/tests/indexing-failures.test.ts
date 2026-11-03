// @vitest-environment node
import { afterEach, describe, it, expect } from 'vitest';
import { indexingFailure } from '../server/indexing/failures.js';
import { withinSignal } from '../server/indexing/budget.js';
import { invalid } from '../server/errors.js';
import { indexingFixture, type IndexingFixture } from './indexing-fixture.js';
import { workRepo } from '../server/indexing/store.js';
import { indexingFailureKey } from '../client/indexing/failures.js';
import enUS from '../client/locales/en-US.js';

const privateMessage =
  'private-provider-key postgres://user:password@private-host document-text';
let fixture: IndexingFixture | undefined;
afterEach(async () => {
  await fixture?.close();
  fixture = undefined;
});

describe('safe Knowledge execution failure boundaries', () => {
  it.each([
    ['network', 'INDEXING_MODEL_UNAVAILABLE', true],
    ['rateLimit', 'INDEXING_MODEL_RATE_LIMITED', true],
    ['auth', 'INDEXING_MODEL_AUTH_FAILED', false],
    ['quota', 'INDEXING_MODEL_QUOTA_EXCEEDED', false],
    ['config', 'INDEXING_MODEL_CONFIG_INVALID', false],
    ['filtered', 'INDEXING_MODEL_INPUT_REJECTED', false],
    ['contextOverflow', 'INDEXING_MODEL_INPUT_TOO_LONG', false],
    ['badResponse', 'INDEXING_MODEL_RESPONSE_INVALID', false],
    ['SQLITE_BUSY', 'INDEXING_STORAGE_BUSY', true],
    ['SQLITE_LOCKED', 'INDEXING_STORAGE_BUSY', true],
    ['40001', 'INDEXING_STORAGE_BUSY', true],
    ['40P01', 'INDEXING_STORAGE_BUSY', true],
    ['57P01', 'INDEXING_STORAGE_UNAVAILABLE', true],
    ['08006', 'INDEXING_STORAGE_UNAVAILABLE', true],
    ['ETIMEDOUT', 'INDEXING_TIMEOUT', true],
    ['ECONNRESET', 'INDEXING_STORAGE_UNAVAILABLE', true],
    ['ECONNREFUSED', 'INDEXING_STORAGE_UNAVAILABLE', true],
    ['ENOTFOUND', 'INDEXING_STORAGE_UNAVAILABLE', true],
    ['28P01', 'INDEXING_STORAGE_AUTH_FAILED', false],
    ['28000', 'INDEXING_STORAGE_AUTH_FAILED', false],
    ['42501', 'INDEXING_STORAGE_PERMISSION_DENIED', false],
    ['25006', 'INDEXING_STORAGE_PERMISSION_DENIED', false],
    ['3D000', 'INDEXING_STORAGE_SCHEMA_UNAVAILABLE', false],
    ['3F000', 'INDEXING_STORAGE_SCHEMA_UNAVAILABLE', false],
    ['42P01', 'INDEXING_STORAGE_SCHEMA_UNAVAILABLE', false],
  ])(
    'classifies %s using only its documented code',
    (code, reason, retryable) => {
      expect(
        indexingFailure(Object.assign(new Error(privateMessage), { code })),
      ).toEqual({ retryable, reason, message: 'Knowledge indexing failed.' });
      const key = indexingFailureKey(String(reason));
      expect(key).not.toBe('indexing.workFailed');
      expect(enUS).toHaveProperty(key);
    },
  );
  it.each(['unknown', 'constructor', '__proto__', privateMessage])(
    'does not expose an unrecognized code: %s',
    (code) => {
      expect(
        indexingFailure(Object.assign(new Error(privateMessage), { code })),
      ).toEqual({
        retryable: false,
        reason: 'INDEXING_UNAVAILABLE',
        message: 'Knowledge indexing failed.',
      });
    },
  );
  it('preserves explicit Knowledge reasons without exposing their messages', () => {
    expect(
      indexingFailure(
        invalid('INDEXING_VECTOR_EXTENSION_MISSING', privateMessage),
      ),
    ).toEqual({
      retryable: false,
      reason: 'INDEXING_VECTOR_EXTENSION_MISSING',
      message: 'Knowledge indexing failed.',
    });
  });
  it('does not classify message text or a response body as a known failure', () => {
    expect(
      indexingFailure(
        Object.assign(
          new Error('Invalid API-key provided. network 503 ETIMEDOUT'),
          { responseBody: { code: 'auth' } },
        ),
      ),
    ).toEqual({
      retryable: false,
      reason: 'INDEXING_UNAVAILABLE',
      message: 'Knowledge indexing failed.',
    });
  });
  it('stops waiting on a provider that ignores its deadline signal', async () => {
    const controller = new AbortController();
    const result = withinSignal(
      controller.signal,
      async () => new Promise<never>(() => {}),
    );
    controller.abort(new DOMException('Deadline.', 'TimeoutError'));
    await expect(result).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(indexingFailure(controller.signal.reason)).toEqual({
      retryable: true,
      reason: 'INDEXING_TIMEOUT',
      message: 'Knowledge indexing failed.',
    });
  });
  it('persists the model authentication reason through a real host job and exposes only safe status data', async () => {
    const f = (fixture = await indexingFixture());
    const doc = await f.create();
    f.embed.mockRejectedValue(
      Object.assign(new Error(privateMessage), { code: 'auth' }),
    );
    const receipt = await f.enable();
    await expect
      .poll(
        async () =>
          (
            await workRepo(f.h.database.connection()).findOne({
              filter: { generationId: receipt.generationId!, docId: doc.id },
            })
          )?.errorReason,
      )
      .toBe('INDEXING_MODEL_AUTH_FAILED');
    const status = await f.runtime.service.status(f.context);
    expect(status.target?.error).toEqual({
      reason: 'INDEXING_MODEL_AUTH_FAILED',
      message: 'Knowledge indexing failed.',
    });
    expect(JSON.stringify(status)).not.toContain(privateMessage);
  });
});
