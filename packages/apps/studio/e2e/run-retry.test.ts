import path from 'node:path';

import type { RunDetail } from '@nocobase/app-plugin-agents/shared/runs';

import { expect, open, test, unique } from './support/fixtures.ts';
import { FakeRunner } from './support/runner.ts';

test.use({ user: 'admin', locale: 'en-US' });
test.setTimeout(180_000);

test('removes an old failure when a real retry resumes and preserves historical errors', async ({
  page,
  api,
}) => {
  await api.patch('users/me/preferences', {
    locale: 'en-US',
    'theme.mode': 'light',
  });
  const me = await api.get<{ userId: string }>('projects/me');
  const runner = new FakeRunner(api, `retry-${unique()}`);
  const run = await runner.issueWithTranscript(
    'Retry recovery verification',
    me.userId,
  );
  const route = `/issues/${run.issue.identifier}/runs/${run.runId}`;
  const detail = () => api.get<RunDetail>(`agents/runs/${run.runId}`);
  const snapshot = async (name: string) => {
    const destination = path.join(
      process.env.TMPDIR ?? 'output',
      `${name}.png`,
    );
    await page.screenshot({ path: destination, fullPage: true });
  };
  await run.append([
    {
      seq: run.firstSeq,
      at: new Date().toISOString(),
      type: 'error',
      content: 'Historical connection failure from attempt 1',
    },
  ]);
  await open(page, route);
  await expect(page.getByTestId('run-transcript')).toBeVisible({
    timeout: 60_000,
  });
  await run.fail('toolNetwork', 'First connection failure');
  await expect(
    page
      .getByTestId('run-transcript')
      .getByText(
        /Attempt 1 failed.*First connection failure.*Automatic retry scheduled/u,
      ),
  ).toBeVisible();
  const queued = await detail();
  expect(queued).toMatchObject({
    status: 'queued',
    failureReason: 'toolNetwork',
    failureDetail: 'First connection failure',
  });
  await snapshot('pm381-waiting-retry');
  await expect
    .poll(() => Date.now() >= new Date(queued.availableAt!).getTime(), {
      timeout: 40_000,
    })
    .toBe(true);
  await runner.start(run.issue.identifier);
  await expect(
    page.getByTestId('run-transcript').getByText(/Attempt 1 failed/u),
  ).toHaveCount(0);
  expect(await detail()).toMatchObject({
    status: 'running',
    failureReason: null,
    failureDetail: null,
  });
  await expect(
    page
      .getByTestId('run-transcript')
      .getByText('Historical connection failure from attempt 1', {
        exact: true,
      }),
  ).toBeVisible();
  await snapshot('pm381-recovered-running');
  await open(page, `/issues/${run.issue.identifier}`);
  await open(page, route);
  await expect(
    page.getByTestId('run-transcript').getByText(/Attempt 1 failed/u),
  ).toHaveCount(0);
  await runner.complete(run.runId, 'Retry completed successfully');
  await expect(
    page
      .getByTestId('run-transcript')
      .getByText('Retry completed successfully', { exact: true }),
  ).toBeVisible();
  expect(await detail()).toMatchObject({
    status: 'completed',
    failureReason: null,
    failureDetail: null,
  });
  await snapshot('pm381-completed');

  const failed = await runner.issueWithTranscript(
    'Latest retry failure verification',
    me.userId,
  );
  await failed.append([
    {
      seq: failed.firstSeq,
      at: new Date().toISOString(),
      type: 'error',
      content: 'Historical connection failure from attempt 1',
    },
  ]);
  await open(page, `/issues/${failed.issue.identifier}/runs/${failed.runId}`);
  await expect(page.getByTestId('run-transcript')).toBeVisible();
  await failed.fail('toolNetwork', 'Earlier failure');
  const waiting = await api.get<RunDetail>(`agents/runs/${failed.runId}`);
  await expect
    .poll(() => Date.now() >= new Date(waiting.availableAt!).getTime(), {
      timeout: 40_000,
    })
    .toBe(true);
  await runner.start(failed.issue.identifier);
  await failed.append([
    {
      seq: failed.firstSeq + 1,
      at: new Date().toISOString(),
      type: 'error',
      content: 'Latest command failure from attempt 2',
    },
  ]);
  await failed.fail('toolProcess', 'Latest failure details');
  await expect(
    page.getByTestId('run-transcript').getByText(/Latest failure details/u),
  ).toBeVisible();
  await expect(
    page.getByTestId('run-transcript').getByText(/Earlier failure/u),
  ).toHaveCount(0);
  expect(await api.get<RunDetail>(`agents/runs/${failed.runId}`)).toMatchObject(
    {
      status: 'failed',
      failureReason: 'toolProcess',
      failureDetail: 'Latest failure details',
    },
  );
  await expect(
    page
      .getByTestId('run-transcript')
      .getByText('Historical connection failure from attempt 1', {
        exact: true,
      }),
  ).toBeVisible();
  await snapshot('pm381-latest-failure-history');
  await api.patch('users/me/preferences', {
    locale: 'zh-CN',
    'theme.mode': 'dark',
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, `/issues/${failed.issue.identifier}/runs/${failed.runId}`);
  await expect(
    page.getByTestId('run-transcript').getByText(/Latest failure details/u),
  ).toBeVisible();
  await expect(
    page
      .getByTestId('run-transcript')
      .getByText('Historical connection failure from attempt 1', {
        exact: true,
      }),
  ).toBeVisible();
});
