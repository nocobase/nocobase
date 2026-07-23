#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const SUCCESS = 'success';

export class VerificationError extends Error {
  constructor(errors) {
    super(errors.join('\n'));
    this.name = 'VerificationError';
    this.errors = errors;
  }
}

function value(object, camel, snake = camel) {
  return object?.[camel] ?? object?.[snake];
}

function appMatches(actual, expected) {
  return ['id', 'slug', 'name'].every((key) => expected[key] === undefined || actual?.[key] === expected[key])
    && (expected.owner === undefined || actual?.owner?.login === expected.owner || actual?.owner === expected.owner);
}

function checkRunHead(checkRun) {
  return value(checkRun, 'headSha', 'head_sha') ?? value(checkRun.check_suite, 'headSha', 'head_sha');
}

function parseActionsUrl(url) {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/actions\/runs\/(\d+)(?:\/job\/\d+)?(?:[/?#].*)?$/u.exec(
    url || '',
  );
  return match ? { repository: `${match[1]}/${match[2]}`, runId: Number(match[3]) } : null;
}

function workflowMatches(run, expected, repository) {
  const actualRepository = value(run.repository, 'fullName', 'full_name');
  return actualRepository === repository
    && (expected.id === undefined || Number(value(run, 'workflowId', 'workflow_id')) === expected.id)
    && (expected.name === undefined || run.name === expected.name)
    && (expected.path === undefined || run.path === expected.path)
    && (expected.event === undefined || run.event === expected.event);
}

function orderByAttemptAndId(left, right) {
  return Number(value(left.run, 'runAttempt', 'run_attempt') || 0) - Number(value(right.run, 'runAttempt', 'run_attempt') || 0)
    || Number(left.run.id || 0) - Number(right.run.id || 0)
    || Number(left.checkRun?.id || 0) - Number(right.checkRun?.id || 0);
}

function successful(item) {
  return String(item?.status || '').toLowerCase() === 'completed'
    && String(item?.conclusion || '').toLowerCase() === SUCCESS;
}

function verifyJobs(check, jobs, errors) {
  const claimed = new Set();
  for (const requirement of check.jobs || []) {
    const matcher = requirement.name
      ? (job) => job.name === requirement.name
      : (job) => new RegExp(requirement.pattern, 'u').test(job.name);
    const matches = jobs.filter(matcher);
    const expectedCount = requirement.count ?? 1;
    if (matches.length !== expectedCount) {
      errors.push(`${check.id}: expected ${expectedCount} job(s) for ${requirement.name || requirement.pattern}, found ${matches.length}`);
      continue;
    }
    for (const job of matches) {
      if (claimed.has(job.id)) {
        errors.push(`${check.id}: job ${job.name} matched more than one manifest entry`);
      }
      claimed.add(job.id);
      if (!successful(job)) {
        errors.push(`${check.id}: job ${job.name} is ${job.status}/${job.conclusion || 'pending'}`);
      }
    }
  }
}

async function verifyActionsCheck(check, snapshot, source, expectedHead, errors, report) {
  const candidates = [];
  const seenRuns = new Set();
  for (const checkRun of snapshot.checkRuns) {
    if (!appMatches(checkRun.app, check.app) || checkRunHead(checkRun) !== expectedHead) continue;
    const parsed = parseActionsUrl(value(checkRun, 'detailsUrl', 'details_url'));
    if (!parsed || parsed.repository !== check.sourceRepository || seenRuns.has(parsed.runId)) continue;
    seenRuns.add(parsed.runId);
    const run = await source.getRun(parsed.repository, parsed.runId);
    if (workflowMatches(run, check.workflow, check.sourceRepository)) candidates.push({ checkRun, run });
  }
  if (!candidates.length) {
    errors.push(`${check.id}: no PR-head CheckRun matched app, repository, and workflow identity`);
    return;
  }
  const selected = candidates.sort(orderByAttemptAndId).at(-1);
  if (value(selected.run, 'headSha', 'head_sha') !== expectedHead) {
    errors.push(`${check.id}: workflow run head SHA does not match ${expectedHead}`);
  }
  if (!successful(selected.run)) {
    errors.push(`${check.id}: latest workflow run is ${selected.run.status}/${selected.run.conclusion || 'pending'}`);
  }
  const jobs = await source.getJobs(check.sourceRepository, selected.run.id);
  verifyJobs(check, jobs, errors);
  report.checks.push({ id: check.id, runId: selected.run.id, runAttempt: value(selected.run, 'runAttempt', 'run_attempt'), jobs });
}

async function verifyExternalCheck(check, snapshot, source, expectedHead, errors, report) {
  const candidates = [];
  for (const checkRun of snapshot.checkRuns) {
    if (checkRun.name !== check.name || !appMatches(checkRun.app, check.app) || checkRunHead(checkRun) !== expectedHead) continue;
    const parsed = parseActionsUrl(value(checkRun, 'detailsUrl', 'details_url'));
    if (!parsed || parsed.repository !== check.sourceRepository) continue;
    const run = await source.getRun(parsed.repository, parsed.runId);
    if (workflowMatches(run, check.workflow, check.sourceRepository)) candidates.push({ checkRun, run });
  }
  if (!candidates.length) {
    errors.push(`${check.id}: no PR-head aggregate CheckRun matched name, app, repository, and workflow identity`);
    return;
  }
  const selected = candidates.sort(orderByAttemptAndId).at(-1);
  if (!successful(selected.checkRun)) {
    errors.push(`${check.id}: latest aggregate CheckRun is ${selected.checkRun.status}/${selected.checkRun.conclusion || 'pending'}`);
  }
  if (!successful(selected.run)) {
    errors.push(`${check.id}: latest external workflow run is ${selected.run.status}/${selected.run.conclusion || 'pending'}`);
  }
  const jobs = await source.getJobs(check.sourceRepository, selected.run.id);
  verifyJobs(check, jobs, errors);
  report.checks.push({
    id: check.id,
    checkRunId: selected.checkRun.id,
    runId: selected.run.id,
    runAttempt: value(selected.run, 'runAttempt', 'run_attempt'),
    jobs,
  });
}

function verifyStatusContext(check, snapshot, expectedHead, errors, report) {
  const candidates = snapshot.statuses
    .filter((status) => status.context === check.context && status.creator?.login === check.creator)
    .filter((status) => !check.targetUrlPattern || new RegExp(check.targetUrlPattern, 'u').test(value(status, 'targetUrl', 'target_url') || ''))
    .sort((left, right) => Number(left.id || 0) - Number(right.id || 0));
  const selected = candidates.at(-1);
  if (!selected) {
    errors.push(`${check.id}: no PR-head StatusContext matched context and creator`);
    return;
  }
  const statusSha = selected.sha || snapshot.statusSha;
  if (statusSha !== expectedHead) errors.push(`${check.id}: status SHA does not match ${expectedHead}`);
  if (String(selected.state || '').toLowerCase() !== SUCCESS) {
    errors.push(`${check.id}: latest status is ${selected.state || 'pending'}`);
  }
  report.checks.push({ id: check.id, statusId: selected.id, state: selected.state });
}

export async function verifySnapshot(manifest, snapshot, source, options = {}) {
  const errors = [];
  const expectedHead = options.head;
  const prHead = value(snapshot.pr, 'headRefOid', 'head_sha') ?? snapshot.pr?.head?.sha;
  const prBase = value(snapshot.pr, 'baseRefOid', 'base_sha') ?? snapshot.pr?.base?.sha;
  if (prHead !== expectedHead) errors.push(`PR head ${prHead || 'missing'} does not match ${expectedHead}`);
  if (options.baseHead && prBase !== options.baseHead) errors.push(`PR base ${prBase || 'missing'} does not match ${options.baseHead}`);
  if (options.requireMergeable) {
    const mergeable = snapshot.pr.mergeable;
    const state = value(snapshot.pr, 'mergeStateStatus', 'mergeable_state');
    if (mergeable !== true || !['CLEAN', 'HAS_HOOKS', 'UNSTABLE', 'clean', 'has_hooks', 'unstable'].includes(state)) {
      errors.push(`PR is not mergeable (${String(mergeable)}/${state || 'unknown'})`);
    }
  }

  const report = { repository: manifest.repository, head: expectedHead, baseHead: options.baseHead, checks: [] };
  for (const check of manifest.checks) {
    if (check.type === 'native-actions') {
      await verifyActionsCheck(check, snapshot, source, expectedHead, errors, report);
    } else if (check.type === 'external-check-run') {
      await verifyExternalCheck(check, snapshot, source, expectedHead, errors, report);
    } else if (check.type === 'status-context') {
      verifyStatusContext(check, snapshot, expectedHead, errors, report);
    } else {
      errors.push(`${check.id}: unknown check type ${check.type}`);
    }
  }
  if (errors.length) throw new VerificationError(errors);
  return report;
}

export function createFixtureSource(fixture) {
  return {
    getRun(repository, runId) {
      const run = fixture.workflowRuns?.[`${repository}#${runId}`];
      if (!run) throw new Error(`Fixture is missing workflow run ${repository}#${runId}`);
      return run;
    },
    getJobs(repository, runId) {
      const jobs = fixture.workflowJobs?.[`${repository}#${runId}`];
      if (!jobs) throw new Error(`Fixture is missing workflow jobs ${repository}#${runId}`);
      return jobs;
    },
  };
}

export async function verifyFixture(manifest, fixture, options) {
  return verifySnapshot(manifest, fixture, createFixtureSource(fixture), options);
}

class GitHubClient {
  constructor(token) {
    this.token = token;
  }

  async get(path) {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) throw new Error(`GitHub API ${path} returned ${response.status}: ${await response.text()}`);
    return response.json();
  }

  async pages(path, select) {
    const output = [];
    for (let page = 1; ; page += 1) {
      const separator = path.includes('?') ? '&' : '?';
      const response = await this.get(`${path}${separator}per_page=100&page=${page}`);
      const items = select(response);
      output.push(...items);
      if (items.length < 100) return output;
    }
  }
}

