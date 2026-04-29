import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DEFAULT_SOURCE_ENV = process.env.PUBLISH_E2E_SOURCE_ENV || 'dev';
const DEFAULT_TARGET_ENV = process.env.PUBLISH_E2E_TARGET_ENV || 'dev';

const scenarios = {
  smoke: {
    description: 'Check that publish commands are available.',
  },
  'backup-generate-copy': {
    description: 'Generate a backup publish file and upload it to a target env staging area.',
  },
  'backup-self-restore': {
    description: 'Generate, upload, and execute a backup restore. Destructive execute is gated.',
  },
  'migration-generate-copy': {
    description: 'Create a migration rule, generate a migration publish file, and upload it to a target env.',
  },
  'migration-self-run': {
    description: 'Create, upload, and execute a migration publish file. Destructive execute is gated.',
  },
};

const migrationUserRules = ['schema-only', 'overwrite'];
const migrationSystemRules = ['skip', 'overwrite-first'];

function printHelp() {
  console.log(`Publish CLI E2E runner

Usage:
  yarn --cwd packages/plugins/@nocobase/plugin-publish-manager e2e:publish --scenario <name> --from ${DEFAULT_SOURCE_ENV} --to ${DEFAULT_TARGET_ENV} [options]

Scenarios:
  smoke                 ${scenarios.smoke.description}
  backup-generate-copy  ${scenarios['backup-generate-copy'].description}
  backup-self-restore   ${scenarios['backup-self-restore'].description}
  migration-generate-copy ${scenarios['migration-generate-copy'].description}
  migration-self-run      ${scenarios['migration-self-run'].description}

Options:
  --bin <command>             CLI command to run. Default: nbx
  --from <env>                Source env. Default: PUBLISH_E2E_SOURCE_ENV or dev
  --to <env>                  Target env. Default: PUBLISH_E2E_TARGET_ENV or dev
  --file <fileNameOrPath>     Reuse an existing local publish file and skip generate.
  --rule-id <id>              Reuse an existing migration rule and skip rule creation.
  --migration-user-rule <mode>    User-created table global rule. Default: schema-only
                              Allowed: ${migrationUserRules.join(', ')}
  --migration-system-rule <mode>  System table global rule. Default: skip
                              Allowed: ${migrationSystemRules.join(', ')}
  --allow-destructive         Actually run destructive execute steps.
  --yes                      Alias of --allow-destructive.
  --dry-run                  Print planned steps without running commands.
  --run-dir <dir>            Output directory for logs and summary.
  --timeout-ms <ms>           Per-command timeout. Default: 600000
  --help                     Show this help.
`);
}

function parseArgs(argv) {
  const args = {
    bin: 'nbx',
    scenario: 'backup-generate-copy',
    from: DEFAULT_SOURCE_ENV,
    to: DEFAULT_TARGET_ENV,
    file: undefined,
    ruleId: undefined,
    migrationUserRule: 'schema-only',
    migrationSystemRule: 'skip',
    allowDestructive: false,
    dryRun: false,
    runDir: undefined,
    timeoutMs: 600_000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = () => argv[++index];

    if (token === '--help' || token === '-h') {
      args.help = true;
    } else if (token === '--bin') {
      args.bin = next();
    } else if (token === '--scenario') {
      args.scenario = next();
    } else if (token === '--from') {
      args.from = next();
    } else if (token === '--to') {
      args.to = next();
    } else if (token === '--file') {
      args.file = next();
    } else if (token === '--rule-id') {
      args.ruleId = next();
    } else if (token === '--migration-user-rule') {
      args.migrationUserRule = next();
    } else if (token === '--migration-system-rule') {
      args.migrationSystemRule = next();
    } else if (token === '--allow-destructive' || token === '--yes') {
      args.allowDestructive = true;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--run-dir') {
      args.runDir = next();
    } else if (token === '--timeout-ms') {
      args.timeoutMs = Number(next());
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  args.to = args.to || args.from;
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error('--timeout-ms must be a positive number');
  }
  if (!scenarios[args.scenario]) {
    throw new Error(`Unknown scenario: ${args.scenario}`);
  }
  if (!migrationUserRules.includes(args.migrationUserRule)) {
    throw new Error(`--migration-user-rule must be one of: ${migrationUserRules.join(', ')}`);
  }
  if (!migrationSystemRules.includes(args.migrationSystemRule)) {
    throw new Error(`--migration-system-rule must be one of: ${migrationSystemRules.join(', ')}`);
  }
  return args;
}

function quoteArg(value) {
  const text = String(value);
  if (/^[a-zA-Z0-9_./:=@-]+$/.test(text)) {
    return text;
  }
  return `"${text.replace(/(["\\$`])/g, '\\$1')}"`;
}

