import { describe, expect, it } from 'vitest';

import type {
  AgentAdapter,
  ToolDetection,
} from '../src/agent/adapters/types.ts';
import { detectTools } from '../src/core/loop.ts';
import type { AgentTool } from '../src/protocol/index.ts';

function adapter(kind: AgentTool, detection: ToolDetection): AgentAdapter {
  return {
    kind,
    detect: async () => detection,
    features: () => [],
    start: () => {
      throw new Error('not started in these tests');
    },
  };
}

describe('detectTools', () => {
  it('lists a too-old tool with why, never as signed in, and leaves out a missing one', async () => {
    const tools = await detectTools(
      new Map<AgentTool, AgentAdapter>([
        [
          'claude',
          adapter('claude', {
            installed: false,
            version: '2.1.200',
            path: '/usr/local/bin/claude',
            authenticated: true,
            reason: 'versionTooOld',
            minVersion: '2.1.284',
          }),
        ],
        [
          'codex',
          adapter('codex', {
            installed: true,
            version: '1.0.0',
            authenticated: true,
          }),
        ],
        ['pi', adapter('pi', { installed: false, authenticated: false })],
      ]),
    );
    expect(tools).toEqual([
      {
        kind: 'claude',
        authenticated: false,
        reason: 'versionTooOld',
        minVersion: '2.1.284',
        version: '2.1.200',
        path: '/usr/local/bin/claude',
      },
      { kind: 'codex', authenticated: true, version: '1.0.0' },
    ]);
  });
});
