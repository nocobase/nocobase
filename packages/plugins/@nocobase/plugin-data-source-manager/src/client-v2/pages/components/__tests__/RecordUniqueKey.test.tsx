/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.fn(() => Promise.resolve());
const reload = vi.fn(() => Promise.resolve());
const setOption = vi.fn();
const messages = {
  success: vi.fn(),
  warning: vi.fn(),
};
const notifications = {
  error: vi.fn(),
};

const flowMocks = {
  ctx: {
    api: {
      request: apiRequest,
    },
    dataSourceManager: {
      collectionFieldInterfaceManager: {
        getFieldInterface: vi.fn((name: string) => (name === 'input' ? { titleUsable: true } : undefined)),
      },
      getDataSource: vi.fn(() => ({
        collectionManager: {
          getCollection: vi.fn(() => ({
            setOption,
          })),
        },
        options: {
          type: 'postgres',
        },
        reload,
      })),
    },
  },
  engine: {
    context: {
      t: vi.fn((key: string, options?: Record<string, unknown>) =>
        options?.title ? `t:${key}:${options.title}` : `t:${key}`,
      ),
    },
  },
};

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => flowMocks.ctx,
    useFlowEngine: () => flowMocks.engine,
  };
});

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const MockApp = Object.assign(({ children }: { children: React.ReactNode }) => <div>{children}</div>, {
    useApp: () => ({
      message: messages,
      notification: notifications,
    }),
  });

  return {
    ...actual,
    App: MockApp,
    Popconfirm: ({
      children,
      onConfirm,
      title,
    }: {
      children: React.ReactNode;
      onConfirm?: () => void;
      title: React.ReactNode;
    }) => (
      <div>
        <div>{title}</div>
        {children}
        <button type="button" onClick={() => onConfirm?.()}>
          Confirm
        </button>
      </div>
    ),
    Select: ({
      mode,
      onChange,
      options,
      placeholder,
      value,
    }: {
      mode?: string;
      onChange?: (value: string[]) => void;
      options?: Array<{ label: React.ReactNode; value: string }>;
      placeholder?: string;
      value?: string[];
    }) => (
      <select
        aria-label={placeholder}
        multiple={mode === 'multiple'}
        value={value}
        onChange={(event) => onChange?.(event.currentTarget.value ? [event.currentTarget.value] : [])}
      >
        {(options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  };
});

import { RecordUniqueKeyPrompt } from '../RecordUniqueKey';

const fields = [
  {
    name: 'title',
    interface: 'input',
    uiSchema: {
      title: '{{t("Title")}}',
    },
  },
  {
    name: 'meta',
    interface: 'json',
    uiSchema: {
      title: 'Meta',
    },
  },
];

describe('RecordUniqueKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves selected record unique keys and updates the runtime collection', async () => {
    const onSaved = vi.fn();

    render(
      <App>
        <RecordUniqueKeyPrompt
          collection={{ name: 'orders' }}
          dataSourceKey="external"
          fields={fields}
          onSaved={onSaved}
        />
      </App>,
    );

    fireEvent.change(screen.getByLabelText('t:Select field'), {
      target: {
        value: 'title',
      },
    });
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith({
        url: 'dataSources/external/collections:update',
        method: 'post',
        params: { filterByTk: 'orders' },
        data: {
          filterTargetKey: ['title'],
        },
      }),
    );
    expect(setOption).toHaveBeenCalledWith('filterTargetKey', ['title']);
    expect(onSaved).toHaveBeenCalledWith({ filterTargetKey: ['title'] });
    expect(messages.success).toHaveBeenCalledWith('t:Saved successfully');
    expect(reload).toHaveBeenCalled();
  });

  it('warns before saving when no field has been selected', async () => {
    render(
      <App>
        <RecordUniqueKeyPrompt collection={{ name: 'orders' }} dataSourceKey="main" fields={fields} />
      </App>,
    );

    fireEvent.click(screen.getByText('Confirm'));

    expect(messages.warning).toHaveBeenCalledWith('t:Please select a field.');
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
