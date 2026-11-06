import { expect, it } from 'vitest';

import { DemoReadOnlyError } from '../../server/errors.js';
import { DemoWriteGuard } from '../../server/guard.js';

function guarded() {
  const guard = new DemoWriteGuard();
  let inspect: (query: { sql: string }) => void = () => {};
  guard.attach(
    {
      client: {
        on(_event, listener) {
          inspect = listener;
        },
      },
    },
    'main',
  );
  return {
    guard,
    write: () => inspect({ sql: 'insert into "notes" ("id") values (?)' }),
  };
}

it('refuses writes while the request runs, but not work it left behind after it ended', async () => {
  const { guard, write } = guarded();
  let later!: () => void;
  const leftBehind = new Promise<void>((resolve, reject) => {
    later = () => {
      try {
        write();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
  });
  await guard.run({ method: 'POST', path: '/notes', blocked: [] }, async () => {
    expect(write).toThrow(DemoReadOnlyError);
    // Like an in-process job queued by the request: it keeps the request's async context.
    setTimeout(later, 0);
  });
  await expect(leftBehind).resolves.toBeUndefined();
});
