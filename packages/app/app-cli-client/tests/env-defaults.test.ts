// Defaults a command reads from the caller's environment (`env` on a parameter): what CI already knows, such as the
// repository and the commit being built, fills a flag the line leaves out; a flag given on the line always wins.
import { describe, expect, it } from 'vitest';

import {
  envDefaultOf,
  parseCommandLine,
  renderCommandHelp,
  type CliCommand,
  type CliEnvDefault,
  type CliParseIo,
} from '../src/parse/index.ts';

const SHA_SOURCES: readonly CliEnvDefault[] = [
  { file: 'GITHUB_EVENT_PATH', path: 'pull_request.head.sha' },
  'GITHUB_SHA',
  'CI_MERGE_REQUEST_SOURCE_BRANCH_SHA',
  'CI_COMMIT_SHA',
];

const deploy: CliCommand = {
  id: 'deploy',
  summary: 'Deploy an archive',
  method: 'POST',
  path: '/api/builds/deploy',
  parameters: [
    {
      name: 'app',
      field: 'appId',
      in: 'body',
      type: 'string',
      required: true,
    },
    {
      name: 'sha',
      field: 'sha',
      in: 'body',
      type: 'string',
      required: true,
      env: SHA_SOURCES,
    },
    {
      name: 'repository',
      field: 'repository',
      in: 'body',
      type: 'string',
      required: false,
      env: ['GITHUB_REPOSITORY', 'CI_PROJECT_PATH'],
    },
  ],
  body: { media: 'application/json', file: 'file' },
  output: { kind: 'data' },
  identities: ['person'],
};

/** An environment of variables and files, as `CliParseIo` reads it. */
function ioOf(
  variables: Readonly<Record<string, string>>,
  files: Readonly<Record<string, string>> = {},
): CliParseIo {
  return {
    env: (name) => variables[name],
    readText: async (path) => files[path],
  };
}

async function parse(
  line: readonly string[],
  io: CliParseIo,
): Promise<Record<string, unknown>> {
  const call = await parseCommandLine(deploy, line, { bin: 'acme', io });
  return Object.fromEntries(
    [...call.values].map(([parameter, value]) => [parameter.field, value]),
  );
}

const PUSHED = 'a'.repeat(40);
const MERGE = 'b'.repeat(40);
const HEAD = 'c'.repeat(40);

describe('environment defaults', () => {
  it('reads the repository and the commit of a GitHub Actions push', async () => {
    const io = ioOf(
      {
        GITHUB_REPOSITORY: 'acme/shop',
        GITHUB_SHA: PUSHED,
        GITHUB_EVENT_PATH: '/run/event.json',
      },
      { '/run/event.json': JSON.stringify({ ref: 'refs/heads/main' }) },
    );
    expect(await parse(['--app', 'shop'], io)).toEqual({
      appId: 'shop',
      sha: PUSHED,
      repository: 'acme/shop',
    });
  });

  it('takes a GitHub pull request’s head from the event, not the merge commit', async () => {
    const io = ioOf(
      {
        GITHUB_REPOSITORY: 'acme/shop',
        GITHUB_SHA: MERGE,
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_EVENT_PATH: '/run/event.json',
      },
      {
        '/run/event.json': JSON.stringify({
          number: 12,
          pull_request: { number: 12, head: { sha: HEAD } },
        }),
      },
    );
    expect(await parse(['--app', 'shop-pr-12'], io)).toMatchObject({
      sha: HEAD,
      repository: 'acme/shop',
    });
  });

  it('falls through an unreadable or malformed event file', async () => {
    const variables = {
      GITHUB_SHA: PUSHED,
      GITHUB_EVENT_PATH: '/run/event.json',
    };
    expect(await parse(['--app', 'shop'], ioOf(variables))).toMatchObject({
      sha: PUSHED,
    });
    expect(
      await parse(
        ['--app', 'shop'],
        ioOf(variables, { '/run/event.json': '{not json' }),
      ),
    ).toMatchObject({ sha: PUSHED });
  });

  it('reads GitLab CI, preferring a merged-results pipeline’s source commit', async () => {
    expect(
      await parse(
        ['--app', 'shop'],
        ioOf({ CI_PROJECT_PATH: 'acme/group/shop', CI_COMMIT_SHA: PUSHED }),
      ),
    ).toEqual({ appId: 'shop', sha: PUSHED, repository: 'acme/group/shop' });
    expect(
      await parse(
        ['--app', 'shop'],
        ioOf({
          CI_PROJECT_PATH: 'acme/shop',
          CI_COMMIT_SHA: MERGE,
          CI_MERGE_REQUEST_SOURCE_BRANCH_SHA: HEAD,
        }),
      ),
    ).toMatchObject({ sha: HEAD });
  });

  it('lets an explicit flag win', async () => {
    const io = ioOf({ GITHUB_REPOSITORY: 'acme/shop', GITHUB_SHA: PUSHED });
    expect(
      await parse(
        ['--app', 'shop', '--sha', HEAD, '--repository', 'acme/other'],
        io,
      ),
    ).toEqual({ appId: 'shop', sha: HEAD, repository: 'acme/other' });
  });

  it('skips an empty variable and leaves a field the body file gives', async () => {
    const io = ioOf(
      {
        GITHUB_REPOSITORY: '',
        CI_PROJECT_PATH: 'acme/shop',
        GITHUB_SHA: PUSHED,
      },
      { 'body.json': JSON.stringify({ sha: HEAD }) },
    );
    const call = await parseCommandLine(
      deploy,
      ['--app', 'shop', '--file', 'body.json'],
      { bin: 'acme', io },
    );
    const fields = Object.fromEntries(
      [...call.values].map(([parameter, value]) => [parameter.field, value]),
    );
    expect(fields).toEqual({ appId: 'shop', repository: 'acme/shop' });
    expect(call.bodyFile).toEqual({ sha: HEAD });
  });

  it('still asks for a required value outside CI', async () => {
    await expect(parse(['--app', 'shop'], ioOf({}))).rejects.toMatchObject({
      code: 'MISSING_ARGUMENT',
    });
  });

  it('says where a default comes from in the help', () => {
    const help = renderCommandHelp(deploy, { bin: 'acme' });
    expect(help).toContain(
      'default from $GITHUB_REPOSITORY or $CI_PROJECT_PATH',
    );
    expect(help).toContain(
      'default from pull_request.head.sha of $GITHUB_EVENT_PATH or $GITHUB_SHA',
    );
  });

  it('reads a number from the event file as text', async () => {
    expect(
      await envDefaultOf([{ file: 'EVENT', path: 'pull_request.number' }], {
        env: (name) => (name === 'EVENT' ? '/e.json' : undefined),
        readText: async () => JSON.stringify({ pull_request: { number: 7 } }),
      }),
    ).toBe('7');
  });
});