function commandLine(bin, args) {
  return [bin, ...args.map(quoteArg)].join(' ');
}

function parseOutputValue(output, label) {
  const pattern = new RegExp(`${label}:\\s*(.+)`, 'i');
  const match = output.match(pattern);
  return match?.[1]?.trim();
}

function stripAnsi(text) {
  return String(text).replace(/\u001b\[[0-9;]*m/g, '');
}

function parseJsonOutput(output) {
  const text = stripAnsi(output).trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error(`No JSON object found in command output: ${text}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

function unwrapResponseData(payload) {
  let data = payload;
  if (data && typeof data === 'object' && 'data' in data) {
    data = data.data;
  }
  if (data && typeof data === 'object' && data.status === 'ok' && 'data' in data) {
    data = data.data;
  }
  return data;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function resolveCliHomeDir() {
  return path.join(process.env.NB_CLI_ROOT || os.homedir(), '.nocobase');
}

function defaultPublishDir(type, envName) {
  return path.join(resolveCliHomeDir(), 'publish', type, envName);
}

async function findLatestBackupFile(envName) {
  const backupDir = defaultPublishDir('backup', envName);
  return findLatestPublishFile(backupDir);
}

async function findLatestMigrationFile(envName) {
  const migrationDir = defaultPublishDir('migration', envName);
  return findLatestPublishFile(migrationDir);
}

async function findLatestPublishFile(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.nbdata'))
      .map(async (entry) => {
        const filePath = path.join(dir, entry.name);
        const stat = await fs.stat(filePath);
        return { filePath, fileName: entry.name, mtimeMs: stat.mtimeMs };
      }),
  );
  files.sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (!files[0]) {
    throw new Error(`No publish file found under ${dir}`);
  }
  return files[0];
}

function resolveLocalPublishFile(type, file, sourceEnv) {
  if (path.isAbsolute(file) || file.includes('/') || file.includes('\\')) {
    return path.resolve(process.cwd(), file);
  }
  return path.join(defaultPublishDir(type, sourceEnv), file);
}

class ScenarioRunner {
  constructor(options) {
    this.options = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.runDir = path.resolve(
      process.cwd(),
      options.runDir || path.join('.nocobase', 'publish-e2e', 'runs', `${options.scenario}-${timestamp}`),
    );
    this.summary = {
      scenario: options.scenario,
      startedAt: new Date().toISOString(),
      options: {
        bin: options.bin,
        from: options.from,
        to: options.to,
        file: options.file,
        ruleId: options.ruleId,
        migrationUserRule: options.migrationUserRule,
        migrationSystemRule: options.migrationSystemRule,
        allowDestructive: options.allowDestructive,
        dryRun: options.dryRun,
      },
      steps: [],
      artifacts: {},
    };
  }

  async runCommand(name, args, options = {}) {
    const line = commandLine(this.options.bin, args);
    const step = {
      name,
      command: line,
      destructive: Boolean(options.destructive),
      skipped: false,
      startedAt: new Date().toISOString(),
    };
    this.summary.steps.push(step);

    if (options.destructive && !this.options.allowDestructive) {
      step.skipped = true;
      step.reason = 'destructive step requires --allow-destructive';
      console.log(`[skip] ${name}: ${step.reason}`);
      return { stdout: '', stderr: '', skipped: true };
    }

    if (this.options.dryRun) {
      step.skipped = true;
      step.reason = 'dry run';
      console.log(`[dry-run] ${line}`);
      return { stdout: '', stderr: '', skipped: true };
    }

    console.log(`[run] ${line}`);
    const result = await new Promise((resolve) => {
      const child = spawn(this.options.bin, args, {
        cwd: process.cwd(),
        shell: true,
        windowsHide: true,
        env: process.env,
      });
      let stdout = '';
      let stderr = '';
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          code: 124,
          stdout,
          stderr: `${stderr}\nCommand timed out after ${this.options.timeoutMs}ms`,
          timedOut: true,
        });
      }, this.options.timeoutMs);

      child.stdout?.on('data', (chunk) => {
        const text = String(chunk);
        stdout += text;
        process.stdout.write(text);
      });
      child.stderr?.on('data', (chunk) => {
        const text = String(chunk);
        stderr += text;
        process.stderr.write(text);
      });
      child.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ code: 1, stdout, stderr: `${stderr}\n${error.message}` });
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({ code: code ?? 0, stdout, stderr });
      });
    });

    step.finishedAt = new Date().toISOString();
    step.code = result.code;
    step.timedOut = Boolean(result.timedOut);
    await fs.writeFile(path.join(this.runDir, `${this.summary.steps.length}-${name}.stdout.log`), result.stdout || '', 'utf8');
    await fs.writeFile(path.join(this.runDir, `${this.summary.steps.length}-${name}.stderr.log`), result.stderr || '', 'utf8');

    if (result.code !== 0) {
      throw new Error(`Step "${name}" failed with exit code ${result.code}`);
    }
    return result;
  }

  async run() {
    await ensureDir(this.runDir);
    console.log(`Scenario: ${this.options.scenario}`);
    console.log(`Run dir: ${this.runDir}`);

    try {
      if (this.options.scenario === 'smoke') {
        await this.runSmoke();
      } else if (this.options.scenario === 'backup-generate-copy') {
        await this.runBackupGenerateCopy();
      } else if (this.options.scenario === 'backup-self-restore') {
        await this.runBackupSelfRestore();
      } else if (this.options.scenario === 'migration-generate-copy') {
        await this.runMigrationGenerateCopy();
      } else if (this.options.scenario === 'migration-self-run') {
        await this.runMigrationSelfRun();
      }
      this.summary.finishedAt = new Date().toISOString();
      this.summary.status = 'passed';
      return 0;
    } catch (error) {
      this.summary.finishedAt = new Date().toISOString();
      this.summary.status = 'failed';
      this.summary.error = error.message;
      console.error(`\n[failed] ${error.message}`);
      return 1;
    } finally {
      await writeJson(path.join(this.runDir, 'summary.json'), this.summary);
      console.log(`Summary: ${path.join(this.runDir, 'summary.json')}`);
    }
  }

  async runSmoke() {
    await this.runCommand('publish-help', ['publish', '--help']);
    await this.runCommand('publish-generate-help', ['publish', 'generate', '--help']);
    await this.runCommand('publish-copy-help', ['publish', 'copy', '--help']);
    await this.runCommand('publish-execute-help', ['publish', 'execute', '--help']);
  }

  async runBackupGenerateCopy() {
    let fileName;
    let localFile;

    if (this.options.file) {
      localFile = resolveLocalPublishFile('backup', this.options.file, this.options.from);
      fileName = path.basename(localFile);
      this.summary.artifacts.localFile = localFile;
      this.summary.artifacts.fileName = fileName;
      this.summary.artifacts.fileArg = this.options.file;
    } else {
      const generate = await this.runCommand('backup-generate', [
        'publish',
        'generate',
        '--type',
        'backup',
        '--env',
        this.options.from,
        '--wait',
      ]);
      localFile = parseOutputValue(generate.stdout, 'Local file');
      const generatedArtifactId = parseOutputValue(generate.stdout, 'Artifact');
      if (!localFile && generate.skipped) {
        fileName = '<generated-backup-file>.nbdata';
        localFile = path.join(defaultPublishDir('backup', this.options.from), fileName);
      } else if (!localFile) {
        const latest = await findLatestBackupFile(this.options.from);
        localFile = latest.filePath;
      }
      fileName = path.basename(localFile);
      this.summary.artifacts.localFile = localFile;
      this.summary.artifacts.fileName = fileName;
      this.summary.artifacts.generatedArtifactId = generatedArtifactId;
      this.summary.artifacts.fileArg = fileName;
    }

    const copy = await this.runCommand('backup-copy', [
      'publish',
      'copy',
      '--type',
      'backup',
      '--from',
      this.options.from,
      '--to',
      this.options.to,
      '--file',
      this.summary.artifacts.fileArg,
    ]);
    this.summary.artifacts.uploadedArtifactId = parseOutputValue(copy.stdout, 'Artifact');
    return this.summary.artifacts;
  }

  async runBackupSelfRestore() {
    const artifacts = await this.runBackupGenerateCopy();
    await this.runCommand('backup-execute', [
      'publish',
      'execute',
      '--type',
      'backup',
      '--env',
      this.options.to,
      '--file',
      artifacts.fileArg,
      '--yes',
      '--wait',
    ], { destructive: true });
  }

  buildMigrationRuleValues() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return {
      name: `publish-e2e-${this.options.from}-${this.options.to}-${timestamp}`,
      description: 'Created by publish CLI E2E runner',
      rules: {
        userDefined: {
          globalRule: this.options.migrationUserRule,
        },
        systemDefined: {
          globalRule: this.options.migrationSystemRule,
        },
      },
    };
  }

  async createMigrationRule() {
    if (this.options.ruleId) {
      this.summary.artifacts.ruleId = this.options.ruleId;
      this.summary.artifacts.ruleSource = 'provided';
      return this.options.ruleId;
    }

    const values = this.buildMigrationRuleValues();
    const valuesFile = path.join(this.runDir, 'migration-rule-values.json');
    await writeJson(valuesFile, values);
    const create = await this.runCommand('migration-rule-create', [
      'api',
      'resource',
      'create',
      '--env',
      this.options.from,
      '--resource',
      'migrationRules',
      '--values-file',
      valuesFile,
      '--json-output',
    ]);
    if (create.skipped) {
      const ruleId = '<created-migration-rule-id>';
      this.summary.artifacts.ruleId = ruleId;
      this.summary.artifacts.ruleSource = 'dry-run';
      this.summary.artifacts.ruleValues = values;
      return ruleId;
    }
    const payload = unwrapResponseData(parseJsonOutput(create.stdout));
    const ruleId = payload?.id ?? payload?.data?.id;
    if (!ruleId) {
      throw new Error(`Migration rule created but no id was found in response: ${create.stdout}`);
    }
    this.summary.artifacts.ruleId = String(ruleId);
    this.summary.artifacts.ruleSource = 'created';
    this.summary.artifacts.ruleValues = values;
    return String(ruleId);
  }

  async runMigrationGenerateCopy() {
    let fileName;
    let localFile;
    const ruleId = await this.createMigrationRule();

    if (this.options.file) {
      localFile = resolveLocalPublishFile('migration', this.options.file, this.options.from);
      fileName = path.basename(localFile);
      this.summary.artifacts.localFile = localFile;
      this.summary.artifacts.fileName = fileName;
      this.summary.artifacts.fileArg = this.options.file;
    } else {
      const generate = await this.runCommand('migration-generate', [
        'publish',
        'generate',
        '--type',
        'migration',
        '--env',
        this.options.from,
        '--rule',
        ruleId,
        '--title',
        `publish-e2e-${this.options.from}-to-${this.options.to}`,
        '--wait',
      ]);
      localFile = parseOutputValue(generate.stdout, 'Local file');
      const generatedArtifactId = parseOutputValue(generate.stdout, 'Artifact');
      if (!localFile && generate.skipped) {
        fileName = '<generated-migration-file>.nbdata';
        localFile = path.join(defaultPublishDir('migration', this.options.from), fileName);
      } else if (!localFile) {
        const latest = await findLatestMigrationFile(this.options.from);
        localFile = latest.filePath;
      }
      fileName = path.basename(localFile);
      this.summary.artifacts.localFile = localFile;
      this.summary.artifacts.fileName = fileName;
      this.summary.artifacts.generatedArtifactId = generatedArtifactId;
      this.summary.artifacts.fileArg = fileName;
    }

    const copy = await this.runCommand('migration-copy', [
      'publish',
      'copy',
      '--type',
      'migration',
      '--from',
      this.options.from,
      '--to',
      this.options.to,
      '--file',
      this.summary.artifacts.fileArg,
    ]);
    this.summary.artifacts.uploadedArtifactId = parseOutputValue(copy.stdout, 'Artifact');
    return this.summary.artifacts;
  }

  async runMigrationSelfRun() {
    const artifacts = await this.runMigrationGenerateCopy();
    await this.runCommand('migration-execute', [
      'publish',
      'execute',
      '--type',
      'migration',
      '--env',
      this.options.to,
      '--file',
      artifacts.fileArg,
      '--yes',
      '--wait',
    ], { destructive: true });
  }
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    const runner = new ScenarioRunner(options);
    process.exitCode = await runner.run();
  } catch (error) {
    console.error(error.message);
    printHelp();
    process.exitCode = 1;
  }
}

await main();
