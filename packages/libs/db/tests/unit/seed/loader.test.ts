import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSeeds, validateSeeds } from '../../../src/index.js';

const tempRoot = join(process.cwd(), 'tests/.tmp');
const tempDirectories: string[] = [];

describe('seed loader', () => {
  afterEach(async () => {
    await Promise.all(
      tempDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it('loads multiple package sources in global name order', async () => {
    const firstDirectory = await createTempDirectory();
    const secondDirectory = await createTempDirectory();
    await writeSeed(
      firstDirectory,
      '202608210002_alpha_defaults',
      seedSource('202608210002_alpha_defaults'),
    );
    await writeSeed(
      secondDirectory,
      '202608210001_beta_defaults',
      seedSource('202608210001_beta_defaults'),
    );

    const seeds = await loadSeeds({
      sources: [
        { packageName: '@nocobase/plugin-alpha', directory: firstDirectory },
        { packageName: '@nocobase/plugin-beta', directory: secondDirectory },
      ],
    });

    expect(
      seeds.map(({ packageName, name }) => ({ packageName, name })),
    ).toEqual([
      {
        packageName: '@nocobase/plugin-beta',
        name: '202608210001_beta_defaults',
      },
      {
        packageName: '@nocobase/plugin-alpha',
        name: '202608210002_alpha_defaults',
      },
    ]);
    expect(seeds[0].checksum).toHaveLength(64);
  });

  it('defaults the single-directory package name to app', async () => {
    const directory = await createTempDirectory();
    await writeSeed(
      directory,
      '202608210001_app_defaults',
      seedSource('202608210001_app_defaults'),
    );

    const seeds = await validateSeeds(directory);

    expect(seeds).toHaveLength(1);
    expect(seeds[0].packageName).toBe('app');
  });

  it('rejects plain objects and file-name mismatches', async () => {
    const plainDirectory = await createTempDirectory();
    await writeSeed(
      plainDirectory,
      '202608210001_plain',
      `export default { name: '202608210001_plain', async run() {} };`,
    );

    await expect(loadSeeds({ directory: plainDirectory })).rejects.toThrow(
      'must default export defineSeed({...}).',
    );

    const mismatchDirectory = await createTempDirectory();
    await writeSeed(
      mismatchDirectory,
      '202608210001_file_name',
      seedSource('202608210001_different_name'),
    );

    await expect(loadSeeds({ directory: mismatchDirectory })).rejects.toThrow(
      'but file name requires "202608210001_file_name"',
    );
  });

  it('rejects duplicate names across package sources', async () => {
    const firstDirectory = await createTempDirectory();
    const secondDirectory = await createTempDirectory();
    const name = '202608210001_duplicate';
    await writeSeed(firstDirectory, name, seedSource(name));
    await writeSeed(secondDirectory, name, seedSource(name));

    await expect(
      loadSeeds({
        sources: [
          { packageName: '@nocobase/plugin-alpha', directory: firstDirectory },
          { packageName: '@nocobase/plugin-beta', directory: secondDirectory },
        ],
      }),
    ).rejects.toThrow(`Duplicate seed name "${name}"`);
  });

  it('validates source options and transaction mode', async () => {
    const directory = await createTempDirectory();

    await expect(loadSeeds({})).rejects.toThrow(
      'Seed options must define directory or sources.',
    );
    await expect(loadSeeds({ directory, sources: [] })).rejects.toThrow(
      'Seed options cannot define both directory and sources.',
    );
    await expect(
      loadSeeds({ sources: [{ packageName: ' ', directory }] }),
    ).rejects.toThrow('Seed packageName must be a non-empty string.');

    await writeSeed(
      directory,
      '202608210001_invalid_transaction',
      `
      import { defineSeed } from '../../../src/index.js';
      export default defineSeed({
        name: '202608210001_invalid_transaction',
        transaction: 'always',
        async run() {},
      });
    `,
    );
    await expect(loadSeeds({ directory })).rejects.toThrow(
      'transaction must be true, false, or "auto".',
    );
  });

  it('accepts a boolean sample flag and rejects anything else', async () => {
    const valid = await createTempDirectory();
    await writeSeed(
      valid,
      '202610060001_sample',
      `
      import { defineSeed } from '../../../src/index.js';
      export default defineSeed({
        name: '202610060001_sample',
        sample: true,
        async run() {},
      });
    `,
    );
    const [loaded] = await loadSeeds({ directory: valid });
    expect(loaded?.seed.sample).toBe(true);

    const invalid = await createTempDirectory();
    await writeSeed(
      invalid,
      '202610060002_invalid_sample',
      `
      import { defineSeed } from '../../../src/index.js';
      export default defineSeed({
        name: '202610060002_invalid_sample',
        sample: 'yes',
        async run() {},
      });
    `,
    );
    await expect(loadSeeds({ directory: invalid })).rejects.toThrow(
      'sample must be true or false.',
    );
  });
});

async function createTempDirectory(): Promise<string> {
  await mkdir(tempRoot, { recursive: true });
  const directory = await mkdtemp(join(tempRoot, 'seeds-'));
  tempDirectories.push(directory);
  return directory;
}

async function writeSeed(
  directory: string,
  name: string,
  source: string,
): Promise<void> {
  await writeFile(join(directory, `${name}.ts`), trimSource(source));
}

function seedSource(name: string): string {
  return `
      import { defineSeed } from '../../../src/index.js';

      export default defineSeed({
        name: '${name}',
        async run() {},
      });
    `;
}

function trimSource(source: string): string {
  return `${source.trim().replace(/^ {6}/gm, '')}\n`;
}
