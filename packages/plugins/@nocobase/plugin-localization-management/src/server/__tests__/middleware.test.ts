import { MockServer, createMockServer } from '@nocobase/test';
import PluginLocalizationServer from '../plugin';

describe('middleware', () => {
  let app: MockServer;
  let agent: any;
  let plugin: PluginLocalizationServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['localization-management', 'client', 'ui-schema-storage', 'system-settings'],
    });
    await app.localeManager.load();
    agent = app.agent();
    plugin = app.pm.get('localization-management') as PluginLocalizationServer;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should merge resources', async () => {
    vi.spyOn(plugin.resources, 'getResources').mockResolvedValue({
      'test-resource': {
        'test-text': 'text Translation',
      },
    });
    const res = await agent.resource('app').getLang();
    const data = JSON.parse(res.text);
    const resources = data.data.resources;
    expect(resources['test-resource']).toBeDefined();
    expect(resources['test-resource']['test-text']).toBe('text Translation');
  });
});
