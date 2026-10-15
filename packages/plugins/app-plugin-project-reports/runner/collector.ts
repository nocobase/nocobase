/** Self-contained runner program. Runtime imports are Node built-ins only; no project code is executed. */
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { FileChange, ReportContext, ReportRepository, RepositoryResult, TestDelta } from '../shared/reports.js';

const exec = promisify(execFile);
const MAX_BUFFER = 12 * 1024 * 1024;
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
const LIMITS = { history: 50_000, files: 20_000, commits: 2000, material: 400_000 };

async function git(cwd: string, args: readonly string[]): Promise<string> {
  const result = await exec('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.quotePath=false', ...args], {
    cwd, encoding: 'utf8', maxBuffer: MAX_BUFFER, timeout: 120_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
  });
  return result.stdout;
}

export function safeRemote(remote: string): boolean {
  if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+:[^\s\x00-\x1f]+$/u.test(remote)) return true;
  try {
    const url = new URL(remote);
    return ['https:', 'ssh:'].includes(url.protocol) && !!url.hostname && !url.password && !url.search && !url.hash && (url.protocol === 'ssh:' || !url.username);
  } catch { return false; }
}

export function fileKind(path: string): FileChange['kind'] {
  if (/(^|\/)(node_modules|dist|build|coverage|vendor|\.next)(\/|$)/u.test(path) || /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?)$/u.test(path) || /\.(snap|min\.js|map)$/u.test(path)) return 'generated';
  if (/(^|\/)(__tests__|tests?|e2e)(\/|$)/u.test(path) || /\.(test|spec)\.[cm]?[jt]sx?$/u.test(path)) return 'test';
  if (/(^|\/)(docs?|\.changeset)(\/|$)/u.test(path) || /\.(md|mdx|rst|txt)$/u.test(path)) return 'documentation';
  return /\.(?:[cm]?[jt]sx?|vue|svelte|py|go|rs|java|kt|swift|rb|php|c|cc|cpp|h|cs|css|scss|html|sql)$/u.test(path) ? 'source' : 'configuration';
}

/** --numstat -z preserves tabs/newlines in names and uses two extra fields for a rename. */
export function parseNumstat(text: string): FileChange[] {
  const fields = text.split('\0');
  const files: FileChange[] = [];
  for (let at = 0; at < fields.length; at += 1) {
    const entry = fields[at];
    if (!entry) continue;
    const first = entry.indexOf('\t');
    const second = entry.indexOf('\t', first + 1);
    if (first < 0 || second < 0) throw new Error('Malformed git numstat.');
    const amount = (value: string): number | null => {
      if (value === '-') return null;
      if (!/^\d+$/u.test(value)) throw new Error('Malformed git line count.');
      const number = Number(value);
      if (!Number.isSafeInteger(number)) throw new Error('Git line count exceeds the supported range.');
      return number;
    };
    let path = entry.slice(second + 1);
    let previousPath: string | null = null;
    if (!path) {
      previousPath = fields[++at] ?? null;
      path = fields[++at] ?? '';
      if (!previousPath || !path) throw new Error('Malformed git rename.');
    }
    files.push({ path, previousPath, kind: fileKind(path), additions: amount(entry.slice(0, first)), deletions: amount(entry.slice(first + 1, second)) });
  }
  if (files.length > LIMITS.files) throw new Error('The file-statistics budget was exceeded.');
  return files;
}

interface Token { kind: 'word' | 'string' | 'punctuation'; value: string }
/** A small lexical scan, explicitly an estimate rather than a test-framework inventory. */
function tokens(source: string): Token[] {
  const result: Token[] = [];
  for (let at = 0; at < source.length;) {
    const char = source[at] ?? '';
    if (/\s/u.test(char)) { at += 1; continue; }
    if (source.startsWith('//', at)) { const end = source.indexOf('\n', at + 2); at = end < 0 ? source.length : end + 1; continue; }
    if (source.startsWith('/*', at)) { const end = source.indexOf('*/', at + 2); at = end < 0 ? source.length : end + 2; continue; }
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let value = '';
      at += 1;
      while (at < source.length && source[at] !== quote) {
        if (source[at] === '\\') { value += source.slice(at, at + 2); at += 2; }
        else value += source[at++];
      }
      at += 1;
      result.push({ kind: 'string', value });
      continue;
    }
    const word = /^[A-Za-z_$][\w$]*/u.exec(source.slice(at))?.[0];
    if (word) { result.push({ kind: 'word', value: word }); at += word.length; }
    else { result.push({ kind: 'punctuation', value: char }); at += 1; }
  }
  return result;
}

