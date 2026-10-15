// @vitest-environment node
import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';
import { describe, expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.ts';
import zhCN from '../../client/locales/zh-CN.ts';
import {
  agentBlocker,
  agentSetupPrompt,
  chosenAgent,
  cliInstallLine,
  defaultAgent,
  messageOf,
} from '../../client/pages/home/model.ts';

function agent(id: string, extra: Partial<ChatAgent> = {}): ChatAgent {
  return {
    id,
    name: id,
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    personalOnly: false,
    isSystemDefault: false,
    isMyDefault: false,
    availability: { online: true, reason: null, onlineRunners: 1 },
    ...extra,
  };
}

const offline = (reason: 'noRunner' | 'agentArchived' | 'forbidden') => ({
  availability: { online: false, reason, onlineRunners: 0 },
});

describe('home composer', () => {
  it("starts with the person's default, then the team's, then one that can answer", () => {
    const agents = [
      agent('a', offline('noRunner')),
      agent('b'),
      agent('team', { isSystemDefault: true }),
      agent('mine', { isMyDefault: true }),
    ];
    expect(defaultAgent(agents)?.id).toBe('mine');
    expect(defaultAgent(agents.filter((item) => !item.isMyDefault))?.id).toBe(
      'team',
    );
    expect(
      defaultAgent([agent('a', offline('noRunner')), agent('b')])?.id,
    ).toBe('b');
    expect(defaultAgent([agent('a', offline('noRunner'))])?.id).toBe('a');
    expect(defaultAgent([])).toBeNull();
  });

  it('keeps the agent picked while it is listed', () => {
    const agents = [agent('pm', { isSystemDefault: true }), agent('coder')];
    expect(chosenAgent(agents, 'coder')?.id).toBe('coder');
    expect(chosenAgent(agents, 'gone')?.id).toBe('pm');
    expect(chosenAgent(agents, null)?.id).toBe('pm');
  });

  it('says why the chosen agent cannot be written to', () => {
    expect(agentBlocker(agent('pm'))).toBeNull();
    // No runner online: the message waits for one.
    expect(agentBlocker(agent('coder', offline('noRunner')))).toBeNull();
    expect(agentBlocker(agent('old', offline('agentArchived')))).toBe(
      'unavailable',
    );
    expect(agentBlocker(agent('theirs', offline('forbidden')))).toBe(
      'unavailable',
    );
    expect(agentBlocker(null)).toBe('noAgent');
  });

  it('sends trimmed text and nothing blank', () => {
    expect(messageOf('  hi \n')).toBe('hi');
    expect(messageOf(' \n ')).toBeNull();
  });
});

describe('the agent setup prompt', () => {
  for (const locale of [enUS, zhCN]) {
    it(`shares the common instructions and appends computer setup in ${locale === enUS ? 'English' : 'Chinese'}`, () => {
      const t = (key: string, options: Record<string, unknown>) => {
        const template = key.endsWith('.computerPrompt')
          ? locale.home.agentSetup.computerPrompt
          : locale.home.agentSetup.prompt;
        return template.replace(/\{\{(\w+)\}\}/gu, (_, name: string) =>
          String(options[name]),
        );
      };
      const server = 'https://studio.example.com/app';
      const local = agentSetupPrompt(t, server, 'fgdl_abc');
      const computer = agentSetupPrompt(t, server, 'fgdl_abc', {
        purpose: 'computer',
      });
      expect(computer.startsWith(`${local}\n`)).toBe(true);
      expect(local).toContain(cliInstallLine(server, 'fgdl_abc'));
      for (const command of [
        'node --version',
        `nb-studio login --server ${server}`,
        'nb-studio whoami',
        'nb-studio docs',
        'nb-studio skills install',
      ]) {
        expect(local).toContain(command);
      }
      expect(local).not.toContain('acp');
      expect(computer).toContain('nb-studio acp service install');
      expect(computer).toContain('nb-studio acp start');
      expect(computer).not.toMatch(/npm install -g|api key/iu);
      expect(computer).not.toContain('{{');
    });
  }
});
