import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import {
  treeAnnotationTitle,
  waitForProChecks,
} from '../../scripts/wait-for-pro-checks.mjs';

const tree = 'a'.repeat(40);
const otherTree = 'b'.repeat(40);
const names = ['Check Pro (test)', 'Check Pro (smoke)'];

// A GitHub API that serves the run's jobs from `states`, one entry per poll (the last one repeats), and each job's annotations from `annotations`.
async function fakeApi(t, states, annotations = {}) {
  const requests = [];
  let polls = 0;
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    requests.push(`${url.pathname}${url.search}`);
    assert.equal(request.headers.authorization, 'Bearer token');
    let body;
    if (url.pathname === '/repos/nocobase/nocobase/actions/runs/7/jobs') {
      assert.equal(url.searchParams.get('filter'), 'all');
      body = { jobs: states[Math.min(polls, states.length - 1)] };
      polls += 1;
    } else {
      const id = url.pathname.match(
        /^\/repos\/nocobase\/nocobase\/check-runs\/(\d+)\/annotations$/u,
      )?.[1];
      if (!id) {
        response.writeHead(404).end('{}');
        return;
      }
      body = annotations[id] ?? [];
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const options = {
    tree,
    names,
    api: `http://127.0.0.1:${server.address().port}`,
    token: 'token',
    repository: 'nocobase/nocobase',
    runId: '7',
    intervalSeconds: 0.01,
    timeoutSeconds: 5,
  };
  return { options, requests };
}

function job(id, name, status, conclusion, attempt = 1, started = id) {
  return {
    id,
    name,
    status,
    conclusion,
    run_attempt: attempt,
    started_at: `2026-11-13T08:00:0${started}Z`,
    completed_at:
      status === 'completed' ? `2026-11-13T08:30:0${started}Z` : null,
    html_url: `https://github.com/nocobase/nocobase/actions/runs/7/job/${id}`,
  };
}

const announced = (value) => [
  { title: treeAnnotationTitle, message: `${value}\n` },
  { title: '', message: 'The ubuntu-latest label will migrate' },
];

test('waits until both checks finish and accepts them when they passed on this tree', async (t) => {
  const { options } = await fakeApi(
    t,
    [
      [job(1, names[0], 'in_progress', null), job(2, names[1], 'queued', null)],
      [
        job(1, names[0], 'completed', 'success'),
        job(2, names[1], 'in_progress', null),
      ],
      [
        job(1, names[0], 'completed', 'success'),
        job(2, names[1], 'completed', 'success'),
      ],
    ],
    { 1: announced(tree), 2: announced(tree) },
  );
  await waitForProChecks(options);
});

test('follows the latest attempt of a re-run check, and a check run through workflow_call', async (t) => {
  const { options } = await fakeApi(
    t,
    [
      [
        job(1, `release / ${names[0]}`, 'completed', 'success'),
        job(2, names[1], 'completed', 'failure'),
        job(5, names[1], 'completed', 'success', 2),
      ],
    ],
    { 1: announced(tree), 5: announced(tree) },
  );
  await waitForProChecks(options);
});

// "Re-run failed jobs" lists a check it did not re-run as a copy with a new id and no annotations.
test('reads the tree of a check a re-run attempt copied from the attempt that ran it', async (t) => {
  const { options, requests } = await fakeApi(
    t,
    [
      [
        job(1, names[0], 'completed', 'success'),
        job(2, names[1], 'completed', 'success'),
        job(3, 'Publish Pro beta', 'completed', 'failure'),
        job(4, names[0], 'completed', 'success', 2, 1),
        job(5, names[1], 'completed', 'success', 2, 2),
        job(6, 'Publish Pro beta', 'in_progress', null, 2),
      ],
    ],
    { 1: announced(tree), 2: announced(tree) },
  );
  await waitForProChecks(options);
  assert.ok(
    requests.includes(
      '/repos/nocobase/nocobase/check-runs/1/annotations?per_page=100',
    ),
    requests.join('\n'),
  );
});

test('refuses a check that did not succeed', async (t) => {
  const { options } = await fakeApi(
    t,
    [
      [
        job(1, names[0], 'completed', 'success'),
        job(2, names[1], 'completed', 'failure'),
      ],
    ],
    { 1: announced(tree) },
  );
  await assert.rejects(
    waitForProChecks(options),
    /Check Pro \(smoke\) finished as failure .*job\/2\), so nothing was published/u,
  );
});

test('refuses a check that passed on another tree or announced none', async (t) => {
  const passed = [
    job(1, names[0], 'completed', 'success'),
    job(2, names[1], 'completed', 'success'),
  ];
  const other = await fakeApi(t, [passed], {
    1: announced(tree),
    2: announced(otherTree),
  });
  await assert.rejects(
    waitForProChecks(other.options),
    new RegExp(
      `Check Pro \\(smoke\\) .* passed on tree ${otherTree}, but this job built tree ${tree}`,
      'u',
    ),
  );
  const none = await fakeApi(t, [passed], { 1: announced(tree) });
  await assert.rejects(
    waitForProChecks(none.options),
    /Check Pro \(smoke\) .* passed without announcing a "Pro checked tree"/u,
  );
});

test('gives up once the timeout passes', async (t) => {
  const { options } = await fakeApi(t, [[job(1, names[0], 'queued', null)]]);
  await assert.rejects(
    waitForProChecks({ ...options, timeoutSeconds: 0.05 }),
    /Gave up after 0\.05 seconds waiting for Check Pro \(test\) \(queued\), Check Pro \(smoke\) \(not started\)/u,
  );
});

test('rejects an argument that is not a tree SHA', async () => {
  await assert.rejects(
    waitForProChecks({
      tree: 'HEAD',
      names,
      token: 'token',
      repository: 'nocobase/nocobase',
      runId: '7',
    }),
    /--tree must be a tree SHA/u,
  );
});
