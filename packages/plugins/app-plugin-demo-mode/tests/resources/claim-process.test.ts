import { access, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { expect, it } from 'vitest';
import { demoConfigurationRuntimeToken } from '../../server/configuration/runtime-token.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

it.skipIf(!process.env.DEMO_CLAIM_CONFIG)(
  'claims from an independent application process',
  async () => {
    const output = process.env.DEMO_CLAIM_OUTPUT!;
    const server = await createStandaloneServer({
      configPath: process.env.DEMO_CLAIM_CONFIG!,
      viteDevUrl: false,
      env: { APP_STORAGE_DIR: `${output}-storage` },
    });
    try {
      await writeFile(`${output}.ready`, 'ready');
      const deadline = Date.now() + 20_000;
      while (
        !(await access(process.env.DEMO_CLAIM_GATE!).then(
          () => true,
          () => false,
        ))
      ) {
        expect(Date.now()).toBeLessThan(deadline);
        await setTimeout(20);
      }
      const claim = await server.application.container
        .resolve(demoConfigurationRuntimeToken)
        .claimDaily(new Date('2026-10-29T03:00:00Z'));
      await writeFile(output, JSON.stringify(claim));
    } finally {
      await server.close();
    }
  },
  30_000,
);
