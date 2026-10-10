// @vitest-environment node
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { expect, it } from 'vitest';

const exec = promisify(execFile);
async function compile(config: string): Promise<void> {
  try {
    await exec('pnpm', ['exec', 'tsc', '-p', config], { cwd: appRoot });
  } catch (error) {
    throw new Error((error as { stdout: string }).stdout, { cause: error });
  }
}
const appRoot = fileURLToPath(new URL('../../', import.meta.url));

it('runs compiled extensionless server imports without source files or a loader', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'app-esm-imports-'));
  try {
    const source = path.join(directory, 'source');
    await mkdir(path.join(source, 'nested'), { recursive: true });
    await writeFile(path.join(directory, 'package.json'), '{"type":"module"}');
    await writeFile(
      path.join(source, 'value.ts'),
      'export const value: number = 42;',
    );
    await writeFile(
      path.join(source, 'nested/index.ts'),
      "export { value } from '../value';",
    );
    await writeFile(
      path.join(source, 'main.ts'),
      `
      import { value } from './nested';
      import { value as explicit } from './value.js';
      const dynamic = await import('./value');
      export const result: number[] = [value, explicit, dynamic.value];
    `,
    );
    const config = path.join(directory, 'tsconfig.json');
    await writeFile(
      config,
      JSON.stringify({
        extends: path.join(appRoot, 'tsconfig.server.json'),
        compilerOptions: {
          rootDir: source,
          outDir: path.join(directory, 'dist'),
          types: [],
        },
        include: [path.join(source, '**/*.ts')],
      }),
    );
    // Use the same two stages as the shared application build.
    await compile(config);
    await exec(
      'pnpm',
      [
        'exec',
        'tsc-alias',
        '-p',
        'tsconfig.server.json',
        '--outDir',
        path.join(directory, 'dist'),
      ],
      { cwd: appRoot },
    );
    await rm(source, { recursive: true });
    const runner = path.join(directory, 'runner.mjs');
    await writeFile(
      runner,
      `
      import { result } from './dist/main.js';
      import { writeFileSync } from 'node:fs';
      writeFileSync(new URL('./result.json', import.meta.url), JSON.stringify(result));
    `,
    );
    await exec(process.execPath, [runner], { env: { PATH: process.env.PATH } });
    expect(
      JSON.parse(await readFile(path.join(directory, 'result.json'), 'utf8')),
    ).toEqual([42, 42, 42]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 30_000);
