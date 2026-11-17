import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import { expect, it } from 'vitest';

import { defineFoundationConfig } from '../../config.js';

async function load(environment: Record<string, string> = {}, file = {}) {
  const config = new AppConfig();
  await config.loadAll();
  const sections = defaultAppConfigs({ foundation: defineFoundationConfig() });
  config.mergeDefaults({ ...sections({} as never), ...file });
  config.defineSections(sections.sections!);
  await config.loadSectionEnvironment(environment);
  return config;
}

it('scans on start by default and lists the variable that turns it off', async () => {
  const config = await load();
  expect(config.get('foundation')).toEqual({ scanOnStart: true });
  expect(config.environmentVariableMappings()).toMatchObject({
    FOUNDATION_SCAN_ON_START: {
      path: 'foundation.scanOnStart',
      type: 'boolean',
      required: false,
    },
  });
  expect(config.publicPaths()).toEqual([]);
});

it('reads scanOnStart from the environment', async () => {
  const config = await load({ FOUNDATION_SCAN_ON_START: 'false' });
  expect(config.get('foundation')).toEqual({ scanOnStart: false });
  expect(await config.validate()).toEqual([]);
});

it('rejects a scanOnStart that is not a boolean', async () => {
  const config = await load({}, { foundation: { scanOnStart: 'no' } });
  expect(await config.validate()).toContainEqual(
    expect.objectContaining({ path: 'foundation.scanOnStart' }),
  );
});
