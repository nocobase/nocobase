import { describe, expect, it } from 'vitest';
import {
  diagnosticsDates,
  DiagnosticsRequestSchema,
  HeartbeatResponseSchema,
  RUNNER_FEATURES,
} from '../src/index.js';

describe('诊断协议日期交集', () => {
  it('按当地日期转换的 UTC 区间涵盖首尾文件，结束日零点不多选一天', () => {
    expect(
      diagnosticsDates({
        since: '2026-11-01T00:00:00-04:00',
        until: '2026-11-02T00:00:00-05:00',
      }),
    ).toEqual(['2026-11-01', '2026-11-02']);
    expect(
      diagnosticsDates({
        since: '2026-11-01T00:00:00Z',
        until: '2026-11-02T00:00:00Z',
      }),
    ).toEqual(['2026-11-01']);
    expect(
      diagnosticsDates({
        since: '2026-11-01T00:00:00+08:00',
        until: '2026-11-02T00:00:00+08:00',
      }),
    ).toEqual(['2026-10-31', '2026-11-01']);
  });
  it('旧心跳仍有效，新请求拒绝过长日期、任意路径和过大预算', () => {
    expect(
      HeartbeatResponseSchema.parse({
        ok: true,
        serverTime: '',
        cancelRequested: [],
        release: [],
      }).diagnostics,
    ).toBeUndefined();
    expect(RUNNER_FEATURES).toContain('diagnostics');
    const base = {
      requestId: '7e53ca48-1bd0-4343-b027-b5d81bdb7d43',
      window: {
        since: '2026-11-01T00:00:00Z',
        until: '2026-11-02T00:00:00Z',
        runIds: [],
      },
      maxBytes: 131072,
      expiresAt: '2026-11-02T00:00:00Z',
    };
    expect(DiagnosticsRequestSchema.safeParse(base).success).toBe(true);
    for (const value of [
      { ...base, maxBytes: 21 * 1024 ** 2 },
      { ...base, window: { ...base.window, runIds: ['../secret'] } },
      { ...base, window: { ...base.window, until: '2026-11-20T00:00:00Z' } },
    ])
      expect(DiagnosticsRequestSchema.safeParse(value).success).toBe(false);
  });
});
