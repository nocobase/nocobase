/**
 * The home page's composer: the agent it starts with, the one agent picker listing the enabled agents (the team
 * default first, each that cannot answer now with why), what it says when the chosen agent has no runner or cannot be
 * used, sending (a new conversation, opened full screen at `/chat/:id`), and the recent conversations with their modes, which
 * open there too.
 */
import type {
  ChatAgent,
  ConversationSummary,
  MessageAttachment,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  agents: [] as ChatAgent[],
  recent: [] as ConversationSummary[],
};
const start = vi.fn();
const uploads = {
  upload: vi.fn((file: File) =>
    Promise.resolve(attachmentOf(file.name, file.type, file.size)),
  ),
  discard: vi.fn(),
};

function attachmentOf(
  name: string,
  type: string,
  size: number,
): MessageAttachment {
  return {
    id: `a-${name}`,
    filename: name,
    ext: name.split('.').pop() ?? '',
    mimeType: type,
    size,
    contentUrl: `/files/${name}`,
    downloadUrl: `/files/${name}?download=true`,
    previewable: type.startsWith('image/'),
  };
}

/** What `start` is called with for a message with no files. */
const plain = (content: string) => ({ content, attachments: [] });
const minted = vi.fn();

vi.mock('../../client/pages/home/api.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/pages/home/api.js')>()),
  useHomeApi: () => ({
    agents: () => Promise.resolve(state.agents),
    recent: () => Promise.resolve({ items: state.recent, nextCursor: null }),
    downloadToken: () => {
      minted();
      return Promise.resolve({
        token: `fgdl_token${minted.mock.calls.length}`,
        expiresAt: '2026-10-06T00:30:00.000Z',
        maxDownloads: 3,
      });
    },
    start: (agentId: string, input: unknown) => {
      start(agentId, input);
      return Promise.resolve({ conversation: { id: 'c-new' } });
    },
  }),
}));

// Uploads answer at once with the attachment the server would keep.
vi.mock('@nocobase/app-plugin-agents/client/chat', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-agents/client/chat')
  >()),
  useChatAttachments: () => uploads,
}));

vi.mock('../../client/access/api.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/access/api.js')>()),
  useStudioApi: () => ({
    me: () => Promise.resolve({ superuser: false, roles: [{ key: 'member' }] }),
  }),
}));

// Keys as text, whatever default a call gives: a built-in agent's name then reads as its key.
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));

vi.mock('../../client/extensions/nocobase-agent-chat/history-list.js', () => ({
  ChatHistoryDialog: () => null,
}));

function ChatPageStub() {
  return <p>conversation {useParams().conversationId}</p>;
}

const { default: HomePage } = await import('../../client/pages/home/index');
const { homeKeys } = await import('../../client/pages/home/api');
const { ComputerSetup } = await import('../../client/pages/home/agent-setup');

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

