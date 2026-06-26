/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';

import type { FlowModel } from '@nocobase/flow-engine';

import type { RecordCommentsBlockModel } from '../RecordCommentsBlockModel';
import { RecordCommentsBlockView } from '../components/RecordCommentsBlockView';

vi.mock('../../locale', () => ({
  useT: () => (value: string) => value,
}));

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
});
