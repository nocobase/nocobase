import { rm } from 'node:fs/promises';

// tsc does not remove outputs belonging to deleted source modules.
await rm(new URL('../dist/', import.meta.url), {
  recursive: true,
  force: true,
});
