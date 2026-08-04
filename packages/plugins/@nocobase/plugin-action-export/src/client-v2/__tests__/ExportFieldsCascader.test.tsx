/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/client-v2', () => {
  class ActionModel {
    static define() {}

    static registerFlow() {}
  }

  return {
    ActionModel,
    ActionSceneEnum: { collection: 'collection' },
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  escapeT: (value: string) => value,
}));

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

import { ExportFieldsCascader } from '../ExportActionModel';

type SearchOptions = { signal?: AbortSignal };
type SearchOption = { name: string; title: string; isLeaf: boolean; children?: SearchOption[] };

const createOptionsCache = (
  searchOptionsAsync: (searchValue: string, options?: SearchOptions) => Promise<SearchOption[]>,
) => ({
  getRootOptions: () => [{ name: 'title', title: 'Title', isLeaf: true }],
  loadChildren: vi.fn(() => []),
  preloadPath: vi.fn(() => false),
  searchOptionsAsync,
});

describe('ExportFieldsCascader', () => {
  it('shows a matching relation path after searchable options finish loading', async () => {
    let resolveSearch = (_value: SearchOption[]) => undefined;
    const searchPromise = new Promise<SearchOption[]>((resolve) => {
      resolveSearch = resolve;
    });
    const searchOptionsAsync = vi.fn(() => searchPromise);
    render(<ExportFieldsCascader optionsCache={createOptionsCache(searchOptionsAsync)} />);

    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    fireEvent.change(combobox, { target: { value: 'Nickname' } });

    await waitFor(() => expect(searchOptionsAsync).toHaveBeenCalledTimes(1));
    expect(document.querySelector('.ant-spin')).toBeTruthy();

    await act(async () => {
      resolveSearch([
        {
          name: 'user',
          title: 'User',
          isLeaf: false,
          children: [{ name: 'nickname', title: 'Nickname', isLeaf: true }],
        },
      ]);
      await searchPromise;
    });

    await waitFor(() => expect(document.querySelector('.ant-spin')).toBeFalsy());
    await waitFor(() => expect(document.body.textContent).toContain('User / Nickname'));
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('cancels an obsolete search when the input is cleared and changed', async () => {
    const signals: AbortSignal[] = [];
    const searchOptionsAsync = vi.fn((searchValue: string, options?: SearchOptions) => {
      const signal = options?.signal;
      if (signal) {
        signals.push(signal);
      }
      if (searchValue === 'Second') {
        return Promise.resolve([{ name: 'second', title: 'Second', isLeaf: true }]);
      }
      return new Promise<SearchOption[]>((resolve) => {
        signal?.addEventListener('abort', () => resolve([]), { once: true });
      });
    });
    render(<ExportFieldsCascader optionsCache={createOptionsCache(searchOptionsAsync)} />);

    const combobox = screen.getByRole('combobox');
    fireEvent.change(combobox, { target: { value: 'First' } });
    await waitFor(() => expect(searchOptionsAsync).toHaveBeenCalledTimes(1));

    fireEvent.change(combobox, { target: { value: '' } });
    fireEvent.change(combobox, { target: { value: 'Second' } });

    await waitFor(() => expect(signals[0]?.aborted).toBe(true));
    expect(document.querySelector('.ant-spin')).toBeTruthy();
    await waitFor(() => expect(searchOptionsAsync).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(document.querySelector('.ant-spin')).toBeFalsy());
  });

  it('contains option search errors instead of crashing the cascader', async () => {
    const searchOptionsAsync = vi.fn().mockRejectedValue(new Error('Failed to search fields'));
    const { container } = render(<ExportFieldsCascader optionsCache={createOptionsCache(searchOptionsAsync)} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Title' } });

    await waitFor(() => expect(searchOptionsAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container.querySelector('.ant-spin')).toBeFalsy());
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('cancels an active search when the cascader unmounts', async () => {
    let activeSignal: AbortSignal | undefined;
    const searchOptionsAsync = vi.fn((_searchValue: string, options?: SearchOptions) => {
      activeSignal = options?.signal;
      return new Promise<SearchOption[]>((resolve) => {
        activeSignal?.addEventListener('abort', () => resolve([]), { once: true });
      });
    });
    const { unmount } = render(<ExportFieldsCascader optionsCache={createOptionsCache(searchOptionsAsync)} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Nickname' } });
    await waitFor(() => expect(searchOptionsAsync).toHaveBeenCalledTimes(1));

    unmount();

    expect(activeSignal?.aborted).toBe(true);
  });
});
