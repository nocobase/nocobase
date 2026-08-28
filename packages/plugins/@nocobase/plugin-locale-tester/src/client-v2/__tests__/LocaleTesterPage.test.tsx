/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LocaleTesterPage from '../pages/LocaleTesterPage';

const testState = vi.hoisted(() => ({
  request: vi.fn(),
  messageSuccess: vi.fn(),
  reloadWindow: vi.fn(),
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../utils', () => ({
  reloadWindow: testState.reloadWindow,
}));

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    JsonTextArea: ({ value, onChange }: { value?: unknown; onChange?: (value: unknown) => void }) =>
      React.createElement('textarea', {
        'aria-label': 'Translations',
        value: value == null ? '' : JSON.stringify(value),
        onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
          onChange?.(event.target.value ? JSON.parse(event.target.value) : null);
        },
      }),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');

  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        request: testState.request,
      },
    }),
  };
});

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        message: {
          success: testState.messageSuccess,
        },
      }),
    },
  };
});

function renderPage() {
  return render(<LocaleTesterPage />);
}

describe('LocaleTesterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.request.mockResolvedValue({
      data: {
        data: {
          id: 1,
          locale: {
            '@nocobase/plugin-demo': {
              Hello: 'Hello',
            },
          },
        },
      },
    });
  });

  it('loads the locale tester record into the JSON editor', async () => {
    renderPage();

    await waitFor(() => {
      expect(testState.request).toHaveBeenCalledWith({
        url: 'localeTester:get',
      });
    });
    await waitFor(() => {
      expect(screen.getByLabelText('Translations')).toHaveValue(
        JSON.stringify({
          '@nocobase/plugin-demo': {
            Hello: 'Hello',
          },
        }),
      );
    });
  });

  it('submits the v1-compatible updateOrCreate payload', async () => {
    renderPage();

    const editor = await screen.findByLabelText('Translations');
    fireEvent.change(editor, {
      target: {
        value: JSON.stringify({
          '@nocobase/plugin-demo': {
            Hello: 'Hi',
          },
        }),
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(testState.request).toHaveBeenCalledWith({
        url: 'localeTester:updateOrCreate',
        method: 'post',
        params: {
          filterKeys: ['id'],
        },
        data: {
          id: 1,
          locale: {
            '@nocobase/plugin-demo': {
              Hello: 'Hi',
            },
          },
        },
      });
    });
    expect(testState.messageSuccess).toHaveBeenCalledWith('Saved successfully!');
    expect(testState.reloadWindow).toHaveBeenCalledTimes(1);
  });
});