export function testDeclarations(source: string): string[] {
  const list = tokens(source);
  const result: string[] = [];
  for (let at = 0; at < list.length; at += 1) {
    const token = list[at];
    if (token?.kind !== 'word' || !['it', 'test'].includes(token.value) || list[at - 1]?.value === '.') continue;
    let next = at + 1;
    while (list[next]?.value === '.' && ['skip', 'only', 'todo', 'concurrent', 'fails'].includes(list[next + 1]?.value ?? '')) next += 2;
    const title = list[next + 1];
    if (list[next]?.value === '(' && title?.kind === 'string' && !title.value.includes('${') && [',', ')'].includes(list[next + 2]?.value ?? '')) result.push(title.value);
  }
  return result;
}

export function inventoryDelta(before: readonly string[], after: readonly string[]): { added: number; removed: number } {
  const difference = new Map<string, number>();
  for (const item of before) difference.set(item, (difference.get(item) ?? 0) - 1);
  for (const item of after) difference.set(item, (difference.get(item) ?? 0) + 1);
  let added = 0;
  let removed = 0;
  for (const count of difference.values()) { if (count > 0) added += count; else removed -= count; }
  return { added, removed };
}

async function blob(cwd: string, sha: string | null, path: string): Promise<string | null> {
  if (!sha) return null;
  const present = await git(cwd, ['ls-tree', '-z', sha, '--', path]);
  if (!present) return null;
  return git(cwd, ['cat-file', 'blob', `${sha}:${path}`]);
}

function manifest(text: string): string[] {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('cases' in value) || !Array.isArray(value.cases) || !value.cases.every((item): item is string => typeof item === 'string' && item.length > 0)) throw new Error('Invalid test inventory.');
  if (new Set(value.cases).size !== value.cases.length) throw new Error('Test inventory ids must be unique.');
  return value.cases;
}

async function tests(cwd: string, base: string | null, head: string, files: readonly FileChange[]): Promise<TestDelta> {
  try {
    const oldManifest = await blob(cwd, base, '.project-reports/tests.json');
    const newManifest = await blob(cwd, head, '.project-reports/tests.json');
    if ((oldManifest || !base) && newManifest) return { quality: 'manifest', ...inventoryDelta(oldManifest ? manifest(oldManifest) : [], manifest(newManifest)), reason: null };
    const before: string[] = [];
    const after: string[] = [];
    for (const file of files) {
      const previous = file.previousPath ?? file.path;
      if (file.kind !== 'test' && fileKind(previous) !== 'test') continue;
      if (!/\.[cm]?[jt]sx?$/u.test(file.path) && !/\.[cm]?[jt]sx?$/u.test(previous)) continue;
      const oldSource = await blob(cwd, base, previous);
      const newSource = await blob(cwd, head, file.path);
      // Rename matching uses the destination path on both sides, so a move alone is not a new test.
      before.push(...testDeclarations(oldSource ?? '').map((title) => `${file.path}\0${title}`));
      after.push(...testDeclarations(newSource ?? '').map((title) => `${file.path}\0${title}`));
    }
    return { quality: 'estimated', ...inventoryDelta(before, after), reason: 'Static JS/TS test declarations, not executed or parameter-expanded cases.' };
  } catch {
    return { quality: 'unavailable', added: null, removed: null, reason: 'The test inventories could not be compared completely.' };
  }
}

async function resolveTarget(cwd: string, ref: string | null): Promise<string> {
  const candidates = ref ? [`refs/remotes/origin/${ref}`, `refs/tags/${ref}`, ref] : ['refs/remotes/origin/HEAD', 'HEAD'];
  for (const candidate of candidates) {
    try {
      const sha = (await git(cwd, ['rev-parse', '--verify', '--end-of-options', `${candidate}^{commit}`])).trim();
      if (/^[a-f0-9]{40,64}$/u.test(sha)) return sha;
    } catch { /* Try a tag or pinned commit after a remote branch. */ }
  }
  throw new Error('The target ref could not be resolved.');
}

