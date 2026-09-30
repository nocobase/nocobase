import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { defineQueueContract } from '../contract/queue-contract.js';

const storage = mkdtempSync(path.join(tmpdir(), 'nocobase-queue-contract-'));

defineQueueContract({
  name: 'inMemory',
  entry: (namespace) => ({
    adapter: 'inMemory',
    namespace,
    persistence: { path: storage },
  }),
});
