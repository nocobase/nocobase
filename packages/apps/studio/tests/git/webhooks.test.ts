// @vitest-environment node
/**
 * GitHub webhooks and the merge preflight, against a GitHub stand-in: signed deliveries over the public endpoint (a
 * valid signature, a bad one, a replay), each event type taking the same path polling takes, deliveries acted on once,
 * polling slowing down while a webhook works, the repository settings' write-only secret, and why a pull request cannot
 * be merged, what merging does to its issue, and the head the person confirmed.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import type { ScheduleExecutor } from '@nocobase/jobs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PullRequestMergeBlocker } from '../../shared/git.js';
import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import { createGitPoller } from '../../server/git/poller.js';
import { verifyWebhookSignature } from '../../server/git/github.js';
import { createWebhookRouter } from '../../server/git/routes.js';
import { createGitProviders } from '../../server/git/providers.js';
import {
  createGitSecrets,
  GIT_SECRET_PURPOSES,
} from '../../server/git/sealing.js';
import {
  GIT_DELIVERY_PURGE_SCHEDULE,
  scheduleDeliveryPurge,
} from '../../server/git/delivery-purge.job.js';
import {
  DELIVERIES,
  ensureRepo,
  findPullRequest,
  findRepoById,
  updateRepo,
  type RepoRow,
} from '../../server/git/store.js';
import {
  createWebhookReceiver,
  WEBHOOK_RECEIVED_INTERVAL_MS,
  WEBHOOK_RETENTION_DAYS,
  type WebhookRequest,
} from '../../server/git/webhooks.js';
import {
  API,
  bindingOf,
  connectedRepo,
  signBody,
  tokenConnection,
} from './helpers.js';
import {
  createBridgeHarness,
  TEST_SECRETS,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

const REPO = 'acme/studio';
const SECRET = 'whsec-0123456789abcdef';
const PR_URL = (number: number) => `https://github.com/${REPO}/pull/${number}`;

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  const software = (await h.projects.workflows.list(h.viewer('alice'))).find(
    (workflow) => workflow.builtInKey === 'software',
  )!;
  await h.projects.workflows.setDefault(h.viewer('alice'), software.id);
  h.roles.delete('alice');
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const secrets = createGitSecrets(TEST_SECRETS);

async function detail(issue: Pick<Issue, 'id'>) {
  return h.projects.issueQueries.detail(alice(), issue.id);
}

async function move(issue: Pick<Issue, 'id'>, statusKey: string) {
  const current = await detail(issue);
  return h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

/** An issue alice owns, in `statusKey` of the Software development workflow. */
async function issueIn(statusKey: 'todo' | 'in_progress' | 'in_review') {
  const issue = await h.projects.issues.create(alice(), {
    title: 'Fix login',
    start: false,
  });
  if (statusKey !== 'todo') await move(issue, 'in_progress');
  if (statusKey === 'in_review') await move(issue, 'in_review');
  return issue;
}

/** The repository reached through a token connection and, unless told otherwise, with its webhook secret. */
async function repo(options: { secret?: boolean } = {}): Promise<RepoRow> {
  const conn = h.projects.tx.read();
  const row = await connectedRepo(h, REPO);
  if (options.secret !== false)
    await updateRepo(conn, row.id, {
      webhookSecretSealed: secrets.seal(
        SECRET,
        GIT_SECRET_PURPOSES.repoWebhookSecret,
        [row.id],
      ),
    });
  return (await findRepoById(conn, row.id))!;
}

const reread = async (row: RepoRow) =>
  (await findRepoById(h.projects.tx.read(), row.id))!;

/** The delivery ids recorded for the repository's endpoint, sorted. */
const recorded = async (row: Pick<RepoRow, 'id'>) =>
  (
    await h.projects.tx
      .read()
      .query.selectFrom(DELIVERIES)
      .select('deliveryId')
      .where('repoId', '=', row.id)
      .execute()
  )
    .map((delivery) => delivery.deliveryId as string)
    .sort();

let deliveries = 0;