/** Analyze an existing independent checkout. Tests use this without any network or credentials. */
export async function collectRepository(cwd: string, repository: ReportRepository, window: { start: string; end: string }): Promise<{ result: RepositoryResult; patch: string }> {
  const target = await resolveTarget(cwd, repository.ref);
  const history = (await git(cwd, ['log', '--first-parent', `--max-count=${LIMITS.history + 1}`, '--format=%H%x09%ct', target])).trim().split('\n').filter(Boolean).map((row) => {
    const [sha = '', seconds = ''] = row.split('\t');
    return { sha, at: Number(seconds) * 1000 };
  });
  const start = Date.parse(window.start);
  const end = Date.parse(window.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) throw new Error('Invalid collection window.');
  const headIndex = history.findIndex((commit) => commit.at < end);
  if (headIndex < 0) throw new Error('No commit exists before the report window ends.');
  const head = history[headIndex]!.sha;
  const baseEntry = history.slice(headIndex).find((commit) => commit.at < start);
  if (!baseEntry && history.length > LIMITS.history) throw new Error('The history budget does not reach the baseline.');
  const base = baseEntry?.sha ?? null;
  const files = parseNumstat(await git(cwd, ['diff', '--no-ext-diff', '--no-textconv', '--find-renames', '--numstat', '-z', base ?? EMPTY_TREE, head, '--']));
  const range = base ? `${base}..${head}` : head;
  const allCommits = (await git(cwd, ['log', `--max-count=${LIMITS.commits + 1}`, '--format=%H%x09%s', range])).trim().split('\n').filter(Boolean).map((row) => ({ sha: row.slice(0, row.indexOf('\t')), title: row.slice(row.indexOf('\t') + 1).slice(0, 2000) }));
  let patch: string;
  try { patch = (await git(cwd, ['diff', '--no-ext-diff', '--no-textconv', '--find-renames', '--unified=2', base ?? EMPTY_TREE, head, '--', ...files.filter((file) => file.kind !== 'generated').slice(0, 200).map((file) => file.path)])).slice(0, LIMITS.material); }
  catch { patch = 'The combined diff exceeds the material budget. Inspect individual files using the pinned commits.'; }
  return {
    result: {
      resourceId: repository.resourceId, state: 'complete', baseSha: base, headSha: head,
      boundary: 'first-parent-committer-time', files,
      commits: allCommits.slice(0, LIMITS.commits), commitsTruncated: allCommits.length > LIMITS.commits,
      tests: await tests(cwd, base, head, files),
      warning: 'Day boundaries are reconstructed from first-parent commit times, not historical branch push times. Rewritten history and delayed pushes can change attribution.',
    },
    patch,
  };
}

export async function collect(context: ReportContext, outputDirectory: string): Promise<RepositoryResult[]> {
  await mkdir(outputDirectory, { recursive: true });
  const results: RepositoryResult[] = [];
  for (const [index, repository] of context.repositories.entries()) {
    try {
      if (!safeRemote(repository.url)) throw new Error('Unsupported repository URL.');
      // Every attempt owns this directory; it never changes a developer's existing checkout.
      const cwd = join(outputDirectory, `repository-${index}`);
      await git(outputDirectory, ['clone', '--no-checkout', '--filter=blob:none', '--', repository.url, cwd]);
      const { result, patch } = await collectRepository(cwd, repository, context);
      await writeFile(join(outputDirectory, `repository-${index}.patch`), patch, 'utf8');
      results.push(result);
    } catch {
      results.push({ resourceId: repository.resourceId, state: 'unavailable', baseSha: null, headSha: null, boundary: 'first-parent-committer-time', files: [], commits: [], commitsTruncated: false, tests: { quality: 'unavailable', added: null, removed: null, reason: 'Repository collection failed.' }, warning: 'Collection failed: check this runner’s Git access, the target ref, and the collection budget. Credentials and raw command errors are not included in reports.' });
    }
  }
  await writeFile(join(outputDirectory, 'facts.json'), JSON.stringify(results, null, 2), 'utf8');
  return results;
}

async function main(): Promise<void> {
  const directory = dirname(fileURLToPath(import.meta.url));
  if (process.argv.includes('--assemble')) {
    const repositories: unknown = JSON.parse(await readFile(join(directory, 'output', 'facts.json'), 'utf8'));
    const narrative: unknown = JSON.parse(await readFile(join(directory, 'narrative.json'), 'utf8'));
    await writeFile(join(directory, 'submission.json'), JSON.stringify({ version: 1, repositories, narrative }), 'utf8');
    return;
  }
  const context = JSON.parse(await readFile(join(directory, 'context.json'), 'utf8')) as ReportContext;
  await collect(context, join(directory, 'output'));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(() => { console.error('Project report collection failed. No credentials or raw command output were logged.'); process.exitCode = 1; });
}
