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

const mocks = vi.hoisted(() => ({
  codingTarget: { type: 'workspace', surfaceId: 'workspace-1' } as
    | { type: 'workspace'; surfaceId: string }
    | { type: 'single-file'; editorUid: string },
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
      codingTarget: () => mocks.codingTarget,
      currentEditorRefUid: () => 'editor-1',
      editorRef: () => ({ 'editor-1': { write: mocks.write } }),
    },
  }),
}));

vi.mock('../../stores/chat-conversations', () => ({
  useChatConversationsStore: {
    use: { currentConversation: () => 'session-1' },
  },
}));

vi.mock('../Actions', () => ({ Actions: () => null }));

describe('Markdown workspace authoring', () => {
  beforeEach(() => {
    mocks.codingTarget = { type: 'workspace', surfaceId: 'workspace-1' };
    mocks.write.mockClear();
  });

  it('does not expose direct editor apply for a code-workspace session', () => {
    render(
      <App>
        <Code className="language-js">return 2;</Code>
      </App>,
    );

    expect(document.querySelector('code')).toHaveTextContent('return 2;');
    expect(screen.queryByRole('button', { name: 'Apply to editor' })).toBeNull();
    expect(mocks.write).not.toHaveBeenCalled();
  });

  it('preserves direct editor apply for a legacy single-file session', () => {
    mocks.codingTarget = { type: 'single-file', editorUid: 'editor-1' };
    render(
      <App>
        <Code className="language-js">return 3;</Code>
      </App>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apply to editor' }));
    expect(mocks.write).toHaveBeenCalledWith('return 3;');
  });
});
