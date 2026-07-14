/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NormalizedAgentEvent } from '../../providerEvents';
import { detectClaudeCodeSessionId, normalizeClaudeCodeEvent } from '../claudeCode';
import { detectCodexSessionId, normalizeCodexEvent } from '../codex';
import { detectOpenCodeSessionId, normalizeOpenCodeEvent } from '../opencode';
import { PROVIDER_LOG_FIXTURES } from '../../../../test-fixtures/providerLogNormalizers';

const NORMALIZERS = {
  codex: normalizeCodexEvent,
  opencode: normalizeOpenCodeEvent,
  'claude-code': normalizeClaudeCodeEvent,
};
const SESSION_DETECTORS = {
  codex: detectCodexSessionId,
  opencode: detectOpenCodeSessionId,
  'claude-code': detectClaudeCodeSessionId,
};

function normalizeLines(provider: keyof typeof NORMALIZERS, lines: string[]) {
  return lines.flatMap((rawLine) => NORMALIZERS[provider]({ rawLine }));
}

function expectEventType(events: NormalizedAgentEvent[], eventType: string) {
  expect(events.some((event) => event.eventType === eventType)).toBe(true);
}

describe.each(PROVIDER_LOG_FIXTURES)('$provider provider log normalizer fixture matrix', (fixture) => {
  it('detects the provider session', () => {
    expect(SESSION_DETECTORS[fixture.provider]({ rawLine: fixture.session })).toBe(fixture.sessionId);
  });

  it('normalizes reasoning, message, tool, usage, and artifact-reference events', () => {
    const reasoning = normalizeLines(fixture.provider, [fixture.reasoning]);
    const message = normalizeLines(fixture.provider, [fixture.message]);
    const tool = normalizeLines(fixture.provider, [fixture.tool]);
    const usage = normalizeLines(fixture.provider, [fixture.usage]);

    expectEventType(reasoning, 'agent.reasoning');
    expectEventType(message, 'agent.message');
    expect(tool.some((event) => event.eventType.startsWith('agent.tool.'))).toBe(true);
    expect(JSON.stringify(tool)).toContain(fixture.artifactReference);
    expect(JSON.stringify(usage)).toMatch(/usage|tokens/);
  });

  it('ignores malformed input', () => {
    expect(normalizeLines(fixture.provider, [fixture.malformed])).toEqual([]);
  });

  it('is deterministic for duplicates and multiple batches', () => {
    const lines = [fixture.message, fixture.tool, fixture.usage];
    const singleBatch = normalizeLines(fixture.provider, lines);
    const duplicateBatch = normalizeLines(fixture.provider, [...lines, ...lines]);
    const multipleBatches = [lines.slice(0, 1), lines.slice(1)].flatMap((batch) =>
      normalizeLines(fixture.provider, batch),
    );

    expect(duplicateBatch).toEqual([...singleBatch, ...singleBatch]);
    expect(multipleBatches).toEqual(singleBatch);
  });
});
