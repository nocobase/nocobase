import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import { create } from 'tar';
import { runInstaller } from '../src/cli.ts';
import {
  interruptError,
  onInterrupt,
  takeInterrupt,
} from '../src/lib/interrupt.ts';
import type { Pm2, Pm2Process } from '../src/lib/pm2.ts';
import type { FetchLike } from '../src/lib/registry.ts';
import { CommandFailedError, type RunCommand } from '../src/lib/run-command.ts';

/**
 * A stand-in for everything the installer starts: `pnpm create`, `pnpm add`, `pnpm build --tar`, the release's
 * own CLI, pm2 and the Hub's health route. It writes the files each real command would leave behind, so the commands
 * under test see a realistic root, and it records what was run.
 */
export interface FakeWorld {
  run: RunCommand;
  pm2: Pm2 & { processes: Map<string, Pm2Process>; calls: string[] };
  fetchImpl: FetchLike;
  calls: string[][];
  /** Throw from the command whose joined arguments contain this text. */
  failOn?: string;
  /** Wait for an interrupt in the command whose joined arguments contain this text. */
  hangOn?: string;
  /** Envelope overrides for the release CLI, by its subcommand (`config set`, `db apply --dry-run`, ...). */
  cli: Record<string, unknown>;
  /** Migration and seed tasks `db apply --dry-run` reports, by release version. */
  pendingTasks: Record<string, number>;
  /** Whether the health route answers ok; by default it does while a pm2 process is online. */
  healthy?: () => boolean;
  /** Versions the registry publishes; the last one is `latest`. */
  published: string[];
  /** pm2 status a started process takes, `online` by default. */
  startStatus: string;
  /** Statuses for the next starts, in order, before `startStatus` applies again. */
  startQueue: string[];
  /** Unpacked manifests omit `nocobase.builtAt` and `nocobase.basePath`, as builds before they were recorded did. */
  legacyManifest?: boolean;
  /** Build times handed to built manifests, one minute apart so every build is a release of its own. */
  builds: number;
  /** The release CLI writes its database inside the release, as one older than `APP_STORAGE_DIR` does. */
  ignoresStorageDir?: boolean;
}

/** The part of the template's `config.example.yml` the installer reads, which `config init` copies. */
const EXAMPLE_CONFIG = `users:
  initialAdmin:
    username: nocobase # stored lowercase
    email: admin@nocobase.com
    password: admin123
database:
  default: main
  connections:
    main:
      dialect: sqlite
      database: hub/database/main.sqlite
`;

const buildTarget = () => ({
  platform: process.platform,
  arch: process.arch,
  libc: 'glibc',
  nodeMajor: Number.parseInt(process.versions.node, 10),
});

export interface ArchiveOptions {
  name?: string;
  version: string;
  builtAt?: string;
  basePath?: string;
  /** Record `nocobase.relocatable` instead of `nocobase.basePath`, as a current build does. */
  relocatable?: boolean;
  /** Leave `nocobase.builtAt` and `nocobase.basePath` out, as a build before they were recorded did. */
  legacy?: boolean;
  buildTarget?: Record<string, unknown>;
  /** Driver packages the archive carries in `dist/node_modules`. */
  drivers?: string[];
  /** `nocobase.templateKind` in the manifest, `app` unless given. */
  templateKind?: string;
}

/**
 * Writes a deployment archive the way `pnpm build --tar` packs one: `config.example.yml` and `dist/`, with the
 * manifest in `dist/package.json`. The server entry names the version, so a test can tell releases apart.
 */