/** Posts a delivery to the repository's endpoint as GitHub would, signed with `secret` unless `signature` says. */
async function deliver(
  row: Pick<RepoRow, 'id'>,
  event: string,
  payload: unknown,
  options: { secret?: string; signature?: string | null; id?: string } = {},
) {
  const body = JSON.stringify(payload);
  const router = createWebhookRouter(h.git.receiveWebhook);
  const signature =
    options.signature === undefined
      ? signBody(options.secret ?? SECRET, body)
      : options.signature;
  deliveries += 1;
  const response = await router.request(
    `/webhooks/github/repositories/${row.id}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': event,
        'x-github-delivery': options.id ?? `delivery-${deliveries}`,
        ...(signature ? { 'x-hub-signature-256': signature } : {}),
      },
      body,
    },
  );
  return {
    status: response.status,
    body: (await response.json()) as Record<string, any>,
  };
}

/** A `pull_request` delivery's pull request, as GitHub sends it. */
function pullPayload(number: number, action = 'opened') {
  const pull = h.github.pull(REPO, number);
  return {
    action,
    repository: { full_name: REPO },
    pull_request: {
      ...pull,
      html_url: PR_URL(number),
      closed_at: pull.state === 'closed' ? pull.merged_at : null,
    },
  };
}

describe('webhook signatures and deliveries', () => {
  it.each(['repository', 'connection'] as const)(
    'throttles signed receipts on the %s endpoint without recording ignored deliveries',
    async (kind) => {
      const row = await repo();
      const other = await connectedRepo(h, 'acme/second');
      const target = kind === 'repository' ? row.id : row.connectionId!;
      let at = new Date('2026-10-08T12:00:00Z');
      const conn = h.projects.tx.read();
      const receiver = createWebhookReceiver({
        conn: () => conn,
        providers: createGitProviders([h.github.platform]),
        repoSecretOf: () => SECRET,
        connectionSecretOf: () => SECRET,
        handlers: {
          pullRequest: async () => null,
          checks: async () => null,
          push: async () => null,
          workflowRun: async () => null,
        },
        now: () => at,
      });
      const read = async () =>
        kind === 'repository' ? reread(row) : h.gitConnections.get(target);
      const send = async (
        event: string,
        payload: unknown,
        signature = SECRET,
        id: string | null = 'irrelevant',
        destination = target,
      ) => {
        const body = new TextEncoder().encode(JSON.stringify(payload));
        const headers: Record<string, string> = {
          'x-github-event': event,
          'x-hub-signature-256': signBody(signature, body),
          ...(id ? { 'x-github-delivery': id } : {}),
        };
        return receiver[kind]({
          target: destination,
          body,
          headers: (name) => headers[name] ?? null,
        });
      };
      await send('ping', {}, SECRET, 'baseline');
      const lastDelivery = (await read()).lastDelivery;
      at = new Date(at.getTime() + WEBHOOK_RECEIVED_INTERVAL_MS);
      const update = vi.spyOn(conn.query, 'updateTable');
      const insert = vi.spyOn(conn.query, 'insertInto');
      try {
        const first = at.toISOString();
        expect(await send('issues', {})).toMatchObject({ status: 'ignored' });
        expect((await read()).lastReceivedAt).toBe(first);
        expect(update).toHaveBeenCalledTimes(1);
        at = new Date(at.getTime() + WEBHOOK_RECEIVED_INTERVAL_MS - 1);
        await Promise.all(
          Array.from({ length: 5 }, () =>
            send('workflow_run', {
              action: 'completed',
              repository: { full_name: 'acme/other' },
              workflow_run: { id: 1, workflow_id: 2 },
            }),
          ),
        );
        expect(update).toHaveBeenCalledTimes(1);
        expect((await read()).lastReceivedAt).toBe(first);
        at = new Date(at.getTime() + 1);
        await Promise.all(Array.from({ length: 5 }, () => send('issues', {})));
        expect(update).toHaveBeenCalledTimes(2);
        expect((await read()).lastReceivedAt).toBe(at.toISOString());
        expect((await read()).lastDelivery).toEqual(lastDelivery);
        expect(insert).not.toHaveBeenCalled();
        expect(await recorded({ id: target })).toEqual(['baseline']);
        const received = (await read()).lastReceivedAt;
        at = new Date(at.getTime() + WEBHOOK_RECEIVED_INTERVAL_MS);
        expect(await send('issues', {}, 'wrong-secret')).toEqual({
          status: 'invalidSignature',
        });
        expect((await read()).lastReceivedAt).toBe(received);
        // Even a signed malformed request without a delivery ID proves this endpoint is receiving traffic.
        expect(await send('issues', {}, SECRET, null)).toEqual({
          status: 'missingDelivery',
        });
        expect((await read()).lastReceivedAt).toBe(at.toISOString());
        const otherTarget =
          kind === 'repository' ? other.id : other.connectionId!;
        const otherRead = async () =>
          kind === 'repository'
            ? reread(other)
            : h.gitConnections.get(otherTarget);
        await send('issues', {}, SECRET, 'other-ignored', otherTarget);
        expect((await otherRead()).lastReceivedAt).toBe(at.toISOString());
        expect((await otherRead()).lastDelivery).toBeNull();
        expect(await recorded({ id: otherTarget })).toEqual([]);
        const beforeRetry = (await read()).lastReceivedAt;
        at = new Date(at.getTime() + WEBHOOK_RECEIVED_INTERVAL_MS);
        update.mockImplementationOnce(() => {
          throw new Error('Receipt write failed');
        });
        await expect(send('issues', {})).rejects.toThrow(
          'Receipt write failed',
        );
        expect((await read()).lastReceivedAt).toBe(beforeRetry);
        await send('issues', {});
        expect((await read()).lastReceivedAt).toBe(at.toISOString());
      } finally {
        update.mockRestore();
        insert.mockRestore();
      }
    },
  );

  it('verifies the HMAC of the raw body in constant time', async () => {
    const body = new TextEncoder().encode(
      '{"zen":"Keep it logically awesome. ✨"}',
    );
    const verify = (signature: string | null, raw = body) =>
      verifyWebhookSignature(SECRET, raw, signature);
    expect(await verify(signBody(SECRET, body))).toBe(true);
    expect(await verify(signBody('another', body))).toBe(false);
    expect(await verify('sha1=abc')).toBe(false);
    expect(await verify(null)).toBe(false);
    // Nothing to verify, or bytes GitHub never signs as text.
    const empty = new Uint8Array();
    expect(await verify(signBody(SECRET, empty), empty)).toBe(false);
    const binary = new Uint8Array([0xff, 0xfe, 0x00]);
    expect(await verify(signBody(SECRET, binary), binary)).toBe(false);
  });

  it('takes a signed delivery, refuses a bad signature, and acts on a replay once', async () => {
    const row = await repo();
    const ok = await deliver(
      row,
      'ping',
      { zen: 'Design for failure.' },
      { id: 'ping-1' },
    );
    expect(ok).toEqual({
      status: 200,
      body: { data: { ok: true, event: 'ping', ignored: false, reason: null } },
    });
    expect((await reread(row)).lastDelivery).toMatchObject({
      event: 'ping',
      status: 'processed',
    });

    const bad = await deliver(row, 'ping', {}, { secret: 'not-the-secret' });
    expect(bad.status).toBe(401);
    expect(bad.body).toMatchObject({
      error: {
        status: 'UNAUTHENTICATED',
        reason: 'INVALID_SIGNATURE',
        domain: 'studio',
      },
    });
    expect((await deliver(row, 'ping', {}, { signature: null })).status).toBe(
      401,
    );
    expect((await reread(row)).lastDelivery).toMatchObject({
      status: 'invalidSignature',
    });

    const replayed = await deliver(row, 'ping', {}, { id: 'ping-1' });
    expect(replayed).toEqual({
      status: 200,
      body: { data: { duplicate: true } },
    });
  });

  it('refuses every delivery while no secret is set, and an unknown repository', async () => {
    const row = await repo({ secret: false });
    expect((await deliver(row, 'ping', {})).status).toBe(401);
    expect((await deliver({ id: 'nope' }, 'ping', {})).status).toBe(404);
  });

  it('needs a delivery id, and ignores what is not JSON or another repository’s', async () => {
    const row = await repo();
    const router = createWebhookRouter(h.git.receiveWebhook);
    const missing = await router.request(
      `/webhooks/github/repositories/${row.id}`,
      {
        method: 'POST',
        headers: {
          'x-github-event': 'ping',
          'x-hub-signature-256': signBody(SECRET, '{}'),
        },
        body: '{}',
      },
    );
    expect(missing.status).toBe(400);
    const form = 'payload=%7B%7D';
    const encoded = await router.request(
      `/webhooks/github/repositories/${row.id}`,
      {
        method: 'POST',
        headers: {
          'x-github-event': 'ping',
          'x-github-delivery': 'form-1',
          'x-hub-signature-256': signBody(SECRET, form),
        },
        body: form,
      },
    );
    expect(await encoded.json()).toMatchObject({
      data: { ignored: true, reason: 'notJson' },
    });
    expect(
      (
        await deliver(row, 'push', {
          ref: 'refs/heads/main',
          repository: { full_name: 'acme/other' },
        })
      ).body.data,
    ).toMatchObject({ ignored: true, reason: 'otherRepository' });
    expect(
      (await deliver(row, 'issues', { repository: { full_name: REPO } })).body
        .data,
    ).toMatchObject({ ignored: true, reason: 'unsupportedEvent' });
  });

  it('checks the signature before anything else, also of an event Studio would ignore', async () => {
    const row = await repo();
    const bad = await deliver(
      row,
      'issues',
      { action: 'opened', repository: { full_name: 'acme/other' } },
      { secret: 'not-the-secret' },
    );
    expect(bad.status).toBe(401);
    expect((await reread(row)).lastDelivery).toMatchObject({
      event: 'issues',
      status: 'invalidSignature',
    });
    expect(await recorded(row)).toEqual([]);
  });

  it('does not record or remember an event, an action or a repository Studio does not follow', async () => {
    const row = await repo();
    await deliver(row, 'ping', {}, { id: 'ping-1' });
    const before = (await reread(row)).lastDelivery;
    const irrelevant: [string, unknown, string][] = [
      [
        'issues',
        { action: 'opened', repository: { full_name: REPO } },
        'unsupportedEvent',
      ],
      [
        'check_suite',
        { action: 'requested', repository: { full_name: REPO } },
        'unsupportedAction',
      ],
      [
        'push',
        { ref: 'refs/tags/v1.0.0', repository: { full_name: REPO } },
        'unsupportedAction',
      ],
      [
        'check_run',
        {
          action: 'completed',
          repository: { full_name: 'acme/other' },
          check_run: { head_sha: 'o1', status: 'completed' },
        },
        'otherRepository',
      ],
      [
        'workflow_run',
        {
          action: 'completed',
          repository: { full_name: 'acme/other' },
          workflow_run: { id: 1, workflow_id: 2 },
        },
        'otherRepository',
      ],
    ];
    for (const [event, payload, reason] of irrelevant) {
      const id = `${event}-1`;
      expect(await deliver(row, event, payload, { id })).toEqual({
        status: 200,
        body: { data: { ok: true, event, ignored: true, reason } },
      });
      // Not recorded, so not a duplicate either.
      expect(
        (await deliver(row, event, payload, { id })).body.data,
      ).toMatchObject({ ignored: true, reason });
    }
    expect(await recorded(row)).toEqual(['ping-1']);
    expect((await reread(row)).lastDelivery).toEqual(before);

    // An event of the repository is recorded and acted on once, even when there is nothing it changes.
    const checks = {
      action: 'completed',
      repository: { full_name: REPO },
      check_run: { head_sha: 'n1', status: 'completed', conclusion: 'success' },
    };
    expect(
      (await deliver(row, 'check_run', checks, { id: 'checks-1' })).body.data,
    ).toMatchObject({ event: 'check_run' });
    expect(await deliver(row, 'check_run', checks, { id: 'checks-1' })).toEqual(
      { status: 200, body: { data: { duplicate: true } } },
    );
    expect(await recorded(row)).toEqual(['checks-1', 'ping-1']);
  });

  it('purges delivery ids past the retention on a schedule, not as deliveries arrive', async () => {
    const row = await repo();
    const conn = h.projects.tx.read();
    await deliver(row, 'ping', {}, { id: 'old' });
    await conn.query
      .updateTable(DELIVERIES)
      .set({
        receivedAt: new Date(
          Date.now() - (WEBHOOK_RETENTION_DAYS + 1) * 24 * 3600 * 1000,
        ),
      })
      .where('deliveryId', '=', 'old')
      .execute();
    await deliver(row, 'ping', {}, { id: 'new' });
    expect(await recorded(row)).toEqual(['new', 'old']);

    const executor = {
      addJob: vi.fn(() => Promise.resolve()),
      setup: vi.fn(() => Promise.resolve()),
      shutdown: vi.fn(() => Promise.resolve()),
    };
    const stop = await scheduleDeliveryPurge(
      () => conn,
      executor as unknown as ScheduleExecutor,
      (error) => {
        throw error;
      },
    );
    expect(executor.addJob).toHaveBeenCalledWith(
      expect.objectContaining({
        name: GIT_DELIVERY_PURGE_SCHEDULE,
        options: { cron: '23 * * * *' },
      }),
    );
    expect(executor.setup).toHaveBeenCalled();
    const [job] = executor.addJob.mock.calls[0] as unknown as [
      { execute: () => Promise<void> },
    ];
    await job.execute();
    expect(await recorded(row)).toEqual(['new']);
    await stop();
    expect(executor.shutdown).toHaveBeenCalled();
  });

  it('forgets a delivery it failed to process, so GitHub may redeliver it', async () => {
    const row = await repo();
    let fail = true;
    const pullRequest = vi.fn(() => {
      if (fail) throw new Error('The database went away.');
      return Promise.resolve(null);
    });
    const receiver = createWebhookReceiver({
      conn: () => h.projects.tx.read(),
      providers: createGitProviders([h.github.platform]),
      repoSecretOf: () => SECRET,
      connectionSecretOf: () => null,
      handlers: {
        pullRequest,
        checks: () => Promise.resolve(null),
        push: () => Promise.resolve(null),
        workflowRun: () => Promise.resolve(null),
      },
      now: () => new Date(),
    });
    const receive = (request: WebhookRequest) => receiver.repository(request);
    const body = new TextEncoder().encode(
      JSON.stringify({
        action: 'opened',
        repository: { full_name: REPO },
        pull_request: { number: 1 },
      }),
    );
    const headers: Record<string, string> = {
      'x-github-delivery': 'redelivered',
      'x-github-event': 'pull_request',
      'x-hub-signature-256': signBody(SECRET, body),
    };
    const request: WebhookRequest = {
      target: row.id,
      headers: (name) => headers[name] ?? null,
      body,
    };
    await expect(receive(request)).rejects.toThrow('The database went away.');
    expect((await reread(row)).lastDelivery).toMatchObject({
      status: 'failed',
      reason: 'error',
    });
    fail = false;
    await expect(receive(request)).resolves.toMatchObject({
      status: 'processed',
    });
    await expect(receive(request)).resolves.toEqual({ status: 'duplicate' });
    expect(pullRequest).toHaveBeenCalledTimes(2);
  });
});

describe('webhook events', () => {
  it('pull_request: links an agent branch, then moves the issue to Done on the merge, once', async () => {
    const row = await repo();
    const issue = await issueIn('in_review');
    h.github.addPull(REPO, {
      number: 2,
      head: { ref: `agent/${issue.identifier}`, sha: 'b1' },
    });
    const before = h.github.requests.length;
    const opened = await deliver(row, 'pull_request', pullPayload(2));
    expect(opened.body.data).toMatchObject({
      event: 'pull_request',
      ignored: false,
    });
    const linked = (await h.git.list(alice(), issue.id)).data;
    expect(linked).toMatchObject([
      { number: 2, state: 'open', linkedBy: { type: 'system' } },
    ]);
    // The payload is the read: GitHub was not asked.
    expect(h.github.requests.length).toBe(before);
    expect(h.port.sent.map((notice) => notice.decisionKey)).toContain(
      `pr:${linked[0]!.id}:${issue.id}`,
    );

    h.github.merge(REPO, 2, 'bob');
    const closed = await deliver(
      row,
      'pull_request',
      pullPayload(2, 'closed'),
      {
        id: 'closed-2',
      },
    );
    expect(closed.body.data).toMatchObject({ ignored: false });
    expect((await detail(issue)).statusKey).toBe('done');
    const replay = await deliver(
      row,
      'pull_request',
      pullPayload(2, 'closed'),
      {
        id: 'closed-2',
      },
    );
    expect(replay.body).toEqual({ data: { duplicate: true } });
    const moves = (
      await h.projects.issueQueries.activities(alice(), issue.id, {})
    ).data.filter(
      (entry) =>
        entry.action === 'status_changed' &&
        (entry.details as { to?: string }).to === 'done',
    );
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ actorType: 'user', actorId: 'bob' });
  });

  it('pull_request: ignores a pull request no issue links, and actions Studio does not read', async () => {
    const row = await repo();
    h.github.addPull(REPO, { number: 3, head: { ref: 'chore', sha: 'c1' } });
    expect(
      (await deliver(row, 'pull_request', pullPayload(3))).body.data,
    ).toMatchObject({ ignored: true, reason: 'notLinked' });
    expect(
      (await deliver(row, 'pull_request', pullPayload(3, 'labeled'))).body.data,
    ).toMatchObject({ ignored: true, reason: 'unsupportedAction' });
    expect(await findPullRequest(h.projects.tx.read(), row.id, 3)).toBeNull();
  });

  it('check_suite, check_run and status: read the checks of the linked head, and ignore a suite without runs', async () => {
    const row = await repo();
    const issue = await issueIn('in_review');
    h.github.addPull(REPO, { number: 4, head: { ref: 'x', sha: 'd1' } });
    const { pullRequest } = await h.git.link(alice(), issue.id, PR_URL(4), {
      type: 'user',
      id: 'alice',
    });
    const ciOf = async () =>
      (await h.git.list(alice(), issue.id)).data[0]?.ciState;
    expect(await ciOf()).toBeNull();

    h.github.setCheck(REPO, 'd1', {
      name: 'build',
      status: 'in_progress',
      conclusion: null,
    });
    const run = await deliver(row, 'check_run', {
      action: 'created',
      repository: { full_name: REPO },
      check_run: { head_sha: 'd1', status: 'in_progress', conclusion: null },
    });
    expect(run.body.data).toMatchObject({ event: 'check_run', ignored: false });
    expect(await ciOf()).toBe('pending');

    h.github.setCheck(REPO, 'd1', {
      name: 'build',
      status: 'completed',
      conclusion: 'success',
    });
    h.github.setStatus(REPO, 'd1', 'failure');
    await deliver(row, 'check_suite', {
      action: 'completed',
      repository: { full_name: REPO },
      check_suite: {
        head_sha: 'd1',
        status: 'completed',
        conclusion: 'success',
        latest_check_runs_count: 1,
      },
    });
    // Every check of the head together: the failing status wins over the passing run, each listed on its own.
    expect(await ciOf()).toBe('failure');
    expect((await h.git.list(alice(), issue.id)).data[0]?.checks).toEqual([
      {
        kind: 'status',
        name: 'ci',
        status: 'completed',
        conclusion: 'failure',
        url: `https://github.com/${REPO}/actions/ci`,
      },
      {
        kind: 'check',
        name: 'build',
        status: 'completed',
        conclusion: 'success',
        url: `https://github.com/${REPO}/runs/build`,
      },
    ]);

    h.github.setStatus(REPO, 'd1', 'success');
    await deliver(row, 'status', {
      sha: 'd1',
      state: 'success',
      repository: { full_name: REPO },
    });
    expect(await ciOf()).toBe('success');

    const empty = await deliver(row, 'check_suite', {
      action: 'completed',
      repository: { full_name: REPO },
      check_suite: {
        head_sha: 'd1',
        status: 'completed',
        conclusion: 'failure',
        latest_check_runs_count: 0,
      },
    });
    expect(empty.body.data).toMatchObject({ ignored: true, reason: 'noRuns' });
    expect(await ciOf()).toBe('success');
    expect(pullRequest.id).toBeTruthy();

    expect(
      (
        await deliver(row, 'status', {
          sha: 'unknown-head',
          state: 'failure',
          repository: { full_name: REPO },
        })
      ).body.data,
    ).toMatchObject({ ignored: true, reason: 'notLinked' });
  });

  it('check events fall back on what the delivery says when GitHub cannot be read', async () => {
    const row = await repo();
    const issue = await issueIn('in_review');
    h.github.addPull(REPO, { number: 5, head: { ref: 'x', sha: 'e1' } });
    await h.git.link(alice(), issue.id, PR_URL(5), {
      type: 'user',
      id: 'alice',
    });
    h.github.tokens.clear();
    h.github.tokens.add('another-token');
    await deliver(row, 'check_suite', {
      action: 'completed',
      repository: { full_name: REPO },
      check_suite: {
        head_sha: 'e1',
        status: 'completed',
        conclusion: 'failure',
        latest_check_runs_count: 2,
      },
    });
    expect((await h.git.list(alice(), issue.id)).data[0]?.ciState).toBe(
      'failure',
    );
  });

  it('tells pushes and workflow runs to the repository’s listeners', async () => {
    const row = await repo();
    const heard: unknown[] = [];
    const stop = h.gitRepoEvents.on((event) => {
      heard.push(event);
      return Promise.resolve();
    });
    await deliver(row, 'push', {
      ref: 'refs/heads/main',
      created: true,
      before: '0'.repeat(40),
      after: 'abc',
      repository: { full_name: REPO },
    });
    const ran = await deliver(row, 'workflow_run', {
      action: 'completed',
      repository: { full_name: REPO },
      workflow_run: {
        id: 5,
        workflow_id: 9,
        name: 'Initialize',
        path: '.github/workflows/nb-studio-init.yml',
        head_branch: 'main',
        head_sha: 'abc',
        status: 'completed',
        conclusion: 'success',
        html_url: 'https://github.com/acme/studio/actions/runs/5',
        run_attempt: 1,
      },
    });
    stop();
    expect(ran.body.data).toMatchObject({
      event: 'workflow_run',
      ignored: false,
    });
    expect(heard).toEqual([
      {
        type: 'push',
        repoId: row.id,
        repo: REPO,
        branch: 'main',
        created: true,
        before: '0'.repeat(40),
        after: 'abc',
      },
      expect.objectContaining({
        type: 'workflowRun',
        repoId: row.id,
        action: 'completed',
        run: expect.objectContaining({ id: '5', conclusion: 'success' }),
      }),
    ]);
  });

  it('push: checks the mergeability of the pull requests based on the branch, again while GitHub computes', async () => {
    const row = await repo();
    const issue = await issueIn('in_review');
    h.github.addPull(REPO, {
      number: 6,
      head: { ref: 'x', sha: 'f1' },
      base: { ref: 'main' },
    });
    await h.git.link(alice(), issue.id, PR_URL(6), {
      type: 'user',
      id: 'alice',
    });
    const pushed = await deliver(row, 'push', {
      ref: 'refs/heads/main',
      repository: { full_name: REPO },
    });
    expect(pushed.body.data).toMatchObject({ event: 'push', ignored: false });
    // Not yet: GitHub starts working mergeability out after the push.
    expect(await h.git.runMergeChecks(new Date())).toBe(0);

    h.github.pull(REPO, 6).mergeable_state = 'unknown';
    const later = new Date(Date.now() + 60_000);
    expect(await h.git.runMergeChecks(later)).toBe(1);
    h.github.pull(REPO, 6).mergeable_state = 'dirty';
    expect(await h.git.runMergeChecks(later)).toBe(0);
    expect(await h.git.runMergeChecks(new Date(later.getTime() + 31_000))).toBe(
      1,
    );
    const [pr] = (await h.git.list(alice(), issue.id)).data;
    expect(pr).toMatchObject({
      mergeableState: 'dirty',
      mergeBlocker: 'conflicts',
    });
    // Known now: no more checks.
    expect(
      await h.git.runMergeChecks(new Date(later.getTime() + 120_000)),
    ).toBe(0);
    expect(
      (
        await deliver(row, 'push', {
          ref: 'refs/tags/v1',
          repository: { full_name: REPO },
        })
      ).body.data,
    ).toMatchObject({ ignored: true, reason: 'unsupportedAction' });
  });
});

