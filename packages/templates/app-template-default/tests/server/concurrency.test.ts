import { expect, it } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  concurrencyServiceToken,
  type ConcurrencyService,
} from '@nocobase/app-plugin-concurrency/server';
import { createStandaloneServer } from '../../server/standalone.js';
import concurrency from '../../server/config/concurrency.js';

class BusinessConsumer {
  public constructor(private readonly service: ConcurrencyService) {}
  public manager() {
    return this.service.getManager('memory');
  }
}

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: 'test-auth-secret-at-least-32-characters' },
  },
});

test('the real default composition supplies one memory lock domain to two business consumers', async ({
  app,
}) => {
  const service = app.container.resolve(concurrencyServiceToken);
  const first = new BusinessConsumer(service);
  const second = new BusinessConsumer(service);
  expect(app.config.get('concurrency')).toEqual({
    default: 'memory',
    memory: { adapter: 'mutex' },
  });
  const [left, right] = await Promise.all([first.manager(), second.manager()]);
  expect(left).toBe(right);
  expect(left).toBe(await service.getManager());
  const lock = await left.createLock('concurrency-test:business');
  const executor = await right.createSynchronous('concurrency-test:business');
  const lease = await lock.lock();
  try {
    expect(await executor.tryRun(() => 'should-not-run')).toEqual({
      acquired: false,
    });
  } finally {
    await lease.release();
  }
  expect(await executor.tryRun(() => 'done')).toEqual({
    acquired: true,
    value: 'done',
  });
});

it('declares only the default selector environment variable and no public configuration', () => {
  expect(concurrency.rules?.public).toEqual([]);
  expect(Object.keys(concurrency.rules?.env ?? {})).toEqual([
    'CONCURRENCY_DEFAULT',
  ]);
  expect(concurrency.rules?.validators).toHaveLength(1);
});
