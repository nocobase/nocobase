import path from 'node:path';
import { expect, it } from 'vitest';
import { AGENTS } from '@nocobase/acp-bridge/catalog';
import type { ResolvedAgent } from '@nocobase/acp-bridge/client';
import { identifyProgram } from '../../src/agent/adapters/acp.ts';

const gooseSpec = AGENTS.find((agent) => agent.id === 'goose')!;

/** `resolved.command` is run directly (the fixture's shebang executes it under Node), `identify.args` appended. */
const resolvedFixture = (name: string, spec = gooseSpec): ResolvedAgent => ({
  spec,
  command: path.resolve(import.meta.dirname, `../fixtures/${name}.mjs`),
  args: [],
});

const env = { PATH: process.env.PATH ?? '' };

it('rejects the unrelated pressly/goose migration tool found under the same name', async () => {
  const ok = await identifyProgram(
    resolvedFixture('pressly-goose-like'),
    gooseSpec,
    env,
    new AbortController().signal,
  );
  expect(ok).toBe(false);
});

it('accepts a program that answers --help like the real agent', async () => {
  const ok = await identifyProgram(
    resolvedFixture('goose-agent-like'),
    gooseSpec,
    env,
    new AbortController().signal,
  );
  expect(ok).toBe(true);
});

it('accepts an agent whose spec declares no identify check at all', async () => {
  const spec = AGENTS.find((agent) => agent.id === 'amp')!;
  expect(spec.identify).toBeUndefined();
  const ok = await identifyProgram(
    resolvedFixture('pressly-goose-like', spec),
    spec,
    env,
    new AbortController().signal,
  );
  expect(ok).toBe(true);
});
