import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
  utimesSync,
  symlinkSync,
  linkSync,
  unlinkSync,
  writeSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  createJsonLinesLogOutput,
  createLogOutput,
  type JsonLinesLogOutput,
} from '../src/output.js';

vi.mock('node:fs', { spy: true });

const now = new Date('2026-11-26T23:59:59.999Z');
const day = 86_400_000;
let directory: string;
const outputs: JsonLinesLogOutput[] = [];

beforeEach(() => {
  directory = realpathSync.native(
    mkdtempSync(path.join(tmpdir(), 'rolling-jsonl-')),
  );
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
});

afterEach(async () => {
  try {
    await Promise.all(outputs.splice(0).map((output) => output.close()));
  } finally {
    vi.useRealTimers();
    vi.restoreAllMocks();
    rmSync(directory, { force: true, recursive: true });
  }
});

function openOutput(
  options: {
    maxFileSizeMB?: number;
    retentionDays?: number;
    onCleanupError?: (error: unknown) => void;
  } = {},
) {
  const output = createJsonLinesLogOutput({
    directory,
    name: 'audit',
    maxFileSizeMB: 50,
    retentionDays: 180,
    ...options,
  });
  outputs.push(output);
  return output;
}

function fullPath(name: string) {
  return path.join(directory, name);
}

function seed(name: string, age: number) {
  writeFileSync(fullPath(name), '{}\n', { mode: 0o600 });
  const modified = new Date(now.getTime() - age * day);
  utimesSync(fullPath(name), modified, modified);
}

it('rotates complete records by size and UTC date and resumes the highest part on restart', async () => {
  const output = openOutput({ maxFileSizeMB: 10 / 1024 ** 2 });
  const first = '{"é":1}\n';
  const second = '{"b":2}\n';
  const oversized =
    JSON.stringify({ msg: 'a'.repeat(40 * 1024), token: 'serialized-record' }) +
    '\n';
  output.writeLine(first);
  output.writeLine(second);
  output.writeLine(oversized);
  await output.close();
  expect(readdirSync(directory).sort()).toEqual([
    'audit.2026-11-26.000000.jsonl',
    'audit.2026-11-26.000001.jsonl',
    'audit.2026-11-26.000002.jsonl',
  ]);
  expect(readFileSync(fullPath('audit.2026-11-26.000000.jsonl'), 'utf8')).toBe(
    first,
  );
  expect(readFileSync(fullPath('audit.2026-11-26.000001.jsonl'), 'utf8')).toBe(
    second,
  );
  expect(readFileSync(fullPath('audit.2026-11-26.000002.jsonl'), 'utf8')).toBe(
    oversized,
  );

  const restarted = openOutput({ maxFileSizeMB: 1 });
  restarted.writeLine(first);
  expect(readFileSync(fullPath('audit.2026-11-26.000002.jsonl'), 'utf8')).toBe(
    oversized + first,
  );

  vi.setSystemTime(now.getTime() + 1);
  restarted.writeLine(second);
  expect(readFileSync(fullPath('audit.2026-11-27.000000.jsonl'), 'utf8')).toBe(
    second,
  );
  await restarted.close();
  expect(() => restarted.writeLine(first)).toThrow('closed');
});

it('cleans only expired archives of its own target and keeps the active segment', async () => {
  seed('audit.2026-01-01.000000.jsonl', 181);
  seed('audit.2026-02-01.000000.jsonl', 179);
  seed('audit.2026-02-01.000001.jsonl', 180);
  seed('other.2026-01-01.000000.jsonl', 200);
  seed('audit.2026-99-01.000000.jsonl', 200);
  seed('audit.2026-01-01.000000.log', 200);
  seed('audit.jsonl', 200);
  if (process.platform !== 'win32') {
    symlinkSync(
      fullPath('audit.jsonl'),
      fullPath('audit.2026-01-01.000001.jsonl'),
    );
    linkSync(
      fullPath('audit.jsonl'),
      fullPath('audit.2026-01-01.000002.jsonl'),
    );
  }
  const output = openOutput();
  output.writeLine('{}\n');
  const active = fullPath('audit.2026-11-26.000000.jsonl');
  utimesSync(active, 0, 0);
  await output.close();
  expect(readdirSync(directory).sort()).toEqual(
    [
      ...(process.platform === 'win32'
        ? []
        : ['audit.2026-01-01.000001.jsonl', 'audit.2026-01-01.000002.jsonl']),
      'audit.2026-01-01.000000.log',
      'audit.2026-02-01.000000.jsonl',
      'audit.2026-02-01.000001.jsonl',
      'audit.2026-11-26.000000.jsonl',
      'audit.2026-99-01.000000.jsonl',
      'audit.jsonl',
      'other.2026-01-01.000000.jsonl',
    ].sort(),
  );

  const application = createLogOutput({
    file: { directory, name: 'audit', retentionDays: 1, maxTotalSizeMB: 1 },
  });
  application.writeEntry({
    time: now.toISOString(),
    level: 'info',
    msg: 'application event',
  });
  await new Promise<void>((resolve) => application.end(resolve));
  expect(readdirSync(directory)).not.toContain('audit.2026-01-01.000000.log');
  expect(readFileSync(active, 'utf8')).toBe('{}\n');
  expect(readFileSync(fullPath('audit.2026-02-01.000000.jsonl'), 'utf8')).toBe(
    '{}\n',
  );
});

it('reports a cleanup error and retries expired archives after later rotation', async () => {
  const onCleanupError = vi.fn();
  const expired = 'audit.2026-01-01.000000.jsonl';
  seed(expired, 200);
  const failure = new Error('cleanup unavailable');
  vi.mocked(unlinkSync).mockImplementationOnce(() => {
    throw failure;
  });
  const output = openOutput({ onCleanupError });
  output.writeLine('{"first":true}\n');
  await vi.waitFor(() => expect(onCleanupError).toHaveBeenCalledWith(failure));
  expect(readdirSync(directory)).toContain(expired);

  vi.setSystemTime(now.getTime() + 1);
  output.writeLine('{"second":true}\n');
  await output.close();
  expect(readdirSync(directory).sort()).toEqual([
    'audit.2026-11-26.000000.jsonl',
    'audit.2026-11-27.000000.jsonl',
  ]);
});

it('restores the original file after a partial append and permits the next complete record', async () => {
  const file = fullPath('audit.2026-11-26.000000.jsonl');
  const output = openOutput();
  output.writeLine('{}\n');
  const fs = await vi.importActual<typeof import('node:fs')>('node:fs');
  vi.mocked(writeSync)
    .mockImplementationOnce((fd: number) => fs.writeSync(fd, '{'))
    .mockImplementationOnce(() => {
      throw new Error('write failed');
    });
  expect(() => output.writeLine('{"partial":true}\n')).toThrow('write failed');
  expect(readFileSync(file, 'utf8')).toBe('{}\n');
  output.writeLine('{"complete":true}\n');
  expect(readFileSync(file, 'utf8')).toBe('{}\n{"complete":true}\n');
});
