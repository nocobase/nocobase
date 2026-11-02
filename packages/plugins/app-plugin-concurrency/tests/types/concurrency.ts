import type {
  ConcurrencyInstance,
  ConcurrencyImplementation,
  ConcurrencyService,
} from '@nocobase/app-plugin-concurrency/server';
import type { ConcurrentManager } from '@nocobase/concurrency';
declare const service: ConcurrencyService;
declare const manager: ConcurrentManager;
const implementation: ConcurrencyImplementation = {
  validate: () => {},
  create: (): ConcurrencyInstance => ({
    manager,
    start: async () => {},
    shutdown: async () => {},
  }),
};
service.registerImplementation('typeTest', implementation);
const asynchronous: ConcurrencyImplementation = {
  validate: () => {},
  // @ts-expect-error Implementations return an owned instance synchronously.
  create: async () => ({
    manager,
    start: async () => {},
    shutdown: async () => {},
  }),
};
// @ts-expect-error Managers expose business factories, not shutdown.
manager.shutdown();
void asynchronous;
