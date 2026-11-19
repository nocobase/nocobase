import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { AppConfig, envString } from '@nocobase/app-server/config';

it('keeps source attribution for equal overrides and strips credentials from both views', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'inspector-'));
  try {
    const file = path.join(dir, 'config.yml');
    await writeFile(
      file,
      'app:\n  publicOrigin: https://admin:private-key@example.com/foo?token=private-key\nusers:\n  initialAdmin:\n    password: private-key\ncustom:\n  token: private-key\n',
    );
    const config = new AppConfig().loadFile(file);
    await config.loadAll();
    config.defineSections(
      new Map([
        [
          'app',
          {
            validators: [],
            public: [],
            env: { APP_PUBLIC_ORIGIN: envString('publicOrigin') },
          },
        ],
      ]),
    );
    await config.loadSectionEnvironment({
      APP_PUBLIC_ORIGIN:
        'https://admin:private-key@example.com/foo?token=private-key',
    });
    expect(config.inspectSettings()).toContainEqual({
      path: 'app.publicOrigin',
      value: 'https://example.com',
      fileValue: 'https://example.com',
      source: 'environment',
      variable: 'APP_PUBLIC_ORIGIN',
    });
    expect(JSON.stringify(config.inspectSettings())).not.toContain(
      'private-key',
    );
    expect(JSON.stringify(config.inspectSettings())).not.toContain('custom');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
