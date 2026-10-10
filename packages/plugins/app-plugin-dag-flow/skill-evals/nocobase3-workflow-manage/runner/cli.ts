#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { CodexAppServerAdapter } from './codex-app-server.js';
import { loadPromptCases } from './load-cases.js';
import type { PromptCase, PromptRunRecord } from './types.js';
import { prepareCaseWorkspace } from './workspace.js';

interface CliOptions {
  list: boolean;
  ids: string[];
  suite?: string;
  model?: string;
  concurrency: number;
  timeoutMs: number;
  allowMutation: boolean;
  allowInvocation: boolean;
  keepWorkspaces: boolean;
  output?: string;
}

const testsRoot = fileURLToPath(new URL('..', import.meta.url));
const packageRoot = path.resolve(testsRoot, '../..');
const repoRoot = path.resolve(packageRoot, '../../..');
const skillPath = path.join(
  packageRoot,
  'skills',
  'nocobase-app-plugin-dag-flow',
  'SKILL.md',
);
const options = parseArgs(process.argv.slice(2));
const allCases = await loadPromptCases(testsRoot);

if (options.list) {
  for (const item of allCases) {
    console.log(`${item.case.id}\t${item.case.risk}\t${item.suiteFile}`);
  }
  process.exit(0);
}

const selected = allCases.filter((item) => {
  if (options.ids.length > 0 && !options.ids.includes(item.case.id))
    return false;
  if (options.suite && item.suiteFile !== options.suite) return false;
  return isAllowed(item.case, options);
});
if (selected.length === 0) {
  throw new Error(
    'No prompt cases selected. Use --list to inspect available cases.',
  );
}

const adapter = new CodexAppServerAdapter();
const records = await mapLimit(selected, options.concurrency, async (item) => {
  const workspace = await prepareCaseWorkspace({
    case: item.case,
    repoRoot,
    testsRoot,
    keep: options.keepWorkspaces,
  });
  const record: PromptRunRecord = {
    case: item.case,
    suiteFile: item.suiteFile,
    workspace: workspace.root,
    fixtureDatabase: workspace.fixtureDatabase,
    startedAt: new Date().toISOString(),
  };
  try {
    console.error(`[start] ${item.case.id}`);
    record.result = await adapter.run({
      cwd: workspace.root,
      prompt: augmentPrompt(item.case),
      skillPath,
      injectSkill: item.case.skillMode !== 'implicit',
      model: options.model,
      sandbox: item.case.risk === 'read-only' ? 'read-only' : 'workspace-write',
      timeoutMs: options.timeoutMs,
    });
    console.error(`[done] ${item.case.id}: ${record.result.status}`);
  } catch (error) {
    record.error =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    console.error(`[error] ${item.case.id}: ${record.error}`);
  } finally {
    await workspace.cleanup();
  }
  return record;
});

const output = JSON.stringify(
  {
    generatedAt: new Date().toISOString(),
    adapter: adapter.name,
    model: options.model ?? null,
    records,
  },
  null,
  2,
);
if (options.output) {
  await fs.mkdir(path.dirname(path.resolve(options.output)), {
    recursive: true,
  });
  await fs.writeFile(path.resolve(options.output), `${output}\n`);
  console.error(
    `Wrote ${records.length} result(s) to ${path.resolve(options.output)}`,
  );
} else {
  console.log(output);
}
if (
  records.some(
    (record) => record.error || record.result?.status !== 'completed',
  )
) {
  process.exitCode = 1;
}

function augmentPrompt(promptCase: PromptCase): string {
  return [
    promptCase.prompt,
    '',
    '测试环境说明：先阅读当前目录的 TEST_CONTEXT.md。该目录是本用例独享的隔离环境。',
    '只执行用户 prompt 授权的操作；不要读取 expected/forbidden 判定标准。',
  ].join('\n');
}

function isAllowed(promptCase: PromptCase, cli: CliOptions): boolean {
  if (promptCase.risk === 'read-only') return true;
  if (promptCase.risk === 'side-effecting' || promptCase.risk === 'high') {
    return cli.allowInvocation;
  }
  return cli.allowMutation;
}

function parseArgs(args: string[]): CliOptions {
  const result: CliOptions = {
    list: false,
    ids: [],
    concurrency: 1,
    timeoutMs: 5 * 60_000,
    allowMutation: false,
    allowInvocation: false,
    keepWorkspaces: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--') continue;
    const value = (): string => {
      const next = args[index + 1];
      if (!next) throw new Error(`${arg} requires a value.`);
      index += 1;
      return next;
    };
    if (arg === '--list') result.list = true;
    else if (arg === '--id') result.ids.push(value());
    else if (arg === '--suite') result.suite = value();
    else if (arg === '--model') result.model = value();
    else if (arg === '--concurrency')
      result.concurrency = positiveInteger(value(), arg);
    else if (arg === '--timeout-ms')
      result.timeoutMs = positiveInteger(value(), arg);
    else if (arg === '--output') result.output = value();
    else if (arg === '--allow-mutation') result.allowMutation = true;
    else if (arg === '--allow-invocation') result.allowInvocation = true;
    else if (arg === '--keep-workspaces') result.keepWorkspaces = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return result;
}

function positiveInteger(value: string, flag: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new Error(`${flag} must be a positive integer.`);
  return parsed;
}

async function mapLimit<T, R>(
  values: T[],
  limit: number,
  task: (value: T) => Promise<R>,
): Promise<R[]> {
  const result = new Array<R>(values.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor;
        cursor += 1;
        result[index] = await task(values[index]);
      }
    }),
  );
  return result;
}