export function makeArchive(file: string, options: ArchiveOptions): string {
  const tree = mkdtempSync(path.join(os.tmpdir(), 'app-installer-archive-'));
  try {
    mkdirSync(path.join(tree, 'dist/cli'), { recursive: true });
    mkdirSync(path.join(tree, 'dist/server'), { recursive: true });
    writeFileSync(path.join(tree, 'config.example.yml'), EXAMPLE_CONFIG);
    writeFileSync(path.join(tree, 'dist/cli/index.js'), '');
    writeFileSync(
      path.join(tree, 'dist/server/standalone.js'),
      `// ${options.version}\n`,
    );
    for (const driver of options.drivers ?? []) {
      const directory = path.join(tree, 'dist/node_modules', driver);
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        path.join(directory, 'package.json'),
        JSON.stringify({ name: driver }),
      );
    }
    writeFileSync(
      path.join(tree, 'dist/package.json'),
      JSON.stringify({
        name: options.name ?? 'hub',
        version: options.version,
        nocobase: {
          templateKind: options.templateKind ?? 'app',
          buildTarget: options.buildTarget ?? buildTarget(),
          ...(options.legacy
            ? {}
            : {
                builtAt: options.builtAt ?? new Date().toISOString(),
                ...(options.relocatable
                  ? { relocatable: true }
                  : { basePath: options.basePath ?? '/hub' }),
              }),
        },
      }),
    );
    mkdirSync(path.dirname(file), { recursive: true });
    create({ cwd: tree, file, gzip: true, sync: true }, [
      'config.example.yml',
      'dist',
    ]);
    return file;
  } finally {
    rmSync(tree, { recursive: true, force: true });
  }
}

/** `.build/<version>/hub/...` names a version; `releases/<version>_<time>/app` names a release of one. */
function versionFromPath(file: string): string {
  const parts = file.split(path.sep);
  const index = Math.max(
    parts.lastIndexOf('.build'),
    parts.lastIndexOf('releases'),
  );
  return parts[index + 1].split('_')[0];
}

