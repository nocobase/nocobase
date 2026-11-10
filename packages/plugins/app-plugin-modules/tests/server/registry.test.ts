import { expect, it } from 'vitest';
import { DefaultModulesService } from '../../server/services/modules.js';
import type { ModuleDefinition } from '../../server/tokens.js';
const definition = (id: string): ModuleDefinition => ({
  id,
  packageName: `@acme/app-module-${id}`,
  namespace: id,
  entry: `/modules/${id}`,
  icon: 'Box',
  tone: 1,
});
it('starts dependencies first and cleans resources in reverse order', async () => {
  const service = new DefaultModulesService(),
    events: string[] = [];
  service.register({
    ...definition('child'),
    dependencies: ['parent'],
    start: async (stop) => {
      events.push('child');
      stop(() => {
        events.push('stop-child');
      });
    },
  });
  service.register({
    ...definition('parent'),
    start: async (stop) => {
      events.push('parent');
      stop(() => {
        events.push('stop-parent');
      });
    },
  });
  await expect(service.requireAvailable('parent')).rejects.toThrow('not ready');
  await service.ready();
  await service.requireAvailable('child');
  await service.shutdown();
  expect(events).toEqual(['parent', 'child', 'stop-child', 'stop-parent']);
});
it('rejects cycles and cleans partially started resources', async () => {
  const cycle = new DefaultModulesService();
  cycle.register({ ...definition('cycle'), dependencies: ['cycle'] });
  await expect(cycle.ready()).rejects.toThrow('Circular');
  const service = new DefaultModulesService(),
    events: string[] = [];
  service.register({
    ...definition('broken'),
    start: async (stop) => {
      stop(() => {
        events.push('stop');
      });
      throw new Error('start failed');
    },
  });
  await expect(service.ready()).rejects.toThrow('start failed');
  expect(events).toEqual(['stop']);
  await expect(service.requireAvailable('broken')).rejects.toThrow('not ready');
});

it('rejects database-backed modules when database startup never ran', async () => {
  const service = new DefaultModulesService(() => true);
  service.register(definition('database'));
  await expect(service.ready()).rejects.toThrow(
    'requires database initialization',
  );
});
