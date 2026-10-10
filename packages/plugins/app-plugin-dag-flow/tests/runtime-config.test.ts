import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { resolveWorkflowRuntimeConfig } from '../server/config.js';

describe('workflow runtime paths', () => {
  const rootDir = path.resolve('/tmp/workflow-app');
  const config = {
    sourceRoot: path.join(rootDir, 'workflows'),
    distRoot: '',
    artifactDisk: 'local',
    production: false,
  };

  it('loads development sources and builds artifacts at application level', () => {
    expect(
      resolveWorkflowRuntimeConfig(config, {
        rootDir,
        serverDir: path.join(rootDir, 'server'),
      }),
    ).toMatchObject({
      sourceRoot: path.join(rootDir, 'workflows'),
      distRoot: path.join(rootDir, 'dist/workflows'),
      production: false,
    });
  });

  it('resolves compiled artifacts beside the server for standalone and hosted apps', () => {
    const serverDir = path.join(rootDir, 'releases/current/dist/server');
    expect(
      resolveWorkflowRuntimeConfig(config, {
        rootDir: path.join(rootDir, 'persistent'),
        serverDir,
      }),
    ).toMatchObject({
      distRoot: path.join(rootDir, 'releases/current/dist/workflows'),
      production: true,
    });
  });

  it('preserves an explicitly configured source root', () => {
    expect(
      resolveWorkflowRuntimeConfig(
        { ...config, sourceRoot: '/custom/flows' },
        {
          rootDir,
          serverDir: path.join(rootDir, 'server'),
        },
      ).sourceRoot,
    ).toBe('/custom/flows');
  });
});
