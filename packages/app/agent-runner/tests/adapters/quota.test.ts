import { expect, it } from 'vitest';
import { claudeQuota, codexQuota } from '../../src/agent/adapters/quota.ts';
import { classifyCodexFailure } from '../../src/agent/adapters/codex/classify.ts';
it('reports allowed/warning usage but blocks rejected quota only, respecting overage', () => {
  for (const status of ['allowed', 'allowed_warning'])
    expect(
      claudeQuota({
        status,
        rateLimitType: 'five_hour',
        utilization: 0.62,
        resetsAt: 2000000000,
      })?.windows[0],
    ).toMatchObject({
      usedPercent: 62,
      exhausted: false,
      resetsAt: '2033-05-18T03:33:20.000Z',
    });
  expect(
    claudeQuota({
      status: 'rejected',
      rateLimitType: 'seven_day',
      utilization: 1,
    })?.windows[0],
  ).toMatchObject({ exhausted: true, resetsAt: null });
  expect(
    claudeQuota({
      status: 'rejected',
      rateLimitType: 'seven_day',
      overageStatus: 'allowed',
    })?.windows[0].exhausted,
  ).toBe(false);
  expect(
    claudeQuota(
      { status: 'rejected', rateLimitType: 'seven_day_opus' },
      'claude-opus-5',
    )?.windows[0],
  ).toMatchObject({ scope: 'model', target: 'claude-opus-5' });
  expect(
    claudeQuota(
      { status: 'rejected', rateLimitType: 'seven_day_opus' },
      'claude-sonnet-5',
    ),
  ).toBeUndefined();
});
it('preserves independent Codex reset windows and distinguishes account quota from session budgets and rate limits', () => {
  const result = codexQuota(
    {
      primary: {
        usedPercent: 100,
        windowDurationMins: 300,
        resetsAt: 2000000000,
      },
      secondary: { usedPercent: 100, windowDurationMins: 10080 },
    },
    true,
  );
  expect(result?.windows).toHaveLength(2);
  expect(result?.windows[1]).toMatchObject({
    window: '10080m',
    resetsAt: null,
    exhausted: true,
  });
  expect(codexQuota(undefined, true)?.windows[0]).toMatchObject({
    resetsAt: null,
    scope: 'tool',
    exhausted: true,
  });
  expect(
    classifyCodexFailure({
      codexErrorInfo: { usageLimitExceeded: { httpStatusCode: 429 } },
    }).reason,
  ).toBe('toolQuota');
  expect(
    classifyCodexFailure({ codexErrorInfo: 'rateLimitExceeded' }).reason,
  ).toBe('toolRateLimit');
});
