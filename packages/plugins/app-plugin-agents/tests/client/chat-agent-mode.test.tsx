// @vitest-environment jsdom
/**
 * The panel's two kinds of agent and the agent last used, as a chat UI reads them from the headless entry.
 */
import { act, renderHook } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatAgent } from '../../shared/conversations.js';
import { clientMocks, resetApi } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const chat = await import('../../client/chat.js');

function agent(id: string, extra: Partial<ChatAgent> = {}): ChatAgent {
  return {
    id,
    name: `Agent ${id}`,
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    isSystemDefault: false,
    isMyDefault: false,
    availability: { online: true, reason: null, onlineRunners: 1 },
    personalOnly: false,
    runnerNames: [],
    ...extra,
  };
}

const ONLINE = agent('online', { isSystemDefault: true });
const CODER = agent('coder');
const WRITER = agent('writer', { isMyDefault: true });

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  resetApi({});
});

describe('agent modes', () => {
  it('offers only the modes the catalog has', () => {
    expect(chat.configuredChatModes(undefined)).toEqual([]);
    expect(chat.configuredChatModes([ONLINE])).toEqual(['online']);
    expect(chat.configuredChatModes([CODER])).toEqual(['runner']);
    expect(chat.configuredChatModes([CODER, ONLINE])).toEqual([
      'online',
      'runner',
    ]);
    expect(chat.agentsOfMode([ONLINE, CODER, WRITER], 'runner')).toEqual([
      CODER,
      WRITER,
    ]);
  });

  it('follows the open conversation, then the choice, then the agent a new conversation goes to', () => {
    const agents = [ONLINE, CODER, WRITER];
    expect(
      chat.resolveChatAgentMode({
        agents,
        chosen: 'online',
        conversationAgent: { id: 'coder' },
      }),
    ).toBe('runner');
    expect(chat.resolveChatAgentMode({ agents, chosen: 'online' })).toBe(
      'online',
    );
    expect(chat.resolveChatAgentMode({ agents, newAgentId: 'coder' })).toBe(
      'runner',
    );
    expect(
      chat.resolveChatAgentMode({
        agents: [ONLINE, CODER],
        lastAgentId: 'coder',
      }),
    ).toBe('runner');
    // The person's default before the system default.
    expect(chat.resolveChatAgentMode({ agents })).toBe('runner');
    expect(chat.resolveChatAgentMode({ agents: [ONLINE, CODER] })).toBe(
      'online',
    );
    // A choice of a mode that is not configured is ignored.
    expect(
      chat.resolveChatAgentMode({ agents: [CODER], chosen: 'online' }),
    ).toBe('runner');
    expect(chat.resolveChatAgentMode({ agents: undefined })).toBeNull();
  });

  it('starts a new conversation with the agent last used, before the defaults', () => {
    const agents = [ONLINE, CODER, WRITER];
    expect(chat.newConversationAgent(agents, null)?.id).toBe('writer');
    expect(chat.newConversationAgent(agents, null, 'coder')?.id).toBe('coder');
    expect(chat.newConversationAgent(agents, 'online', 'coder')?.id).toBe(
      'online',
    );
    expect(chat.newConversationAgent(agents, null, 'gone')?.id).toBe('writer');
  });

  it('keeps the agent last used per scope, and survives storage that throws', () => {
    chat.rememberLastAgent('/main/:alice', 'coder');
    expect(chat.readLastAgent('/main/:alice')).toBe('coder');
    expect(chat.readLastAgent('/main/:bob')).toBeNull();
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(chat.readLastAgent('/main/:alice', broken)).toBeNull();
    expect(() =>
      chat.rememberLastAgent('/main/:alice', 'coder', broken),
    ).not.toThrow();
  });
});

function wrapper(scope: string) {
  return function Wrapper({
    children,
  }: {
    readonly children?: ReactNode;
  }): ReactElement {
    return (
      <MemoryRouter initialEntries={['/issues']}>
        <chat.ChatProvider memoryScope={scope}>{children}</chat.ChatProvider>
      </MemoryRouter>
    );
  };
}

describe('ChatProvider agent memory', () => {
  it('remembers the agent last used for the person, and the mode switched to', () => {
    const first = renderHook(() => chat.useChatPanel(), {
      wrapper: wrapper('alice'),
    });
    expect(first.result.current.lastAgentId).toBeNull();
    act(() => first.result.current.rememberAgent?.('coder'));
    expect(first.result.current.lastAgentId).toBe('coder');
    act(() => first.result.current.setAgentMode?.('online'));
    expect(first.result.current.agentMode).toBe('online');
    // An agent asked for decides the mode again.
    act(() => first.result.current.openChat({ agentId: 'coder' }));
    expect(first.result.current.agentMode).toBeNull();
    first.unmount();

    const again = renderHook(() => chat.useChatPanel(), {
      wrapper: wrapper('alice'),
    });
    expect(again.result.current.lastAgentId).toBe('coder');
    again.unmount();
    const other = renderHook(() => chat.useChatPanel(), {
      wrapper: wrapper('bob'),
    });
    expect(other.result.current.lastAgentId).toBeNull();
  });
});
