import { describe, expect, it, vi } from 'vitest';
import { OnlineAgentConfigurator } from '../server/online/agent/configuration.js';
import { sandboxLimits } from '../server/online/sandbox/limits.js';
import { registerSandboxTools } from '../server/online/sandbox/tools.js';

describe('Sandbox tool descriptions', () => {
  it('retains the legacy guidance without claiming an independent scratch limit or an always-present CLI', () => {
    const configurator = new OnlineAgentConfigurator();
    const register = vi.spyOn(configurator, 'registerTool');
    registerSandboxTools(configurator);

    const definitions = new Map(
      register.mock.calls.map(([name, options]) => [name, options.definition]),
    );
    expect(definitions.get('skill')).toMatchObject({
      description:
        'Read one of your skills: its SKILL.md and the list of its files, which you read with the bash tool. Read a skill when its description matches what you are doing, and follow it.',
    });
    expect(definitions.get('bash')).toMatchObject({
      description: [
        'Run a shell command in your sandbox (bash syntax; ls, cat, grep, find, sed, awk, jq and the like).',
        'When configured, reach the application with its command line (named in the sandbox instructions); use --help to discover current commands.',
        'Your selected skills are at /skills/<name>/, read-only.',
        `Write scratch files under /tmp only. No network; nothing is installed or run for real, so a skill's scripts cannot be executed. Each command stops after ${sandboxLimits.durationMs / 1000} seconds.`,
      ].join(' '),
    });
  });
});
