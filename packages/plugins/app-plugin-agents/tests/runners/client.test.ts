import { AGENT_TOOLS } from '@nocobase/agent-protocol';
import { describe, expect, it } from 'vitest';

import {
  guessSystem,
  cliInstallCommand,
  installCommand,
  registerCommand,
  upgradeCommand,
} from '../../client/lib/install.js';
import runtimesEnUS from '../../client/locales/runtimes.en-US.js';
import runtimesZhCN from '../../client/locales/runtimes.zh-CN.js';
import {
  listedTools,
  reportedModels,
  runnerActivity,
  runnerTakesAgent,
  runsEntry,
  toolState,
  type RunnerSummary,
} from '../../shared/runners.js';

const AT = '2026-10-01T00:00:00.000Z';

function runner(
  id: string,
  overrides: Partial<RunnerSummary> = {},
): RunnerSummary {
  return {
    id,
    name: `runner-${id}`,
    hostname: `${id}.local`,
    os: 'darwin',
    arch: 'arm64',
    version: '0.1.0',
    protocolVersion: 3,
    features: ['input'],
    tools: [{ kind: 'claude', version: '2.1.0', authenticated: true }],
    enabledTools: null,
    trust: 'ownerOnly',
    ownerUserId: 'u1',
    ownerName: 'Alice',
    status: 'online',
    slots: 1,
    acceptJobs: false,
    policy: null,
    lastSeenAt: AT,
    createdAt: AT,
    updatedAt: AT,
    activeRuns: 0,
    activeJobs: 0,
    canManage: false,
    canChangeTrust: false,
    updateVersion: null,
    requiredProtocol: { min: 3, max: 4 },
    ...overrides,
  };
}

