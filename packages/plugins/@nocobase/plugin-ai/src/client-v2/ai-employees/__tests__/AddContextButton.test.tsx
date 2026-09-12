/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddContextButton } from '../AddContextButton';

const mocks = vi.hoisted(() => ({
  workContextOnClick: vi.fn(),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Dropdown: ({ children, menu }: React.PropsWithChildren<{ menu: { onClick?: (event: unknown) => void } }>) => (
      <div>
        {children}
        <button
          type="button"
          data-testid="work-context-menu-item"
          onClick={(domEvent) => {
            menu.onClick?.({ key: 'flow-model', domEvent });
          }}
        />
      </div>
    ),
  };
});

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => ({
    pm: {
      get: () => ({
        aiManager: {
          workContext: {
            getValues: () => [
              {
                name: 'flow-model',
                menu: {
                  label: 'Pick block',
                  onClick: mocks.workContextOnClick,
                },
              },
            ],
          },
        },
      }),
    },
  }),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({ engine: {} }),
}));

vi.mock('../../locale', () => ({
  useT: () => (value: string) => value,
}));

vi.mock('../chatbox/hooks/useChatMessageActions', () => ({
  useChatMessageActions: () => ({
    syncContextAttachments: vi.fn(),
  }),
}));

describe('AddContextButton', () => {
  it('does not let the pick-block menu click select the containing block', () => {
    const onParentClick = vi.fn();

    render(
      <div onClick={onParentClick}>
        <AddContextButton onAdd={vi.fn()} onRemove={vi.fn()} />
      </div>,
    );

    fireEvent.click(screen.getByTestId('work-context-menu-item'));

    expect(mocks.workContextOnClick).toHaveBeenCalledTimes(1);
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
