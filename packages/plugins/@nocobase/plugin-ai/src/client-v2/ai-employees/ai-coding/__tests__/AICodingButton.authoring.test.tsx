/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CodeAuthoringSurface, EditorRef } from '@nocobase/client-v2';

import { AICodingButton } from '../AICodingButton';
import { CHAT_DEFAULT_SESSION_KEY, useChatMessagesStore } from '../../chatbox/stores/chat-messages';
import { useChatConversationsStore } from '../../chatbox/stores/chat-conversations';
import { useChatBoxStore } from '../../chatbox/stores/chat-box';

const nathan = { username: 'nathan', nickname: 'Nathan', builtIn: true };
const triggerTask = vi.fn(async () => undefined);
const getAIEmployees = vi.fn(async () => undefined);
const surfaces = new Map<string, CodeAuthoringSurface>();
const app = {
  aiManager: { authoringSurfaces: { get: (surfaceId: string) => surfaces.get(surfaceId) } },
};

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Avatar: () => <span data-testid="avatar" />,
    Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    theme: {
      ...actual.theme,
      useToken: () => ({ token: { screenXS: 480, controlHeight: 32, lineWidth: 1, lineType: 'solid' } }),
    },
  };
});

vi.mock('@nocobase/client-v2', () => ({ useApp: () => app }));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    observer: (component: React.ComponentType) => component,
    useFlowContext: () => ({ context: 'flow' }),
  };
});

vi.mock('../../../locale', () => ({ useT: () => (key: string) => key }));
vi.mock('../../../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => ({ aiEmployees: [nathan], getAIEmployees }),
}));
vi.mock('../../chatbox/hooks/useChatBoxActions', () => ({
  useChatBoxActions: () => ({ triggerTask }),
}));
vi.mock('../../ProfileCard', () => ({ AIEmployeeProfileCard: () => null }));
vi.mock('../../avatars', () => ({ avatars: () => undefined }));

const createSurface = (): CodeAuthoringSurface => ({
  id: 'workspace-a',
  getSnapshot: vi.fn(async () => ({
    surfaceId: 'workspace-a',
    kind: 'light-extension',
    title: 'Workspace A',
    snapshotId: 'snapshot-1',
    files: [],
    diagnostics: [],
  })),
  read: vi.fn(),
  search: vi.fn(),
  prepareChanges: vi.fn(),
  applyPreparedChanges: vi.fn(),
  validateDraft: vi.fn(),
});

const createEditorRef = (read = vi.fn(() => 'const value = 1;')): EditorRef => ({
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
    currentEditorRefUid: undefined,
    flowContext: undefined,
  });
});

afterEach(() => cleanup());

describe('AICodingButton authoring target', () => {
  it('starts workspace authoring from a new draft without reading editor source', async () => {
    const surface = createSurface();
    const read = vi.fn(() => 'secret source');
    surfaces.set(surface.id, surface);
    render(
      <AICodingButton
        uid="editor-a"
        scene="RunJS"
        language="javascript"
        authoringSurfaceId="workspace-a"
        editorRef={createEditorRef(read)}
        setActive={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));

    await waitFor(() => expect(triggerTask).toHaveBeenCalledOnce());
    expect(surface.getSnapshot).toHaveBeenCalledOnce();
    expect(read).not.toHaveBeenCalled();
    expect(useChatMessagesStore.getState().getSessionState(undefined).contextItems).toEqual([
      {
        type: 'code-workspace',
        uid: 'workspace-a',
        title: 'Workspace A',
        content: { surfaceId: 'workspace-a', kind: 'light-extension', title: 'Workspace A' },
      },
    ]);
    expect(useChatMessagesStore.getState().getSessionState(undefined).workspaceSurfaceId).toBe('workspace-a');
    expect(useChatMessagesStore.getState().getSessionState('session-a').workspaceSurfaceId).toBeUndefined();
    expect(triggerTask).toHaveBeenCalledWith(
      expect.objectContaining({
        tasks: expect.arrayContaining([
          expect.objectContaining({
            message: expect.objectContaining({
              workContext: [
                {
                  type: 'code-workspace',
                  uid: 'workspace-a',
                  title: 'Workspace A',
                  content: { surfaceId: 'workspace-a', kind: 'light-extension', title: 'Workspace A' },
                },
              ],
            }),
          }),
        ]),
      }),
    );
  });

  it('preserves the existing single-file editor behavior', async () => {
    const read = vi.fn(() => 'const value = 1;');
    render(
      <AICodingButton
        uid="editor-a"
        scene="RunJS"
        language="javascript"
        editorRef={createEditorRef(read)}
        setActive={vi.fn()}
      />,
    );

    await waitFor(() => expect(useChatMessagesStore.getState().editorRef?.['editor-a']).toBeDefined());
    const readsBeforeClick = read.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'AI coding assistant' }));

    expect(read).toHaveBeenCalledTimes(readsBeforeClick + 1);
    expect(useChatMessagesStore.getState().getSessionState('session-a').contextItems[0]).toMatchObject({
      type: 'code-editor',
      uid: 'editor-a',
      content: { code: 'const value = 1;' },
    });
    expect(triggerTask).not.toHaveBeenCalled();
  });
});