function githubToken() {
  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) return process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    const status = spawnSync('gh', ['auth', 'status', '--show-token'], {
      encoding: 'utf8',
    });
    const token = /Token:\s*(\S+)/u.exec(`${status.stdout || ''}\n${status.stderr || ''}`)?.[1];
    if (!token) throw new Error('Set GH_TOKEN or authenticate gh before verifying PR checks');
    return token;
  }
}

async function liveSnapshot(client, repository, prNumber) {
  const pr = await client.get(`/repos/${repository}/pulls/${prNumber}`);
  const head = pr.head.sha;
  const [checkRuns, statuses] = await Promise.all([
    client.pages(`/repos/${repository}/commits/${head}/check-runs`, (response) => response.check_runs),
    client.pages(`/repos/${repository}/commits/${head}/statuses`, (response) => response),
  ]);
  const cache = { workflowRuns: {}, workflowJobs: {} };
  return {
    snapshot: { pr, checkRuns, statuses, statusSha: head },
    cache,
    source: {
      async getRun(sourceRepository, runId) {
        const key = `${sourceRepository}#${runId}`;
        return (cache.workflowRuns[key] ??= await client.get(`/repos/${sourceRepository}/actions/runs/${runId}`));
      },
      async getJobs(sourceRepository, runId) {
        const key = `${sourceRepository}#${runId}`;
        return (cache.workflowJobs[key] ??= await client.pages(
          `/repos/${sourceRepository}/actions/runs/${runId}/jobs`,
          (response) => response.jobs,
        ));
      },
    },
  };
}

