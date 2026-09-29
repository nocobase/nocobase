import { execFile } from 'node:child_process';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { bindAppCommand, runAppCommand } from '@nocobase/app-cli/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import WorkflowBuild from '../cli/build.ts';
import WorkflowCheck from '../cli/check.ts';
import cliPlugin from '../cli/index.ts';
import packageMetadata from '../package.json' with { type: 'json' };

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(packageRoot, '../../..');
// The application CLI of the Default template, named through `NOCOBASE_APP_ROOT` so the working directory stays free
// for the relative paths each test passes.
const appCli = path.join(repoRoot, 'packages/app/app-cli/bin/run.js');
const appRoot = path.join(repoRoot, 'packages/templates/app-template-default');
const appEnv = { ...process.env, NOCOBASE_APP_ROOT: appRoot };

describe('workflow CLI contribution', () => {
  it('declares the workflow topic and command map', () => {
    expect(cliPlugin).toMatchObject({
      packageName: packageMetadata.name,
      topic: 'workflow',
      commands: {},
      // Both act on workflow sources, which a built `dist/` does not carry.
      devCommands: {
        check: WorkflowCheck,
        build: WorkflowBuild,
      },
    });
  });

  /**
   * The build stage reads the compiled `.js` a deployment runs, so it has to follow `tsc`. There is no dev
   * counterpart: outside production the loader compiles `workflows` on demand and produces the digest a build
   * would produce, so a preflight build would put seconds back on every `pnpm dev` start and reintroduce the
   * rebuild-and-restart loop it replaced, without making anything visible that is not already visible.
   */
  it('builds artifacts after the server build and never before a dev run', () => {
    expect(cliPlugin.buildHooks).toEqual({
      afterServerBuild: [
        {
          label: 'Build workflow artifacts',
          command: [
            'pnpm',
            'nocobase',
            'workflow',
            'build',
            '--resource-root',
            './dist/workflows',
          ],
        },
      ],
    });
    expect(cliPlugin.devHooks).toEqual({});
  });

  it('exposes the cli entry and shares the app oclif runtime', () => {
    expect(packageMetadata.exports['./cli']).toBeDefined();
    expect(packageMetadata.publishConfig.exports['./cli']).toBeDefined();
    // Declared once each. pnpm resolves both peers here on its own, so a duplicate devDependency adds nothing.
    expect(packageMetadata.peerDependencies['@nocobase/app-cli']).toBeTruthy();
    expect(packageMetadata.peerDependencies['@oclif/core']).toBeTruthy();
    expect(
      packageMetadata.devDependencies?.['@nocobase/app-cli'],
    ).toBeUndefined();
    expect(packageMetadata.devDependencies?.['@oclif/core']).toBeUndefined();
  });

  it('gives every command, flag, and argument help text', () => {
    for (const [name, command] of Object.entries(cliPlugin.devCommands)) {
      expect(command.summary, `${name} has no summary`).toBeTruthy();
      expect(
        command.examples?.length,
        `${name} has no example`,
      ).toBeGreaterThan(0);
      for (const [flag, definition] of Object.entries(command.flags ?? {})) {
        expect(
          definition.description ?? definition.summary,
          `${name} --${flag} has no description`,
        ).toBeTruthy();
      }
      for (const [argument, definition] of Object.entries(command.args ?? {})) {
        expect(
          definition.description,
          `${name} ${argument} has no description`,
        ).toBeTruthy();
      }
    }
  });

  it('checks a relative workflow path through the application CLI', async () => {
    const fixture = path.relative(
      packageRoot,
      path.join(
        packageRoot,
        'skill-evals/nocobase3-workflow-manage/fixtures/workflows/valid-quotation',
      ),
    );
    const { stdout } = await execFileAsync(
      process.execPath,
      [appCli, 'workflow', 'check', fixture, '--json'],
      { cwd: packageRoot, env: appEnv },
    );

    expect(JSON.parse(stdout)).toMatchObject({
      schemaVersion: 1,
      ok: true,
      command: 'workflow check',
      status: 'success',
      result: {
        file: path.join(packageRoot, fixture, 'workflow.ts'),
        nodes: expect.any(Number),
      },
    });
  });
});

/**
 * The commands bound to a throwaway application, the way the runner points them at the one it located. The working
 * directory is moved elsewhere on purpose: a default path belongs to the application, not to where the command ran.
 */
