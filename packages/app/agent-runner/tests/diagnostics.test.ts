import {
  mkdir,
  writeFile,
  readFile,
  symlink,
  utimes,
  stat,
  readdir,
} from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { DiagnosticsRecordSchema } from '../src/protocol/index.ts';
import { diagnosticsRecords } from '../src/core/diagnostics.ts';
import { RunnerJournal, pruneRunnerLogs } from '../src/lib/journal.ts';
import {
  runnerPaths,
  runLogPath,
  runRawLogPath,
  writeJsonAtomic,
} from '../src/lib/home.ts';
import { recordPath } from '../src/core/supervisor.ts';
import { tempDir, removeDir, cli, cliEnv, readDaemonLog } from './helpers.ts';
import type { DiagnosticsRequest } from '../src/protocol/index.ts';
const root = tempDir('runner-diagnostics-');
afterAll(() => removeDir(root));
const request = (): DiagnosticsRequest => ({
  requestId: '7e53ca48-1bd0-4343-b027-b5d81bdb7d43',
  window: {
    since: '2026-11-01T00:00:00+08:00',
    until: '2026-11-02T00:00:00+08:00',
    runIds: ['selected'],
  },
  maxBytes: 131072,
  expiresAt: new Date(Date.now() + 45000).toISOString(),
});
const entry = (msg: string) =>
  JSON.stringify({ time: '2026-11-01T10:00:00Z', level: 'info', msg }) + '\n';
async function records(home: string, input = request()) {
  let data = '';
  for await (const line of diagnosticsRecords(runnerPaths(home, home), input, {
    version: 'fixture',
    tools: [],
  }))
    data += line;
  return data;
}

