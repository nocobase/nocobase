// The parser of `@nocobase/app-cli-client/parse` over an environment of its own: no file, variable or terminal but
// what its `CliParseIo` gives.
import { describe, expect, it } from 'vitest';

import {
  apiExitCode,
  parseCommandLine,
  renderCommandHelp,
  type CliCommand,
  type CliParseIo,
} from '../src/parse/index.ts';

const attach: CliCommand = {
  id: 'issue:comment:add',
  summary: 'Comment on an issue.',
  method: 'POST',
  path: '/api/issues/{issueId}/comments',
  parameters: [
    {
      name: 'issue',
      field: 'issueId',
      in: 'path',
      position: 0,
      type: 'string',
      required: true,
    },
    {
      name: 'content',
      field: 'content',
      in: 'body',
      type: 'string',
      required: true,
      contentFile: true,
    },
    {
      name: 'attach',
      field: 'attachmentIds',
      in: 'file',
      type: 'string[]',
      required: false,
      upload: {
        method: 'POST',
        path: '/api/attachments',
        part: 'file',
        field: 'attachmentIds',
        multiple: true,
      },
    },
  ],
  body: { media: 'application/json' },
  output: { kind: 'data' },
  identities: ['person', 'run'],
};

const files: Record<string, string> = { 'c.md': 'From a file' };
const io: CliParseIo = {
  readText: (path) => Promise.resolve(files[path]),
  env: () => undefined,
};

describe('parseCommandLine', () => {
  it('reads files through its environment', async () => {
    const call = await parseCommandLine(
      attach,
      ['PM-1', '--content-file', 'c.md'],
      { bin: 'acme', io },
    );
    expect(
      Object.fromEntries(
        [...call.values].map(([parameter, value]) => [parameter.field, value]),
      ),
    ).toEqual({ issueId: 'PM-1', content: 'From a file' });
  });

  it('refuses a file to send where the environment has none, and asks no one', async () => {
    await expect(
      parseCommandLine(attach, ['PM-1', '--content', 'Hi', '--attach', 'a'], {
        bin: 'acme',
        io,
      }),
    ).rejects.toMatchObject({ code: 'FILES_UNAVAILABLE', exit: 5 });
    await expect(
      parseCommandLine(attach, ['PM-1'], { bin: 'acme', io }),
    ).rejects.toMatchObject({
      code: 'MISSING_ARGUMENT',
      message:
        'acme issue comment add needs --content (or --content-file <path>).',
    });
  });

  it('asks for a missing value where someone can answer', async () => {
    const call = await parseCommandLine(attach, ['PM-1'], {
      bin: 'acme',
      io: { ...io, ask: () => Promise.resolve('Typed') },
    });
    expect(call.values.get(attach.parameters[1]!)).toBe('Typed');
  });
});

describe('renderCommandHelp', () => {
  it('leaves out the file flags where there are no files to send', () => {
    const local = renderCommandHelp(attach, { bin: 'acme' });
    const shell = renderCommandHelp(attach, {
      bin: 'acme',
      localFiles: false,
    });
    expect(local).toContain('--attach <path>');
    expect(shell).not.toContain('--attach');
    expect(shell).toContain('--content-file <path>');
  });
});

describe('apiExitCode', () => {
  it('lets the reason decide, then the HTTP status', () => {
    expect(apiExitCode(403, 'FORBIDDEN', 'PERMISSION_DENIED')).toBe(3);
    expect(apiExitCode(400, 'PLAN_REQUIRED', 'FAILED_PRECONDITION')).toBe(7);
    expect(apiExitCode(404, 'HTTP_404')).toBe(4);
    expect(apiExitCode(500, 'HTTP_500')).toBe(2);
    expect(apiExitCode(0, 'NETWORK')).toBe(2);
  });
});
