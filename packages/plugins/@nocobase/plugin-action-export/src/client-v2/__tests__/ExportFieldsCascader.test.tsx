/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ArrayItems, FormItem, Space } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
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

  it('sorts safely after changing a lazy-loaded relation field', async () => {
    const originalPointerEvent = globalThis.PointerEvent;
    class TestPointerEvent extends MouseEvent {
      readonly isPrimary: boolean;
      readonly pointerId: number;

      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.isPrimary = init.isPrimary ?? true;
        this.pointerId = init.pointerId ?? 1;
      }
    }
    globalThis.PointerEvent = TestPointerEvent as unknown as typeof PointerEvent;

    const rootOptions: SearchOption[] = [
      {
        name: 'org_m2o',
        title: 'org_m2o',
        isLeaf: false,
      },
      { name: 'username', title: 'Username', isLeaf: true },
    ];
    const optionsCache = {
      getRootOptions: () => rootOptions,
      loadChildren: vi.fn(() => []),
      preloadPath: vi.fn(() => {
        rootOptions[0].children = [
          { name: 'company_name', title: 'Company name', isLeaf: true },
          { name: 'address', title: 'Address', isLeaf: true },
        ];
        return true;
      }),
      searchOptionsAsync: vi.fn(() => Promise.resolve([])),
    };
    const form = createForm({
      values: {
        exportSettings: [{ dataIndex: ['org_m2o', 'company_name'] }, { dataIndex: ['username'] }],
      },
    });
    const SchemaField = createSchemaField({
      components: {
        ArrayItems,
        ExportFieldsCascader,
        FormItem,
        Space,
      },
    });
    const schema = {
      type: 'object',
      properties: {
        exportSettings: {
          type: 'array',
          'x-component': 'ArrayItems',
          items: {
            type: 'object',
            properties: {
              layout: {
                type: 'void',
                'x-component': 'Space',
                properties: {
                  sort: {
                    type: 'void',
                    'x-component': 'ArrayItems.SortHandle',
                  },
                  dataIndex: {
                    type: 'array',
                    'x-decorator': 'FormItem',
                    'x-component': 'ExportFieldsCascader',
                    'x-component-props': { optionsCache },
                  },
                },
              },
            },
          },
        },
      },
    };

    try {
      const { container } = render(
        <FormProvider form={form}>
          <SchemaField schema={schema} />
        </FormProvider>,
      );
      const rows = Array.from(container.querySelectorAll<HTMLElement>('.ant-formily-array-items-item'));
      const handles = container.querySelectorAll<HTMLElement>('.ant-formily-array-base-sort-handle');
      const comboboxes = container.querySelectorAll<HTMLElement>('[role="combobox"]');

      rows.forEach((row, index) => {
        const top = index * 64;
        vi.spyOn(row, 'getBoundingClientRect').mockReturnValue({
          bottom: top + 48,
          height: 48,
          left: 0,
          right: 640,
          top,
          width: 640,
          x: 0,
          y: top,
          toJSON: () => ({}),
        });
      });

      await act(async () => {
        fireEvent.mouseDown(comboboxes[0]);
      });
      await waitFor(() => expect(optionsCache.preloadPath).toHaveBeenCalledWith(['org_m2o', 'company_name']));
      fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Address' }));
      await waitFor(() => expect(form.values.exportSettings[0].dataIndex).toEqual(['org_m2o', 'address']));

      fireEvent.pointerDown(handles[0], { button: 0, buttons: 1, clientX: 12, clientY: 8, pointerId: 1 });
      await act(async () => Promise.resolve());
      fireEvent.pointerMove(document, { button: 0, buttons: 1, clientX: 12, clientY: 90, pointerId: 1 });
      await act(async () => Promise.resolve());
      fireEvent.pointerUp(document, { button: 0, buttons: 0, clientX: 12, clientY: 90, pointerId: 1 });

      await waitFor(() => {
        expect(form.values.exportSettings.map((item) => item.dataIndex)).toEqual([
          ['username'],
          ['org_m2o', 'address'],
        ]);
      });
    } finally {
      globalThis.PointerEvent = originalPointerEvent;
    }
  });
});
