// Turns a run's tool policy into the adapter's `permission(tool, input)` callback.
//
// Shell commands, in order:
//
// 1. Refused in every mode: a built-in or configured denied pattern; anything that names a protected path (the run's
//    credentials, the runner's own directory); a command that downloads and runs code (`npx` without `--no`,
//    `pnpm dlx`, `bunx`, `uvx`, `pipx run`, `curl … | sh` and the like) unless `allowedDownloads` lets it; and a push
//    that skips or replaces the push guard (`--no-verify`, `core.hooksPath`, `GIT_CONFIG_*`).
// 2. Refused outside `bypass`: an explicit path that resolves, through symbolic links, outside the work directory.
//    Arguments that look like paths (`/x`, `~/x`, `../x`, anything with a `/`, or a name that exists), redirection
//    targets, `cd` targets and `git clone` destinations are all checked.
// 3. `bypass` allows the rest. Otherwise command substitution is refused, and every segment of the line (split on `;`,
//    `&&`, `||`, `|` and newlines) must match an allowed-command pattern; `cd` and the application's CLI always do.
//
// Paths are resolved against the shell's working directory: the one the tool reports with the call (Codex, OpenCode),
// or the one this policy tracks from the `cd`s it allowed (Claude Code's shell keeps its directory between calls).
// The heredoc bodies of commands such as `cat > f <<'EOF'` are text, not commands, and are not checked as commands.
//
// This is best-effort parsing of shell, not a sandbox: variables other than HOME, PWD and TMPDIR, globs, `eval`, and
// interpreters given code (`node -e`, `python -c`) are not followed. True isolation needs a separate OS user or a
// container.
//
// File tools: the path must resolve inside the work directory and outside every protected path. `plan` refuses file
// edits; `bypass` skips the work-directory check but still protects the protected paths.
//
// A refusal is returned with its reason so the worker can record it as a `permission` event.
import { existsSync, realpathSync } from 'node:fs';
import path from 'node:path';

import type { ToolPolicy } from '../protocol/index.ts';

export type PolicyDecision =
  { decision: 'allow' } | { decision: 'deny'; reason: string };

const SHELL_TOOLS = new Set(['Bash', 'bash', 'shell', 'exec', 'command']);
const WRITE_TOOLS = new Set([
  'Write',
  'Edit',
  'MultiEdit',
  'NotebookEdit',
  'write',
  'edit',
  'patch',
]);
const FILE_TOOLS = new Set([
  ...WRITE_TOOLS,
  'Read',
  'Glob',
  'Grep',
  'LS',
  'read',
  'glob',
  'grep',
  'list',
]);
const PATH_KEYS = ['file_path', 'path', 'notebook_path', 'filePath'] as const;