describe('polling beside webhooks', () => {
  it('polls a repository every minute, and only as a slow fallback while its webhook works', async () => {
    const row = await repo();
    const polled: string[] = [];
    let at = new Date();
    const poller = createGitPoller({
      git: () => ({
        async pollRepo(target) {
          polled.push(target.id);
          await updateRepo(h.projects.tx.read(), target.id, { polledAt: at });
          return { retryAt: null };
        },
        runMergeChecks: () => Promise.resolve(0),
        syncRepos: () => Promise.resolve(),
      }),
      conn: () => h.projects.tx.read(),
      intervalSeconds: 60,
      fallbackSeconds: 600,
      now: () => at,
      onError: (_, error) => {
        throw error;
      },
    });
    const tick = async (seconds: number) => {
      at = new Date(at.getTime() + seconds * 1000);
      await poller.tick();
      return polled.length;
    };
    expect(await tick(0)).toBe(1);
    expect(await tick(30)).toBe(1);
    expect(await tick(31)).toBe(2);

    // A verified delivery: the webhook works.
    await deliver(row, 'ping', {});
    expect(await tick(61)).toBe(2);
    expect(await tick(300)).toBe(2);
    expect(await tick(300)).toBe(3);

    // A delivery that fails verification: back to every minute.
    await deliver(row, 'ping', {}, { secret: 'stale' });
    expect(await tick(61)).toBe(4);
  });

  it('waits until GitHub’s rate limit lifts for every repository read with the same credential', async () => {
    const first = await repo();
    const conn = h.projects.tx.read();
    const second = await ensureRepo(conn, API, 'acme/other');
    await updateRepo(conn, second.id, { connectionId: first.connectionId });
    const polled: string[] = [];
    let at = new Date();
    let limitedUntil: Date | null = new Date(at.getTime() + 600_000);
    const poller = createGitPoller({
      git: () => ({
        async pollRepo(target) {
          polled.push(target.repo);
          await updateRepo(h.projects.tx.read(), target.id, { polledAt: at });
          return { retryAt: limitedUntil?.toISOString() ?? null };
        },
        runMergeChecks: () => Promise.resolve(0),
        syncRepos: () => Promise.resolve(),
      }),
      conn: () => h.projects.tx.read(),
      intervalSeconds: 60,
      now: () => at,
      onError: (_, error) => {
        throw error;
      },
    });
    // The first read is limited: the other repository on the connection is not read either.
    await poller.tick();
    expect(polled).toHaveLength(1);
    limitedUntil = null;
    at = new Date(at.getTime() + 120_000);
    await poller.pollNow();
    expect(polled).toHaveLength(1);
    // Once the limit lifts, both are read again.
    at = new Date(at.getTime() + 600_000);
    await poller.tick();
    expect(polled).toHaveLength(3);
  });
});

