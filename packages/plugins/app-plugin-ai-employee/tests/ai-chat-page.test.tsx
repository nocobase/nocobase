/**
 * @vitest-environment jsdom
 */

import { render } from '@testing-library/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const shown = vi.hoisted(() => ({
  providerWebSearch: [] as Array<boolean | undefined>,
  windowProps: undefined as
    | {
        enableAttachments?: boolean;
        enableWebSearch?: boolean;
        composerActions?: Array<{ key: string }>;
      }
    | undefined,
}));

vi.mock('../registry/nocobase-ai/components/index.js', () => ({
  AIChatWindow: () => null,
  ChatSurface: ({ children }: PropsWithChildren) => <>{children}</>,
  ChatSurfaceActions: () => null,
  useAIPageElementPicker: () => ({
    registeredCount: 0,
    startPicking: vi.fn(),
  }),
}));

vi.mock('../registry/nocobase-ai/providers/index.js', () => ({
  AIChatProvider: ({
    children,
    webSearch,
  }: PropsWithChildren<{ webSearch?: boolean }>) => {
    shown.providerWebSearch.push(webSearch);
    return <>{children}</>;
  },
  useAIChatBase: () => ({
    id: 'chat-test',
    addWorkContext: vi.fn(),
    focusComposer: vi.fn(),
  }),
}));

vi.mock('../client/dev/demo/configuration-gate.js', () => ({
  AIConfigurationGate: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock('../client/dev/demo/container-showcase.js', () => ({
  ContainerShowcase: ({
    windowProps,
  }: {
    windowProps: NonNullable<typeof shown.windowProps>;
  }) => {
    shown.windowProps = windowProps;
    return null;
  },
}));

vi.mock('../client/dev/demo/interaction-showcase.js', () => ({
  InteractionShowcase: () => null,
}));

vi.mock('../client/dev/demo/prompt-generator.js', () => ({
  PromptGenerator: () => null,
}));

vi.mock('../registry/nocobase-ai/shared/ui/badge.js', () => ({
  Badge: ({ children }: PropsWithChildren) => <span>{children}</span>,
}));

vi.mock('../registry/nocobase-ai/shared/ui/card.js', () => ({
  Card: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('../registry/nocobase-ai/shared/ui/table.js', () => {
  const TablePart = ({ children }: { children?: ReactNode }) => <>{children}</>;
  return {
    Table: TablePart,
    TableBody: TablePart,
    TableCell: TablePart,
    TableHead: TablePart,
    TableHeader: TablePart,
    TableRow: TablePart,
  };
});

import { AIChatPage } from '../client/dev/demo/index.js';

describe('AIChatPage', () => {
  it("uses the composer's own web search toggle, beside attachments", () => {
    shown.providerWebSearch.length = 0;
    render(<AIChatPage />);

    expect(shown.windowProps).toMatchObject({
      enableAttachments: true,
      enableWebSearch: true,
    });
    expect(
      shown.windowProps?.composerActions?.map((action) => action.key),
    ).toEqual(['pick-page-element']);
    expect(shown.providerWebSearch).toEqual([undefined]);
  });
});
