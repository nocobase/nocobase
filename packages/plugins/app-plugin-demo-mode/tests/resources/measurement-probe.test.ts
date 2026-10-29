import { writeFile } from 'node:fs/promises';
import { createTestApp } from '@nocobase/app-testing/server';
import { it } from 'vitest';
import { createStandaloneServer } from '../helpers/minimal-app.js';

it.skipIf(!process.env.DEMO_RESOURCE_PROBE_OUTPUT)(
  'records application close after normal or exceptional execution',
  async () => {
    const app = await createTestApp({ createServer: createStandaloneServer });
    let appCloseState = 'failed';
    try {
      if (process.env.DEMO_RESOURCE_PROBE_FAIL)
        throw new Error('Expected measurement probe failure');
    } finally {
      try {
        await app.close();
        appCloseState = 'completed';
      } finally {
        await writeFile(
          process.env.DEMO_RESOURCE_PROBE_OUTPUT!,
          JSON.stringify({
            appPid: process.pid,
            appCloseState,
            maxRssThroughAppCloseKiB: process.resourceUsage().maxRSS,
          }),
        );
      }
    }
  },
);