describe('repository settings', () => {
  async function resource() {
    h.roles.set('alice', 'admin');
    const project = await h.projects.projects.create(alice(), { name: 'Web' });
    return h.projects.projects.addResource(alice(), project.id, {
      type: 'gitRepo',
      url: `https://github.com/${REPO}.git`,
      binding: bindingOf(await tokenConnection(h), REPO),
    });
  }

  it('keeps branch rules per repository, the first naming the agents’ branches', async () => {
    const workdir = await resource();
    expect((await h.git.repoSettings(alice(), workdir.id)).branchRules).toEqual(
      ['agent/{key}'],
    );
    await expect(
      h.git.updateRepoSettings(alice(), workdir.id, {
        branchRules: ['agent/x'],
      }),
    ).rejects.toMatchObject({ details: { code: 'INVALID_BRANCH_RULE' } });
    await expect(
      h.git.updateRepoSettings(alice(), workdir.id, { branchRules: [] }),
    ).rejects.toMatchObject({ details: { code: 'INVALID_BRANCH_RULE' } });
    const saved = await h.git.updateRepoSettings(alice(), workdir.id, {
      branchRules: ['feat/{key}', 'agent/{key}'],
    });
    expect(saved.branchRules).toEqual(['feat/{key}', 'agent/{key}']);
    expect(saved.connection).toMatchObject({ name: 'GitHub', kind: 'token' });
  });

  it('keeps the webhook secret write-only, and shows where GitHub posts and what it last sent', async () => {
    const workdir = await resource();
    const empty = await h.git.repoSettings(alice(), workdir.id);
    expect(empty).toMatchObject({
      repo: REPO,
      webUrl: `https://github.com/${REPO}`,
      hasWebhookSecret: false,
      lastDelivery: null,
      webhookHealthy: false,
      pollSeconds: 60,
    });
    expect(empty.webhookUrl).toMatch(
      /^\/api\/webhooks\/github\/repositories\/.+/u,
    );
    await expect(
      h.git.updateRepoSettings(alice(), workdir.id, { webhookSecret: 'short' }),
    ).rejects.toMatchObject({ details: { code: 'INVALID_WEBHOOK_SECRET' } });

    const saved = await h.git.updateRepoSettings(alice(), workdir.id, {
      webhookSecret: SECRET,
    });
    expect(saved.hasWebhookSecret).toBe(true);
    expect(JSON.stringify(saved)).not.toContain(SECRET);
    const repoId = saved.webhookUrl!.split('/').at(-1)!;
    await deliver({ id: repoId }, 'ping', {});
    expect(await h.git.repoSettings(alice(), workdir.id)).toMatchObject({
      lastDelivery: { event: 'ping', status: 'processed', reason: null },
      webhookHealthy: true,
      pollSeconds: 600,
    });

    // Replacing it forgets what the old one signed; clearing it refuses deliveries.
    const replaced = await h.git.updateRepoSettings(alice(), workdir.id, {
      webhookSecret: `${SECRET}-new`,
    });
    expect(replaced).toMatchObject({
      hasWebhookSecret: true,
      lastDelivery: null,
    });
    const cleared = await h.git.updateRepoSettings(alice(), workdir.id, {
      webhookSecret: null,
    });
    expect(cleared.hasWebhookSecret).toBe(false);
    expect((await deliver({ id: repoId }, 'ping', {})).status).toBe(401);

    // A member who may not manage the project sees no address.
    h.roles.delete('alice');
    h.roles.set('bob', 'member');
    await expect(
      h.git.updateRepoSettings(h.viewer('bob'), workdir.id, {
        webhookSecret: SECRET,
      }),
    ).rejects.toThrow();
  });
});

