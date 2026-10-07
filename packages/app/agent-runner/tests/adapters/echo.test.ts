import { describe, expect, it } from 'vitest';

import { createEchoAdapter } from '../../src/agent/adapters/echo.ts';
import type { AdapterEvent } from '../../src/agent/adapters/types.ts';

describe('echo adapter', () => {
  it('reports the usage a script gives it, as an event and in the result', async () => {
    const handle = await createEchoAdapter({ kind: 'codex' }).start({
      workDir: '/tmp',
      prompt: 'say hi\nusage gpt-5-codex 1200 300 4000 50',
      systemPrompt: '',
      env: {},
      permission: () => Promise.resolve('allow'),
      abort: new AbortController().signal,
    });
    const events: AdapterEvent[] = [];
    for await (const event of handle.events) events.push(event);
    const result = await handle.result;
    const usage = {
      tool: 'codex',
      model: 'gpt-5-codex',
      inputTokens: 1200,
      outputTokens: 300,
      cacheReadTokens: 4000,
      cacheWriteTokens: 50,
    };
    expect(events.find((event) => event.type === 'usage')).toMatchObject({
      meta: { usage: [usage] },
    });
    expect(result).toMatchObject({ exit: 'completed', usage: [usage] });
  });
});
