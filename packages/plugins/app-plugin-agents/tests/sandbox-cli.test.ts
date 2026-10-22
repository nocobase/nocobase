import { Bash } from '../server/vendor/just-bash.js';
import { describe, expect, it, vi } from 'vitest';
import type { CliCommand } from '@nocobase/app-cli-client/parse';
import { cliCommand } from '../server/online/sandbox/cli-command.js';
import type { CommandSurface } from '../server/online/sandbox/types.js';

const command: CliCommand = {
  id: 'record:update',
  summary: 'Update a record',
  method: 'PATCH',
  path: '/api/records/{id}',
  parameters: [
    {
      name: 'id',
      field: 'id',
      in: 'path',
      type: 'string',
      required: true,
      position: 0,
    },
    {
      name: 'content',
      field: 'content',
      in: 'body',
      type: 'string',
      env: ['RECORD_CONTENT'],
      contentFile: true,
      required: false,
    },
  ],
  body: { media: 'application/json', file: 'file' },
  output: { kind: 'data' },
  identities: ['person'],
};
function shell(commands: readonly CliCommand[], send: CommandSurface['send']) {
  return new Bash({
    cwd: '/tmp',
    env: {},
    files: {
      '/tmp/body.json': '{"extra":"多行值"}',
      '/tmp/content.txt': 'line one\nline two',
    },
    customCommands: [
      cliCommand({ bin: 'acme', commands, send }, new AbortController().signal),
    ],
  });
}

describe('Sandbox CLI public parser/request compatibility (adapter contracts, not business acceptance)', () => {
  it('reads JSON/content files and exported shell values only from the VFS', async () => {
    const send = vi.fn<CommandSurface['send']>(async () =>
      Response.json({ data: { saved: true } }),
    );
    const bash = shell([command], send);
    expect(
      (
        await bash.exec(
          'acme record update abc --file /tmp/body.json --content-file /tmp/content.txt --json',
        )
      ).exitCode,
    ).toBe(0);
    expect(send.mock.calls[0][0]).toEqual({
      method: 'PATCH',
      path: '/api/records/abc',
      body: JSON.stringify({ extra: '多行值', content: 'line one\nline two' }),
    });
    expect(
      (
        await bash.exec(
          'export RECORD_CONTENT="来自环境"; acme record update abc --json',
        )
      ).exitCode,
    ).toBe(0);
    expect(JSON.parse(String(send.mock.calls[1][0].body))).toEqual({
      content: '来自环境',
    });
    expect(
      (await bash.exec('acme record update abc --file /etc/passwd --json'))
        .exitCode,
    ).not.toBe(0);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('reads current binding once before the write and does not send when it is missing', async () => {
    let revision: string | null = 'revision-2';
    const send = vi.fn<CommandSurface['send']>(async (request) =>
      Response.json({
        data: request.method === 'GET' ? { revision } : { saved: true },
      }),
    );
    const bash = shell(
      [
        {
          ...command,
          readBinding: {
            path: '/api/records/{recordId}',
            params: { recordId: 'id' },
            responseField: 'data.revision',
            bodyField: 'expectedRevision',
          },
        },
      ],
      send,
    );
    expect((await bash.exec('acme record update abc --json')).exitCode).toBe(0);
    expect(send.mock.calls.map(([request]) => request.method)).toEqual([
      'GET',
      'PATCH',
    ]);
    expect(JSON.parse(String(send.mock.calls[1][0].body))).toEqual({
      expectedRevision: 'revision-2',
    });
    revision = null;
    const missing = await bash.exec('acme record update abc --json');
    expect(missing.stdout).toContain('READ_BINDING_MISSING');
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('encodes no-file multipart fields and preserves business error reasons without approvals', async () => {
    const send = vi.fn<CommandSurface['send']>(async (request) => {
      expect(request.body).toBeInstanceOf(FormData);
      expect((request.body as FormData).get('content')).toBe('hello');
      return Response.json(
        {
          error: {
            code: 403,
            status: 'PERMISSION_DENIED',
            reason: 'PLAN_REQUIRED',
            domain: 'fixture',
            message: 'Create a plan first.',
          },
        },
        { status: 403 },
      );
    });
    const bash = shell(
      [{ ...command, body: { media: 'multipart/form-data' } }],
      send,
    );
    const result = await bash.exec(
      'acme record update abc --content hello --json',
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain('PLAN_REQUIRED');
    expect(result.stdout).not.toContain('approval-requested');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('refuses real downloads and confirmation requirements without sending or automatically adding --yes', async () => {
    const send = vi.fn<CommandSurface['send']>();
    const bash = shell(
      [
        { ...command, id: 'record:download', output: { kind: 'download' } },
        { ...command, confirm: 'Really update?' },
      ],
      send,
    );
    expect(
      (await bash.exec('acme record download abc --json')).stdout,
    ).toContain('FILES_UNAVAILABLE');
    expect((await bash.exec('acme record update abc --json')).stdout).toContain(
      'CONFIRMATION_REQUIRED',
    );
    expect(send).not.toHaveBeenCalled();
  });
});