/** Refused whatever the run's policy says. */
export const BUILTIN_DENIED: readonly RegExp[] = [
  /(^|[\s;&|(])sudo(\s|$)/,
  /(^|[\s;&|(])su(\s|$)/,
  /\brm\s+(-[a-zA-Z]*\s+)*-[a-zA-Z]*[rR][a-zA-Z]*\s+(-[a-zA-Z]*\s+)*(\/|~|\$HOME)(\/?\*?)?(\s|$)/,
  /\bmkfs(\.\w+)?\b/,
  /\bdd\s+[^|]*\bof=\/dev\//,
  /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
  /\bchmod\s+(-R\s+)?[0-7]*777\s+\/(\s|$)/,
];

/** Shell builtins that only move the shell; their targets are checked like any path. */
const DIRECTORY_COMMANDS = new Set(['cd', 'pushd', 'popd']);

/** Paths outside the work directory a command may always name. */
const SAFE_PATHS = new Set([
  '/dev/null',
  '/dev/stdin',
  '/dev/stdout',
  '/dev/stderr',
  '/dev/tty',
  '/dev/zero',
  '/dev/random',
  '/dev/urandom',
]);

const PROTECTED_REASON =
  'The runner keeps credentials there; tools may not touch them.';

export interface PolicyOptions {
  policy: ToolPolicy;
  /** What the agent may touch. */
  workDir: string;
  /** Other directories the agent may touch, such as a working directory used in place outside `workDir`. */
  extraRoots?: readonly string[];
  /** Where the agent's shell starts; the work directory by default. */
  cwd?: string;
  /** The agent's HOME, for `~` and `$HOME`; the work directory by default. */
  home?: string;
  /** The agent's TMPDIR, for `$TMPDIR`. */
  tmpDir?: string;
  /** Never readable or writable by tools, in any mode: the run's credentials, the runner's own directory. */
  protectedPaths?: readonly string[];
  /** Commands always allowed, such as the application's CLI. */
  alwaysAllowed?: readonly string[];
}

export function compilePatterns(patterns: readonly string[]): RegExp[] {
  const compiled: RegExp[] = [];
  for (const pattern of patterns) {
    try {
      compiled.push(new RegExp(pattern));
    } catch {
      // An invalid pattern from the server must not open the gate: it matches nothing for allow, and for deny it is
      // matched as a literal substring below.
      compiled.push(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  return compiled;
}

// ---------------------------------------------------------------------------------------------------------------
// Shell parsing

/**
 * Removes the bodies of heredocs (`<<EOF … EOF`, `<<-'EOF' … EOF`), keeping the operator. With `quotedOnly`, only
 * bodies whose delimiter is quoted go: an unquoted heredoc expands `$(…)` and backticks.
 */
/**
 * `$(cat <<'EOF' … EOF)` once its quoted heredoc body is stripped: it only prints literal text, and it is how Claude
 * Code writes multi-line commit messages (`git commit -m "$(cat <<'EOF' …`), so it is not refused as a substitution.
 */
const LITERAL_SUBSTITUTION =
  /\$\(\s*cat\s+<<-?\s*(['"])[A-Za-z_][A-Za-z0-9_]*\1[ \t]*\n\s*\)/gu;

export function stripHeredocs(line: string, quotedOnly = false): string {
  const lines = line.split('\n');
  const out: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index] ?? '';
    out.push(current);
    const pending = [
      ...current.matchAll(/<<(-?)\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\2/gu),
    ];
    for (const match of pending) {
      const delimiter = match[3] ?? '';
      const tabs = match[1] === '-';
      const keep = quotedOnly && match[2] === '';
      while (index + 1 < lines.length) {
        index += 1;
        const body = lines[index] ?? '';
        if ((tabs ? body.replace(/^\t+/u, '') : body) === delimiter) break;
        if (keep) out.push(body);
      }
    }
  }
  return out.join('\n');
}

/** Splits a shell line into the commands it runs, ignoring operators inside quotes. */
export function commandSegments(line: string): string[] {
  const segments: string[] = [];
  let current = '';
  let quote: '"' | "'" | undefined;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? '';
    const next = line[index + 1] ?? '';
    if (quote !== undefined) {
      if (char === quote) quote = undefined;
      else if (char === '\\' && quote === '"') {
        current += char + next;
        index += 1;
        continue;
      }
      current += char;
      continue;
    }
    if (char === '\\' && next !== '\n') {
      current += char + next;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    const pair = char + next;
    if (pair === '&&' || pair === '||') {
      segments.push(current);
      current = '';
      index += 1;
      continue;
    }
    // `2>&1` and `&>file` are redirections, not a background operator.
    const redirection = char === '&' && (/[<>]$/.test(current) || next === '>');
    if (
      char === ';' ||
      char === '|' ||
      char === '\n' ||
      (char === '&' && !redirection)
    ) {
      segments.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  segments.push(current);
  return segments
    .map((segment) => segment.trim())
    .filter((segment) => segment !== '');
}

/** The words of one command, with quotes and escapes removed. */
export function shellWords(segment: string): string[] {
  const words: string[] = [];
  let current = '';
  let started = false;
  let quote: '"' | "'" | undefined;
  const flush = () => {
    if (started) words.push(current);
    current = '';
    started = false;
  };
  for (let index = 0; index < segment.length; index += 1) {
    const char = segment[index] ?? '';
    if (quote !== undefined) {
      if (char === quote) quote = undefined;
      else if (
        char === '\\' &&
        quote === '"' &&
        /["\\$`]/u.test(segment[index + 1] ?? '')
      ) {
        current += segment[index + 1] ?? '';
        index += 1;
      } else current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      started = true;
      continue;
    }
    if (char === '\\') {
      current += segment[index + 1] ?? '';
      index += 1;
      started = true;
      continue;
    }
    if (/\s/u.test(char)) {
      flush();
      continue;
    }
    current += char;
    started = true;
  }
  flush();
  return words;
}

/** Wrappers that only run the command after them. */
const WRAPPERS = new Set(['env', 'time', 'nice', 'nohup', 'command', 'exec']);

/** The words from the command on: leading `NAME=value` assignments and wrappers dropped. */
export function commandWords(words: readonly string[]): string[] {
  let index = 0;
  while (index < words.length) {
    const word = words[index] ?? '';
    if (/^[A-Za-z_][A-Za-z0-9_]*=/u.test(word) || WRAPPERS.has(word)) {
      index += 1;
      continue;
    }
    break;
  }
  return words.slice(index);
}

// ---------------------------------------------------------------------------------------------------------------
// Paths

/** Whether `target` is `root` or inside it, after resolving symbolic links of the part that exists. */
export function isInside(root: string, target: string): boolean {
  const realRoot = realpathOrSelf(root);
  const realTarget = realpathOfExistingPrefix(path.resolve(root, target));
  const relative = path.relative(realRoot, realTarget);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
}

function realpathOrSelf(file: string): string {
  try {
    return realpathSync(file);
  } catch {
    return path.resolve(file);
  }
}

function realpathOfExistingPrefix(file: string): string {
  let current = file;
  const rest: string[] = [];
  while (!existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    rest.unshift(path.basename(current));
    current = parent;
  }
  return path.join(realpathOrSelf(current), ...rest);
}

// ---------------------------------------------------------------------------------------------------------------
// Downloads

const DOWNLOAD_REASON =
  'Downloading and running code is refused by the runner. Use a tool the project already installs (`pnpm exec <bin>`, ' +
  '`npx --no <bin>`), or ask for the command to be allowed';

/** Why a command downloads and runs code, or undefined when it does not. */
export function downloadsCode(words: readonly string[]): string | undefined {
  const [command = '', ...args] = words;
  const positional = args.filter((arg) => !arg.startsWith('-'));
  const sub = positional[0] ?? '';
  const npxLike = (): string | undefined => {
    if (args.some((arg) => ['-y', '--yes', '-p', '--package'].includes(arg)))
      return `${command} with --yes or --package`;
    if (args.some((arg) => ['--no', '--no-install', '--offline'].includes(arg)))
      return undefined;
    return `${command} without --no`;
  };
  switch (path.basename(command)) {
    case 'npx':
      return npxLike();
    case 'pnpx':
    case 'bunx':
    case 'uvx':
      return command;
    case 'npm':
      if (sub === 'exec' || sub === 'x') return npxLike();
      if ((sub === 'init' || sub === 'create') && positional.length > 1)
        return `npm ${sub} <initializer>`;
      return undefined;
    case 'pnpm':
    case 'yarn':
      return sub === 'dlx' || sub === 'create'
        ? `${command} ${sub}`
        : undefined;
    case 'bun':
      return sub === 'x' || sub === 'create' ? `bun ${sub}` : undefined;
    case 'uv':
      return sub === 'tool' && positional[1] === 'run'
        ? 'uv tool run'
        : undefined;
    case 'pipx':
      return sub === 'run' ? 'pipx run' : undefined;
    case 'deno':
      return args.some((arg) => /^([a-z]+:\/\/|npm:|jsr:)/u.test(arg))
        ? 'deno with a remote module'
        : undefined;
    case 'go':
      return sub === 'run' &&
        positional.slice(1).some((arg) => arg.includes('@'))
        ? 'go run <module>@<version>'
        : undefined;
    default:
      return undefined;
  }
}

/** A download piped or substituted into an interpreter, anywhere on the line. */
const PIPED_DOWNLOAD =
  /\b(curl|wget|fetch)\b[^|;&]*\|\s*(sudo\s+)?(env\s+)?((ba|z|da|k|fi)?sh|python[0-9.]*|node|perl|ruby|php)\b|(\$\(|<\(|`)\s*(curl|wget)\b/u;

// ---------------------------------------------------------------------------------------------------------------
// Commands whose arguments are not paths

/** Every argument is text; only redirections name files. */
const TEXT_COMMANDS = new Set([
  'echo',
  'printf',
  'true',
  'false',
  'test',
  '[',
  'export',
  'which',
  'type',
]);
/** The first positional argument is a pattern or a script. */
const PATTERN_COMMANDS = new Set([
  'grep',
  'egrep',
  'fgrep',
  'rg',
  'ag',
  'ack',
  'sed',
  'awk',
  'jq',
]);
/** Flags whose value is text, not a path. */
const TEXT_FLAGS = new Set([
  '-e',
  '--regexp',
  '-m',
  '--message',
  '-S',
  '-G',
  '--grep',
  '--author',
  '--format',
  '--pretty',
  '-g',
  '--glob',
  '--include',
  '--exclude',
  '-t',
  '--type',
  '--content',
  '--title',
  '--description',
]);

/** The words of a command that name files, as typed. */
export function pathWords(words: readonly string[]): string[] {
  const [command = '', ...args] = words;
  const name = path.basename(command);
  const result: string[] = [];
  // A command named by a relative path is a path too; an absolute one is left to the allowlist.
  if (!command.startsWith('/') && command.includes('/')) result.push(command);
  let skipNext = false;
  let patternSeen = !PATTERN_COMMANDS.has(name);
  for (let index = 0; index < args.length; index += 1) {
    const word = args[index] ?? '';
    const redirect = /^(\d*|&)?(>>?|<|>\|)(.*)$/u.exec(word);
    if (redirect) {
      const target = redirect[3] ?? '';
      if (target.startsWith('&')) continue;
      if (target !== '') result.push(target);
      else if (index + 1 < args.length) {
        result.push(args[index + 1] ?? '');
        index += 1;
      }
      continue;
    }
    if (skipNext) {
      skipNext = false;
      continue;
    }
    if (TEXT_COMMANDS.has(name)) continue;
    if (word.startsWith('-')) {
      const equals = word.indexOf('=');
      if (equals > 0) {
        if (!TEXT_FLAGS.has(word.slice(0, equals)))
          result.push(word.slice(equals + 1));
      } else if (TEXT_FLAGS.has(word)) skipNext = true;
      if (word === '-e' || word === '--regexp' || word.startsWith('--regexp='))
        patternSeen = true;
      continue;
    }
    if (!patternSeen) {
      patternSeen = true;
      continue;
    }
    result.push(word);
  }
  return result;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function createPolicy(
  options: PolicyOptions,
): (tool: string, input: unknown) => PolicyDecision {
  const { policy, workDir } = options;
  const allowed = compilePatterns(policy.allowedCommands);
  const denied = [...BUILTIN_DENIED, ...compilePatterns(policy.deniedPatterns)];
  const downloads = compilePatterns(policy.allowedDownloads ?? []);
  const protectedPaths = (options.protectedPaths ?? []).map((file) =>
    path.resolve(workDir, file),
  );
  // A protected path named on the command line, absolute or relative to the work directory.
  const protectedMentions = protectedPaths.flatMap((root) => {
    const relative = path.relative(workDir, root);
    const names = [root];
    if (relative !== '' && !relative.startsWith('..')) names.push(relative);
    return names.map(
      (name) =>
        new RegExp(`(^|[\\s'"=:/])${escapeRegExp(name)}(/|[\\s'";|&)]|$)`, 'u'),
    );
  });
  const alwaysAllowed = new Set([
    ...DIRECTORY_COMMANDS,
    ...(options.alwaysAllowed ?? []),
  ]);
  const home = options.home ?? workDir;
  const roots = [workDir, ...(options.extraRoots ?? [])];
  const inside = (target: string): boolean =>
    roots.some((root) => isInside(root, target));
  const bypass = policy.permissionMode === 'bypass';
  /** The shell's directory between calls, for tools that keep it (Claude Code's Bash). */
  let trackedCwd = options.cwd ?? workDir;

  const deny = (reason: string): PolicyDecision => ({
    decision: 'deny',
    reason,
  });

  const isProtected = (file: string): boolean =>
    protectedPaths.some((root) => isInside(root, file));

  /** The absolute path a word names, or undefined when it names none the policy can follow. */
  const resolveWord = (word: string, cwd: string): string | undefined => {
    let text = word;
    const variable = /^\$\{?(HOME|PWD|TMPDIR)\}?(?=\/|$)/u.exec(text);
    if (text === '~' || text.startsWith('~/'))
      text = path.join(home, text.slice(1));
    else if (variable) {
      const base =
        variable[1] === 'HOME'
          ? home
          : variable[1] === 'PWD'
            ? cwd
            : options.tmpDir;
      if (base === undefined) return undefined;
      text = path.join(base, text.slice(variable[0].length));
    } else if (text.startsWith('$') || text.startsWith('~')) return undefined;
    if (text === '' || text === '-') return undefined;
    // URLs and scp-like remotes (`git@host:org/repo.git`) are not local paths; `file://` URLs are.
    if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(text))
      return text.toLowerCase().startsWith('file://')
        ? path.resolve(text.slice('file://'.length))
        : undefined;
    if (/^[\w.-]+@[\w.-]+:/u.test(text)) return undefined;
    const looksLikePath =
      text.includes('/') ||
      text === '..' ||
      text === '.' ||
      existsSync(path.resolve(cwd, text));
    return looksLikePath ? path.resolve(cwd, text) : undefined;
  };

  const checkCommand = (
    command: string,
    reportedCwd: string | undefined,
  ): PolicyDecision => {
    const line = command.trim();
    const hit = denied.find((pattern) => pattern.test(line));
    if (hit !== undefined)
      return deny(`Command matches a denied pattern: ${hit.source}`);
    if (protectedMentions.some((pattern) => pattern.test(line)))
      return deny(PROTECTED_REASON);
    if (/\bcore\.hooksPath\b|\bGIT_CONFIG_[A-Z]+\b/u.test(line))
      return deny(
        'Changing where git finds its hooks is refused: pushes must pass the push guard.',
      );
    if (
      PIPED_DOWNLOAD.test(line) &&
      !downloads.some((pattern) => pattern.test(line))
    )
      return deny(`${DOWNLOAD_REASON} (a download piped into an interpreter).`);

    const segments = commandSegments(stripHeredocs(line)).map((segment) => ({
      segment,
      words: commandWords(shellWords(segment)),
    }));
    for (const { segment, words } of segments) {
      const download = downloadsCode(words);
      if (
        download !== undefined &&
        !downloads.some((pattern) => pattern.test(segment))
      )
        return deny(`${DOWNLOAD_REASON} (${download}).`);
      if (
        words[0] === 'git' &&
        words.includes('push') &&
        words.includes('--no-verify')
      )
        return deny(
          'git push --no-verify is refused: pushes must pass the push guard.',
        );
    }

    let cwd = reportedCwd ?? trackedCwd;
    for (const { words } of segments) {
      const name = words[0] ?? '';
      if (name === 'cd' || name === 'pushd') {
        const target = words.slice(1).find((word) => !word.startsWith('-'));
        if (target === undefined) cwd = home;
        else if (target !== '-') {
          const resolved =
            resolveWord(target, cwd) ?? path.resolve(cwd, target);
          if (isProtected(resolved)) return deny(PROTECTED_REASON);
          if (!bypass && !inside(resolved))
            return deny(`cd outside the work directory: ${target}`);
          cwd = resolved;
        }
        continue;
      }
      for (const word of pathWords(words)) {
        const resolved = resolveWord(word, cwd);
        if (resolved === undefined || SAFE_PATHS.has(resolved)) continue;
        if (isProtected(resolved)) return deny(PROTECTED_REASON);
        if (!bypass && !inside(resolved))
          return deny(`${name} outside the work directory: ${word}`);
      }
    }

    if (!bypass) {
      if (
        /\$\(|`|<\(|>\(/.test(
          stripHeredocs(line, true).replace(LITERAL_SUBSTITUTION, ''),
        )
      )
        return deny('Command substitution is not allowed by the tool policy.');
      for (const { segment, words } of segments) {
        const name = words[0] ?? '';
        if (name === '' || alwaysAllowed.has(name)) continue;
        const text = words.join(' ');
        if (
          !allowed.some(
            (pattern) => pattern.test(text) || pattern.test(segment),
          )
        )
          return deny(`Command is not in the allowlist: ${name}`);
      }
    }
    if (reportedCwd === undefined) trackedCwd = cwd;
    return { decision: 'allow' };
  };

  const checkPath = (tool: string, file: string): PolicyDecision => {
    const resolved = path.resolve(options.cwd ?? workDir, file);
    if (isProtected(resolved)) return deny(PROTECTED_REASON);
    if (bypass) return { decision: 'allow' };
    if (!inside(resolved))
      return deny(`${tool} outside the work directory: ${file}`);
    return { decision: 'allow' };
  };

  return (tool, input) => {
    const fields =
      typeof input === 'object' && input !== null
        ? (input as Record<string, unknown>)
        : {};
    if (SHELL_TOOLS.has(tool)) {
      const command = fields.command ?? fields.cmd;
      if (typeof command !== 'string')
        return deny('Shell call without a command.');
      const reported = fields.cwd ?? fields.workdir;
      return checkCommand(
        command,
        typeof reported === 'string' && reported !== ''
          ? path.resolve(options.cwd ?? workDir, reported)
          : undefined,
      );
    }
    if (policy.permissionMode === 'plan' && WRITE_TOOLS.has(tool))
      return deny('The run is in plan mode; file edits are refused.');
    if (FILE_TOOLS.has(tool)) {
      const files = PATH_KEYS.map((key) => fields[key]).filter(
        (value): value is string => typeof value === 'string',
      );
      for (const file of files) {
        const decision = checkPath(tool, file);
        if (decision.decision === 'deny') return decision;
      }
      return { decision: 'allow' };
    }
    return { decision: 'allow' };
  };
}