export function createWorld(overrides: Partial<FakeWorld> = {}): FakeWorld {
  const calls: string[][] = [];
  const processes = new Map<string, Pm2Process>();
  const world: FakeWorld = {
    calls,
    cli: {},
    pendingTasks: {},
    published: ['1.0.0', '1.1.0'],
    startStatus: 'online',
    startQueue: [],
    builds: 0,
    ...overrides,
  } as FakeWorld;

  world.run = async (command, args, options = {}) => {
    const joined = [command, ...args].join(' ');
    calls.push([command, ...args]);
    const cwd = options.cwd ?? process.cwd();
    const env = options.env ?? process.env;
    if (world.hangOn && joined.includes(world.hangOn)) {
      await new Promise<void>((resolve) => {
        const stop = onInterrupt(() => {
          stop();
          resolve();
        });
      });
      takeInterrupt();
      throw interruptError();
    }
    if (world.failOn && joined.includes(world.failOn)) {
      throw new CommandFailedError(
        joined,
        1,
        '',
        `simulated failure of ${world.failOn}`,
      );
    }
    if (command === 'pnpm' && args[0] === '--version')
      return { stdout: '11.7.0\n', stderr: '' };
    if (command === 'pnpm' && args[0] === 'create') {
      const project = path.join(cwd, 'hub');
      mkdirSync(path.join(project, 'node_modules/@nocobase/app-server'), {
        recursive: true,
      });
      writeFileSync(
        path.join(project, 'node_modules/@nocobase/app-server/package.json'),
        JSON.stringify({
          peerDependencies: { '@nocobase/db-postgres': '^0.1.0' },
        }),
      );
      return {
        stdout: '{"status":"success","stage":"complete"}\n',
        stderr: '',
      };
    }
    if (command === 'pnpm' && args[0] === 'add')
      return { stdout: '', stderr: '' };
    if (command === 'pnpm' && args[0] === 'build') {
      makeArchive(path.join(cwd, 'storage/exports/dist.tar.gz'), {
        version: versionFromPath(cwd),
        builtAt: new Date(
          Date.UTC(2026, 0, 1) + world.builds++ * 60_000,
        ).toISOString(),
        basePath: '/hub',
        templateKind: 'hub',
        legacy: world.legacyManifest,
      });
      return { stdout: '', stderr: '' };
    }
    if (
      command === process.execPath &&
      args[0]?.endsWith(path.join('dist', 'cli', 'index.js'))
    ) {
      const release = path.dirname(path.dirname(path.dirname(args[0])));
      const version = versionFromPath(release);
      const cli = args.slice(1).filter((arg) => arg !== '--json');
      const key =
        cli[0] === 'db' && cli.includes('--dry-run')
          ? 'db apply --dry-run'
          : cli.slice(0, 2).join(' ');
      const override = world.cli[key];
      if (override !== undefined) {
        return { stdout: JSON.stringify(override), stderr: '' };
      }
      if (key === 'config init') {
        writeFileSync(
          cli[cli.indexOf('--config') + 1],
          `${readFileSync(path.join(release, 'config.example.yml'), 'utf8')}auth:\n  secret: generated\n`,
          { mode: 0o600 },
        );
      }
      if (key === 'db apply') {
        const database = path.join(
          world.ignoresStorageDir
            ? path.join(release, 'storage')
            : (env.APP_STORAGE_DIR ?? ''),
          'hub/database/main.sqlite',
        );
        mkdirSync(path.dirname(database), { recursive: true });
        const before = (() => {
          try {
            return readFileSync(database, 'utf8');
          } catch {
            return '';
          }
        })();
        if ((world.pendingTasks[version] ?? 0) > 0 || before === '') {
          writeFileSync(database, `schema of ${version}`);
        }
      }
      const tasks = Array.from(
        { length: world.pendingTasks[version] ?? 0 },
        () => ({}),
      );
      return {
        stdout: JSON.stringify({
          ok: true,
          status: 'success',
          result: key === 'db apply --dry-run' ? { plan: [{ tasks }] } : {},
        }),
        stderr: '',
      };
    }
    throw new Error(`The fake world does not know how to run: ${joined}`);
  };

  const pm2Calls: string[] = [];
  world.pm2 = {
    processes,
    calls: pm2Calls,
    async version() {
      pm2Calls.push('version');
      return '7.0.3';
    },
    async start(file, cwd) {
      pm2Calls.push(`start ${file}`);
      const ecosystem = readFileSync(file, 'utf8');
      const name = /name: "([^"]+)"/u.exec(ecosystem)?.[1] ?? 'unknown';
      processes.set(name, {
        name,
        pid: 4242,
        status: world.startQueue.shift() ?? world.startStatus,
        restarts: 0,
        cwd,
      });
    },
    async stop(name) {
      pm2Calls.push(`stop ${name}`);
      const known = processes.get(name);
      if (known) known.status = 'stopped';
    },
    async remove(name) {
      pm2Calls.push(`delete ${name}`);
      processes.delete(name);
    },
    async save() {
      pm2Calls.push('save');
    },
    async describe(name) {
      return processes.get(name);
    },
  };

  world.fetchImpl = async (url) => {
    if (url.endsWith('/api/healthz')) {
      const ok = world.healthy
        ? world.healthy()
        : [...processes.values()].some((entry) => entry.status === 'online');
      if (!ok) throw new Error('ECONNREFUSED');
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        'dist-tags': { latest: world.published.at(-1) },
        versions: Object.fromEntries(
          world.published.map((version) => [version, {}]),
        ),
      }),
    };
  };
  return world;
}

function capture(): { stream: Writable; text: () => string } {
  let buffer = '';
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      buffer += chunk.toString();
      callback();
    },
  });
  return { stream, text: () => buffer };
}

export interface RunResult {
  code: number;
  json: {
    ok: boolean;
    status: string;
    result?: Record<string, unknown>;
    error?: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
    warnings: string[];
  };
  stderr: string;
}

/** Runs the installer against the fake world, always with `--json`, and returns the parsed envelope. */
export async function hub(
  world: FakeWorld,
  argv: string[],
  cwd?: string,
): Promise<RunResult> {
  const stdout = capture();
  const stderr = capture();
  const code = await runInstaller({
    argv: [...argv, '--json'],
    version: '0.0.0-test',
    stdout: stdout.stream,
    stderr: stderr.stream,
    cwd,
    pm2: world.pm2,
    fetchImpl: world.fetchImpl,
    run: world.run,
  });
  return {
    code,
    json: JSON.parse(stdout.text()) as RunResult['json'],
    stderr: stderr.text(),
  };
}

/** A port nothing listens on right now, so parallel test files never race for a fixed one. */
export async function freePort(): Promise<number> {
  const { createServer } = await import('node:net');
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}

export function tempDir(prefix: string): { dir: string; remove: () => void } {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  return { dir, remove: () => rmSync(dir, { recursive: true, force: true }) };
}