function renderHome(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/chat/:conversationId' element={<ChatPageStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

describe('the home page', () => {
  beforeEach(() => {
    state.agents = [agent('Opus', { isSystemDefault: true }), agent('Coder')];
    state.recent = [];
    start.mockReset();
    minted.mockReset();
    uploads.upload.mockClear();
  });

  it('gives a prompt that sets up the nb-studio CLI in a coding agent, with a fresh download token', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderHome();
    await userEvent.click(
      await screen.findByRole('button', { name: 'home.agentSetup.open' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('home.agentSetup.identity');
    expect(dialog).toHaveTextContent('home.agentSetup.expiry');
    const prompt = await screen.findByLabelText('home.agentSetup.promptLabel');
    expect(prompt).toHaveTextContent('home.agentSetup.prompt');
    expect(minted).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByRole('button', { name: 'home.agentSetup.copy' }),
    );
    expect(writeText).toHaveBeenCalledWith(prompt.textContent);
    expect(
      await screen.findByRole('button', { name: 'home.agentSetup.copied' }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'home.agentSetup.regenerate' }),
    );
    await waitFor(() => expect(minted).toHaveBeenCalledTimes(2));
  });

  it('opens computer instructions, copies the appended steps and retries a failed regeneration', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ComputerSetup />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.click(
      screen.getByRole('button', { name: 'home.agentSetup.computerTitle' }),
    );
    const prompt = await screen.findByLabelText('home.agentSetup.promptLabel');
    expect(prompt).toHaveTextContent(
      'home.agentSetup.prompt home.agentSetup.computerPrompt',
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'home.agentSetup.expiry',
    );
    await user.click(
      screen.getByRole('button', { name: 'home.agentSetup.copy' }),
    );
    expect(writeText).toHaveBeenCalledWith(prompt.textContent);
    minted.mockImplementationOnce(() => {
      throw new Error('Download unavailable');
    });
    await user.click(
      screen.getByRole('button', { name: 'home.agentSetup.regenerate' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'home.agentSetup.failed',
    );
    expect(
      screen.getByRole('button', { name: /home.agentSetup.(copy|copied)$/ }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole('button', { name: 'home.agentSetup.regenerate' }),
    );
    await screen.findByLabelText('home.agentSetup.promptLabel');
    expect(minted).toHaveBeenCalledTimes(3);
  });

  it('starts a conversation with the default agent and opens it full screen', async () => {
    renderHome();
    const input = await screen.findByRole('textbox', {
      name: 'home.inputLabel',
    });
    // About three lines to start with, growing with the text.
    expect(input).toHaveClass('min-h-20');
    expect(input).not.toHaveClass('min-h-28');
    // One agent picker in the composer's toolbar, fitted to its width; no model choice.
    const picker = within(screen.getByTestId('chat-composer')).getByTestId(
      'chat-agent-picker',
    );
    expect(picker).toHaveTextContent('Opus');
    expect(picker).toHaveClass('max-w-44', '@md:max-w-64');
    expect(screen.queryByTestId('chat-model')).toBeNull();
    await userEvent.type(input, 'What is blocked?{Enter}');
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith('Opus', plain('What is blocked?')),
    );
    expect(await screen.findByText('conversation c-new')).toBeInTheDocument();
  });

  it("shows a built-in agent's name in the viewer's language", async () => {
    state.agents = [
      agent('Opus', {
        isSystemDefault: true,
        nameText: { key: 'presets.lead.name', ns: 'studio' },
      }),
    ];
    renderHome();
    expect(await screen.findByTestId('chat-agent-picker')).toHaveTextContent(
      'presets.lead.name',
    );
  });

  it('lists the enabled agents, the team default first, with what each is good at and why one cannot be picked', async () => {
    state.agents = [
      agent('Writer', { description: 'Docs and copy' }),
      agent('Opus', { isSystemDefault: true }),
      agent('Kimi', {
        availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
      }),
      agent('Mine', { personalOnly: true }),
    ];
    renderHome();
    await userEvent.click(await screen.findByTestId('chat-agent-picker'));
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.getAttribute('data-agent'))).toEqual([
      'Opus',
      'Writer',
      'Kimi',
      'Mine',
    ]);
    expect(items[1]).toHaveTextContent('Docs and copy');
    expect(items[2]).toHaveAttribute('aria-disabled', 'true');
    expect(items[2]).toHaveTextContent('chat.availability.noRunner');
    expect(items[3]).toHaveTextContent('chat.agents.personal');
    await userEvent.click(items[1]!);
    await userEvent.type(
      screen.getByRole('textbox', { name: 'home.inputLabel' }),
      'Draft the notes{Enter}',
    );
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith('Writer', plain('Draft the notes')),
    );
  });

  it('starts with the person’s own default', async () => {
    state.agents = [
      agent('Opus', { isSystemDefault: true }),
      agent('Coder', { isMyDefault: true }),
    ];
    renderHome();
    expect(await screen.findByTestId('chat-agent-picker')).toHaveTextContent(
      'Coder',
    );
    expect(
      screen.getByRole('textbox', { name: 'home.inputLabel' }),
    ).toHaveAttribute('placeholder', 'home.placeholder');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'home.inputLabel' }),
      'Fix the build{Enter}',
    );
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith('Coder', plain('Fix the build')),
    );
  });

  it('uploads files attached, pasted or dropped on the box and starts the conversation with them', async () => {
    renderHome();
    const input = await screen.findByRole('textbox', {
      name: 'home.inputLabel',
    });
    expect(
      screen.getByRole('button', { name: 'chat.attachments.attach' }),
    ).toBeVisible();
    fireEvent.change(screen.getByTestId('chat-attach-input'), {
      target: {
        files: [new File(['log'], 'build.log', { type: 'text/plain' })],
      },
    });
    fireEvent.paste(input, {
      clipboardData: {
        files: [new File(['png'], 'shot.png', { type: 'image/png' })],
        getData: () => '',
      },
    });
    fireEvent.drop(screen.getByTestId('chat-composer'), {
      dataTransfer: {
        files: [new File(['a'], 'notes.md', { type: 'text/markdown' })],
        types: ['Files'],
      },
    });
    const files = await screen.findByTestId('chat-composer-files');
    expect(within(files).getAllByRole('listitem')).toHaveLength(3);
    await waitFor(() => expect(uploads.upload).toHaveBeenCalledTimes(3));
    await userEvent.type(input, 'Why did it fail?{Enter}');
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith('Opus', {
        content: 'Why did it fail?',
        attachments: [
          expect.objectContaining({ id: 'a-build.log' }),
          expect.objectContaining({ id: 'a-shot.png' }),
          expect.objectContaining({ id: 'a-notes.md' }),
        ],
      }),
    );
    expect(await screen.findByText('conversation c-new')).toBeInTheDocument();
  });

  it('sends files without text', async () => {
    renderHome();
    await screen.findByRole('textbox', { name: 'home.inputLabel' });
    fireEvent.change(screen.getByTestId('chat-attach-input'), {
      target: {
        files: [new File(['log'], 'build.log', { type: 'text/plain' })],
      },
    });
    await waitFor(() => expect(uploads.upload).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole('button', { name: 'home.send' }));
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith('Opus', {
        content: '',
        attachments: [expect.objectContaining({ id: 'a-build.log' })],
      }),
    );
  });

  it('says when the chosen agent cannot be used, and sends nothing', async () => {
    state.agents = [
      agent('Opus', {
        isMyDefault: true,
        availability: {
          online: false,
          reason: 'agentArchived',
          onlineRunners: 0,
        },
      }),
    ];
    renderHome();
    expect(
      await screen.findByText('home.blockers.unavailable'),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'home.inputLabel' }),
      'Hello{Enter}',
    );
    expect(start).not.toHaveBeenCalled();
  });

  it('says there is no agent to talk to when none is listed', async () => {
    state.agents = [];
    renderHome();
    expect(
      await screen.findByText('home.blockers.noAgent'),
    ).toBeInTheDocument();
  });

  it('warns when the chosen agent has no runner online, but still queues messages', async () => {
    state.agents[1] = agent('Coder', {
      isMyDefault: true,
      availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
    });
    renderHome();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'home.runnerUnavailable',
    );
    expect(
      screen.getByRole('link', { name: 'home.setUpRunners' }),
    ).toHaveAttribute('href', '/runtimes');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'home.inputLabel' }),
      'Fix the build',
    );
    expect(screen.getByRole('button', { name: 'home.send' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'home.send' }));
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith('Coder', plain('Fix the build')),
    );
  });

  it('refreshes runner availability without losing the selected agent or message draft', async () => {
    state.agents[1] = agent('Coder', {
      isMyDefault: true,
      availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
    });
    const queryClient = renderHome();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'home.runnerUnavailable',
    );
    const input = screen.getByRole('textbox', { name: 'home.inputLabel' });
    await userEvent.type(input, 'Keep this draft');
    state.agents = [state.agents[0]!, agent('Coder', { isMyDefault: true })];
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: homeKeys.agents });
    });
    await waitFor(() =>
      expect(screen.queryByText('home.runnerUnavailable')).toBeNull(),
    );
    expect(input).toHaveValue('Keep this draft');
    expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent('Coder');
    state.agents[1] = agent('Coder', {
      isMyDefault: true,
      availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
    });
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: homeKeys.agents });
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'home.runnerUnavailable',
    );
    await userEvent.click(screen.getByTestId('chat-agent-picker'));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Opus/u }),
    );
    expect(screen.queryByText('home.runnerUnavailable')).toBeNull();
  });

  it('lists the recent conversations with their modes', async () => {
    state.recent = [
      {
        id: 'c1',
        title: 'Release plan',
        titleSource: 'agent',
        category: 'chat',
        source: 'panel',
        mode: 'online',
        agent: { id: 'pm', name: 'PM', avatar: null, archived: false },
        fallbackFrom: null,
        read: true,
        lastMessageAt: new Date().toISOString(),
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        run: null,
      },
    ];
    renderHome();
    const item = await screen.findByRole('button', { name: /Release plan/u });
    expect(
      screen.getByRole('img', { name: 'home.modes.online' }),
    ).toBeInTheDocument();
    await userEvent.click(item);
    expect(await screen.findByText('conversation c1')).toBeInTheDocument();
  });
});
