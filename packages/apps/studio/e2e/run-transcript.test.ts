import { mixedRunEvents } from '../tests/fixtures/run-transcript.js';
import {
  apiAs,
  expect,
  open,
  signIn,
  test,
  unique,
} from './support/fixtures.ts';
import { FakeRunner } from './support/runner.ts';

interface ScrollViewport {
  scrollTop: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

test.use({ user: 'admin' });
test.setTimeout(120_000);

test('filters a real 200-event run, preserves preferences and follows live failures', async ({
  page,
  api,
  browser,
  context,
}) => {
  // Language and theme persist on the account, including when a second account inherits this browser's choices.
  // Keep both accounts private to this test so parallel sign-in tests never inherit its English/dark preferences.
  const suffix = unique();
  const owner = {
    email: `transcript-owner-${suffix}@example.com`,
    password: 'transcript-e2e-password',
  };
  const reader = {
    email: `transcript-reader-${suffix}@example.com`,
    password: 'transcript-e2e-password',
  };
  await api.post('users', {
    ...owner,
    name: `Transcript owner ${suffix}`,
    roleScopes: { studio: ['admin'] },
  });
  await api.post('users', {
    ...reader,
    name: `Transcript reader ${suffix}`,
    roleScopes: { studio: ['contributor'] },
  });
  await signIn(context, owner);
  await api.patch('users/me/preferences', {
    locale: 'zh-CN',
    'theme.mode': 'light',
  });
  const me = await api.get<{ userId: string }>('projects/me');
  const runner = new FakeRunner(api, `transcript-${unique()}`);
  const run = await runner.issueWithTranscript(
    `运行记录 ${unique()}`,
    me.userId,
  );
  const events = mixedRunEvents().map((event) => ({
    ...event,
    seq: event.seq + run.firstSeq - 1,
  }));
  await run.append(events);
  const route = `/issues/${run.issue.identifier}/runs/${run.runId}`;
  await open(page, route);
  const transcript = page.getByTestId('run-transcript');
  await expect(
    transcript.getByText('Recorded event 1', { exact: true }),
  ).toBeVisible();
  await expect(
    transcript.getByText('Recorded event 2', { exact: true }),
  ).toBeVisible();
  await expect(
    transcript.getByText('Recorded event 10', { exact: true }),
  ).toBeAttached();
  await expect(
    transcript.getByText('Recorded event 6', { exact: true }),
  ).toHaveCount(0);
  await transcript.getByRole('button', { name: /隐藏/u }).first().click();
  await expect(
    transcript.getByText('Recorded event 6', { exact: true }),
  ).toBeVisible();
  await expect(
    transcript.getByText('Recorded event 16', { exact: true }),
  ).toHaveCount(0);
  await transcript.getByRole('button', { name: '思考', exact: true }).click();
  await expect(
    transcript.getByText('Recorded event 16', { exact: true }),
  ).toBeAttached();
  await page.reload();
  await expect(
    transcript.getByText('Recorded event 6', { exact: true }),
  ).toBeAttached();
  await transcript.getByRole('button', { name: '思考', exact: true }).click();
  const seq = run.firstSeq + 200;
  const at = new Date().toISOString();
  await run.append([
    { seq, at, type: 'thinking', content: 'Hidden live thinking' },
    {
      seq: seq + 1,
      at,
      type: 'toolResult',
      output: 'Runner tool failure',
      meta: { isError: true },
    },
    {
      seq: seq + 2,
      at,
      type: 'toolResult',
      output: 'Online tool failure',
      meta: { ok: false },
    },
    { seq: seq + 3, at, type: 'text', content: 'Live reply' },
  ]);
  await expect(
    transcript.getByText('Live reply', { exact: true }),
  ).toBeAttached();
  await expect(transcript.getByText('Hidden live thinking')).toHaveCount(0);
  await expect(transcript.getByText('Runner tool failure')).toBeAttached();
  await expect(transcript.getByText('Online tool failure')).toBeAttached();

  // Expanding a long hidden segment at the bottom starts reading history; the next live event must not pull it away.
  const hiddenSegments = transcript.locator('button[aria-expanded]');
  const hiddenCount = await hiddenSegments.count();
  await run.append(
    Array.from({ length: 30 }, (_, index) => ({
      seq: seq + 4 + index,
      at,
      type: 'thinking' as const,
      content: `Expanded live thinking ${index + 1}`,
    })),
  );
  await expect(hiddenSegments).toHaveCount(hiddenCount + 1);
  const viewport = transcript.locator('.overflow-y-auto');
  await viewport.evaluate((element: ScrollViewport) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect
    .poll(() =>
      viewport.evaluate(
        (element: ScrollViewport) =>
          element.scrollHeight - element.scrollTop - element.clientHeight,
      ),
    )
    .toBeLessThan(1);
  await hiddenSegments.last().click();
  await expect(
    transcript.getByText('Expanded live thinking 30', { exact: true }),
  ).toBeAttached();
  await expect
    .poll(() =>
      viewport.evaluate(
        (element: ScrollViewport) =>
          element.scrollHeight - element.scrollTop - element.clientHeight,
      ),
    )
    .toBeGreaterThan(48);
  const readingTop = await viewport.evaluate(
    (element: ScrollViewport) => element.scrollTop,
  );
  await run.append([
    {
      seq: seq + 34,
      at,
      type: 'text',
      content: 'Reply after expanding history',
    },
  ]);
  await expect(
    transcript.getByText('Reply after expanding history', { exact: true }),
  ).toBeAttached();
  await expect
    .poll(() =>
      viewport.evaluate((element: ScrollViewport) => element.scrollTop),
    )
    .toBe(readingTop);

  await run.fail();
  await expect(transcript.getByText(/The test command failed/u)).toBeVisible();
  await transcript.getByRole('button', { name: '思考', exact: true }).click();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: 'output/screenshots/run-transcript-mobile.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: 'output/screenshots/run-transcript-desktop.png',
    fullPage: true,
  });

  await api.patch('users/me/preferences', {
    locale: 'en-US',
    'theme.mode': 'dark',
  });
  await page.reload();
  await expect(
    transcript.getByRole('button', { name: 'Thinking', exact: true }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/u);
  await page.screenshot({
    path: 'output/screenshots/run-transcript-dark-en.png',
    fullPage: true,
  });

  // A different account on the same browser has an independent choice.
  const other = await apiAs(browser, reader);
  try {
    const user = await other.api.get<{ userId: string }>('projects/me');
    const second = await runner.issueWithTranscript(
      `另一位用户的运行 ${unique()}`,
      user.userId,
      other.api,
    );
    await second.append(
      mixedRunEvents().map((event) => ({
        ...event,
        seq: event.seq + second.firstSeq - 1,
      })),
    );
    await signIn(context, reader);
    await open(page, `/issues/${second.issue.identifier}/runs/${second.runId}`);
    await expect(
      transcript.getByText('Recorded event 1', { exact: true }),
    ).toBeVisible();
    await expect(
      transcript.getByText('Recorded event 6', { exact: true }),
    ).toHaveCount(0);
    await expect
      .poll(() => other.api.get('users/me/preferences'))
      .toMatchObject({ locale: 'en-US', 'theme.mode': 'dark' });
    await signIn(context, owner);
    await open(page, route);
    await expect(
      transcript.getByText('Recorded event 6', { exact: true }),
    ).toBeAttached();
  } finally {
    await other.close();
  }
});
