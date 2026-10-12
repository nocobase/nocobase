// @vitest-environment node
/**
 * The demo is Studio's sample data: the provider registers it on `sampleDataToken`, and the framework decides when it
 * runs (a fresh install with `app.sampleData`) and records it.
 */
import type { Application } from '@nocobase/app-server/application';
import {
  createSampleDataService,
  sampleDataToken,
  type SampleDataRecord,
} from '@nocobase/app-server/sample-data';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';

import StudioDemoProvider from '../../server/demo/provider.js';

function application(): {
  app: Application;
  container: ServiceContainer;
} {
  const container = new ServiceContainer();
  container.singleton(sampleDataToken, () => createSampleDataService());
  const app = {
    container,
    config: { get: () => undefined },
  } as unknown as Application;
  return { app, container };
}

describe('the demo data', () => {
  it('registers as sample data, built only when the installation asks for it', async () => {
    const { app, container } = application();
    await new StudioDemoProvider(app).boot();
    const service = container.resolve(sampleDataToken);
    expect(
      service.registrations().map(({ name, packageName }) => ({
        name,
        packageName,
      })),
    ).toEqual([
      { name: 'studio/demo', packageName: '@nocobase/studio' },
      // After the demo, whose people and projects it builds on.
      { name: 'studio/demo-deploy', packageName: '@nocobase/studio' },
    ]);

    const records = new Map<string, SampleDataRecord['status']>();
    const ledger = {
      history: async (): Promise<SampleDataRecord[]> =>
        [...records].map(([name, status]) => ({ name, status })),
      record: async (entry: {
        name: string;
        status: SampleDataRecord['status'];
      }): Promise<void> => {
        records.set(entry.name, entry.status);
      },
    };

    // Not asked for: recorded as skipped, nothing built.
    service.prepare({ ledger, enabled: false });
    expect(await service.run()).toMatchObject({
      skipped: ['studio/demo', 'studio/demo-deploy'],
    });
    expect(records.get('sample-data:studio/demo')).toBe('skipped');
    expect(records.get('sample-data:studio/demo-deploy')).toBe('skipped');

    // Asked for, but without the plugins the demo goes through: reported, and left to run again.
    service.rerunSkipped();
    const result = await service.run();
    expect(result.failed.map((entry) => entry.name)).toEqual([
      'studio/demo',
      'studio/demo-deploy',
    ]);
    expect(String(result.failed[0]?.error)).toContain(
      'The demo needs the projects and users plugins.',
    );
    expect(String(result.failed[1]?.error)).toContain(
      'The deployment demo needs the projects and users plugins',
    );
    expect(records.get('sample-data:studio/demo')).toBe('skipped');
    expect(records.get('sample-data:studio/demo-deploy')).toBe('skipped');
  });

  it('registers nothing where the application offers no sample data', async () => {
    const container = new ServiceContainer();
    const app = { container, config: { get: () => undefined } };
    await new StudioDemoProvider(app as unknown as Application).boot();
    expect(container.has(sampleDataToken)).toBe(false);
  });
});