describe('workflow commands bound to an application', () => {
  let root: string;
  let elsewhere: string;
  let Build: typeof WorkflowBuild;
  let Check: typeof WorkflowCheck;

  beforeEach(async () => {
    root = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'workflow-cli-'));
    elsewhere = await fsPromises.mkdtemp(
      path.join(os.tmpdir(), 'workflow-cli-cwd-'),
    );
    vi.spyOn(process, 'cwd').mockReturnValue(elsewhere);
    Build = bindAppCommand(WorkflowBuild, {
      id: 'workflow:build',
      rootDir: root,
    });
    Check = bindAppCommand(WorkflowCheck, {
      id: 'workflow:check',
      rootDir: root,
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fsPromises.rm(root, { recursive: true, force: true });
    await fsPromises.rm(elsewhere, { recursive: true, force: true });
  });

  async function writeWorkflow(title: string, nodes = '[]'): Promise<string> {
    const packagePath = path.join(root, 'workflows/example');
    await fsPromises.mkdir(packagePath, { recursive: true });
    await fsPromises.writeFile(
      path.join(packagePath, 'workflow.ts'),
      `import { defineWorkflow, RunInstruction } from ${JSON.stringify(path.join(packageRoot, 'index.ts'))};\nexport default defineWorkflow({ title: ${JSON.stringify(title)}, nodes: ${nodes} });\n`,
    );
    return packagePath;
  }

  // A config value of the wrong type, which the typecheck phase rejects.
  const brokenNodes =
    "[RunInstruction.create({ key: 'run', config: { module: 1 } })]";

  /** The directory of the one Artifact built for the `example` package. */
  async function artifactDirectory(): Promise<string> {
    const keyRoot = path.join(root, 'dist/workflows/example');
    const [digest] = await fsPromises.readdir(keyRoot);
    return path.join(keyRoot, digest ?? '');
  }

  it('builds from the default paths inside the application, wherever the command runs', async () => {
    await writeWorkflow('CLI build');

    const run = await runAppCommand(Build, []);

    expect(run.result).toEqual({
      packages: 1,
      distRoot: path.join(root, 'dist/workflows'),
    });
    await expect(
      fsPromises.readFile(
        path.join(await artifactDirectory(), 'workflow.json'),
        'utf8',
      ),
    ).resolves.toContain('"title": "CLI build"');
    await expect(fsPromises.readdir(elsewhere)).resolves.toEqual([]);
  });

  // `nocobase build` runs the afterServerBuild hook from the application root, with a relative --resource-root.
  it('reads compiled resources from a relative --resource-root, as the build hook passes it', async () => {
    await writeWorkflow('Hook build');
    const compiled = path.join(root, 'dist/workflows/example');
    await fsPromises.mkdir(compiled, { recursive: true });
    // What `tsc` leaves there: the compiled definition and a module it references.
    await fsPromises.writeFile(
      path.join(compiled, 'workflow.js'),
      'export default {};\n',
    );
    await fsPromises.writeFile(
      path.join(compiled, 'helper.js'),
      'export {};\n',
    );
    vi.mocked(process.cwd).mockReturnValue(root);
    const [, , , , ...hookArgs] =
      cliPlugin.buildHooks.afterServerBuild?.[0]?.command ?? [];

    const run = await runAppCommand(Build, hookArgs);

    expect(hookArgs).toEqual(['--resource-root', './dist/workflows']);
    expect(run.result).toMatchObject({ packages: 1 });
    await expect(
      fsPromises.readdir(await artifactDirectory()),
    ).resolves.toContain('helper.js');
  });

  it('fails a build with WORKFLOW_BUILD_FAILED and the source issues', async () => {
    await writeWorkflow('Broken build', brokenNodes);

    const run = await runAppCommand(Build, ['--json']);

    expect(run.json()).toMatchObject({
      ok: false,
      command: 'workflow build',
      error: {
        code: 'WORKFLOW_BUILD_FAILED',
        message: expect.stringContaining('Workflow package "example"'),
        details: {
          sourceRoot: path.join(root, 'workflows'),
          issues: [expect.objectContaining({ phase: 'typecheck' })],
        },
      },
    });
    expect(run.exitCode).toBe(1);
  });

  it('prints the checked file and node count as the --json document', async () => {
    const packagePath = await writeWorkflow('CLI check');

    const run = await runAppCommand(Check, [packagePath, '--json']);

    expect(run.json()).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'workflow check',
      status: 'success',
      result: { file: path.join(packagePath, 'workflow.ts'), nodes: 0 },
      warnings: [],
    });
  });

  it('fails a check with WORKFLOW_CHECK_FAILED and the issues in its details', async () => {
    const packagePath = await writeWorkflow('Broken check', brokenNodes);

    const run = await runAppCommand(Check, [packagePath, '--json']);

    expect(run.json()).toMatchObject({
      ok: false,
      error: {
        code: 'WORKFLOW_CHECK_FAILED',
        details: { issues: [expect.objectContaining({ phase: 'typecheck' })] },
      },
    });
    expect(run.exitCode).toBe(1);
  });

  it('fails a check with WORKFLOW_PACKAGE_NOT_FOUND for a path that does not exist', async () => {
    const run = await runAppCommand(Check, ['missing']);

    // Without --json the failure escapes for oclif to print. A typed path resolves from the current directory.
    expect(run.error).toMatchObject({
      errorCode: 'WORKFLOW_PACKAGE_NOT_FOUND',
      message: `Workflow package not found: ${path.join(elsewhere, 'missing')}`,
    });
    expect(run.exitCode).toBe(1);
  });
});