describe('merge preflight', () => {
  async function linkedPull(
    number: number,
    pull: Parameters<BridgeHarness['github']['addPull']>[1] = { number },
    statusKey: 'todo' | 'in_progress' | 'in_review' = 'in_review',
  ) {
    const issue = await issueIn(statusKey);
    h.github.addPull(REPO, {
      head: { ref: `x-${number}`, sha: `h${number}` },
      ...pull,
      number,
    });
    const { pullRequest } = await h.git.link(
      alice(),
      issue.id,
      PR_URL(number),
      {
        type: 'user',
        id: 'alice',
      },
    );
    return { issue, pullRequest };
  }

  const preflight = (issue: Issue, id: string) =>
    h.git.preflight(alice(), issue.id, id);

  it('names the first reason a pull request cannot be merged', async () => {
    await repo();
    const cases: [number, () => void, PullRequestMergeBlocker | null][] = [
      [10, () => h.github.setStatus(REPO, 'h10', 'success'), null],
      [11, () => (h.github.pull(REPO, 11).draft = true), 'draft'],
      [
        12,
        () => (h.github.pull(REPO, 12).mergeable_state = 'dirty'),
        'conflicts',
      ],
      [
        13,
        () => (h.github.pull(REPO, 13).mergeable_state = 'unknown'),
        'computing',
      ],
      [14, () => h.github.setStatus(REPO, 'h14', 'pending'), 'ciPending'],
      [15, () => h.github.setStatus(REPO, 'h15', 'failure'), 'ciFailed'],
      [16, () => undefined, 'ciMissing'],
    ];
    for (const [number, arrange, blocker] of cases) {
      const { issue, pullRequest } = await linkedPull(number);
      arrange();
      expect(await preflight(issue, pullRequest.id)).toMatchObject({
        blocker,
        method: 'squash',
        headSha: `h${number}`,
        baseRef: 'main',
        commitTitle: `Pull request ${number} (#${number})`,
      });
    }
    const { issue, pullRequest } = await linkedPull(17);
    h.github.merge(REPO, 17, 'bob');
    expect((await preflight(issue, pullRequest.id)).blocker).toBe('merged');
  });

  it('shows the stored reason on the pull request, and notConfigured without a connection', async () => {
    const { issue, pullRequest } = await linkedPull(20);
    expect(pullRequest.mergeBlocker).toBe('ciMissing');
    // No connection: the stored state is all there is.
    expect((await h.git.list(alice(), issue.id)).data[0]?.mergeBlocker).toBe(
      'ciMissing',
    );
    h.github.setStatus(REPO, 'h20', 'success');
    await h.git.refresh(alice(), issue.id, pullRequest.id);
    expect((await h.git.list(alice(), issue.id)).data[0]?.mergeBlocker).toBe(
      'notConfigured',
    );
    expect(await preflight(issue, pullRequest.id)).toMatchObject({
      blocker: 'notConfigured',
      headSha: 'h20',
    });
    await expect(
      h.git.merge(alice(), issue.id, pullRequest.id, 'h20'),
    ).rejects.toMatchObject({
      details: { code: 'PR_NOT_MERGEABLE', blocker: 'notConfigured' },
    });
  });

  it('says what merging does to the issue', async () => {
    await repo();
    const moves = await linkedPull(30);
    expect(
      (await preflight(moves.issue, moves.pullRequest.id)).statusAfter,
    ).toEqual({ statusKey: 'done', statusName: 'Done', keepReason: null });
    const early = await linkedPull(31, { number: 31 }, 'todo');
    expect(
      (await preflight(early.issue, early.pullRequest.id)).statusAfter,
    ).toEqual({
      statusKey: null,
      statusName: null,
      keepReason: 'noTransition',
    });

    h.github.addPull(REPO, { number: 32, head: { ref: 'y', sha: 'h32' } });
    await h.git.link(alice(), moves.issue.id, PR_URL(32), {
      type: 'user',
      id: 'alice',
    });
    expect(
      (await preflight(moves.issue, moves.pullRequest.id)).statusAfter
        .keepReason,
    ).toBe('otherPrs');
    await h.git.setAutoComplete(
      alice(),
      moves.issue.id,
      moves.pullRequest.id,
      true,
    );
    expect(
      (await preflight(moves.issue, moves.pullRequest.id)).statusAfter
        .keepReason,
    ).toBe('optedOut');

    const finished = await linkedPull(33);
    await move(finished.issue, 'done');
    expect(
      (await preflight(finished.issue, finished.pullRequest.id)).statusAfter
        .keepReason,
    ).toBe('terminal');
  });

  it('merges only the head the person confirmed, and only when nothing blocks it', async () => {
    await repo();
    const { issue, pullRequest } = await linkedPull(40);
    await expect(
      h.git.merge(alice(), issue.id, pullRequest.id, ''),
    ).rejects.toMatchObject({ details: { code: 'INVALID_EXPECTED_HEAD' } });
    await expect(
      h.git.merge(alice(), issue.id, pullRequest.id, 'h40'),
    ).rejects.toMatchObject({
      details: { code: 'PR_NOT_MERGEABLE', blocker: 'ciMissing' },
    });
    h.github.setStatus(REPO, 'h40', 'success');
    // A push after the person looked: the head moved.
    const pull = h.github.pull(REPO, 40);
    pull.head = { ...pull.head, sha: 'h40b' };
    h.github.setStatus(REPO, 'h40b', 'success');
    await expect(
      h.git.merge(alice(), issue.id, pullRequest.id, 'h40'),
    ).rejects.toMatchObject({ details: { code: 'PR_CHANGED' } });
    expect(h.github.pull(REPO, 40).merged).toBe(false);

    // Branch protection refuses it on GitHub.
    h.github.protectedPulls.add(`${REPO}#40`);
    await expect(
      h.git.merge(alice(), issue.id, pullRequest.id, 'h40b'),
    ).rejects.toMatchObject({
      details: { code: 'PR_NOT_MERGEABLE', blocker: 'protected' },
    });
    h.github.protectedPulls.clear();
    const merged = await h.git.merge(alice(), issue.id, pullRequest.id, 'h40b');
    expect(merged).toMatchObject({ state: 'merged' });
    expect((await detail(issue)).statusKey).toBe('done');
  });

  it('is for whoever may merge only', async () => {
    await repo();
    const { issue, pullRequest } = await linkedPull(50);
    await expect(
      h.git.preflight(h.viewer('bob'), issue.id, pullRequest.id),
    ).rejects.toThrow();
    await expect(
      h.git.merge(h.viewer('bob'), issue.id, pullRequest.id, 'h50'),
    ).rejects.toThrow();
  });
});
