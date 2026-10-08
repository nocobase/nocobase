import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createApplicationConfig,
  createClientLibraryConfig,
} from '../eslint/index.ts';

let root: string;

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'eslint-client-env-'));
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

const restricted =
  'Read runtime values from the client configuration (resolveAppUrl, useClientApplication().config); use resolveAssetUrl for built assets. import.meta.env is limited to PROD, DEV, MODE and BASE_URL.';

async function lint(
  configs: ReturnType<typeof createApplicationConfig>,
  file: string,
  source: string,
): Promise<string[]> {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: configs,
  });
  const [result] = await eslint.lintText(source, {
    filePath: path.join(root, file),
  });
  return (result?.messages ?? []).map((message) => message.message);
}

describe('import.meta.env in browser code', () => {
  it.each([
    [
      'an application',
      createApplicationConfig({ tsconfigRootDir: root }),
      'client/api.jsx',
    ],
    [
      'a client library',
      createClientLibraryConfig({ tsconfigRootDir: root }),
      'src/api.jsx',
    ],
  ])('refuses a custom variable in %s', async (_, configs, file) => {
    const messages = await lint(
      configs,
      file,
      'export const url = import.meta.env.NOCOBASE_API_URL;\nexport const cdn = import.meta.env?.CDN_BASE_URL;\n',
    );
    expect(messages.filter((message) => message === restricted)).toHaveLength(
      2,
    );
  });

  it('allows the build-mode flags and asset base Vite replaces with literals', async () => {
    const messages = await lint(
      createApplicationConfig({ tsconfigRootDir: root }),
      'client/mode.jsx',
      'export const flags = [import.meta.env.PROD, import.meta.env.DEV, import.meta.env.MODE];\nexport const base = import.meta.env.BASE_URL;\nexport const optionalBase = import.meta.env?.BASE_URL;\n',
    );
    expect(messages).not.toContain(restricted);
  });

  it('leaves server code alone', async () => {
    const messages = await lint(
      createApplicationConfig({ tsconfigRootDir: root }),
      'server/env.mjs',
      'export const url = import.meta.env.NOCOBASE_API_URL;\n',
    );
    expect(messages).not.toContain(restricted);
  });
});
