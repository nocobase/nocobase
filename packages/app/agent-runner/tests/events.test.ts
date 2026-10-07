import { readFileSync, statSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiClient } from '../src/lib/http.ts';
import { HEADERS } from '../src/protocol/index.ts';
import { EventSpool, spoolPaths } from '../src/core/events.ts';
import { FakeServer, waitFor } from './fake-server.ts';
import { removeDir, tempDir } from './helpers.ts';

describe('event spool', () => {
  const server = new FakeServer();
  const runsDir = tempDir('nocobase-runner-spool-');
  let client: ApiClient;

  beforeAll(async () => {
    await server.listen();
    server.registrationTokens.add('t');
    server.runners.set('r1', {
      id: 'r1',
      key: 'k1',
      revoked: false,
      heartbeats: [],
      register: { features: [] } as never,
    });
    client = new ApiClient({
      server: server.url,
      headers: { [HEADERS.runnerKey]: 'k1' },
    });
  });
  afterAll(async () => {
    await server.close();
    removeDir(runsDir);
  });

  const claimed = (): string => {
    const run = server.enqueue();
    run.status = 'running';
    run.runnerId = 'r1';
    return run.payload.run.id;
  };

  it('numbers events from the attempt.s first seq and writes them to a 0600 spool before sending', () => {
    const spool = EventSpool.open({
      runsDir,
      runId: 'local',
      client,
      firstSeq: 1_000_001,
    });
    expect(spool.push({ type: 'text', content: 'a' }).seq).toBe(1_000_001);
    const file = spoolPaths(runsDir, 'local').spool;
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(readFileSync(file, 'utf8')).toContain('"seq":1000001');
  });

  it('truncates content over 64 KB and marks it', () => {
    const spool = EventSpool.open({
      runsDir,
      runId: 'big',
      client,
      firstSeq: 1,
    });
    const event = spool.push({
      type: 'toolResult',
      output: 'x'.repeat(70_000),
    });
    expect(event.output).toHaveLength(64 * 1024);
    expect(event.meta).toEqual({ truncated: true });
  });

  it('sends batches of at most 200 and keeps everything across failures', async () => {
    const runId = claimed();
    const spool = EventSpool.open({
      runsDir,
      runId,
      client,
      firstSeq: 1,
      flushIntervalMs: 20,
    });
    server.eventsDown = true;
    for (let index = 0; index < 450; index += 1)
      spool.push({ type: 'text', content: `e${index}` });
    spool.start();
    await waitFor(() => server.eventsFailures > 0, 5_000, 'a failed send');
    expect(spool.size).toBe(450);
    server.eventsDown = false;
    expect(await spool.drain(10_000)).toBe(true);
    expect(server.events(runId).map((event) => event.seq)).toEqual(
      Array.from({ length: 450 }, (_, i) => i + 1),
    );
    expect(server.run(runId).eventRequests).toBeGreaterThanOrEqual(3);
    spool.stop();
  });

  it('resumes unacknowledged events from disk in a new process', async () => {
    const runId = claimed();
    server.eventsDown = true;
    const first = EventSpool.open({ runsDir, runId, client, firstSeq: 1 });
    first.push({ type: 'text', content: 'one' });
    first.push({ type: 'text', content: 'two' });
    await first.flush();
    server.eventsDown = false;
    const second = EventSpool.open({ runsDir, runId, client, firstSeq: 1 });
    expect(second.size).toBe(2);
    expect(second.push({ type: 'text', content: 'three' }).seq).toBe(3);
    expect(await second.drain(5_000)).toBe(true);
    expect(server.events(runId).map((event) => event.content)).toEqual([
      'one',
      'two',
      'three',
    ]);
    const third = EventSpool.open({ runsDir, runId, client, firstSeq: 1 });
    expect(third.size).toBe(0);
  });

  it('stops on a non-retryable answer and reports it', async () => {
    const runId = claimed();
    server.loseLease(runId);
    let fatal = '';
    const spool = EventSpool.open({
      runsDir,
      runId,
      client,
      firstSeq: 1,
      onFatal: (error) => (fatal = error.reason),
    });
    spool.push({ type: 'text', content: 'x' });
    expect(await spool.drain(2_000)).toBe(false);
    expect(fatal).toBe('LEASE_LOST');
  });
});
