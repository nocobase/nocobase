// @vitest-environment node
/**
 * An App created without its own runtime policy takes its environment's defaults.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from './harness.js';

describe('environment App defaults', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({ id: 'apps', name: 'Apps', driver: 'fake' });
  });
  afterEach(async () => {
    await harness.close();
  });

  it('gives an App without its own policy the environment defaults', async () => {
    const owner = await harness.as('owner', 'admin');
    await harness.services.environments.update(owner, 'apps', {
      defaultIdleStopMinutes: 10,
      defaultDormantAfterHours: 24,
      maxApps: 5,
    });
    expect(
      await harness.services.environments.get(owner, 'apps'),
    ).toMatchObject({
      defaultIdleStopMinutes: 10,
      defaultDormantAfterHours: 24,
      maxApps: 5,
    });
    const preview = await harness.services.releases.createApp(owner, {
      id: 'fg-1--shop',
      name: 'FG-1',
      environmentId: 'apps',
      activation: 'onDemand',
    });
    expect(preview.app).toMatchObject({
      activation: 'onDemand',
      idleStopMinutes: 10,
      dormantAfterHours: 24,
    });
    // Its own policy wins, null included.
    const steady = await harness.services.releases.createApp(owner, {
      id: 'steady',
      name: 'Steady',
      environmentId: 'apps',
      idleStopMinutes: null,
      dormantAfterHours: null,
    });
    expect(steady.app).toMatchObject({
      idleStopMinutes: null,
      dormantAfterHours: null,
    });
    await expect(
      harness.services.environments.update(owner, 'apps', {
        defaultIdleStopMinutes: -1,
      }),
    ).rejects.toMatchObject({ status: 'INVALID_ARGUMENT' });
  });
});
