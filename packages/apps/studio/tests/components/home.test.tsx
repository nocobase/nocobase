/**
 * The home page's composer: the agent it starts with, the one agent picker listing both types, what it says when online
 * agents have no model,
 * sending (a new conversation, opened full screen at `/chat/:id`), and the recent conversations with their modes, which
 * open there too.
 */
import type {
  ChatAgent,
  ConversationSummary,
  MessageAttachment,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
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
  services: 1,
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

/** What `start` is called with for a message with no files on the agent's default model. */
const plain = (content: string) => ({ content, attachments: [], model: null });
const minted = vi.fn();

vi.mock('../../client/pages/home/api.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/pages/home/api.js')>()),
  useHomeApi: () => ({
    agents: () => Promise.resolve(state.agents),
    models: () =>
      Promise.resolve({
        services: Array.from({ length: state.services }, (_, index) => ({
          name: `s${index}`,
          title: 'S',
          provider: 'openai',
          models: [{ value: 'm', label: 'm' }],
        })),
      }),
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

function renderHome(): void {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/chat/:conversationId' element={<ChatPageStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('the home page', () => {
  beforeEach(() => {
    state.agents = [
      agent('Project manager', 'online', { isSystemDefault: true }),
      agent('Coder', 'runner'),
    ];
    state.services = 1;
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

  it('starts a conversation with the default agent and opens it full screen', async () => {
    renderHome();
    const input = await screen.findByRole('textbox', {
      name: 'home.inputLabel',
    });
    // About three lines to start with, growing with the text.
    expect(input).toHaveClass('min-h-20');
    expect(input).not.toHaveClass('min-h-28');
    // One agent picker in the composer's toolbar, fitted to its width; no Online / Runner switch.
    const picker = within(screen.getByTestId('chat-composer')).getByTestId(
      'chat-agent-picker',
    );
    expect(picker).toHaveTextContent('Project manager');
    expect(picker).toHaveClass('max-w-44', '@md:max-w-64');
    expect(
      screen.queryByRole('button', { name: 'home.modes.online' }),
    ).toBeNull();
    await userEvent.type(input, 'What is blocked?{Enter}');
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith(
        'Project manager',
        plain('What is blocked?'),
      ),
    );
    expect(await screen.findByText('conversation c-new')).toBeInTheDocument();
  });

  it("shows a built-in agent's name in the viewer's language", async () => {
    state.agents = [
      agent('Project manager', 'online', {
        isSystemDefault: true,
        nameText: { key: 'presets.lead.name', ns: 'studio' },
      }),
    ];
    renderHome();
    expect(await screen.findByTestId('chat-agent-picker')).toHaveTextContent(
      'presets.lead.name',
    );
  });

  it('lists every agent, grouped by type, and sends to the one picked', async () => {
    state.agents = [
      agent('Project manager', 'online', { isSystemDefault: true }),
      agent('Writer', 'online'),
      agent('Coder', 'runner'),
    ];
    renderHome();
    await userEvent.click(await screen.findByTestId('chat-agent-picker'));
    expect(
      await screen.findByRole('menuitem', { name: /Coder/u }),
    ).toBeInTheDocument();
    expect(screen.getByText('chat.agents.onlineGroup')).toBeInTheDocument();
    expect(screen.getByText('chat.agents.runnerGroup')).toBeInTheDocument();
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Writer/u }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'home.inputLabel' }),
      'Draft the notes{Enter}',
    );
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith('Writer', plain('Draft the notes')),
    );
  });

  it('starts with the person’s own default, a runner agent', async () => {
    state.agents = [
      agent('Project manager', 'online', { isSystemDefault: true }),
      agent('Coder', 'runner', { isMyDefault: true }),
    ];
    renderHome();
    expect(await screen.findByTestId('chat-agent-picker')).toHaveTextContent(
      'Coder',
    );
    expect(
      screen.getByRole('textbox', { name: 'home.inputLabel' }),
    ).toHaveAttribute('placeholder', 'home.placeholders.runner');
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
      expect(start).toHaveBeenCalledWith('Project manager', {
        content: 'Why did it fail?',
        attachments: [
          expect.objectContaining({ id: 'a-build.log' }),
          expect.objectContaining({ id: 'a-shot.png' }),
          expect.objectContaining({ id: 'a-notes.md' }),
        ],
        model: null,
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
      expect(start).toHaveBeenCalledWith('Project manager', {
        content: '',
        attachments: [expect.objectContaining({ id: 'a-build.log' })],
        model: null,
      }),
    );
  });

  it('offers an online agent’s models before the first message and starts on the chosen one', async () => {
    const models = [
      {
        modelService: 's0',
        model: 'gpt-5-mini',
        serviceTitle: 'S0',
        modelLabel: 'gpt-5-mini',
      },
      {
        modelService: 's0',
        model: 'claude-sonnet',
        serviceTitle: 'S0',
        modelLabel: 'claude-sonnet',
      },
    ];
    state.agents = [
      agent('Project manager', 'online', { isSystemDefault: true, models }),
      agent('Coder', 'runner'),
    ];
    renderHome();
    const picker = await screen.findByTestId('chat-model');
    expect(picker).toHaveTextContent('gpt-5-mini');
    fireEvent.click(picker);
    const option = await screen.findByRole('option', {
      name: /claude-sonnet/u,
    });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.pointerUp(option, { pointerType: 'mouse' });
    fireEvent.mouseUp(option);
    fireEvent.click(option);
    await waitFor(() =>
      expect(screen.getByTestId('chat-model')).toHaveTextContent(
        'claude-sonnet',
      ),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'home.inputLabel' }),
      'Which model?{Enter}',
    );
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith('Project manager', {
        content: 'Which model?',
        attachments: [],
        model: models[1],
      }),
    );
  });

  it('offers no model choice for an agent with one model or a runner', async () => {
    renderHome();
    await screen.findByRole('textbox', { name: 'home.inputLabel' });
    expect(screen.queryByTestId('chat-model')).toBeNull();
    await userEvent.click(screen.getByTestId('chat-agent-picker'));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Coder/u }),
    );
    expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent('Coder');
    expect(screen.queryByTestId('chat-model')).toBeNull();
  });

  it('says online agents need a model service when none offers a model, and sends nothing', async () => {
    state.services = 0;
    renderHome();
    expect(
      await screen.findByText('home.blockers.noModel'),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'home.inputLabel' }),
      'Hello{Enter}',
    );
    expect(start).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'home.send' })).toBeDisabled();
  });

  it('links to where models are set up when online agents have none', async () => {
    state.services = 0;
    renderHome();
    expect(
      await screen.findByRole('link', { name: 'home.setUpModels' }),
    ).toHaveAttribute('href', '/models');
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
