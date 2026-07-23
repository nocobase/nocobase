import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { VerificationError, verifyFixture } from '../verify-pr-checks.mjs';

const manifest = JSON.parse(await readFile(new URL('../required-checks.json', import.meta.url), 'utf8'));
const successFixture = JSON.parse(await readFile(new URL('./fixtures/success.json', import.meta.url), 'utf8'));
const options = { head: 'head-sha', baseHead: 'base-sha', requireMergeable: true };

function fixture() {
  return structuredClone(successFixture);
}

async function rejectsWith(input, pattern) {
  await assert.rejects(
    verifyFixture(manifest, input, options),
    (error) => error instanceof VerificationError && pattern.test(error.message),
  );
}

test('accepts native Actions, external aggregate checks, and a jobless status context', async () => {
  const report = await verifyFixture(manifest, fixture(), options);
  assert.deepEqual(
    report.checks.map((check) => check.id),
    ['frontend', 'windows', 'backend', 'build-pro-image', 'cla'],
  );
});

test('does not compare an external workflow head SHA with the PR head SHA', async () => {
  const input = fixture();
  input.workflowRuns['chenos/nocobase-ci#201'].head_sha = 'ci-repository-sha';
  await verifyFixture(manifest, input, options);
});

test('rejects a missing Windows or database matrix job', async () => {
  const withoutWindows = fixture();
  withoutWindows.workflowJobs['nocobase/nocobase#102'] = [];
  await rejectsWith(withoutWindows, /windows: expected 1 job/u);

  const withoutDatabaseLane = fixture();
  withoutDatabaseLane.workflowJobs['chenos/nocobase-ci#201'].splice(3, 1);
  await rejectsWith(withoutDatabaseLane, /backend: expected 1 job/u);
});

test('rejects a same-name aggregate check from the wrong app', async () => {
  const input = fixture();
  input.checkRuns.find((check) => check.name === 'Backend test').app.id = 1;
  await rejectsWith(input, /backend: no PR-head aggregate CheckRun matched/u);
});

test('uses the latest workflow attempt so an old success cannot hide a new pending run', async () => {
  const input = fixture();
  input.checkRuns.push({
    ...structuredClone(input.checkRuns[0]),
    id: 1001,
    details_url: 'https://github.com/nocobase/nocobase/actions/runs/100/job/1001',
  });
  input.workflowRuns['nocobase/nocobase#100'] = {
    ...structuredClone(input.workflowRuns['nocobase/nocobase#101']),
    id: 100,
    run_attempt: 1,
  };
  input.workflowJobs['nocobase/nocobase#100'] = structuredClone(input.workflowJobs['nocobase/nocobase#101']);
  input.workflowRuns['nocobase/nocobase#101'].run_attempt = 2;
  input.workflowRuns['nocobase/nocobase#101'].status = 'in_progress';
  input.workflowRuns['nocobase/nocobase#101'].conclusion = null;

  await rejectsWith(input, /frontend: latest workflow run is in_progress\/pending/u);
});

test('uses the latest aggregate id so an old cancelled run does not hide a newer success', async () => {
  const input = fixture();
  const current = input.checkRuns.find((check) => check.name === 'Backend test');
  input.checkRuns.push({
    ...structuredClone(current),
    id: 2001,
    status: 'completed',
    conclusion: 'cancelled',
    details_url: 'https://github.com/chenos/nocobase-ci/actions/runs/200',
  });
  input.workflowRuns['chenos/nocobase-ci#200'] = {
    ...structuredClone(input.workflowRuns['chenos/nocobase-ci#201']),
    id: 200,
    status: 'completed',
    conclusion: 'cancelled',
  };
  input.workflowJobs['chenos/nocobase-ci#200'] = structuredClone(input.workflowJobs['chenos/nocobase-ci#201']);

  await verifyFixture(manifest, input, options);
});

test('does not let an old aggregate success hide a newer pending check', async () => {
  const input = fixture();
  const current = input.checkRuns.find((check) => check.name === 'Backend test');
  input.checkRuns.push({
    ...structuredClone(current),
    id: 2031,
    status: 'queued',
    conclusion: null,
    details_url: 'https://github.com/chenos/nocobase-ci/actions/runs/203',
  });
  input.workflowRuns['chenos/nocobase-ci#203'] = {
    ...structuredClone(input.workflowRuns['chenos/nocobase-ci#201']),
    id: 203,
    status: 'queued',
    conclusion: null,
  };
  input.workflowJobs['chenos/nocobase-ci#203'] = structuredClone(input.workflowJobs['chenos/nocobase-ci#201']);

  await rejectsWith(input, /backend: latest aggregate CheckRun is queued\/pending/u);
});

test('rejects non-success required job and check states', async (t) => {
  for (const conclusion of ['failure', 'neutral', 'cancelled', 'skipped']) {
    await t.test(conclusion, async () => {
      const input = fixture();
      const job = input.workflowJobs['nocobase/nocobase#101'][1];
      job.conclusion = conclusion;
      await rejectsWith(input, new RegExp(`frontend: job .* completed/${conclusion}`, 'u'));
    });
  }

  await t.test('pending', async () => {
    const input = fixture();
    const job = input.workflowJobs['nocobase/nocobase#101'][1];
    job.status = 'queued';
    job.conclusion = null;
    await rejectsWith(input, /frontend: job .* queued\/pending/u);
  });
});

test('rejects an old successful status when the latest matching status is pending', async () => {
  const input = fixture();
  input.statuses.push({ ...structuredClone(input.statuses[0]), id: 302, state: 'pending' });
  await rejectsWith(input, /cla: latest status is pending/u);
});

test('binds evidence to the requested PR head and workflow identity', async () => {
  const wrongHead = fixture();
  wrongHead.pr.head.sha = 'other-head';
  await rejectsWith(wrongHead, /PR head other-head does not match head-sha/u);

  const wrongWorkflow = fixture();
  wrongWorkflow.workflowRuns['nocobase/nocobase#101'].workflow_id = 1;
  await rejectsWith(wrongWorkflow, /frontend: no PR-head CheckRun matched/u);
});