describe('install commands', () => {
  it('carry the server and the one-time token in one line', () => {
    expect(
      installCommand('macos', 'https://acme.example.com/', 'fgreg_abc'),
    ).toBe(
      'curl -fsSL https://acme.example.com/api/agents/dist/installScript | sh -s -- --runner --server https://acme.example.com --token fgreg_abc',
    );
    expect(cliInstallCommand('https://acme.example.com/', 'fgdl_abc')).toBe(
      'curl -fsSL https://acme.example.com/api/agents/dist/installScript | sh -s -- --token fgdl_abc',
    );
    expect(
      installCommand('linux', 'http://localhost:3000/main', 't'),
    ).toContain('http://localhost:3000/main/api/agents/dist/installScript');
    expect(installCommand('windows', 'https://x', 't')).toBeNull();
    expect(registerCommand('https://x', 't')).toBe(
      'nocobase-runner register --server https://x --token t && nocobase-runner service install',
    );
  });

  it('come with the note that the host needs Node.js 24 or newer', () => {
    expect(runtimesEnUS.connect.nodeRequired).toContain('Node.js 24 or newer');
    expect(runtimesZhCN.connect.nodeRequired).toContain('Node.js 24');
    expect(runtimesEnUS.connect.run).not.toContain('no Node.js needed');
    expect(runtimesZhCN.connect.run).not.toContain('无需 Node.js');
  });

  it('update nocobase-runner, and reinstall anything else', () => {
    expect(upgradeCommand('nocobase-runner')).toBe('nocobase-runner update');
    expect(upgradeCommand('acme')).toBeNull();
    expect(upgradeCommand(null)).toBeNull();
  });

  it('quotes what the shell would split', () => {
    expect(registerCommand('https://x', "a b'c")).toContain(
      `--token 'a b'"'"'c'`,
    );
  });

  it('opens on the browser’s system', () => {
    expect(guessSystem('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(
      'macos',
    );
    expect(guessSystem('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(
      'windows',
    );
    expect(guessSystem('Mozilla/5.0 (X11; Linux x86_64)')).toBe('linux');
  });
});

describe('a runner at a glance', () => {
  it('lists exactly the tools a runner reported, whatever is enabled', () => {
    const tools = [
      { kind: 'claude' as const, authenticated: true },
      { kind: 'codex' as const, authenticated: false },
    ];
    // Turning claude off from "every tool" stores every other protocol tool.
    const enabledTools = AGENT_TOOLS.filter((tool) => tool !== 'claude');
    const off = runner('r1', { tools, enabledTools });
    expect(listedTools(off)).toEqual(['claude', 'codex']);
    expect(toolState(off, 'claude')).toBe('off');
    expect(toolState(off, 'codex')).toBe('signedOut');
    expect(listedTools(runner('r2', { tools, enabledTools: ['pi'] }))).toEqual([
      'claude',
      'codex',
    ]);
    expect(
      listedTools(runner('r3', { tools: [], enabledTools: null })),
    ).toEqual([]);
  });

  it('says the tool state of each tool', () => {
    const both = [
      { kind: 'claude' as const, authenticated: true },
      { kind: 'codex' as const, authenticated: true },
    ];
    const one = runner('r1', { tools: both, enabledTools: ['codex'] });
    expect(toolState(one, 'claude')).toBe('off');
    expect(toolState(one, 'codex')).toBe('signedIn');
    expect(toolState(runner('r4', { enabledTools: ['pi'] }), 'pi')).toBe(
      'notInstalled',
    );
  });

  it('is busy while every slot is taken', () => {
    expect(runnerActivity(runner('r1', { draining: 'updatePending' }))).toBe(
      'updatePending',
    );
    expect(runnerActivity(runner('r1', { draining: 'pruning' }))).toBe(
      'pruning',
    );
    expect(runnerActivity(runner('r1'))).toBe('online');
    expect(runnerActivity(runner('r1', { activeJobs: 1 }))).toBe('busy');
    expect(
      runnerActivity(runner('r1', { slots: 2, activeRuns: 1, activeJobs: 1 })),
    ).toBe('busy');
    expect(
      runnerActivity(runner('r1', { status: 'offline', activeRuns: 1 })),
    ).toBe('offline');
  });

  it('shows low disk capacity before slot availability without changing offline state', () => {
    const low = runner('r1', {
      activeRuns: 1,
      workspaceUsage: {
        disk: { freeBytes: 1, totalBytes: 100, minFreeBytes: 20 },
        count: 0,
        unpushedCount: 0,
        measuredAt: null,
        workspaces: [],
      },
    });
    expect(runnerActivity(runner('r1', { draining: 'diskLow' }))).toBe(
      'low_disk',
    );
    expect(runnerActivity(low)).toBe('low_disk');
    expect(runnerActivity({ ...low, status: 'offline' })).toBe('offline');
    expect(runnerActivity({ ...low, workspaceUsage: null })).toBe('busy');
  });

  it('takes an agent its tool and model, and its owner’s policy, allow', () => {
    const coder = {
      id: 'a1',
      name: 'Coder',
      modelEntries: [{ tool: 'claude' as const, model: null }],
    };
    expect(runnerTakesAgent(runner('r1'), coder, Date.now())).toBe(true);
    expect(
      runnerTakesAgent(
        runner('r1'),
        {
          ...coder,
          modelEntries: [{ tool: 'codex', model: null }],
        },
        Date.now(),
      ),
    ).toBe(false);
    // Any of its tools will do; an entry naming a model needs the runner to report it.
    expect(
      runnerTakesAgent(
        runner('r1'),
        {
          ...coder,
          modelEntries: [
            { tool: 'codex', model: null },
            { tool: 'claude', model: 'opus' },
          ],
        },
        Date.now(),
      ),
    ).toBe(false);
    const reporting = runner('r1', {
      tools: [
        {
          kind: 'claude',
          authenticated: true,
          models: [{ id: 'claude-opus-5-5-20261001' }],
        },
      ],
    });
    expect(
      runnerTakesAgent(
        reporting,
        {
          ...coder,
          modelEntries: [{ tool: 'claude', model: 'opus' }],
        },
        Date.now(),
      ),
    ).toBe(true);
    // A run that failed `modelUnavailable` there keeps it off that runner until it reports the tool's models anew.
    const marked = {
      ...reporting,
      unavailableModels: [
        {
          tool: 'claude' as const,
          model: 'claude-opus-5-5',
          at: '2026-10-01T00:00:00.000Z',
          reported: ['claude-opus-5-5'],
        },
      ],
    };
    expect(
      runnerTakesAgent(
        marked,
        {
          ...coder,
          modelEntries: [{ tool: 'claude', model: 'claude-opus-5-5' }],
        },
        Date.now(),
      ),
    ).toBe(false);
    expect(runsEntry(marked, { tool: 'claude', model: null }, Date.now())).toBe(
      true,
    );
    expect(reportedModels(reporting, 'claude')).toEqual(['claude-opus-5-5']);
    expect(
      runnerTakesAgent(
        runner('r1', { policy: { agents: ['Rev*'] } }),
        coder,
        Date.now(),
      ),
    ).toBe(false);
    expect(
      runnerTakesAgent(
        runner('r1', { policy: { agents: ['Cod*'] } }),
        coder,
        Date.now(),
      ),
    ).toBe(true);
  });
});
