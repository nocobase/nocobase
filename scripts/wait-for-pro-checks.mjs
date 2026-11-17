// Wait for the Pro check jobs of this workflow run and require that each of them passed on the tree this job built.
//
// Usage, from a job of v3-pro-release-beta.yml, with GH_TOKEN allowed to read actions and checks:
//   node wait-for-pro-checks.mjs --tree <tree> --job 'Check Pro (test)' --job 'Check Pro (smoke)'
//
// The standalone Pro beta builds Pro in the job that publishes it, because commercial source and its build never leave a job as an artifact or cache. That job starts with the check jobs instead of after them, so the build overlaps the tests and the smoke test; this script is how it waits for them before it writes anything. A job cannot read the outputs of a job it does not need, so every check job announces the versioned tree it checked as a notice annotation titled "Pro checked tree" once its check passed, and this script reads it back through the check runs API. A check counts only when its latest attempt succeeded and announced exactly this job's tree, so "Re-run failed jobs" may re-run any of the jobs: whichever attempt passed on the same tree is evidence for it. A re-run attempt lists the jobs it did not re-run as copies with new ids, the same start and completion times, and no annotations, so a copy's tree is read from the execution it copies.
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';

export const treeAnnotationTitle = 'Pro checked tree';

async function request(api, token, pathname) {
  const response = await fetch(new URL(pathname, `${api}/`), {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!response.ok) {
    throw new Error(
      `GET ${pathname} answered ${response.status}: ${await response.text()}`,
    );
  }
  return response.json();
}

// Every job of every attempt of the run.
async function listJobs({ api, token, repository, runId }) {
  const jobs = [];
  for (let page = 1; ; page += 1) {
    const { jobs: batch } = await request(
      api,
      token,
      `repos/${repository}/actions/runs/${runId}/jobs?filter=all&per_page=100&page=${page}`,
    );
    jobs.push(...batch);
    if (batch.length < 100) return jobs;
  }
}

// Every record of the job named `name`, latest attempt last; a run started through workflow_call prefixes the name with the caller's job.
function jobRecords(jobs, name) {
  return jobs
    .filter((job) => job.name === name || job.name.endsWith(` / ${name}`))
    .sort((a, b) => a.run_attempt - b.run_attempt || a.id - b.id);
}

// The trees announced by the execution `job` records: by `job` itself, or by the earlier record a re-run attempt copied it from.
async function checkedTrees({ api, token, repository }, records, job) {
  const trees = [];
  for (const record of records.filter(
    ({ started_at, completed_at }) =>
      started_at === job.started_at && completed_at === job.completed_at,
  )) {
    const annotations = await request(
      api,
      token,
      `repos/${repository}/check-runs/${record.id}/annotations?per_page=100`,
    );
    trees.push(
      ...annotations
        .filter(({ title }) => title === treeAnnotationTitle)
        .map(({ message }) => message.trim()),
    );
  }
  return [...new Set(trees)];
}

export async function waitForProChecks({
  tree,
  names,
  api = process.env.GITHUB_API_URL ?? 'https://api.github.com',
  token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN,
  repository = process.env.GITHUB_REPOSITORY,
  runId = process.env.GITHUB_RUN_ID,
  intervalSeconds = 20,
  timeoutSeconds = 3600,
}) {
  if (!/^[0-9a-f]{40}$/u.test(tree ?? '')) {
    throw new Error(`--tree must be a tree SHA, not '${tree ?? ''}'`);
  }
  if (names.length === 0) throw new Error('Name at least one --job');
  for (const [name, value] of Object.entries({ token, repository, runId })) {
    if (!value) throw new Error(`Missing ${name}`);
  }
  const context = { api, token, repository, runId };
  const deadline = Date.now() + timeoutSeconds * 1000;
  const passed = new Set();
  let reported = '';
  for (;;) {
    const jobs = await listJobs(context);
    const waiting = [];
    for (const name of names.filter((name) => !passed.has(name))) {
      const records = jobRecords(jobs, name);
      const job = records.at(-1);
      if (!job || job.status !== 'completed') {
        waiting.push(`${name} (${job?.status ?? 'not started'})`);
        continue;
      }
      if (job.conclusion !== 'success') {
        throw new Error(
          `${name} finished as ${job.conclusion} (${job.html_url}), so nothing was published. "Re-run failed jobs" checks the same Pro and open-source commits again, which is enough for a flaky failure; a fix merged into Pro develop needs a new run of the workflow.`,
        );
      }
      const trees = await checkedTrees(context, records, job);
      if (trees.length === 0) {
        throw new Error(
          `${name} (${job.html_url}) passed without announcing a "${treeAnnotationTitle}", so it is no evidence for tree ${tree} and nothing was published.`,
        );
      }
      if (!trees.includes(tree)) {
        throw new Error(
          `${name} (${job.html_url}) passed on tree ${trees.join(', ')}, but this job built tree ${tree}, so nothing was published. Versioning the same Pro and open-source commits gave different trees, typically because the lockfile resolved differently; start the workflow again.`,
        );
      }
      console.log(`${name} passed on tree ${tree} (${job.html_url}).`);
      passed.add(name);
    }
    if (waiting.length === 0) return;
    if (Date.now() > deadline) {
      throw new Error(
        `Gave up after ${timeoutSeconds} seconds waiting for ${waiting.join(', ')}`,
      );
    }
    const status = `Waiting for ${waiting.join(', ')}`;
    if (status !== reported) console.log(status);
    reported = status;
    await sleep(intervalSeconds * 1000);
  }
}

if (import.meta.main) {
  try {
    const { values } = parseArgs({
      options: {
        tree: { type: 'string' },
        job: { type: 'string', multiple: true, default: [] },
        interval: { type: 'string' },
      },
    });
    await waitForProChecks({
      tree: values.tree,
      names: values.job,
      ...(values.interval ? { intervalSeconds: Number(values.interval) } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const line of message.split('\n')) console.log(`::error::${line}`);
    process.exitCode = 1;
  }
}
