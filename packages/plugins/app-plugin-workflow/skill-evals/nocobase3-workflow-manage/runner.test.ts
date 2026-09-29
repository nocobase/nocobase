import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { WorkflowRunRepository } from '../../server/repositories/workflow-run-repository.js';

import { loadPromptCases } from './runner/load-cases.js';
import { prepareCaseWorkspace } from './runner/workspace.js';
import {
  closeRuntimeFixture,
  createRuntimeFixture,
  openRuntimeFixture,
} from './runtime/fixture-db.js';

const testsRoot = fileURLToPath(new URL('.', import.meta.url));
const packageRoot = path.resolve(testsRoot, '../..');
const repoRoot = path.resolve(packageRoot, '../../..');
const cleanup: Array<() => Promise<void>> = [];
const execFileAsync = promisify(execFile);

afterEach(async () => {
  await Promise.allSettled(cleanup.splice(0).map((run) => run()));
});

describe('workflow skill prompt fixtures', () => {
  it('keeps the published skill in its owning plugin package', async () => {
    const manifest = JSON.parse(
      await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'),
    ) as { files?: string[] };

    expect(manifest.files).toContain('skills');
    expect(manifest.files).not.toContain('.agents');
    await expect(
      fs.readFile(
        path.join(packageRoot, 'skills/nocobase-app-plugin-workflow/SKILL.md'),
        'utf8',
      ),
    ).resolves.toContain('name: nocobase-app-plugin-workflow');
    await expect(
      fs.stat(
        path.join(
          repoRoot,
          'packages/templates/app-template-default/.agents/skills/nocobase3-workflow-manage',
        ),
      ),
    ).rejects.toThrow();
  });

  it('loads unique cases from both suites', async () => {
    const cases = await loadPromptCases(testsRoot);
    expect(cases.length).toBeGreaterThanOrEqual(28);
    expect(new Set(cases.map((item) => item.case.id)).size).toBe(cases.length);
    expect(
      cases.some((item) => item.case.fixture === 'runtime-diagnostics'),
    ).toBe(true);
    expect(
      cases.find((item) => item.case.id === 'update-existing-order-workflow')
        ?.case.fixture,
    ).toBe('source-existing-order-fulfillment');
    expect(cases.some((item) => item.case.skillMode === 'implicit')).toBe(true);
  });

  it('uses the published Skill and current workflow checker paths', async () => {
    await expect(
      fs.stat(
        path.join(packageRoot, 'skills/nocobase-app-plugin-workflow/SKILL.md'),
      ),
    ).resolves.toBeTruthy();
    await expect(
      fs.stat(path.join(packageRoot, 'cli/check.ts')),
    ).resolves.toBeTruthy();

    const promptCase = (await loadPromptCases(testsRoot))[0].case;
    const workspace = await prepareCaseWorkspace({
      case: promptCase,
      repoRoot,
      testsRoot,
      keep: false,
    });
    const fixtureManifest = JSON.parse(
      await fs.readFile(
        path.join(
          workspace.root,
          'node_modules/@nocobase/app-plugin-workflow/package.json',
        ),
        'utf8',
      ),
    ) as { exports: Record<string, unknown> };
    expect(fixtureManifest.exports).toHaveProperty('./dsl');
    await expect(
      fs.stat(
        path.join(
          workspace.root,
          'node_modules/@nocobase/app-plugin-workflow/dsl/index.ts',
        ),
      ),
    ).resolves.toBeTruthy();
    await expect(
      fs.readFile(path.join(workspace.root, 'TEST_CONTEXT.md'), 'utf8'),
    ).resolves.toContain('/bin/run.js workflow check');
    const validWorkflow = path.join(
      workspace.root,
      'workflows/valid-quotation',
    );
    await execFileAsync(
      process.execPath,
      [
        path.join(repoRoot, 'packages/app/app-cli/bin/run.js'),
        'workflow',
        'check',
        validWorkflow,
      ],
      {
        cwd: workspace.root,
        env: {
          ...process.env,
          NOCOBASE_APP_ROOT: path.join(
            repoRoot,
            'packages/templates/app-template-default',
          ),
        },
      },
    );
    await workspace.cleanup();
  });

  it('installs the published Skill for implicit-selection cases', async () => {
    const promptCase = (await loadPromptCases(testsRoot)).find(
      (item) => item.case.skillMode === 'implicit',
    )?.case;
    if (!promptCase) throw new Error('Implicit selection case was not found.');
    const workspace = await prepareCaseWorkspace({
      case: promptCase,
      repoRoot,
      testsRoot,
      keep: false,
    });
    await expect(
      fs.readFile(
        path.join(
          workspace.root,
          '.agents/skills/nocobase-app-plugin-workflow/SKILL.md',
        ),
        'utf8',
      ),
    ).resolves.toContain('name: nocobase-app-plugin-workflow');
    await workspace.cleanup();
  });

  it('creates isolated parallel workspaces and cleans them', async () => {
    const promptCase = (await loadPromptCases(testsRoot))[0].case;
    const [first, second] = await Promise.all([
      prepareCaseWorkspace({
        case: promptCase,
        repoRoot,
        testsRoot,
        keep: false,
      }),
      prepareCaseWorkspace({
        case: promptCase,
        repoRoot,
        testsRoot,
        keep: false,
      }),
    ]);
    expect(first.root).not.toBe(second.root);
    await expect(
      fs.stat(path.join(first.root, 'TEST_CONTEXT.md')),
    ).resolves.toBeTruthy();
    await Promise.all([first.cleanup(), second.cleanup()]);
    await expect(fs.stat(first.root)).rejects.toThrow();
    await expect(fs.stat(second.root)).rejects.toThrow();
  });

  it('copies the existing workflow fixture into a mutation workspace', async () => {
    const promptCase = (await loadPromptCases(testsRoot)).find(
      (item) => item.case.id === 'update-existing-order-workflow',
    )?.case;
    if (!promptCase)
      throw new Error('Update workflow prompt case was not found.');
    const workspace = await prepareCaseWorkspace({
      case: promptCase,
      repoRoot,
      testsRoot,
      keep: false,
    });
    await expect(
      fs.readFile(
        path.join(
          workspace.root,
          'workflows/existing-order-fulfillment/workflow.ts',
        ),
        'utf8',
      ),
    ).resolves.toContain("key: 'recordOutcome'");
    await workspace.cleanup();
  });

  it('seeds diagnostic runs queryable through the real workflow service', async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'workflow-fixture-test-'),
    );
    cleanup.push(() => fs.rm(directory, { recursive: true, force: true }));
    const fixture = await createRuntimeFixture(
      path.join(directory, 'fixture.sqlite'),
      'runtime-diagnostics',
    );
    cleanup.push(() => closeRuntimeFixture(fixture));
    const runtime = {
      trigger: async () => ({
        status: 'accepted' as const,
        eventKey: 'test-event',
        runId: '1',
      }),
      triggerRevision: async () => ({
        status: 'accepted' as const,
        eventKey: 'test-event',
        runId: '1',
      }),
      discoverArtifacts: async () => [],
      ensureArtifactMaterialized: async () => undefined,
    };
    const runs = new WorkflowRunRepository(fixture.database, runtime);
    await expect(runs.get(9001)).resolves.toMatchObject({
      workflowKey: 'order-fulfillment',
      status: -2,
    });
    const attempts = await runs.nodeRuns(9001, 'chargePayment');
    expect(attempts).toHaveLength(2);
    await expect(runs.get(9002)).resolves.toMatchObject({
      workflowKey: 'quotation-decision',
      status: 1,
    });
    await expect(runs.get(781)).resolves.toMatchObject({
      workflowKey: 'tenant-provisioning',
      reason: 'timeout',
    });
  });

  it('creates a different SQLite database for every parallel case workspace', async () => {
    const promptCase = (await loadPromptCases(testsRoot)).find(
      (item) => item.case.id === 'diagnose-failed-rerun-attempts',
    )?.case;
    if (!promptCase) throw new Error('Diagnostic prompt case was not found.');
    const [first, second] = await Promise.all([
      prepareCaseWorkspace({
        case: promptCase,
        repoRoot,
        testsRoot,
        keep: false,
      }),
      prepareCaseWorkspace({
        case: promptCase,
        repoRoot,
        testsRoot,
        keep: false,
      }),
    ]);
    const firstDatabase = first.fixtureDatabase;
    const secondDatabase = second.fixtureDatabase;
    if (!firstDatabase || !secondDatabase) {
      throw new Error('Runtime case did not create fixture databases.');
    }
    expect(firstDatabase).not.toBe(secondDatabase);
    const firstFixture = await openRuntimeFixture(firstDatabase);
    const secondFixture = await openRuntimeFixture(secondDatabase);
    const runtime = {
      trigger: async () => ({
        status: 'accepted' as const,
        eventKey: 'test-event',
        runId: '1',
      }),
      triggerRevision: async () => ({
        status: 'accepted' as const,
        eventKey: 'test-event',
        runId: '1',
      }),
      discoverArtifacts: async () => [],
      ensureArtifactMaterialized: async () => undefined,
    };
    await expect(
      new WorkflowRunRepository(firstFixture.database, runtime).get(9001),
    ).resolves.toMatchObject({ eventKey: 'order-created:O-9' });
    await expect(
      new WorkflowRunRepository(secondFixture.database, runtime).get(9001),
    ).resolves.toMatchObject({ eventKey: 'order-created:O-9' });
    await Promise.all([
      closeRuntimeFixture(firstFixture),
      closeRuntimeFixture(secondFixture),
    ]);
    await Promise.all([first.cleanup(), second.cleanup()]);
  });
});
