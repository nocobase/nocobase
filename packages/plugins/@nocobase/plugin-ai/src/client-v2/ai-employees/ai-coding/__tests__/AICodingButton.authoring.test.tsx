/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CodeAuthoringSurface, EditorRef } from '@nocobase/client-v2';
import { AICodingButton } from '../AICodingButton';
import {
  CHAT_DEFAULT_SESSION_KEY,
  getChatApplicationKey,
  useChatMessagesStore,
} from '../../chatbox/stores/chat-messages';
import { useChatConversationsStore } from '../../chatbox/stores/chat-conversations';
import { useChatBoxStore } from '../../chatbox/stores/chat-box';

const nathan = { username: 'nathan', nickname: 'Nathan', builtIn: true };
const triggerTask = vi.fn(async () => undefined);
const getAIEmployees = vi.fn(async () => undefined);
const surfaces = new Map<string, CodeAuthoringSurface>();
const app = {
  name: 'app-a',
  aiManager: {
    authoringSurfaces: {
      get: (surfaceId: string) => surfaces.get(surfaceId),
    },
  },
};
const applicationKey = getChatApplicationKey(app);

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Avatar: () => <span data-testid="avatar" />,
    Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Tooltip: ({ children, title, open }: { children: React.ReactNode; title: React.ReactNode; open?: boolean }) => (
      <div data-tooltip-open={String(Boolean(open))} data-tooltip-title={String(title)}>
        {children}
      </div>
    ),
    theme: {
      ...actual.theme,
      useToken: () => ({ token: { screenXS: 480, controlHeight: 32, lineWidth: 1, lineType: 'solid' } }),
    },
  };
});

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => app,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    observer: (component: React.ComponentType) => component,
    useFlowContext: () => ({ context: 'flow' }),
  };
});

vi.mock('../../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({ aiEmployees: [nathan], getAIEmployees }),
}));

vi.mock('../../chatbox/hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({ triggerTask }),
}));

vi.mock('../../ProfileCard', () => ({
  AIEmployeeProfileCard: () => null,
}));

vi.mock('../../avatars', () => ({
  avatars: () => undefined,
}));

const createSurface = (surfaceId: string, title: string): CodeAuthoringSurface => ({
  id: surfaceId,
  describe: vi.fn(async () => ({
    surfaceId,
    kind: 'light-extension',
    title,
    scope: { type: 'light-extension', id: surfaceId },
    snapshotId: `${surfaceId}:snapshot`,
    files: [],
    diagnostics: [],
    capabilities: {
      describe: true,
      listFiles: true,
      readFiles: true,
      search: true,
      prepareChanges: true,
      applyPreparedChanges: true,
      validateDraft: true,
      reveal: true,
      supportedChanges: ['create', 'update', 'patch', 'delete'],
    },
  })),
  getSnapshot: vi.fn(),
  list: vi.fn(),
  read: vi.fn(),
  search: vi.fn(),
  prepareChanges: vi.fn(),
  applyPreparedChanges: vi.fn(),
  validateDraft: vi.fn(),
  reveal: vi.fn(),
});

const editorRef = (read = vi.fn(() => 'const value = 1;')): EditorRef => ({
  read,
  write: vi.fn(),
  snippetEntries: [],
  logs: [],
});

beforeEach(() => {
  surfaces.clear();
  triggerTask.mockClear();
  getAIEmployees.mockClear();
  useChatConversationsStore.setState({ currentConversation: 'session-a' });
  useChatBoxStore.setState({ open: true, currentEmployee: nathan });
  useChatMessagesStore.setState({
    sessions: {
      [CHAT_DEFAULT_SESSION_KEY]: useChatMessagesStore.getState().getSessionState('__missing__'),
    },
    editorRef: {},
  });
});

afterEach(() => {
  cleanup();
});

