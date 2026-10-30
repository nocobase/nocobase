import {
  type AppConcurrencyConfig,
  type ConcurrencyConfigEntry,
  type ConcurrencyService,
  type OwnedConcurrencyBackend,
} from '@nocobase/app-plugin-concurrency/server';
import type { ConcurrentManager, Lock } from '@nocobase/concurrency';
declare const service: ConcurrencyService;
const config: AppConcurrencyConfig = {
  default: 'memory',
  memory: { adapter: 'mutex', ttl: 30000 },
};
const entry: ConcurrencyConfigEntry = { adapter: 'mutex' };
// @ts-expect-error Mutex never accepts a connection.
const wrong: ConcurrencyConfigEntry = { adapter: 'mutex', connection: {} };
const manager: Promise<ConcurrentManager> = service.getManager();
declare const backend: OwnedConcurrencyBackend;
declare const lock: Lock;
// @ts-expect-error Resource defaults do not introduce acquisition timeouts.
lock.lock({ timeoutMs: 100 });
// @ts-expect-error Business managers cannot close the host runtime.
manager.then((value) => value.close());
void [config, entry, wrong, manager, backend];