describe('执行机诊断与清理', () => {
  it('删除空日期目录但保留正在运行的日志、非日期目录及符号链接', async () => {
    const paths = runnerPaths(path.join(root, 'empty-dates'));
    const runs = path.join(paths.logsDir, 'runs');
    for (const date of ['2019-01-01', '2020-01-01', '2021-01-01', 'other'])
      await mkdir(path.join(runs, date), { recursive: true });
    const ended = runLogPath(paths, 'ended', '2019-01-01');
    const active = runLogPath(paths, 'active', '2020-01-01');
    for (const file of [ended, active]) {
      await writeFile(file, entry('old'));
      await utimes(file, new Date(0), new Date(0));
    }
    await writeJsonAtomic(recordPath(paths, 'active'), {
      runId: 'active',
      pid: process.pid,
      log: active,
    });
    const outside = path.join(root, 'outside-dates');
    await mkdir(outside);
    await writeFile(path.join(outside, 'keep.log'), entry('keep'));
    await symlink(outside, path.join(runs, '2022-01-01'));
    await pruneRunnerLogs(paths, {
      name: 'fixture',
      agentTools: 'runner',
      autoUpdate: false,
    });
    expect((await readdir(runs)).sort()).toEqual([
      '2020-01-01',
      '2022-01-01',
      'other',
    ]);
    expect(await stat(active)).toBeDefined();
    expect(await stat(path.join(outside, 'keep.log'))).toBeDefined();
  });
  it('同一日志对象跨 UTC 午夜继续滚动，读取时覆盖全部日期和分段', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-11-01T23:59:59Z'));
      const paths = runnerPaths(path.join(root, 'midnight'));
      const writer = new RunnerJournal(paths.logsDir);
      writer.write('before midnight\n');
      vi.setSystemTime(new Date('2026-11-02T00:00:01Z'));
      writer.write('after midnight\n');
      writer.flush();
      const files = await readdir(paths.logsDir);
      expect(files.some((file) => file.startsWith('runner.2026-11-01.'))).toBe(
        true,
      );
      expect(files.some((file) => file.startsWith('runner.2026-11-02.'))).toBe(
        true,
      );
      expect(readDaemonLog(paths.logsDir)).toContain('before midnight');
      expect(readDaemonLog(paths.logsDir)).toContain('after midnight');
    } finally {
      vi.useRealTimers();
    }
  });
  it('收集相交 UTC 日期原文件并包含跨日期的指定运行，排除其他文件和符号链接', async () => {
    const home = path.join(root, 'dates');
    const paths = runnerPaths(home, home);
    await mkdir(paths.logsDir, { recursive: true });
    for (const [date, msg] of [
      ['2026-10-31', 'first'],
      ['2026-11-01', 'second'],
      ['2026-11-03', 'excluded'],
    ])
      await writeFile(
        path.join(paths.logsDir, `runner.${date}.000000.log`),
        entry(msg),
      );
    const selected = runLogPath(paths, 'selected', '2026-10-01');
    await mkdir(path.dirname(selected), { recursive: true });
    await writeFile(selected, entry('full-run'));
    await writeFile(path.join(home, 'credential-fixture'), 'never-export-this');
    await symlink(
      path.join(home, 'credential-fixture'),
      path.join(paths.logsDir, 'runner.2026-11-01.000001.log'),
    );
    const output = await records(home);
    expect(output).toContain('first');
    expect(output).toContain('second');
    expect(output).toContain('full-run');
    expect(output).not.toContain('excluded');
    expect(output).not.toContain('never-export-this');
    expect(
      JSON.parse(output.trim().split('\n').at(-1)!).files.some(
        (file: { dates: string[] }) => file.dates.includes('2026-10-01'),
      ),
    ).toBe(true);
  });
  it('工具探测输出再长也不突破环境记录协议上限', async () => {
    let first = '';
    for await (const line of diagnosticsRecords(
      runnerPaths(path.join(root, 'environment')),
      request(),
      {
        version: 'v'.repeat(1000),
        tools: [{ tool: 't'.repeat(1000), version: 'v'.repeat(1000) }],
      },
    )) {
      first = line;
      break;
    }
    const environment = JSON.parse(first);
    expect(environment.version).toHaveLength(100);
    expect(environment.tools[0].tool).toHaveLength(50);
    expect(environment.tools[0].version).toHaveLength(100);
  });
  it('超长单行和大源文件有界截断，秘密和后缀不会混入后续记录', async () => {
    const home = path.join(root, 'large');
    const paths = runnerPaths(home, home);
    await mkdir(paths.logsDir, { recursive: true });
    await writeFile(
      path.join(paths.logsDir, 'runner.2026-11-01.000000.log'),
      'x'.repeat(70000) +
        'secret-tail\n' +
        entry('api_key=fixture-sensitive-value') +
        entry('bounded').repeat(10000),
    );
    const output = await records(home);
    expect(Buffer.byteLength(output)).toBeLessThanOrEqual(request().maxBytes);
    expect(output).not.toContain('fixture-sensitive-value');
    expect(output).not.toContain('secret-tail');
    expect(JSON.parse(output.trim().split('\n').at(-1)!).truncated).toBe(true);
  });
  it('最低级别不会丢失失败请求的关联 ID', async () => {
    const home = path.join(root, 'request-id');
    const paths = runnerPaths(home, home);
    await mkdir(paths.logsDir, { recursive: true });
    const input = request();
    input.window.level = 'fatal';
    await writeFile(
      path.join(paths.logsDir, 'runner.2026-11-01.000000.log'),
      JSON.stringify({
        time: '2026-11-01T10:00:00Z',
        level: 'warn',
        msg: 'Request failed',
        res: { status: 403 },
        requestId: 'request-fixture',
      }) +
        '\n' +
        entry('ordinary-info'),
    );
    const output = await records(home, input);
    expect(output).toContain('request-fixture');
    expect(output).not.toContain('ordinary-info');
  });
  it('超过 64 份普通日志仍优先导出所有选中运行日期，并保留最新普通日志', async () => {
    const home = path.join(root, 'selected-many');
    const paths = runnerPaths(home, home);
    const input = request();
    input.window.runIds = Array.from(
      { length: 20 },
      (_, index) => `chosen-${index}`,
    );
    for (const id of input.window.runIds)
      for (const date of [
        '2026-10-01',
        '2026-10-02',
        '2026-10-03',
        '2026-10-04',
      ]) {
        const file = runLogPath(paths, id, date);
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, entry(`${id}-${date}`));
      }
    for (let index = 0; index < 70; index++) {
      const file = runLogPath(
        paths,
        `ordinary-${index.toString().padStart(3, '0')}`,
        index === 69 ? '2026-11-01' : '2026-10-31',
      );
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, entry(index === 69 ? 'latest-day' : 'ordinary'));
    }
    const output = await records(home, input);
    const rows = output
      .trim()
      .split('\n')
      .map((line) => DiagnosticsRecordSchema.parse(JSON.parse(line)));
    const manifest = rows.at(-1)!;
    expect(manifest.type).toBe('manifest');
    if (manifest.type !== 'manifest') throw new Error('Missing manifest');
    expect(
      manifest.files.filter((file) => file.file.includes('/chosen-')),
    ).toHaveLength(80);
    expect(manifest.files).toHaveLength(144);
    expect(output).toContain('latest-day');
    expect(
      rows
        .filter((row) => row.type === 'log')
        .slice(0, 80)
        .every((row) => row.type === 'log' && row.file.includes('/chosen-')),
    ).toBe(true);
  });
  it('选中大文件与原始崩溃输出在大小上限内保留故障末尾，并明确说明截断', async () => {
    const home = path.join(root, 'tail');
    const paths = runnerPaths(home, home);
    const file = runLogPath(paths, 'selected', '2026-10-01');
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      entry('front-only') +
        entry('repeated').repeat(10000) +
        entry('failure-at-the-end'),
    );
    await writeFile(
      runRawLogPath(paths, 'selected', '2026-10-01'),
      'native crash api_key=fixture-sensitive-value\nstack-final-frame\n',
    );
    const input = request();
    input.window.level = 'fatal';
    const output = await records(home, input);
    expect(output).toContain('failure-at-the-end');
    expect(output).toContain('stack-final-frame');
    expect(output).not.toContain('front-only');
    expect(output).not.toContain('fixture-sensitive-value');
    expect(output).toContain('retained the available tail');
    expect(Buffer.byteLength(output)).toBeLessThanOrEqual(input.maxBytes);
    expect(JSON.parse(output.trim().split('\n').at(-1)!).truncated).toBe(true);
    const log = await cli(['logs', '--run', 'selected'], cliEnv(home));
    expect(log.code).toBe(0);
    expect(log.stdout).toContain('failure-at-the-end');
    expect(log.stdout).toContain('stack-final-frame');
    const short = await cli(
      ['logs', '--run', 'selected', '--lines', '2'],
      cliEnv(home),
    );
    expect(short.code).toBe(0);
    expect(short.stdout.trim().split('\n')).toHaveLength(2);
    expect(short.stdout).toContain('stack-final-frame');
  });
  it('GC 对主日志及运行日志共享上限，保留存活工作进程的全部日期', async () => {
    const home = path.join(root, 'gc');
    const paths = runnerPaths(home, home);
    for (const id of ['active', 'ended']) {
      const file = runLogPath(paths, id, '2020-01-01');
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, entry(id));
      await writeFile(file.replace(/\.log$/, '.stderr'), 'native crash\n');
      await utimes(file.replace(/\.log$/, '.stderr'), new Date(0), new Date(0));
      await utimes(file, new Date(0), new Date(0));
    }
    await writeJsonAtomic(recordPath(paths, 'active'), {
      runId: 'active',
      pid: process.pid,
      log: runLogPath(paths, 'active', '2020-01-01'),
    });
    await writeFile(
      path.join(paths.logsDir, 'runner.2020-01-01.000000.log'),
      entry('old'),
    );
    await utimes(
      path.join(paths.logsDir, 'runner.2020-01-01.000000.log'),
      new Date(0),
      new Date(0),
    );
    const today = new Date().toISOString().slice(0, 10);
    const previousDaemon = path.join(
      paths.logsDir,
      `runner.${today}.000000.log`,
    );
    const currentDaemon = path.join(
      paths.logsDir,
      `runner.${today}.000001.log`,
    );
    for (const file of [previousDaemon, currentDaemon]) {
      await writeFile(file, entry('daemon'));
      await utimes(file, new Date(0), new Date(0));
    }
    await pruneRunnerLogs(paths, {
      name: 'fixture',
      agentTools: 'runner',
      autoUpdate: false,
      logRetentionDays: 7,
      logMaxSizeMB: 1,
    });
    expect(
      await stat(runRawLogPath(paths, 'active', '2020-01-01')),
    ).toBeDefined();
    expect(
      await stat(runRawLogPath(paths, 'ended', '2020-01-01')).catch(() => null),
    ).toBeNull();
    expect(await stat(previousDaemon).catch(() => null)).toBeNull();
    expect(await stat(currentDaemon)).toBeDefined();
    expect(
      await readFile(runLogPath(paths, 'active', '2020-01-01'), 'utf8'),
    ).toContain('active');
    expect(
      await stat(runLogPath(paths, 'ended', '2020-01-01')).catch(() => null),
    ).toBeNull();
    expect(
      await stat(
        path.join(paths.logsDir, 'runner.2020-01-01.000000.log'),
      ).catch(() => null),
    ).toBeNull();
  });
  it('原始堆栈逐行包装为 JSON，跨行私钥正文被脱敏', async () => {
    const paths = runnerPaths(path.join(root, 'raw'));
    const writer = new RunnerJournal(paths.logsDir);
    writer.write(
      'stack first\n-----BEGIN PRIVATE KEY-----\nprivate-fixture\n-----END PRIVATE KEY-----\n',
    );
    writer.writeError('crash stack\n');
    writer.flush();
    const lines = readDaemonLog(paths.logsDir)
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(lines[0].msg).toBe('stack first');
    expect(lines.at(-1).level).toBe('error');
    expect(JSON.stringify(lines)).not.toContain('private-fixture');
  });
  it('原生命令保存日志保留天数和总大小并拒绝关闭上限', async () => {
    const home = path.join(root, 'config');
    const env = cliEnv(home);
    expect(
      (await cli(['config', 'set', 'log-retention', '14', '--json'], env)).code,
    ).toBe(0);
    expect(
      (await cli(['config', 'set', 'log-max-size', '20M', '--json'], env)).code,
    ).toBe(0);
    const settings = JSON.parse(
      await readFile(runnerPaths(home).settings, 'utf8'),
    );
    expect(settings.logRetentionDays).toBe(14);
    expect(settings.logMaxSizeMB).toBe(20);
    expect(
      (await cli(['config', 'set', 'log-max-size', 'off'], env)).code,
    ).not.toBe(0);
  });
});
