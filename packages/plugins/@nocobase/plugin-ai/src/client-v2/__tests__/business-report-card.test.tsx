/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessReportCard } from '../ai-employees/tools/BusinessReportCard';
import { Markdown } from '../ai-employees/chatbox/components/Markdown';

const mocks = vi.hoisted(() => ({
  chatState: {
    responseLoading: false,
  },
  setOpenToolModal: vi.fn(),
  setActiveTool: vi.fn(),
  setActiveMessageId: vi.fn(),
}));

vi.mock('../locale', () => ({
  useT: () => (text: string) => text,
}));

vi.mock('echarts-for-react', () => ({
  default: React.forwardRef(() => <div data-testid="echarts" />),
}));

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  return {
    ...actual,
    useGlobalTheme: () => ({ isDarkTheme: false }),
  };
});

vi.mock('../ai-employees/chatbox/hooks/useChat', () => ({
  useChat: () => ({
    use: {
      responseLoading: () => mocks.chatState.responseLoading,
    },
  }),
}));

vi.mock('../ai-employees/chatbox/stores/runtime', () => ({
  useChatBoxRuntime: () => ({
    chatConversationModel: {
      currentConversation: 'conversation-1',
    },
    chatToolModel: {
      setOpenToolModal: mocks.setOpenToolModal,
      setActiveTool: mocks.setActiveTool,
      setActiveMessageId: mocks.setActiveMessageId,
    },
  }),
}));

const createProps = (toolCall: Partial<React.ComponentProps<typeof BusinessReportCard>['toolCall']> = {}) => ({
  messageId: '',
  tools: {
    scope: 'GENERAL' as const,
    from: 'loader' as const,
    definition: {
      name: 'businessReportGenerator',
      description: '',
    },
  },
  toolCall: {
    id: 'report-tool-1',
    type: 'function',
    name: 'businessReportGenerator',
    invokeStatus: 'pending' as const,
    auto: true,
    status: undefined,
    args: {
      title: 'Sales report',
      summary: 'Generated report summary',
      markdown: '# Sales report',
    },
    ...toolCall,
  },
  decisions: {
    approve: vi.fn().mockResolvedValue(undefined),
    edit: vi.fn().mockResolvedValue(undefined),
    reject: vi.fn().mockResolvedValue(undefined),
  },
});

describe('BusinessReportCard', () => {
  beforeEach(() => {
    mocks.chatState.responseLoading = false;
    mocks.setOpenToolModal.mockClear();
    mocks.setActiveTool.mockClear();
    mocks.setActiveMessageId.mockClear();
  });

  it('does not auto-open a completed historical report card', () => {
    render(
      <BusinessReportCard
        {...createProps({
          id: 'historical-report-tool',
          status: 'success',
          invokeStatus: 'done',
        })}
      />,
    );

    expect(mocks.setOpenToolModal).not.toHaveBeenCalled();
  });

  it('auto-opens when a report observed as generating completes after loading stops', () => {
    mocks.chatState.responseLoading = true;
    const { rerender } = render(<BusinessReportCard {...createProps({ id: 'live-report-tool' })} />);

    mocks.chatState.responseLoading = false;
    rerender(
      <BusinessReportCard
        {...createProps({
          id: 'live-report-tool',
          status: 'success',
          invokeStatus: 'done',
        })}
      />,
    );

    expect(mocks.setOpenToolModal).toHaveBeenCalledWith(true);
    expect(mocks.setActiveMessageId).toHaveBeenCalledWith('');
    expect(mocks.setActiveTool).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'live-report-tool',
        status: 'success',
        invokeStatus: 'done',
      }),
    );
  });
});

describe('business report markdown', () => {
  it('renders an embedded chart without treating a memo component as a function', () => {
    render(
      <Markdown message={{ messageId: 'report-message', content: '' }}>
        {
          '<echarts>{"xAxis":{"type":"category","data":["Jan","Feb"]},"yAxis":{"type":"value"},"series":[{"type":"bar","data":[100,150]}]}</echarts>'
        }
      </Markdown>,
    );

    expect(screen.getByTestId('echarts')).toBeInTheDocument();
  });
});
