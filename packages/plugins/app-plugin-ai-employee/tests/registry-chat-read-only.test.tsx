/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AIChatMessage,
  AISubAgentConversation,
} from '../registry/nocobase-ai/providers/types.js';
import type { AIToolRendererProps } from '../registry/nocobase-ai/components/tools/tool-renderer-context.js';
import { AIChatMessageList } from '../registry/nocobase-ai/components/chat/chat-messages.js';

const mountTool = vi.hoisted(() => vi.fn());
const useAI = vi.hoisted(() => vi.fn());
vi.mock('../registry/nocobase-ai/providers/index.js', () => ({
  useAI: () => useAI(),
  useAIChatBase: () => {
    throw new Error('No chat provider');
  },
  getAIEmployeeAvatar: () => '',
}));
vi.mock(
  '../registry/nocobase-ai/components/tools/tool-renderer-context.js',
  () => ({
    useAIToolRenderer: (name: string) =>
      name.startsWith('custom')
        ? {
            standalone: name === 'customStandalone',
            component: function InteractiveRenderer({
              onApprove,
            }: AIToolRendererProps) {
              useEffect(() => {
                mountTool();
              }, []);
              return (
                <button onClick={() => void onApprove()}>
                  Execute custom tool
                </button>
              );
            },
          }
        : undefined,
  }),
);

const toolMessage = (name: string, id = name): AIChatMessage => ({
  id,
  role: 'assistant',
  parts: [
    {
      type: 'dynamic-tool',
      toolName: name,
      toolCallId: id,
      state: 'input-available',
      input: { task: id },
    },
  ],
  metadata: { toolApprovals: { [id]: { required: true, status: 'pending' } } },
});
const subagent = (
  messages: AIChatMessage[],
  sessionId = 'child',
): AISubAgentConversation => ({
  sessionId,
  username: sessionId,
  status: 'completed',
  messages,
});

beforeEach(() => {
  vi.clearAllMocks();
  useAI.mockImplementation(() => {
    throw new Error('No AI provider');
  });
  Element.prototype.scrollTo = vi.fn();
});

describe('AIChatMessageList read-only history', () => {
  it.each([{ readOnly: true }, { showMessageActions: false }])(
    'does not mount interactive tools or expose mutations with %j',
    (props) => {
      const decide = vi.fn();
      const notify = vi.fn();
      const revise = vi.fn();
      const messages: AIChatMessage[] = [
        toolMessage('customStandalone'),
        toolMessage('customEmbedded'),
        toolMessage('generic'),
        {
          id: 'parent',
          role: 'assistant',
          parts: [
            {
              type: 'data-subAgent',
              data: subagent([
                toolMessage('customStandalone', 'child-tool'),
                {
                  id: 'nested',
                  role: 'assistant',
                  parts: [
                    {
                      type: 'data-subAgent',
                      data: subagent(
                        [
                          toolMessage('customEmbedded', 'nested-tool'),
                          toolMessage('generic', 'nested-generic'),
                        ],
                        'grandchild',
                      ),
                    },
                  ],
                },
              ]),
            },
          ],
        },
      ];
      render(
        <AIChatMessageList
          messages={messages}
          {...props}
          decideToolCall={decide}
          onToolCallDecision={notify}
          focusComposer={revise}
        />,
      );
      for (const trigger of screen.getAllByRole('button', {
        name: /Approval required/,
      })) {
        fireEvent.click(trigger);
      }
      expect(
        screen.getByText('child-tool', { exact: false }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('nested-tool', { exact: false }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: /Allow|Deny|Execute custom tool|Retry response/,
        }),
      ).not.toBeInTheDocument();
      expect(mountTool).not.toHaveBeenCalled();
      expect(useAI).not.toHaveBeenCalled();
      expect(decide).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
      expect(revise).not.toHaveBeenCalled();
    },
  );

  it('displays completed tool input and output without mounting its renderer', () => {
    render(
      <AIChatMessageList
        readOnly
        messages={[
          {
            id: 'done',
            role: 'assistant',
            parts: [
              {
                type: 'dynamic-tool',
                toolName: 'customStandalone',
                toolCallId: 'done',
                state: 'output-available',
                input: { query: 'report' },
                output: { total: 42 },
              },
            ],
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Completed/ }));
    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByText(/"total": 42/)).toBeInTheDocument();
    expect(mountTool).not.toHaveBeenCalled();
  });

  it('updates the memoized message when readOnly changes and preserves interactive defaults', () => {
    const decide = vi.fn().mockResolvedValue(undefined);
    const messages = [toolMessage('customStandalone')];
    const { rerender } = render(
      <AIChatMessageList messages={messages} decideToolCall={decide} />,
    );
    expect(mountTool).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole('button', { name: 'Execute custom tool' }),
    );
    expect(decide).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'approve',
        toolCallId: 'customStandalone',
      }),
    );
    rerender(
      <AIChatMessageList
        messages={messages}
        readOnly
        decideToolCall={decide}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Execute custom tool' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Approval required/ }),
    ).toBeInTheDocument();
  });

  it('keeps ordinary tool approval interactive by default', async () => {
    const decide = vi.fn().mockResolvedValue(undefined);
    render(
      <AIChatMessageList
        messages={[toolMessage('generic')]}
        decideToolCall={decide}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    expect(decide).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'approve', toolCallId: 'generic' }),
    );
    expect(await screen.findByText('Allowed')).toBeInTheDocument();
  });

  it('does not require chat context for an empty read-only transcript', () => {
    const { rerender } = render(<AIChatMessageList messages={[]} readOnly />);
    expect(screen.getByRole('log')).toBeEmptyDOMElement();
    rerender(
      <AIChatMessageList
        messages={[]}
        readOnly
        emptyState={<p>No messages</p>}
      />,
    );
    expect(screen.getByText('No messages')).toBeInTheDocument();
  });
});
