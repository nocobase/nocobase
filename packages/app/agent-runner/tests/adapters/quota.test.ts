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
it('keeps a cached Codex reset on 99% or missing usage, preferring the structured failure reset', () => {
  for (const usedPercent of [99, undefined]) {
    const snapshot = {
      primary: { usedPercent, windowDurationMins: 300, resetsAt: 2000000000 },
      secondary: {
        usedPercent: usedPercent === undefined ? undefined : 20,
        windowDurationMins: 10080,
        resetsAt: 2100000000,
      },
    };
    expect(
      codexQuota(snapshot, true)?.windows.find((window) => window.exhausted),
    ).toMatchObject({ window: '300m', resetsAt: '2033-05-18T03:33:20.000Z' });
    expect(
      codexQuota(snapshot, true, {
        usageLimitExceeded: { resetsAt: 2200000000 },
      })?.windows.find((window) => window.exhausted),
    ).toMatchObject({ resetsAt: '2039-09-18T23:06:40.000Z' });
  }
});
it('keeps Claude weekly rejection when the default model was not reported', () => {
  expect(
    claudeQuota({
      status: 'rejected',
      rateLimitType: 'seven_day_opus',
      resetsAt: 2000000000,
    })?.windows[0],
  ).toMatchObject({
    scope: 'tool',
    target: '',
    exhausted: true,
    resetsAt: '2033-05-18T03:33:20.000Z',
  });
});

it('preserves all reported Claude windows and fills a missing top-level percentage from unifiedWindows', () => {
  const info = {
    status: 'allowed_warning',
    rateLimitType: 'seven_day',
    utilization: 0.76,
    resetsAt: 1794376800,
    overageStatus: 'rejected',
    unifiedWindows: {
      five_hour: { utilization: 0.14, resetsAt: 1794375000 },
      seven_day: { utilization: 0.76, resetsAt: 1794376800 },
    },
  };
  const report = claudeQuota(info);
  expect(report?.windows).toHaveLength(2);
  expect(report?.windows[0]).toMatchObject({
    window: 'five_hour',
    usedPercent: expect.closeTo(14),
    exhausted: false,
    resetsAt: '2026-11-11T05:30:00.000Z',
  });
  expect(report?.windows[1]).toMatchObject({
    window: 'seven_day',
    usedPercent: 76,
    exhausted: false,
  });
  expect(
    claudeQuota({ ...info, utilization: undefined })?.windows[1].usedPercent,
  ).toBe(76);
});
it('scopes model windows and rejection to the relevant Claude window, ignoring malformed snapshots', () => {
  const report = claudeQuota(
    {
      status: 'rejected',
      rateLimitType: 'five_hour',
      unifiedWindows: {
        five_hour: { utilization: 1 },
        seven_day: { utilization: 0.4 },
        seven_day_opus: { utilization: 0.5 },
        seven_day_sonnet: { utilization: 0.2 },
        garbage: { utilization: 0.8 },
        overage: null,
      },
    },
    'claude-opus-4-6',
  );
  expect(report?.windows).toHaveLength(3);
  expect(report?.windows.find((w) => w.window === 'five_hour')?.exhausted).toBe(
    true,
  );
  expect(report?.windows.find((w) => w.window === 'seven_day')?.exhausted).toBe(
    false,
  );
  expect(
    report?.windows.find((w) => w.window === 'seven_day_opus'),
  ).toMatchObject({ scope: 'model', target: 'claude-opus-4-6' });
  expect(
    claudeQuota({ unifiedWindows: { five_hour: { utilization: NaN } } })
      ?.windows[0].usedPercent,
  ).toBeUndefined();
});
