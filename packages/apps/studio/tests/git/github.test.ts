// @vitest-environment node
/**
 * The GitHub platform (`server/git/github.ts`) against the stand-in through a mocked `fetch`: pull requests opened,
 * edited and merged at a pinned head, every check of a commit one by one with conditional reads, permissions, paged
 * repositories, a new repository with its default branch protected, an app's JWT and installation tokens (limited to
 * repositories for a push credential), a person's OAuth exchange, and webhooks normalized into events. Nothing reaches
 * the network.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CHECK_LOGS_MAX_BYTES,
  createGitHubPlatform,
  parseGitHubWebhook,
  tokenExpirationOf,
} from '../../server/git/github.js';
import { rateLimitOf } from '../../server/git/github-client.js';
import { GitApiError, type GitAuth } from '../../server/git/platform.js';
import { createFakeGitHub } from './fake-github.js';
import { signBody } from './helpers.js';

const REPO = 'acme/studio';
const auth = (token: string | null): GitAuth => ({
  apiBaseUrl: 'https://api.github.com',
  token,
});

afterEach(() => vi.useRealTimers());

describe('the GitHub platform', () => {
  it('refreshes a cached push token before handing a new run less than 30 minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const github = createFakeGitHub();
    github.app.installations.set('acme', '99');
    const app = {
      apiBaseUrl: 'https://api.github.com',
      appId: github.app.appId,
      privateKey: github.app.privateKey,
    };
    const options = { repositories: [REPO] };
    const first = await github.platform.installationToken(app, '99', options);
    vi.setSystemTime(Date.now() + 45 * 60 * 1000);
    const next = await github.platform.installationToken(app, '99', options);
    expect(next.token).not.toBe(first.token);
    expect(new Date(next.expiresAt!).getTime() - Date.now()).toBe(3600 * 1000);
    expect(github.app.minted).toHaveLength(2);
    vi.setSystemTime(Date.now() + 21 * 60 * 1000);
    expect(new Date(next.expiresAt!).getTime()).toBeGreaterThan(Date.now());
    expect(await github.platform.installationToken(app, '99', options)).toEqual(
      next,
    );
    const other = await github.platform.installationToken(app, '99', {
      repositories: ['acme/other'],
    });
    expect(other.token).not.toBe(next.token);
    expect(github.app.minted.at(-1)?.repositories).toEqual(['other']);
  });

  it.each([
    undefined,
    'invalid-date',
    new Date(0).toISOString(),
    new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  ])(
    'refuses a freshly signed token with unusable expiry %s',
    async (expiry) => {
      const github = createFakeGitHub();
      github.app.installations.set('acme', '99');
      const platform = createGitHubPlatform({
        fetch: async (url, init) => {
          const answer = await github.fetch(url, init);
          if (!url.endsWith('/access_tokens')) return answer;
          return Response.json(
            { ...(await answer.json()), expires_at: expiry },
            { status: 201 },
          );
        },
      });
      await expect(
        platform.installationToken(
          {
            apiBaseUrl: 'https://api.github.com',
            appId: github.app.appId,
            privateKey: github.app.privateKey,
          },
          '99',
          { repositories: [REPO] },
        ),
      ).rejects.toMatchObject({
        status: 500,
        message:
          'GitHub answered with an invalid or insufficient token expiry.',
      });
    },
  );

  it('edits, comments on, closes and reopens a pull request, and turns it into a draft and back through GraphQL', async () => {
    const github = createFakeGitHub();
    github.tokens.add('t');
    const { platform } = github;
    github.addPull(REPO, { number: 3, head: { ref: 'x', sha: 'a3' } });
    expect(
      await platform.updatePullRequest(auth('t'), REPO, 3, {
        title: 'fix(x): y',
        base: 'develop',
      }),
    ).toMatchObject({ title: 'fix(x): y', baseRef: 'develop' });
    expect(
      (await platform.setPullRequestDraft(auth('t'), REPO, 3, true)).draft,
    ).toBe(true);
    expect(
      (await platform.setPullRequestDraft(auth('t'), REPO, 3, false)).draft,
    ).toBe(false);
    await platform.commentOnPullRequest(auth('t'), REPO, 3, 'Superseded.');
    expect(github.comments(REPO, 3)).toEqual(['Superseded.']);
    expect(
      (
        await platform.updatePullRequest(auth('t'), REPO, 3, {
          state: 'closed',
        })
      ).state,
    ).toBe('closed');
    // GitHub refuses a closed pull request's draft change in the answer's `errors`.
    await expect(
      platform.setPullRequestDraft(auth('t'), REPO, 3, true),
    ).rejects.toMatchObject({ status: 422 });
    expect(
      (await platform.updatePullRequest(auth('t'), REPO, 3, { state: 'open' }))
        .state,
    ).toBe('open');
  });

  it('sends GraphQL beside GitHub Enterprise Server’s REST API', async () => {
    const urls: string[] = [];
    const platform = createGitHubPlatform({
      fetch: async (url) => {
        urls.push(url);
        return Response.json(
          url.endsWith('/graphql')
            ? { data: {} }
            : { number: 3, draft: true, node_id: 'PR_3', state: 'open' },
        );
      },
    });
    await platform.setPullRequestDraft(
      { apiBaseUrl: 'https://git.example.com/api/v3/', token: 't' },
      REPO,
      3,
      false,
    );
    expect(urls).toEqual([
      `https://git.example.com/api/v3/repos/${REPO}/pulls/3`,
      'https://git.example.com/api/graphql',
      `https://git.example.com/api/v3/repos/${REPO}/pulls/3`,
    ]);
  });

  it('opens a pull request, edits its body, and merges only the head it was given', async () => {
    const github = createFakeGitHub();
    github.tokens.add('t');
    const { platform } = github;
    const opened = await platform.openPullRequest(auth('t'), REPO, {
      title: 'PM-1: Fix login',
      body: 'Closes the bug.',
      head: 'agent/PM-1',
      base: 'main',
      draft: false,
    });
    expect(opened.snapshot).toMatchObject({
      repo: REPO,
      number: 1,
      title: 'PM-1: Fix login',
      state: 'open',
      headRef: 'agent/PM-1',
      baseRef: 'main',
      url: `https://github.com/${REPO}/pull/1`,
    });
    expect(
      (await platform.updatePullRequestBody(auth('t'), REPO, 1, 'Now longer.'))
        .body,
    ).toBe('Now longer.');
    await expect(
      platform.mergePullRequest(auth('t'), REPO, 1, {
        sha: 'not-the-head',
        commitTitle: 'x',
      }),
    ).rejects.toMatchObject({ status: 409 });
    const merged = await platform.mergePullRequest(auth('t'), REPO, 1, {
      sha: opened.snapshot.headSha,
      commitTitle: 'PM-1: Fix login (#1)',
    });
    expect(merged.sha).toMatch(/^[0-9a-f]{40}$/u);
    const mergeRequest = github.requests.findLast((request) =>
      request.path.endsWith('/merge'),
    );
    expect(mergeRequest?.body).toMatchObject({
      merge_method: 'squash',
      commit_title: 'PM-1: Fix login (#1)',
    });
    // A refusal never carries the token.
    const refused = await platform
      .getPullRequest(auth('wrong'), REPO, 1, null)
      .catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(GitApiError);
    expect(String((refused as Error).message)).not.toContain('wrong');
  });

  it('explains a commit’s failed checks: annotations, the failing part of a job’s log, a report', async () => {
    const github = createFakeGitHub();
    const { platform } = github;
    const actions = { slug: 'github-actions' };
    const log = (error: string) =>
      [
        '2026-10-09T01:00:00.0000000Z ##[group]Run pnpm test',
        ...Array.from({ length: 300 }, (_, index) => `ok ${index}`),
        `2026-10-09T01:00:01.0000000Z ##[error]${error}`,
        'Error: Process completed with exit code 1.',
      ].join('\n');
    github.setCheck(REPO, 'c1', {
      name: 'test',
      status: 'completed',
      conclusion: 'failure',
      app: actions,
      annotations: [
        {
          path: 'tests/a.test.ts',
          start_line: 3,
          end_line: 3,
          annotation_level: 'failure',
          message: 'expected 1 to be 2',
        },
      ],
      log: log('expected 1 to be 2'),
    });
    github.setCheck(REPO, 'c1', {
      name: 'lint',
      status: 'completed',
      conclusion: 'success',
      app: actions,
      log: 'fine',
    });
    github.setCheck(REPO, 'c1', {
      name: 'coverage',
      status: 'completed',
      conclusion: 'failure',
      app: { slug: 'codecov' },
      output: { title: 'Coverage fell', summary: '72% (-3%)' },
    });
    // Logs GitHub no longer keeps.
    github.setCheck(REPO, 'c1', {
      name: 'old',
      status: 'completed',
      conclusion: 'timed_out',
      app: actions,
    });

    const failed = await platform.failedChecks(auth(null), REPO, 'c1');
    expect(failed.map((check) => check.name)).toEqual([
      'test',
      'coverage',
      'old',
    ]);
    const [test, coverage, old] = failed;
    expect(test).toMatchObject({
      conclusion: 'failure',
      annotations: [
        {
          path: 'tests/a.test.ts',
          startLine: 3,
          level: 'failure',
          message: 'expected 1 to be 2',
        },
      ],
      logUnavailable: null,
    });
    expect(test!.log).toContain('── Run pnpm test ──');
    expect(test!.log).toContain('##[error]expected 1 to be 2');
    expect(test!.log).not.toContain('ok 100');
    expect(test!.log).not.toContain('2026-10-09T');
    expect(coverage).toMatchObject({
      summary: 'Coverage fell\n\n72% (-3%)',
      log: null,
      logUnavailable: 'notActions',
    });
    expect(old).toMatchObject({ log: null, logUnavailable: 'unavailable' });
    // The log is read from where GitHub redirects, without the credential (the storage refuses one).
    expect(
      github.requests.filter((request) => request.path.startsWith('/logs/')),
    ).toEqual([expect.objectContaining({ status: 200, token: null })]);

    // A finished check's explanation is kept: read again, only the list is.
    const before = github.requests.length;
    expect(await platform.failedChecks(auth(null), REPO, 'c1')).toEqual(failed);
    expect(
      github.requests.slice(before).map((request) => request.path),
    ).toEqual([
      `/repos/${REPO}/commits/c1/check-runs?filter=latest&per_page=100`,
    ]);
  });

  it('leaves logs out under the rate limit or past the commit’s size, keeping what was read', async () => {
    const github = createFakeGitHub();
    const { platform } = github;
    const big = Array.from(
      { length: 400 },
      (_, index) => `##[error]failure ${index} ${'x'.repeat(60)}`,
    ).join('\n');
    for (const name of ['a', 'b', 'c', 'd', 'e', 'f', 'g'])
      github.setCheck(REPO, 'c2', {
        name,
        status: 'completed',
        conclusion: 'failure',
        app: { slug: 'github-actions' },
        annotations: [
          {
            path: `${name}.ts`,
            start_line: 1,
            end_line: 1,
            annotation_level: 'failure',
            message: 'broken',
          },
        ],
        log: big,
      });
    github.rateLimit = {
      status: 403,
      headers: { 'retry-after': '600' },
      path: /\/actions\/jobs\/\d+\/logs$/u,
    };
    const limited = await platform.failedChecks(auth(null), REPO, 'c2');
    expect(
      limited.map((check) => [check.annotations.length, check.logUnavailable]),
    ).toEqual([
      [1, 'rateLimited'],
      [0, 'rateLimited'],
      [0, 'rateLimited'],
      [0, 'rateLimited'],
      [0, 'rateLimited'],
      [0, 'rateLimited'],
      [0, 'rateLimited'],
    ]);
    // Once the limit is reached, nothing more is asked.
    expect(
      github.requests.filter((request) => request.path.includes('/logs')),
    ).toHaveLength(1);

    github.rateLimit = null;
    const read = await platform.failedChecks(auth(null), REPO, 'c2');
    const logs = read.filter((check) => check.log !== null);
    // Each excerpt is at most 8 KB: four fit, not all seven.
    expect(logs.length).toBeGreaterThanOrEqual(4);
    expect(read.at(-1)).toMatchObject({ log: null, logUnavailable: 'budget' });
    expect(
      logs.reduce((sum, check) => sum + Buffer.byteLength(check.log!), 0),
    ).toBeLessThanOrEqual(CHECK_LOGS_MAX_BYTES);
    // The check-runs list itself under the rate limit is the caller's.
    github.rateLimit = { status: 429, headers: { 'retry-after': '600' } };
    await expect(
      platform.failedChecks(auth(null), REPO, 'c2'),
    ).rejects.toMatchObject({ rateLimited: true });
  });

  it('tells what a pinned commit is: an open pull request head, on a branch, a tag target', async () => {
    const github = createFakeGitHub();
    const { platform } = github;
    github.addPull(REPO, {
      number: 7,
      head: { ref: 'agent/PM-7', sha: 'a7' },
      base: { ref: 'main' },
    });
    github.addPull(REPO, {
      number: 8,
      state: 'closed',
      head: { ref: 'agent/PM-8', sha: 'a8' },
      base: { ref: 'main' },
    });
    expect(
      (await platform.openPullRequestsAt(auth(null), REPO, 'a7')).map(
        (pull) => pull.number,
      ),
    ).toEqual([7]);
    // A closed pull request's head is no open head; an unknown commit heads nothing.
    expect(await platform.openPullRequestsAt(auth(null), REPO, 'a8')).toEqual(
      [],
    );
    expect(await platform.openPullRequestsAt(auth(null), REPO, 'zz')).toEqual(
      [],
    );

    github.pushCommits(REPO, 'main', 'm1', 'm2');
    github.pushCommits(REPO, 'feature', 'f1');
    expect(await platform.branchContains(auth(null), REPO, 'main', 'm2')).toBe(
      true,
    );
    expect(await platform.branchContains(auth(null), REPO, 'main', 'm1')).toBe(
      true,
    );
    expect(await platform.branchContains(auth(null), REPO, 'main', 'f1')).toBe(
      false,
    );
    expect(
      await platform.branchContains(auth(null), REPO, 'main', 'nowhere'),
    ).toBe(false);
    // A commit contains itself and its ancestors, not a later commit or another branch's.
    expect(await platform.commitContains(auth(null), REPO, 'm2', 'm1')).toBe(
      true,
    );
    expect(await platform.commitContains(auth(null), REPO, 'm2', 'm2')).toBe(
      true,
    );
    expect(await platform.commitContains(auth(null), REPO, 'm1', 'm2')).toBe(
      false,
    );
    expect(await platform.commitContains(auth(null), REPO, 'm2', 'f1')).toBe(
      false,
    );
    expect(
      await platform.commitContains(auth(null), REPO, 'm2', 'nowhere'),
    ).toBe(false);

    // The branches a commit heads.
    expect(await platform.branchesAt(auth(null), REPO, 'f1')).toEqual([
      'feature',
    ]);
    expect(await platform.branchesAt(auth(null), REPO, 'm1')).toEqual([]);

    github.tag(REPO, 'v1.0.0', 'm1');
    github.tag(REPO, 'v1.0.1', 'm2');
    expect(await platform.tagsAt(auth(null), REPO, 'm1')).toEqual(['v1.0.0']);
    expect(await platform.tagsAt(auth(null), REPO, 'f1')).toEqual([]);
  });

  it('reads every check of a commit one by one, and answers notModified while both reads match', async () => {
    const github = createFakeGitHub();
    const { platform } = github;
    github.setStatus(REPO, 'abc', 'success', 'lint');
    github.setCheck(REPO, 'abc', {
      name: 'test',
      status: 'in_progress',
      conclusion: null,
    });
    const first = await platform.getChecks(auth(null), REPO, 'abc', {
      status: null,
      runs: null,
    });
    if (first.notModified) throw new Error('Expected a body.');
    expect(first.ciState).toBe('pending');
    expect(first.checks).toEqual([
      {
        kind: 'status',
        name: 'lint',
        status: 'completed',
        conclusion: 'success',
        url: `https://github.com/${REPO}/actions/lint`,
      },
      {
        kind: 'check',
        name: 'test',
        status: 'in_progress',
        conclusion: null,
        url: `https://github.com/${REPO}/runs/test`,
      },
    ]);
    expect(
      await platform.getChecks(auth(null), REPO, 'abc', first.etags),
    ).toEqual({ notModified: true });
    github.setCheck(REPO, 'abc', {
      name: 'test',
      status: 'completed',
      conclusion: 'timed_out',
    });
    const after = await platform.getChecks(
      auth(null),
      REPO,
      'abc',
      first.etags,
    );
    expect(after).toMatchObject({ notModified: false, ciState: 'failure' });
  });

  it('answers an account’s permission, pages repositories, and creates or generates one with its default branch protected', async () => {
    const github = createFakeGitHub();
    github.tokens.add('t');
    github.users.set('t', { id: 7, login: 'octo', name: null, email: null });
    github.permissions.set(`${REPO}:octo`, 'write');
    const { platform } = github;
    expect(await platform.repoPermission(auth('t'), REPO, 'octo')).toBe(
      'write',
    );
    expect(await platform.repoPermission(auth('t'), REPO, 'nobody')).toBe(
      'none',
    );
    for (let index = 0; index < 3; index += 1) github.addRepo(`acme/r${index}`);
    const page = await platform.listRepos(auth('t'), 'user', {
      page: 1,
      perPage: 2,
    });
    expect(page.items.map((repo) => repo.fullName)).toEqual([
      'acme/r0',
      'acme/r1',
    ]);
    expect(page.hasMore).toBe(true);
    const last = await platform.listRepos(auth('t'), 'installation', {
      page: 2,
      perPage: 2,
    });
    expect(last).toMatchObject({
      items: [{ fullName: 'acme/r2', defaultBranch: 'main' }],
      hasMore: false,
    });
    const created = await platform.createRepo(auth('t'), {
      owner: 'acme',
      organization: true,
      name: 'fresh',
      private: true,
      description: 'New.',
    });
    expect(created).toMatchObject({
      protected: true,
      repo: {
        fullName: 'acme/fresh',
        private: true,
        cloneUrl: 'https://github.com/acme/fresh.git',
      },
    });
    expect(github.repos.get('acme/fresh')?.protected).toBe(true);
    expect(
      github.requests.find((request) => request.path === '/orgs/acme/repos')
        ?.body,
    ).toMatchObject({ auto_init: true });
    // A repository generated from a template repository, also protected; a plain repository is no template.
    github.addRepo('acme/starter', { is_template: true });
    expect(await platform.getRepo(auth('t'), 'acme/starter')).toMatchObject({
      isTemplate: true,
    });
    expect(await platform.getRepo(auth('t'), 'acme/missing')).toBeNull();
    const generated = await platform.generateRepo(auth('t'), 'acme/starter', {
      owner: 'acme',
      name: 'shop',
      private: true,
      description: null,
    });
    // Left unprotected: its initialization workflow may still commit to the default branch.
    expect(generated).toMatchObject({ fullName: 'acme/shop', private: true });
    expect(github.repos.get('acme/shop')).toMatchObject({
      generatedFrom: 'acme/starter',
      protected: false,
    });
    expect(await platform.protectBranch(auth('t'), 'acme/shop', 'main')).toBe(
      true,
    );
    expect(github.repos.get('acme/shop')?.protected).toBe(true);
    // An empty repository: no initial commit, so no branch to protect.
    const empty = await platform.createRepo(auth('t'), {
      owner: 'acme',
      organization: true,
      name: 'blank',
      private: true,
      description: null,
      empty: true,
    });
    expect(empty).toMatchObject({ protected: false });
    expect(github.repos.get('acme/blank')).toMatchObject({
      empty: true,
      protected: false,
    });
    expect(await platform.protectBranch(auth('t'), 'acme/blank', 'main')).toBe(
      false,
    );
    await expect(
      platform.generateRepo(auth('t'), 'acme/fresh', {
        owner: 'acme',
        name: 'other',
        private: false,
        description: null,
      }),
    ).rejects.toMatchObject({ status: 404 });
    // The commit address falls back on the host's no-reply address.
    expect(await platform.currentUser(auth('t'))).toEqual({
      id: '7',
      login: 'octo',
      name: null,
      email: '7+octo@users.noreply.github.com',
      tokenExpiresAt: null,
    });
  });

  it('lists a repository’s workflows, reads a workflow’s newest run and runs it again', async () => {
    const github = createFakeGitHub();
    github.tokens.add('t');
    const { platform } = github;
    github.addRepo('acme/app');
    const init = github.addWorkflow('acme/app', {
      name: 'Initialize',
      path: '.github/workflows/nb-studio-init.yml',
    });
    github.addWorkflow('acme/app', { path: '.github/workflows/ci.yml' });
    expect(await platform.listWorkflows(auth('t'), 'acme/app')).toEqual([
      {
        id: String(init.id),
        name: 'Initialize',
        path: '.github/workflows/nb-studio-init.yml',
        state: 'active',
        htmlUrl:
          'https://github.com/acme/app/blob/main/.github/workflows/nb-studio-init.yml',
      },
      expect.objectContaining({ path: '.github/workflows/ci.yml' }),
    ]);
    expect(
      await platform.latestWorkflowRun(auth('t'), 'acme/app', String(init.id)),
    ).toBeNull();
    const run = github.addWorkflowRun('acme/app', {
      workflow_id: init.id,
      conclusion: 'failure',
    });
    expect(
      await platform.latestWorkflowRun(auth('t'), 'acme/app', String(init.id)),
    ).toMatchObject({
      id: String(run.id),
      workflowId: String(init.id),
      path: '.github/workflows/nb-studio-init.yml',
      conclusion: 'failure',
      runAttempt: 1,
    });
    await platform.rerunWorkflowRun(auth('t'), 'acme/app', String(run.id));
    expect(github.workflowRuns.get('acme/app')?.[0]).toMatchObject({
      run_attempt: 2,
      status: 'queued',
    });
  });

  it('signs a JWT for the app, finds its installation and mints tokens, limited for a push credential', async () => {
    const github = createFakeGitHub();
    github.app.installations.set('acme', '99');
    const app = {
      apiBaseUrl: 'https://api.github.com',
      appId: github.app.appId,
      privateKey: github.app.privateKey,
    };
    const { platform } = github;
    expect(await platform.findInstallation(app, 'acme')).toBe('99');
    // The JWT is the app's (the stand-in checked its signature), valid ten minutes at most.
    const [, claims] = (github.requests[0]?.token ?? '').split('.');
    const jwt = JSON.parse(Buffer.from(claims!, 'base64url').toString()) as {
      iat: number;
      exp: number;
      iss: unknown;
    };
    expect(String(jwt.iss)).toBe(github.app.appId);
    expect(jwt.exp - jwt.iat).toBeLessThanOrEqual(600);
    expect(await platform.findInstallation(app, 'elsewhere')).toBeNull();
    const token = await platform.installationToken(app, '99', {
      repositories: [REPO],
    });
    expect(github.app.minted.at(-1)).toMatchObject({
      installationId: '99',
      repositories: ['studio'],
    });
    expect(github.requests.at(-1)?.body).toMatchObject({
      permissions: { contents: 'write' },
    });
    expect(platform.pushCredential(token)).toMatchObject({
      username: 'x-access-token',
      password: token.token,
    });
    await expect(
      platform.installationToken({ ...app, appId: 'another-app' }, '99'),
    ).rejects.toMatchObject({ status: 401 });

    // A token is reused until shortly before it expires, from the app's own cache when it has one.
    const minted = github.app.minted.length;
    expect(
      (await platform.installationToken(app, '99', { repositories: [REPO] }))
        .token,
    ).toBe(token.token);
    expect(github.app.minted).toHaveLength(minted);
    const kept = new Map<string, { value: string; expiresAt: Date }>();
    const cached = {
      ...app,
      tokenCache: {
        get: async (key: string) => kept.get(key)?.value,
        set: async (key: string, value: string, expiresAt: Date) => {
          kept.set(key, { value, expiresAt });
        },
      },
    };
    const first = await platform.installationToken(cached, '99');
    expect(await platform.installationToken(cached, '99')).toEqual(first);
    expect(github.app.minted).toHaveLength(minted + 1);
    expect([...kept.values()]).toEqual([
      {
        value: expect.stringContaining(first.token),
        expiresAt: expect.any(Date),
      },
    ]);
    const [entry] = kept.values();
    expect(entry!.expiresAt.getTime()).toBeLessThan(
      new Date(first.expiresAt!).getTime(),
    );
  });

  it('exchanges a person’s OAuth code and reads who they are', async () => {
    const github = createFakeGitHub();
    github.app.codes.set('code-1', {
      id: 3,
      login: 'alice-gh',
      name: 'Alice',
      email: 'alice@example.com',
    });
    const client = {
      webUrl: 'https://github.com',
      clientId: github.app.clientId,
      clientSecret: github.app.clientSecret,
    };
    const { platform } = github;
    const url = new URL(
      platform.authorizeUrl(client, {
        redirectUri: 'https://studio.example.com/cb',
        state: 's',
      }),
    );
    expect(url.pathname).toBe('/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe(github.app.clientId);
    const tokens = await platform.exchangeCode(client, {
      code: 'code-1',
      redirectUri: 'https://studio.example.com/cb',
    });
    expect(tokens.accessToken).toMatch(/^ghu_/u);
    expect(tokens.refreshToken).toMatch(/^ghr_/u);
    expect(await platform.currentUser(auth(tokens.accessToken))).toMatchObject({
      login: 'alice-gh',
      email: 'alice@example.com',
    });
    await expect(
      platform.exchangeCode(client, { code: 'used', redirectUri: 'x' }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'GitHub refused the authorization (bad_verification_code).',
    });

    // Expiring tokens, dated from GitHub's answer; a refresh token is used once.
    expect(new Date(tokens.expiresAt!).getTime() - Date.now()).toBeGreaterThan(
      28_000_000,
    );
    expect(tokens.refreshExpiresAt).not.toBeNull();
    const refreshed = await platform.refreshToken(client, tokens.refreshToken!);
    expect(refreshed.accessToken).not.toBe(tokens.accessToken);
    expect(refreshed.refreshToken).not.toBe(tokens.refreshToken);
    await expect(
      platform.refreshToken(client, tokens.refreshToken!),
    ).rejects.toMatchObject({
      status: 400,
      message: 'GitHub refused the authorization (bad_refresh_token).',
    });
  });

  it('runs the device flow to every answer GitHub gives', async () => {
    const github = createFakeGitHub();
    const { platform } = github;
    const client = {
      webUrl: 'https://github.com',
      clientId: github.app.clientId,
    };
    const started = (await platform.startDeviceAuthorization(client))!;
    expect(started).toMatchObject({
      deviceCode: expect.stringMatching(/^dc_/u),
      verificationUri: 'https://github.com/login/device',
      interval: 5,
    });
    expect(
      await platform.pollDeviceAuthorization(client, started.deviceCode),
    ).toEqual({ status: 'pending', interval: 5 });
    github.enterDeviceCode(started.userCode, {
      id: 4,
      login: 'bob-gh',
      name: 'Bob',
      email: 'bob@example.com',
    });
    const granted = await platform.pollDeviceAuthorization(
      client,
      started.deviceCode,
    );
    expect(granted).toMatchObject({
      status: 'granted',
      tokens: { accessToken: expect.stringMatching(/^ghu_/u) },
    });
    // Used, the code is gone.
    expect(
      await platform.pollDeviceAuthorization(client, started.deviceCode),
    ).toEqual({ status: 'expired' });
    const another = (await platform.startDeviceAuthorization(client))!;
    github.enterDeviceCode(another.userCode, 'denied');
    expect(
      await platform.pollDeviceAuthorization(client, another.deviceCode),
    ).toEqual({ status: 'denied' });
    github.app.deviceFlow = false;
    expect(await platform.startDeviceAuthorization(client)).toBeNull();
    // A client GitHub does not know is refused, not taken for a pending code.
    await expect(
      platform.pollDeviceAuthorization(
        { ...client, clientId: 'unknown' },
        'dc_x',
      ),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('normalizes webhook deliveries into events', async () => {
    const body = (value: unknown) =>
      new TextEncoder().encode(JSON.stringify(value));
    const headers =
      (event: string) =>
      (name: string): string | null =>
        ({ 'x-github-event': event, 'x-github-delivery': 'd1' })[name] ?? null;
    const pull = {
      number: 4,
      state: 'closed',
      merged: true,
      merged_at: '2026-10-01T00:00:00Z',
      head: { ref: 'agent/PM-4', sha: 'h' },
      base: { ref: 'main' },
    };
    const merged = parseGitHubWebhook(
      body({
        action: 'closed',
        repository: { full_name: REPO },
        installation: { id: 5 },
        pull_request: pull,
      }),
      headers('pull_request'),
    );
    expect(merged).toMatchObject({
      deliveryId: 'd1',
      repo: REPO,
      installationId: '5',
      result: {
        event: {
          type: 'pullRequest',
          action: 'merged',
          snapshot: { number: 4, state: 'merged' },
          mergeableReported: false,
        },
      },
    });
    expect(
      parseGitHubWebhook(
        body({
          action: 'closed',
          repository: { full_name: REPO },
          pull_request: { ...pull, merged: false, merged_at: null },
        }),
        headers('pull_request'),
      ).result,
    ).toMatchObject({ event: { action: 'closed' } });
    expect(
      parseGitHubWebhook(
        body({ ref: 'refs/tags/v1.2.0', repository: { full_name: REPO } }),
        headers('push'),
      ).result,
    ).toEqual({ event: { type: 'tag', tag: 'v1.2.0' } });
    expect(
      parseGitHubWebhook(
        body({ ref: 'refs/heads/main', repository: { full_name: REPO } }),
        headers('push'),
      ).result,
    ).toEqual({
      event: {
        type: 'push',
        branch: 'main',
        created: false,
        before: null,
        after: null,
      },
    });
    // The first commit of a branch: it created the ref, from nothing.
    expect(
      parseGitHubWebhook(
        body({
          ref: 'refs/heads/main',
          created: true,
          before: '0000000000000000000000000000000000000000',
          after: 'abc',
          repository: { full_name: REPO },
        }),
        headers('push'),
      ).result,
    ).toMatchObject({
      event: {
        created: true,
        before: '0000000000000000000000000000000000000000',
        after: 'abc',
      },
    });
    expect(
      parseGitHubWebhook(
        body({
          action: 'completed',
          repository: { full_name: REPO },
          workflow_run: {
            id: 30,
            workflow_id: 7,
            name: 'Initialize',
            path: '.github/workflows/nb-studio-init.yml@refs/heads/main',
            head_branch: 'main',
            head_sha: 'h',
            status: 'completed',
            conclusion: 'failure',
            html_url: 'https://github.com/acme/app/actions/runs/30',
            run_attempt: 2,
          },
        }),
        headers('workflow_run'),
      ).result,
    ).toEqual({
      event: {
        type: 'workflowRun',
        action: 'completed',
        run: {
          id: '30',
          workflowId: '7',
          name: 'Initialize',
          path: '.github/workflows/nb-studio-init.yml',
          headBranch: 'main',
          headSha: 'h',
          status: 'completed',
          conclusion: 'failure',
          htmlUrl: 'https://github.com/acme/app/actions/runs/30',
          runAttempt: 2,
        },
      },
    });
    expect(
      parseGitHubWebhook(
        body({
          action: 'completed',
          check_run: {
            head_sha: 'h',
            status: 'completed',
            conclusion: 'success',
          },
        }),
        headers('check_run'),
      ).result,
    ).toEqual({ event: { type: 'checks', sha: 'h', reported: 'success' } });
    expect(
      parseGitHubWebhook(new TextEncoder().encode('payload=1'), headers('ping'))
        .result,
    ).toEqual({ ignored: 'notJson' });
    expect(parseGitHubWebhook(body({}), headers('issues')).result).toEqual({
      ignored: 'unsupportedEvent',
    });
    const signed = body({ zen: 'x' });
    const github = createFakeGitHub();
    expect(
      await github.platform.verifyWebhook('secret', signed, (name) =>
        name === 'x-hub-signature-256' ? signBody('secret', signed) : null,
      ),
    ).toBe(true);
  });
});

describe('a personal token’s expiry header', () => {
  it('reads GitHub’s format, with or without an offset', () => {
    expect(tokenExpirationOf('2026-11-04 12:00:00 UTC')).toBe(
      '2026-11-04T12:00:00.000Z',
    );
    expect(tokenExpirationOf('2026-11-04 20:00:00 +0800')).toBe(
      '2026-11-04T12:00:00.000Z',
    );
    expect(tokenExpirationOf(null)).toBeNull();
    expect(tokenExpirationOf('soon')).toBeNull();
  });
});

describe('GitHub’s rate limit', () => {
  const NOW = Date.parse('2026-10-09T00:00:00Z');
  const headers = (values: Record<string, string>) => (name: string) =>
    values[name] ?? null;

  it('tells a rate limit from a refusal, and when it lifts', () => {
    expect(rateLimitOf(403, headers({ 'retry-after': '30' }), '', NOW)).toBe(
      '2026-10-09T00:00:30.000Z',
    );
    expect(
      rateLimitOf(
        403,
        headers({
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': String(NOW / 1000 + 900),
        }),
        '',
        NOW,
      ),
    ).toBe('2026-10-09T00:15:00.000Z');
    expect(
      rateLimitOf(
        403,
        headers({}),
        'You have exceeded a secondary rate limit.',
        NOW,
      ),
    ).toBe('2026-10-09T00:01:00.000Z');
    expect(rateLimitOf(429, headers({}), '', NOW)).toBe(
      '2026-10-09T00:01:00.000Z',
    );
    // A refusal is not a rate limit, nor is any other status.
    expect(
      rateLimitOf(403, headers({ 'x-ratelimit-remaining': '12' }), '', NOW),
    ).toBeNull();
    expect(rateLimitOf(404, headers({ 'retry-after': '5' }), '', NOW)).toBe(
      null,
    );
  });

  it('reads once more after a short wait, and leaves longer waits and every write to the caller', async () => {
    const github = createFakeGitHub();
    const { platform } = github;
    github.addPull(REPO, { number: 1 });

    github.rateLimit = {
      status: 403,
      headers: { 'retry-after': '2' },
      times: 1,
    };
    expect(
      (await platform.getPullRequest(auth(null), REPO, 1, null)).notModified,
    ).toBe(false);
    const seconds = () => github.waits.map((ms) => Math.round(ms / 1000));
    expect(seconds()).toEqual([2]);

    github.rateLimit = {
      status: 403,
      headers: {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 600),
      },
    };
    const before = github.requests.length;
    const limited = await platform
      .getPullRequest(auth(null), REPO, 1, null)
      .catch((error: unknown) => error);
    expect(limited).toBeInstanceOf(GitApiError);
    expect(limited).toMatchObject({ status: 403, rateLimited: true });
    expect(
      new Date((limited as GitApiError).retryAt!).getTime(),
    ).toBeGreaterThan(Date.now() + 500_000);
    expect(github.requests.length - before).toBe(1);

    // A write is never repeated, however short the wait.
    github.rateLimit = { status: 429, headers: { 'retry-after': '1' } };
    await expect(
      platform.commentOnPullRequest(auth(null), REPO, 1, 'Hello.'),
    ).rejects.toMatchObject({ status: 429, rateLimited: true });
    expect(seconds()).toEqual([2]);
    github.rateLimit = null;

    // A read GitHub could not answer for a moment is tried once more; a second failure is the caller's.
    github.outage = { status: 503, times: 1 };
    expect(
      (await platform.getPullRequest(auth(null), REPO, 1, null)).notModified,
    ).toBe(false);
    github.outage = { status: 502, times: 2 };
    await expect(
      platform.getPullRequest(auth(null), REPO, 1, null),
    ).rejects.toMatchObject({ status: 502, rateLimited: false });
    expect(seconds()).toEqual([2, 1, 1]);
  });
});