function parseArgs(argv) {
  const options = { wait: false, timeoutMinutes: 0, pollSeconds: 20, requireMergeable: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--wait') options.wait = true;
    else if (argument === '--require-mergeable') options.requireMergeable = true;
    else if (argument.startsWith('--')) {
      const key = argument.slice(2).replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
      options[key] = argv[++index];
    }
  }
  options.pr = Number(options.pr);
  options.timeoutMinutes = Number(options.timeoutMinutes);
  options.pollSeconds = Number(options.pollSeconds);
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.manifest || !options.head || (!options.fixture && !Number.isInteger(options.pr))) {
    throw new Error('Usage: verify-pr-checks.mjs --manifest <file> --head <sha> (--pr <number> | --fixture <file>) [--base-head <sha>] [--require-mergeable] [--wait]');
  }
  const manifest = JSON.parse(await readFile(options.manifest, 'utf8'));
  if (options.fixture) {
    const fixture = JSON.parse(await readFile(options.fixture, 'utf8'));
    const report = await verifyFixture(manifest, fixture, options);
    if (options.evidenceOutput) await writeFile(options.evidenceOutput, `${JSON.stringify({ ...fixture, report }, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const client = new GitHubClient(githubToken());
  const deadline = Date.now() + options.timeoutMinutes * 60_000;
  let lastError;
  let polling = true;
  while (polling) {
    const live = await liveSnapshot(client, manifest.repository, options.pr);
    try {
      const report = await verifySnapshot(manifest, live.snapshot, live.source, options);
      if (options.evidenceOutput) {
        await writeFile(options.evidenceOutput, `${JSON.stringify({ ...live.snapshot, ...live.cache, report }, null, 2)}\n`);
      }
      console.log(JSON.stringify(report, null, 2));
      return;
    } catch (error) {
      lastError = error;
      polling = options.wait && Date.now() < deadline;
      if (polling) await new Promise((resolve) => setTimeout(resolve, options.pollSeconds * 1000));
    }
  }
  throw lastError;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(error instanceof VerificationError ? error.errors.join('\n') : error.stack || error.message);
    process.exitCode = 1;
  });
}