describe('AICodingButton authoring targets', () => {
  it('binds an available workspace without reading source during render or storing full source in context', async () => {
    const surface = createSurface('workspace-a', 'Workspace A');
    surfaces.set(surface.id, surface);
    const read = vi.fn(() => 'secret full source');

    render(
      <AICodingButton
        uid="editor-a"
        scene="RunJS"
        language="javascript"
        authoringSurfaceId="workspace-a"
        editorRef={editorRef(read)}
        setActive={vi.fn()}
      />,
    );

    expect(surface.describe).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));

    await waitFor(() => {
      expect(useChatMessagesStore.getState().getSessionState('session-a').codingTarget).toMatchObject({
        type: 'workspace',
        applicationKey,
        surfaceId: 'workspace-a',
      });
    });
    expect(surface.describe).toHaveBeenCalledTimes(1);
    expect(read).not.toHaveBeenCalled();
    expect(useChatMessagesStore.getState().getSessionState('session-a').contextItems).toEqual([
      {
        type: 'code-workspace',
        uid: 'workspace-a',
        title: 'Workspace A',
        content: {
          surfaceId: 'workspace-a',
          kind: 'light-extension',
          title: 'Workspace A',
        },
      },
    ]);
  });

  it('keeps the original workspace target and exposes a mismatch when another workspace is clicked', async () => {
    surfaces.set('workspace-a', createSurface('workspace-a', 'Workspace A'));
    surfaces.set('workspace-b', createSurface('workspace-b', 'Workspace B'));
    const sharedProps = {
      scene: 'RunJS',
      language: 'javascript',
      editorRef: editorRef(),
      setActive: vi.fn(),
    };

    const { rerender } = render(<AICodingButton uid="editor-a" authoringSurfaceId="workspace-a" {...sharedProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));
    await waitFor(() =>
      expect(useChatMessagesStore.getState().getSessionState('session-a').codingTarget).toMatchObject({
        surfaceId: 'workspace-a',
      }),
    );

    rerender(<AICodingButton uid="editor-b" authoringSurfaceId="workspace-b" {...sharedProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));

    await waitFor(() => {
      expect(useChatMessagesStore.getState().getSessionState('session-a')).toMatchObject({
        codingTarget: { surfaceId: 'workspace-a' },
        codingTargetMismatch: { surfaceId: 'workspace-b' },
      });
    });
    expect(screen.getByRole('button', { name: 'AI coding assistant' }).parentElement).toHaveAttribute(
      'data-tooltip-open',
      'true',
    );
    expect(screen.getByRole('button', { name: 'AI coding assistant' }).parentElement).toHaveAttribute(
      'data-tooltip-title',
      'New conversation',
    );
    expect(triggerTask).not.toHaveBeenCalled();
  });

  it('preserves legacy single-file context and registers the editor under the owning application', async () => {
    const read = vi.fn(() => 'const value = 1;');

    render(
      <AICodingButton
        uid="editor-a"
        scene="RunJS"
        language="javascript"
        editorRef={editorRef(read)}
        setActive={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(useChatMessagesStore.getState().editorRef[applicationKey]['editor-a']).toBeDefined();
    });
    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));

    await waitFor(() => {
      expect(useChatMessagesStore.getState().getSessionState('session-a').codingTarget).toEqual({
        type: 'single-file',
        applicationKey,
        editorUid: 'editor-a',
      });
    });
    expect(read).toHaveBeenCalledTimes(1);
    expect(useChatMessagesStore.getState().getSessionState('session-a').contextItems[0]).toMatchObject({
      type: 'code-editor',
      uid: 'editor-a',
      content: { code: 'const value = 1;' },
    });
  });

  it('binds only the new draft when starting a task from an existing conversation', async () => {
    surfaces.set('workspace-a', createSurface('workspace-a', 'Workspace A'));
    useChatBoxStore.setState({ open: false, currentEmployee: undefined });
    render(
      <AICodingButton
        uid="editor-a"
        scene="RunJS"
        language="javascript"
        authoringSurfaceId="workspace-a"
        editorRef={editorRef()}
        setActive={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));
    await waitFor(() =>
      expect(useChatMessagesStore.getState().getSessionState(undefined).codingTarget).toMatchObject({
        surfaceId: 'workspace-a',
      }),
    );
    expect(useChatMessagesStore.getState().getSessionState('session-a').codingTarget).toBeUndefined();
    expect(triggerTask).toHaveBeenCalledTimes(1);
  });

  it('does not bind a workspace that unmounts while its description is pending', async () => {
    let resolveDescription: ((snapshot: Awaited<ReturnType<CodeAuthoringSurface['describe']>>) => void) | undefined;
    const surface = createSurface('workspace-a', 'Workspace A');
    vi.mocked(surface.describe).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDescription = resolve;
        }),
    );
    surfaces.set(surface.id, surface);
    const rendered = render(
      <AICodingButton
        uid="editor-a"
        scene="RunJS"
        language="javascript"
        authoringSurfaceId="workspace-a"
        editorRef={editorRef()}
        setActive={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));
    await waitFor(() => expect(surface.describe).toHaveBeenCalledTimes(1));
    surfaces.delete('workspace-a');
    await act(async () => {
      resolveDescription?.({
        surfaceId: 'workspace-a',
        kind: 'light-extension',
        title: 'Workspace A',
        scope: { type: 'light-extension', id: 'workspace-a' },
        snapshotId: 'workspace-a:snapshot',
        files: [],
        diagnostics: [],
        capabilities: {
          describe: true,
          listFiles: true,
          readFiles: true,
          search: true,
          prepareChanges: true,
          applyPreparedChanges: true,
          validateDraft: true,
          reveal: true,
          supportedChanges: ['create', 'update', 'patch', 'delete'],
        },
      });
    });
    expect(useChatMessagesStore.getState().getSessionState('session-a').codingTarget).toBeUndefined();
    expect(triggerTask).not.toHaveBeenCalled();

    rendered.unmount();
  });

  it('keeps the latest workspace click when descriptions complete out of order', async () => {
    let resolveFirstDescription:
      | ((snapshot: Awaited<ReturnType<CodeAuthoringSurface['describe']>>) => void)
      | undefined;
    const firstSurface = createSurface('workspace-a', 'Workspace A');
    vi.mocked(firstSurface.describe).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirstDescription = resolve;
        }),
    );
    surfaces.set('workspace-a', firstSurface);
    surfaces.set('workspace-b', createSurface('workspace-b', 'Workspace B'));
    const sharedProps = {
      scene: 'RunJS',
      language: 'javascript',
      editorRef: editorRef(),
      setActive: vi.fn(),
    };
    const { rerender } = render(<AICodingButton uid="editor-a" authoringSurfaceId="workspace-a" {...sharedProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));
    await waitFor(() => expect(firstSurface.describe).toHaveBeenCalledTimes(1));
    rerender(<AICodingButton uid="editor-b" authoringSurfaceId="workspace-b" {...sharedProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));
    await waitFor(() =>
      expect(useChatMessagesStore.getState().getSessionState('session-a').codingTarget).toMatchObject({
        surfaceId: 'workspace-b',
      }),
    );
    await act(async () => {
      resolveFirstDescription?.({
        surfaceId: 'workspace-a',
        kind: 'light-extension',
        title: 'Workspace A',
        scope: { type: 'light-extension', id: 'workspace-a' },
        snapshotId: 'workspace-a:snapshot',
        files: [],
        diagnostics: [],
        capabilities: {
          describe: true,
          listFiles: true,
          readFiles: true,
          search: true,
          prepareChanges: true,
          applyPreparedChanges: true,
          validateDraft: true,
          reveal: true,
          supportedChanges: ['create', 'update', 'patch', 'delete'],
        },
      });
    });
    expect(useChatMessagesStore.getState().getSessionState('session-a').codingTarget).toMatchObject({
      surfaceId: 'workspace-b',
    });
  });
});
