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

function agent(
  id: string,
  type: 'online' | 'runner',
  extra: Partial<ChatAgent> = {},
): ChatAgent {
  return {
    id,
    name: id,
    description: null,
    avatar: null,
    type,
    models: [],
    personal: false,
    isSystemDefault: false,
    isMyDefault: false,
    availability: { online: true, reason: null, onlineRunners: 1 },
    ...extra,
  };
}

const offline = {
  availability: {
    online: false,
    reason: 'modelUnavailable' as const,
    onlineRunners: 0,
  },
};

describe('home composer', () => {
  it("starts with the person's default, then the team's, then one that can answer, online first", () => {
    const agents = [
      agent('a-chat', 'online', offline),
      agent('b-chat', 'online'),
      agent('team-chat', 'online', { isSystemDefault: true }),
      agent('coder', 'runner'),
      agent('my-coder', 'runner', { isMyDefault: true }),
    ];
    expect(defaultAgent(agents)?.id).toBe('my-coder');
    expect(defaultAgent(agents.filter((item) => !item.isMyDefault))?.id).toBe(
      'team-chat',
    );
    // Without defaults, the first online agent that can answer, before one that cannot or a runner agent.
    expect(
      defaultAgent([
        agent('coder', 'runner'),
        agent('a-chat', 'online', offline),
        agent('b-chat', 'online'),
      ])?.id,
    ).toBe('b-chat');
    expect(
      defaultAgent([agent('a-chat', 'online', offline), agent('c', 'runner')])
        ?.id,
    ).toBe('c');
    expect(defaultAgent([])).toBeNull();
  });

  it('keeps the agent picked while it is listed', () => {
    const agents = [
      agent('pm', 'online', { isSystemDefault: true }),
      agent('coder', 'runner'),
    ];
    expect(chosenAgent(agents, 'coder')?.id).toBe('coder');
    expect(chosenAgent(agents, 'gone')?.id).toBe('pm');
    expect(chosenAgent(agents, null)?.id).toBe('pm');
  });

  it('says why the chosen agent cannot be written to', () => {
    expect(agentBlocker(agent('pm', 'online'), true)).toBeNull();
    expect(agentBlocker(agent('coder', 'runner'), false)).toBeNull();
    // No model service offers a model: an online agent needs an administrator.
    expect(agentBlocker(agent('pm', 'online'), false)).toBe('noModel');
    expect(agentBlocker(agent('pm', 'online', offline), true)).toBe('noModel');
    // A runner agent with no runner online still takes the message, which waits for one.
    expect(
      agentBlocker(
        agent('coder', 'runner', {
          availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
        }),
        true,
      ),
    ).toBeNull();
    expect(agentBlocker(null, true)).toBe('noAgent');
    // Before anything is set up, a model service comes first.
    expect(agentBlocker(null, false)).toBe('noModel');
  });

  it('sends trimmed text and nothing blank', () => {
    expect(messageOf('  hi \n')).toBe('hi');
    expect(messageOf(' \n ')).toBeNull();
  });
});

describe('the agent setup prompt', () => {
  /** A `t` that fills `{{name}}` from the options, as i18next does without escaping. */
  const translator =
    (prompt: string) => (_key: string, options: Record<string, unknown>) =>
      prompt.replace(/\{\{(\w+)\}\}/gu, (_, name: string) =>
        String(options[name]),
      );

  it('installs the CLI with the token, signs in to the server and points at nb-studio docs', () => {
    const server = 'https://studio.example.com/app';
    expect(cliInstallLine(server, 'fgdl_abc')).toBe(
      'curl -fsSL https://studio.example.com/app/api/agents/dist/installScript | sh -s -- --token fgdl_abc',
    );
    const zh = agentSetupPrompt(
      translator(zhCN.home.agentSetup.prompt),
      server,
      'fgdl_abc',
    );
    expect(zh).toBe(
      [
        '请帮我安装并配置 NocoBase Studio CLI，用来管理 NocoBase Studio（https://studio.example.com/app）的项目和任务：',
        '1. `nb-studio` 需要 Node.js 24 或更高版本及 npm：先用 `node --version` 检查，缺少或版本过低时先征得我同意再安装；然后运行 `curl -fsSL https://studio.example.com/app/api/agents/dist/installScript | sh -s -- --token fgdl_abc` 安装 `nb-studio`；',
        '2. 运行 `nb-studio login --server https://studio.example.com/app`，把它显示的登录地址和验证码告诉我，等待我在浏览器中确认登录；',
        '3. 登录成功后运行 `nb-studio whoami` 确认身份和权限，再运行 `nb-studio docs` 了解可用命令；',
        '4. 之后按我的要求通过 `nb-studio` 操作，不要直接调用 HTTP 接口。',
      ].join('\n'),
    );
    const en = agentSetupPrompt(
      translator(enUS.home.agentSetup.prompt),
      server,
      'fgdl_abc',
    );
    expect(en).toContain('sh -s -- --token fgdl_abc');
    expect(en).toContain(
      'nb-studio login --server https://studio.example.com/app',
    );
    expect(en).toContain('nb-studio docs');
    expect(en).toContain('Node.js 24 or newer with npm');
    expect(en).not.toMatch(/api key/iu);
  });
});
