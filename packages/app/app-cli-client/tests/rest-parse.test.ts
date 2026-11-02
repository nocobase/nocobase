import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { configureAppCli } from '../src/config.ts';
import type { CliCommand, CliParameter } from '../src/dynamic/manifest.ts';
import { parseRestCall } from '../src/dynamic/rest.ts';
import { TEST_CLI } from './helpers.ts';

beforeAll(() => configureAppCli(TEST_CLI));

const command = (parameters: CliParameter[]): CliCommand => ({
  id: 'app:env:set',
  summary: 'Set a variable',
  method: 'PUT',
  path: '/api/apps/{appId}/variables/{name}',
  parameters,
  body: { media: 'application/json' },
  output: { kind: 'data' },
  identities: ['person'],
});

const envSet = command([
  {
    name: 'appId',
    field: 'appId',
    in: 'path',
    position: 0,
    type: 'string',
    required: true,
  },
  {
    name: 'name',
    field: 'name',
    in: 'path',
    position: 1,
    type: 'string',
    required: true,
  },
  {
    name: 'value',
    field: 'value',
    in: 'body',
    position: 2,
    type: 'string',
    required: true,
    fromEnv: 'name',
  },
]);

const valueOf = (
  call: Awaited<ReturnType<typeof parseRestCall>>,
  field: string,
): unknown =>
  [...call.values.entries()].find(
    ([parameter]) => parameter.field === field,
  )?.[1];

describe('--from-env', () => {
  const variable = 'NB_CLI_TEST_FROM_ENV';
  beforeEach(() => {
    process.env[variable] = 's3cret';
  });
  afterEach(() => {
    delete process.env[variable];
  });

  it('fills the parameter from the variable named by another one', async () => {
    const call = await parseRestCall(envSet, ['crm', variable, '--from-env']);
    expect(valueOf(call, 'value')).toBe('s3cret');
  });

  it('refuses a variable that is not set, without a value in the message', async () => {
    delete process.env[variable];
    await expect(
      parseRestCall(envSet, ['crm', variable, '--from-env']),
    ).rejects.toThrow(`${variable} is not set`);
  });

  it('refuses a value and --from-env together', async () => {
    await expect(
      parseRestCall(envSet, ['crm', variable, 'other', '--from-env']),
    ).rejects.toThrow('not both');
  });

  it('is unknown to a command without a fromEnv parameter', async () => {
    const plain = command([
      {
        name: 'value',
        field: 'value',
        in: 'body',
        type: 'string',
        required: false,
      },
    ]);
    await expect(parseRestCall(plain, ['--from-env'])).rejects.toThrow(
      'Unknown flag --from-env. Run `acme app env set --help`.',
    );
  });
});

describe('a json content file', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'cli-rest-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const image = command([
    {
      name: 'variables',
      field: 'variables',
      in: 'body',
      type: 'json',
      required: false,
      contentFile: true,
    },
  ]);

  it('is parsed as JSON', async () => {
    await writeFile(
      path.join(dir, 'variables.json'),
      JSON.stringify({ schemaVersion: 1, variables: [] }),
    );
    const call = await parseRestCall(
      image,
      ['--variables-file', 'variables.json'],
      dir,
    );
    expect(valueOf(call, 'variables')).toEqual({
      schemaVersion: 1,
      variables: [],
    });
  });

  it('refuses a file that is not JSON', async () => {
    await writeFile(path.join(dir, 'variables.json'), 'not json');
    await expect(
      parseRestCall(image, ['--variables-file', 'variables.json'], dir),
    ).rejects.toThrow('not valid JSON');
  });
});

describe('nonempty secret content files', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'cli-secret-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });
  const secret = {
    ...command([
      {
        name: 'token',
        field: 'token',
        in: 'body',
        type: 'string',
        required: false,
        contentFile: true,
        contentFileNonEmpty: true,
      },
    ]),
    body: { media: 'application/json', file: 'file' },
  } satisfies CliCommand;

  it('rejects empty, whitespace-only and unreadable files with the flag and path', async () => {
    for (const text of ['', ' \t\r\n']) {
      await writeFile(path.join(dir, 'secret.txt'), text);
      await expect(
        parseRestCall(secret, ['--token-file', 'secret.txt'], dir),
      ).rejects.toThrow(
        '--token-file: secret.txt must not be empty or whitespace-only.',
      );
    }
    await expect(
      parseRestCall(secret, ['--token-file', 'missing.txt'], dir),
    ).rejects.toThrow('--token-file: cannot read missing.txt.');
  });

  it('preserves nonempty contents and leaves ordinary text files unchanged', async () => {
    await writeFile(path.join(dir, 'secret.txt'), '  secret\n');
    expect(
      valueOf(
        await parseRestCall(secret, ['--token-file', 'secret.txt'], dir),
        'token',
      ),
    ).toBe('  secret\n');
    await writeFile(path.join(dir, 'secret.txt'), '');
    const ordinary = command(
      secret.parameters.map((p) => ({ ...p, contentFileNonEmpty: false })),
    );
    expect(
      valueOf(
        await parseRestCall(ordinary, ['--token-file', 'secret.txt'], dir),
        'token',
      ),
    ).toBe('');
  });

  it('requires a clear in the body file to be exclusive with assigning the same credential', async () => {
    await writeFile(
      path.join(dir, 'clear.json'),
      JSON.stringify({ token: null }),
    );
    await writeFile(path.join(dir, 'secret.txt'), 'do-not-echo-this');
    for (const assignment of [
      ['--token', 'do-not-echo-this'],
      ['--token-file', 'secret.txt'],
    ]) {
      await expect(
        parseRestCall(secret, ['--file', 'clear.json', ...assignment], dir),
      ).rejects.toThrow(
        'Cannot clear token in --file and also give --token or --token-file.',
      );
    }
    const clear = await parseRestCall(secret, ['--file', 'clear.json'], dir);
    expect(clear.bodyFile).toEqual({ token: null });
  });
});
