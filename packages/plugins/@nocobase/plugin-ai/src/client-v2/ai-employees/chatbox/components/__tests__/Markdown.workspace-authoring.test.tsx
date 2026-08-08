/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App } from 'antd';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Code } from '../Markdown';
import { ChatBoxRuntimeProvider, createChatBoxRuntime } from '../../stores/runtime';

const mocks = vi.hoisted(() => ({
  workspaceSurfaceId: 'workspace-1' as string | undefined,
  write: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  useGlobalTheme: () => ({ isDarkTheme: false }),
}));

vi.mock('../../../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../../hooks/useChat', () => ({
  useChat: () => ({
    use: {
      workspaceSurfaceId: () => mocks.workspaceSurfaceId,
      currentEditorRefUid: () => 'editor-1',
      editorRef: () => ({ 'editor-1': { write: mocks.write } }),
    },
  }),
}));

vi.mock('../Actions', () => ({ Actions: () => null }));

const renderCode = (code: string) => {
  const runtime = createChatBoxRuntime();
  runtime.chatConversationModel.setCurrentConversation('session-1');
  return render(
    <ChatBoxRuntimeProvider runtime={runtime}>
      <App>
        <Code className="language-js">{code}</Code>
      </App>
    </ChatBoxRuntimeProvider>,
  );
};

describe('Markdown workspace authoring', () => {
  beforeEach(() => {
    mocks.workspaceSurfaceId = 'workspace-1';
    mocks.write.mockClear();
  });

  it('does not expose direct editor apply for a code-workspace session', () => {
    renderCode('return 2;');

    expect(document.querySelector('code')).toHaveTextContent('return 2;');
    expect(screen.queryByRole('button', { name: 'Apply to editor' })).toBeNull();
    expect(mocks.write).not.toHaveBeenCalled();
  });

  it('preserves direct editor apply for a legacy single-file session', () => {
    mocks.workspaceSurfaceId = undefined;
    renderCode('return 3;');

    fireEvent.click(screen.getByRole('button', { name: 'Apply to editor' }));
    expect(mocks.write).toHaveBeenCalledWith('return 3;');
  });
});
