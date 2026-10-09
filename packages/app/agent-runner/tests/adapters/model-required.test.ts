import { describe, expect, it, vi } from 'vitest';
import { ClaudeAdapter } from '../../src/agent/adapters/claude.ts';
import { CodexAdapter } from '../../src/agent/adapters/codex.ts';
import { OpencodeAdapter } from '../../src/agent/adapters/opencode.ts';
import { PiAdapter } from '../../src/agent/adapters/pi.ts';
import type {
  AgentAdapter,
  AdapterSession,
} from '../../src/agent/adapters/types.ts';

const adapters: AgentAdapter[] = [
  new ClaudeAdapter(),
  new CodexAdapter(),
  new OpencodeAdapter(),
  new PiAdapter(),
];
describe('missing execution models', () => {
  for (const adapter of adapters) {
    it.each([undefined, '', '   '])(
      `${adapter.kind} refuses %s before detection or session resume`,
      async (model) => {
        const detect = vi.spyOn(adapter, 'detect');
        const session: AdapterSession = {
          model,
          workDir: '/work',
          prompt: 'Do work',
          systemPrompt: '',
          env: {},
          permission: async () => 'allow',
          abort: new AbortController().signal,
          resumeSessionId: 'existing-session',
        };
        const handle = adapter.start(session);
        const result = await handle.result;
        expect(result).toMatchObject({
          exit: 'error',
          usage: [],
          error: {
            reason: 'modelUnavailable',
            message: expect.stringContaining('explicit execution model'),
          },
        });
        const events = [];
        for await (const event of handle.events) events.push(event);
        expect(events).toMatchObject([
          { type: 'error', meta: { reason: 'modelUnavailable' } },
        ]);
        expect(await handle.steer('more')).toBe(false);
        await handle.stop();
        expect(detect).not.toHaveBeenCalled();
        detect.mockRestore();
      },
    );
  }
});
