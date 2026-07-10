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
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CurrentUserContext } from '@nocobase/client';
import { AIEmployeesProvider } from '../ai-employees/AIEmployeesProvider';

const { appMock } = vi.hoisted(() => ({
  appMock: {
    router: {
      isSkippedAuthCheckRoute: vi.fn(),
    },
  },
}));

vi.mock('@nocobase/client', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client')>('@nocobase/client');
  return {
    ...actual,
    useApp: () => appMock,
  };
});

vi.mock('../ai-employees/1.x/selector/AISelectorProvider', () => ({
  AISelectionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../ai-employees/AISettingsProvider', () => ({
  AISettingsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../ai-employees/chatbox/ChatBoxLayout', () => ({
  ChatBoxLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="chat-box-layout">{children}</div>,
}));

vi.mock('../ai-employees/AISelection', () => ({
  AISelection: () => null,
}));

vi.mock('../ai-employees/AISelectionControl', () => ({
  AISelectionControl: () => null,
}));

describe('AIEmployeesProvider', () => {
  it('does not mount chat box on routes that skip auth check', () => {
    appMock.router.isSkippedAuthCheckRoute.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/public-forms/form-1']}>
        <CurrentUserContext.Provider value={{ data: { data: { id: 1 } } } as any}>
          <AIEmployeesProvider>
            <div data-testid="content" />
          </AIEmployeesProvider>
        </CurrentUserContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-box-layout')).not.toBeInTheDocument();
  });

  it('mounts chat box on routes that require auth check', () => {
    appMock.router.isSkippedAuthCheckRoute.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/admin/page-1']}>
        <CurrentUserContext.Provider value={{ data: { data: { id: 1 } } } as any}>
          <AIEmployeesProvider>
            <div data-testid="content" />
          </AIEmployeesProvider>
        </CurrentUserContext.Provider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('chat-box-layout')).toBeInTheDocument();
  });
});
