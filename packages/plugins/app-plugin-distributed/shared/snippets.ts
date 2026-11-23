import type { DistributedServiceKey } from './types.js';

/** The Redis runtime package that provides each service's shared adapter. */
export const REDIS_PLUGINS: Readonly<Record<DistributedServiceKey, string>> = {
  caching: '@nocobase/app-plugin-caching-redis',
  concurrency: '@nocobase/app-plugin-concurrency-redis',
  jobs: '@nocobase/app-plugin-jobs-redis',
  queue: '@nocobase/app-plugin-queue-redis',
  realtime: '@nocobase/app-plugin-realtime-redis',
};

/** Configuration fragments with placeholders only; connection options belong to each Redis plugin. */
export function sharedBackendSnippet(key: DistributedServiceKey): string {
  const hint = `# Connection options: see ${REDIS_PLUGINS[key]}`;
  switch (key) {
    case 'caching':
      return `caching:\n  default: redis\n  providers:\n    redis:\n      driver: redis\n      ${hint}`;
    case 'realtime':
      return `realtime:\n  broker:\n    adapter: redis\n    ${hint}`;
    default:
      return `${key}:\n  default: redis\n  backends:\n    redis:\n      adapter: redis\n      ${hint}`;
  }
}
