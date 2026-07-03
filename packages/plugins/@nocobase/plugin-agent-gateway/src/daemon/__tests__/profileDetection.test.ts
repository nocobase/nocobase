/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { detectAgentProfiles } from '../profileDetection';

describe('agent gateway daemon profile detection', () => {
  it('reports opencode, codex, and claude-code without exposing raw execution config', async () => {
    const profiles = await detectAgentProfiles({
      probeCommand: async (candidates) => {
        if (candidates.includes('opencode')) {
          return {
            available: true,
            command: 'opencode',
            version: 'opencode 1.2.3',
            authStatus: 'ok',
          };
        }
        return {
          available: false,
          command: candidates[0],
          error: 'not installed',
        };
      },
    });

    expect(profiles.map((profile) => profile.profileKey)).toEqual(['opencode', 'codex', 'claude-code']);
    expect(profiles.find((profile) => profile.profileKey === 'opencode')).toMatchObject({
      provider: 'opencode',
      status: 'active',
      driver: 'exec',
      capabilities: {
        commandKey: 'opencode',
        detectedCommand: 'opencode',
        version: 'opencode 1.2.3',
        structuredEvents: true,
        terminalOutput: true,
        resumeSession: false,
        artifacts: true,
      },
    });
    expect(profiles.find((profile) => profile.profileKey === 'codex')?.status).toBe('missing');
    expect(profiles.find((profile) => profile.profileKey === 'claude-code')?.status).toBe('missing');
    expect(JSON.stringify(profiles)).not.toContain('commandPath');
    expect(JSON.stringify(profiles)).not.toContain('"cwd"');
    expect(JSON.stringify(profiles)).not.toContain('"env"');
  });
});
