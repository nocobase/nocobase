/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';

import type { FlowModel } from '@nocobase/flow-engine';

import type { RecordCommentsBlockModel } from '../RecordCommentsBlockModel';
import { RecordCommentsBlockView } from '../components/RecordCommentsBlockView';

vi.mock('../../locale', () => ({
  useT: () => (value: string) => value,
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();

  return {
    ...actual,
    FormComponent: ({ children }: { children: React.ReactNode }) => <form>{children}</form>,
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();

  return {
    ...actual,
    FlowModelRenderer: ({ model }: { model: FlowModel }) => {
      const context = model.context as { record?: { title?: string } };
      return <div data-testid="body-fields">{context.record?.title}</div>;
    },
  };
});

vi.mock('../components/RecordCommentActions', () => ({
  RecordCommentActions: ({ setEditing }: { setEditing: () => void }) => (
    <button type="button" onClick={setEditing}>
      Open editor
    </button>
  ),
}));

describe('RecordCommentsBlockView.Item', () => {
  it('restores the original content after canceling an edit', async () => {
    const renderSpy = vi.fn();
    const markdown = {
      edit: ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
        <textarea
          aria-label="Markdown editor"
          value={value ?? ''}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ),
      render: (value: string) => {
        renderSpy(value);
        return <span>{value}</span>;
      },
    };

    const blockModel = {
      mapping: {
        contentField: 'content',
      },
      context: {
        markdown,
      },
      resource: {
        update: vi.fn(),
      },
      collection: {
        filterTargetKey: 'id',
      },
    } as unknown as RecordCommentsBlockModel;

    render(
      <App>
        <RecordCommentsBlockView.Item
          blockModel={blockModel}
          itemModel={{ uid: 'item-1' } as FlowModel}
          record={{ id: 1, content: 'Original content' }}
          forkKeyPrefix="comment_item_1"
        />
      </App>,
    );

    await screen.findByText('Original content');
    fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
    const editor = screen.getByRole('textbox', { name: 'Markdown editor' });
    fireEvent.change(editor, { target: { value: 'Draft content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await screen.findByText('Original content');
    fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
    expect(screen.getByRole('textbox', { name: 'Markdown editor' })).toHaveValue('Original content');
    expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('does not keep rerendering display content after canceling edit mode', async () => {
    const renderSpy = vi.fn();
    const markdown = {
      edit: ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
        <textarea
          aria-label="Markdown editor"
          value={value ?? ''}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ),
      render: (value: string) => {
        renderSpy(value);
        return <span>{value}</span>;
      },
    };

    const blockModel = {
      mapping: {
        contentField: 'content',
      },
      context: {
        markdown,
      },
      resource: {
        update: vi.fn(),
      },
      collection: {
        filterTargetKey: 'id',
      },
    } as unknown as RecordCommentsBlockModel;

    const RenderCounter = () => {
      const renderCountRef = useRef(0);
      renderCountRef.current += 1;

      return (
        <App>
          <RecordCommentsBlockView.Item
            blockModel={blockModel}
            itemModel={{ uid: 'item-2' } as FlowModel}
            record={{ id: 2, content: 'Loop check' }}
            forkKeyPrefix="comment_item_2"
          />
          <span data-testid="render-count">{renderCountRef.current}</span>
        </App>
      );
    };

    render(<RenderCounter />);

    await screen.findByText('Loop check');
    fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await screen.findByText('Loop check');

    expect(Number(screen.getByTestId('render-count').textContent)).toBeLessThanOrEqual(5);
    expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('renders configured body fields with the current comment record', async () => {
    const bodyFieldsFork = {
      gridContainerRef: null,
      context: {
        defineProperty(name: string, descriptor: { get?: () => unknown; value?: unknown }) {
          this[name] = descriptor.get ? descriptor.get() : descriptor.value;
        },
      },
    };
    const bodyFields = {
      hasSubModel: vi.fn(() => true),
      createFork: vi.fn(() => bodyFieldsFork),
    };
    const blockModel = {
      props: {},
      mapping: {
        contentField: 'content',
      },
      context: {
        flowSettingsEnabled: false,
      },
      resource: {
        update: vi.fn(),
      },
      collection: {
        filterTargetKey: 'id',
      },
    } as unknown as RecordCommentsBlockModel;
    const itemModel = {
      uid: 'item-3',
      subModels: {
        bodyFields,
      },
    } as unknown as FlowModel;

    render(
      <App>
        <RecordCommentsBlockView.Item
          blockModel={blockModel}
          itemModel={itemModel}
          record={{ id: 3, content: 'Body field comment', title: 'Configured title' }}
          forkKeyPrefix="comment_item_3"
        />
      </App>,
    );

    await screen.findByText('Body field comment');
    expect(screen.getByTestId('body-fields')).toHaveTextContent('Configured title');
    expect(bodyFields.createFork).toHaveBeenCalledWith({}, 'comment_item_3_body_fields');
  });
});

describe('RecordCommentsBlockView', () => {
  it('includes a custom date field value when creating comments', async () => {
    const create = vi.fn(async () => undefined);
    const resource = {
      loading: false,
      create,
      refresh: vi.fn(async () => undefined),
      setPage: vi.fn(),
      getPage: vi.fn(() => 1),
      getPageSize: vi.fn(() => 20),
      getCount: vi.fn(() => 0),
    };
    const model = {
      uid: 'block-1',
      mapping: {
        contentField: 'content',
        ownerField: 'post',
        dateField: 'commentedAt',
      },
      ownerValue: 12,
      context: {
        defineMethod: vi.fn(),
        flowSettingsEnabled: false,
      },
      collection: {
        fields: [{ name: 'commentedAt', type: 'datetime', interface: 'datetime' }],
      },
      resource,
      isPreparingLastPageLoad: vi.fn(() => false),
      ensureLastPageLoaded: vi.fn(async () => undefined),
      mapSubModels: vi.fn(() => []),
    } as unknown as RecordCommentsBlockModel;

    render(
      <App>
        <RecordCommentsBlockView model={model} dataSource={[]} onPageChange={vi.fn()} />
      </App>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Comment content' }), {
      target: { value: 'A new comment' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'A new comment',
          post: 12,
          commentedAt: expect.any(String),
        }),
        {
          refresh: false,
        },
      );
    });
  });
});
