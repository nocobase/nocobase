import { describe, expect, it } from 'vitest';

import {
  MAX_DENIAL_LOG_BYTES,
  permissionDenialLog,
} from '../src/agent/permission-log.ts';
import { permissionInputSummary } from '../src/agent/adapters/input-summary.ts';
import { createRedactor } from '../src/protocol/index.ts';
import type { AdapterEvent } from '../src/agent/adapters/types.ts';

describe('permission denial logs', () => {
  const denial: AdapterEvent = {
    at: '2026-01-01T00:00:00Z',
    type: 'permission',
    tool: 'Write',
    input: { file_path: '/work/result.txt', content: 'private file body' },
    meta: {
      decision: 'deny',
      reason: 'outside work directory',
      toolUseId: 't1',
    },
  };

  it('names the tool, input path and reason without copying file bodies', () => {
    const log = permissionDenialLog(denial, createRedactor([]));
    expect(log).toContain('Write');
    expect(log).toContain('/work/result.txt');
    expect(log).toContain('outside work directory');
    expect(log).not.toContain('private file body');
  });

  it('redacts before truncation, including field names and reasons', () => {
    const secret = 'sensitive-test-value';
    const log = permissionDenialLog(
      {
        ...denial,
        tool: secret,
        input: {
          command: `cat ${secret} ${'x'.repeat(4000)}`,
          [secret]: 'ignored',
        },
        meta: { decision: 'deny', reason: secret },
      },
      createRedactor([secret]),
    );
    expect(log).not.toContain(secret);
    expect(log).toContain('[REDACTED]');
    expect(log).toContain('xxx…');
    expect(Buffer.byteLength(log!, 'utf8')).toBeLessThanOrEqual(
      MAX_DENIAL_LOG_BYTES,
    );
  });

  const parse = (line: string, prefix = '') =>
    JSON.parse(line.slice(`${prefix}permission denied: `.length)) as Record<
      string,
      unknown
    >;

  it('names every file of a Codex change with its kind', () => {
    const changes = [
      { path: '/outside/a.ts', kind: 'update' },
      { path: '/work/b.ts', kind: 'add' },
    ];
    const log = permissionDenialLog(
      {
        ...denial,
        tool: 'edit',
        input: { changes },
        meta: {
          decision: 'deny',
          reason: 'Edit outside the work directory: /outside/a.ts',
          inputSummary: permissionInputSummary({ changes }),
        },
      },
      createRedactor([]),
    )!;
    expect(parse(log).input).toEqual({ fields: ['changes'], changes });
  });

  it('keeps the path of a large Write whose transcript input is only a preview', () => {
    const input = {
      file_path: '/outside/big.txt',
      content: 'x'.repeat(70_000),
    };
    const log = permissionDenialLog(
      {
        ...denial,
        input: { preview: JSON.stringify(input).slice(0, 100) },
        meta: {
          decision: 'deny',
          reason: 'outside',
          inputSummary: permissionInputSummary(input),
          truncated: true,
        },
      },
      createRedactor([]),
    )!;
    expect(parse(log).input).toEqual({
      fields: ['file_path', 'content'],
      file_path: '/outside/big.txt',
    });
    expect(log).not.toContain('xxxx');
  });

  it('says when a denial carries no input summary', () => {
    const log = permissionDenialLog(
      { ...denial, input: undefined, meta: { decision: 'deny' } },
      createRedactor([]),
    )!;
    expect(parse(log)).toMatchObject({
      reason: 'No reason supplied',
      input: 'unavailable',
    });
  });

  it('bounds the whole line in UTF-8 bytes and keeps it valid JSON for multibyte input', () => {
    const prefix = 'run 391189949841414: ';
    const many = Array.from({ length: 50 }, (_, i) => ({
      path: `/仓库/目录🙂/${'文件'.repeat(200)}-${i}.ts`,
      kind: 'update',
    }));
    const log = permissionDenialLog(
      {
        ...denial,
        tool: 'edit',
        input: { changes: many },
        meta: {
          decision: 'deny',
          reason: `拒绝原因🙂 ${'很长'.repeat(2000)}`,
          inputSummary: permissionInputSummary({ changes: many }),
        },
      },
      createRedactor([]),
      prefix,
    )!;
    expect(log.startsWith(prefix)).toBe(true);
    expect(Buffer.byteLength(log, 'utf8')).toBeLessThanOrEqual(
      MAX_DENIAL_LOG_BYTES,
    );
    expect(log).not.toContain('\uFFFD');
    const entry = parse(log, prefix);
    expect(entry).toMatchObject({ tool: 'edit', truncated: true });
    expect(String(entry.reason)).toMatch(/^拒绝原因🙂/);
    expect(JSON.stringify(entry.input)).toContain('/仓库/目录🙂/');
  });

  it('summarizes only whitelisted fields and bounds the change list', () => {
    const summary = permissionInputSummary({
      command: ['git', 'push'],
      content: 'body',
      changes: Array.from({ length: 25 }, (_, i) => ({
        path: `f${i}`,
        kind: 'add',
        diff: 'patch body',
      })),
    })!;
    expect(summary.command).toBe('git push');
    expect(summary.changes).toHaveLength(20);
    expect(summary.moreChanges).toBe(5);
    expect(JSON.stringify(summary)).not.toContain('body');
    expect(permissionInputSummary('text')).toBeUndefined();
  });

  it('omits allowed calls and non-permission events', () => {
    const redactor = createRedactor([]);
    expect(
      permissionDenialLog({ ...denial, meta: { decision: 'allow' } }, redactor),
    ).toBeUndefined();
    expect(
      permissionDenialLog({ ...denial, type: 'toolUse' }, redactor),
    ).toBeUndefined();
  });
});
