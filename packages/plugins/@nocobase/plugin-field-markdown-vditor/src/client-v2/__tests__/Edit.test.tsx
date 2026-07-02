/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Vditor from 'vditor';
import { Edit } from '../components/Edit';
import { defaultToolbar } from '../interface';

type MockVditorInstance = {
  element: HTMLElement;
  options: MockVditorOptions;
  value: string;
  setValue: ReturnType<typeof vi.fn>;
  getValue: ReturnType<typeof vi.fn>;
  disabled: ReturnType<typeof vi.fn>;
  enable: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  tip: ReturnType<typeof vi.fn>;
  insertValue: ReturnType<typeof vi.fn>;
};

type MockVditorOptions = {
  value: string;
  after: () => void;
  input: (value: string) => void;
  upload: {
    handler: (files: File[]) => Promise<unknown>;
  };
  [key: string]: unknown;
};

const vditorInstances: MockVditorInstance[] = [];
const fileManagerPlugin = {
  uploadFile: vi.fn(),
};
const mutationObserverCallbacks: MutationCallback[] = [];
const resizeObserverCallbacks: ResizeObserverCallback[] = [];
const flowContext = {
  api: {
    auth: {
      locale: 'en-US',
    },
    resource: vi.fn(),
  },
  app: {
    pm: {
      get: vi.fn(),
    },
  },
  t: vi.fn((value: string) => `ctx:${value}`),
};

vi.mock('vditor', () => ({
  default: vi.fn(function MockVditor(this: MockVditorInstance, element: HTMLElement, options: MockVditorOptions) {
    this.element = element;
    this.options = options;
    this.value = options.value;
    this.setValue = vi.fn((value: string) => {
      this.value = value;
    });
    this.getValue = vi.fn(() => this.value);
    this.disabled = vi.fn();
    this.enable = vi.fn();
    this.destroy = vi.fn();
    this.focus = vi.fn();
    this.tip = vi.fn();
    this.insertValue = vi.fn();
    vditorInstances.push(this);
  }),
}));

vi.mock('@nocobase/client-v2', () => ({
  CollectionFieldInterface: class CollectionFieldInterface {},
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => flowContext,
}));

vi.mock('../components/const', () => ({
  useCDN: () => 'https://cdn.example/vditor',
}));

vi.mock('../components/style', () => ({
  default: () => ({
    wrapSSR: (node: React.ReactNode) => node,
    componentCls: 'markdown-vditor',
    hashId: 'hash',
  }),
}));

vi.mock('../locale', () => ({
  useT: () => (key: string, params?: Record<string, string>) => {
    if (params?.storageTitle) {
      return `${key}:${params.storageTitle}`;
    }
    return key;
  },
}));

class MockMutationObserver {
  constructor(callback: MutationCallback) {
    mutationObserverCallbacks.push(callback);
  }

  observe = vi.fn();
  disconnect = vi.fn();
}

class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeObserverCallbacks.push(callback);
  }

  observe = vi.fn();
  unobserve = vi.fn();
}

async function renderEditor(props: Record<string, unknown> = {}) {
  const result = render(<Edit value="initial" fileCollection="attachments" onChange={vi.fn()} {...props} />);
  await waitFor(() => expect(vditorInstances.length).toBeGreaterThan(0));
  return {
    ...result,
    instance: vditorInstances.at(-1) as MockVditorInstance,
  };
}

describe('Edit', () => {
  beforeEach(() => {
    vi.stubGlobal('MutationObserver', MockMutationObserver);
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('scrollTo', vi.fn());
    flowContext.api.auth.locale = 'en-US';
    flowContext.api.resource.mockReturnValue({
      check: vi.fn(),
    });
    flowContext.app.pm.get.mockReturnValue(fileManagerPlugin);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vditorInstances.length = 0;
    mutationObserverCallbacks.length = 0;
    resizeObserverCallbacks.length = 0;
  });

  it('creates vditor with default options and syncs value, input and disabled state', async () => {
    const onChange = vi.fn();
    const { instance, rerender } = await renderEditor({ onChange });

    expect(Vditor).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      value: 'initial',
      lang: 'en_US',
      cache: { enable: false },
      undoDelay: 0,
      preview: { math: { engine: 'KaTeX' } },
      toolbar: defaultToolbar,
      fullscreen: {
        index: 1200,
      },
      cdn: 'https://cdn.example/vditor',
      minHeight: 200,
      mode: 'ir',
      after: expect.any(Function),
      input: expect.any(Function),
      upload: {
        multiple: false,
        fieldName: 'file',
        handler: expect.any(Function),
      },
    });

    act(() => {
      instance.options.after();
    });

    expect(instance.setValue).toHaveBeenCalledWith('initial');
    expect(instance.enable).toHaveBeenCalled();

    instance.options.input('changed');
    expect(onChange).toHaveBeenCalledWith('changed');

    rerender(<Edit value="external" fileCollection="attachments" onChange={onChange} disabled />);

    await waitFor(() => expect(instance.setValue).toHaveBeenCalledWith('external'));
    expect(instance.disabled).toHaveBeenCalled();
  });

  it('uses supported locale and custom toolbar/mode when provided', async () => {
    flowContext.api.auth.locale = 'zh-CN';

    const { instance } = await renderEditor({
      toolbar: ['bold', 'upload'],
      mode: 'sv',
      editMode: 'wysiwyg',
    });

    expect(instance.options.lang).toBe('zh_CN');
    expect(instance.options.toolbar).toEqual(['bold', 'upload']);
    expect(instance.options.mode).toBe('sv');
  });

  it('disables the editor during initial setup when the field is disabled', async () => {
    const { instance } = await renderEditor({ disabled: true });

    act(() => {
      instance.options.after();
    });

    expect(instance.disabled).toHaveBeenCalled();
    expect(instance.enable).not.toHaveBeenCalled();
  });

  it('falls back to English when vditor does not support the current locale', async () => {
    flowContext.api.auth.locale = 'zh-Hans';

    const { instance } = await renderEditor();

    expect(instance.options.lang).toBe('en_US');
  });

  it('shows a storage tip when the selected collection cannot upload files', async () => {
    const check = vi.fn().mockResolvedValue({
      data: {
        data: {
          isSupportToUploadFiles: false,
          storage: {
            title: 'Local storage',
          },
        },
      },
    });
    flowContext.api.resource.mockReturnValue({ check });
    const { instance } = await renderEditor();

    await instance.options.upload.handler([new File(['doc'], 'doc.txt', { type: 'text/plain' })]);

    expect(instance.focus).toHaveBeenCalled();
    expect(check).toHaveBeenCalledWith({
      fileCollectionName: 'attachments',
    });
    expect(instance.tip).toHaveBeenCalledWith('vditor.uploadError.message:Local storage', 0);
    expect(fileManagerPlugin.uploadFile).not.toHaveBeenCalled();
  });

  it('handles upload errors, empty responses and inserted markdown links', async () => {
    const storage = {
      id: 1,
      type: 'local',
      rules: {
        size: 1024,
      },
    };
    const check = vi.fn().mockResolvedValue({
      data: {
        data: {
          isSupportToUploadFiles: true,
          storage,
        },
      },
    });
    flowContext.api.resource.mockReturnValue({ check });
    const { instance } = await renderEditor();
    const handler = instance.options.upload.handler;

    fileManagerPlugin.uploadFile.mockResolvedValueOnce({ errorMessage: 'upload.failed' });
    await handler([new File(['doc'], 'doc.txt', { type: 'text/plain' })]);
    expect(instance.tip).toHaveBeenCalledWith('ctx:upload.failed', 3000);

    fileManagerPlugin.uploadFile.mockResolvedValueOnce({ data: null });
    await handler([new File(['doc'], 'doc.txt', { type: 'text/plain' })]);
    expect(instance.tip).toHaveBeenCalledWith('Response data is empty', 3000);

    fileManagerPlugin.uploadFile.mockResolvedValueOnce({
      data: {
        filename: 'cover.png',
        url: 'https://cdn.example/cover.png',
      },
    });
    await handler([new File(['image'], 'cover.png', { type: 'image/png' })]);
    expect(instance.insertValue).toHaveBeenCalledWith('![cover.png](https://cdn.example/cover.png)');

    fileManagerPlugin.uploadFile.mockResolvedValueOnce({
      data: {
        filename: 'guide.pdf',
        url: 'https://cdn.example/guide.pdf',
      },
    });
    await handler([new File(['pdf'], 'guide.pdf', { type: 'application/pdf' })]);
    expect(instance.insertValue).toHaveBeenCalledWith('[guide.pdf](https://cdn.example/guide.pdf)');
    expect(fileManagerPlugin.uploadFile).toHaveBeenLastCalledWith({
      file: expect.any(File),
      fileCollectionName: 'attachments',
      storageId: storage.id,
      storageType: storage.type,
      storageRules: storage.rules,
    });
  });

  it('adjusts editor layout while fullscreen and keeps preview nodes inside the field wrapper', async () => {
    const { instance, container } = await renderEditor();
    const editorEl = instance.element;
    editorEl.innerHTML = '<div class="vditor-reset"></div><div class="vditor-toolbar"></div>';
    const resetEl = editorEl.querySelector('.vditor-reset') as HTMLElement;
    const toolbarEl = editorEl.querySelector('.vditor-toolbar') as HTMLElement;

    editorEl.classList.add('vditor--fullscreen');
    act(() => {
      mutationObserverCallbacks[0]([] as unknown as MutationRecord[], {} as MutationObserver);
    });

    expect(resetEl.style.padding).toBe('10px 200px');
    expect(toolbarEl.style.paddingLeft).toBe('200px');

    editorEl.classList.remove('vditor--fullscreen');
    act(() => {
      mutationObserverCallbacks[0]([] as unknown as MutationRecord[], {} as MutationObserver);
    });

    expect(resetEl.style.padding).toBe('');
    expect(toolbarEl.style.paddingLeft).toBe('');

    const previewNode = document.createElement('span');
    previewNode.className = 'vditor-img';
    document.body.appendChild(previewNode);
    act(() => {
      mutationObserverCallbacks[1](
        [
          {
            addedNodes: [previewNode],
          } as unknown as MutationRecord,
        ],
        {} as MutationObserver,
      );
    });

    expect(container.querySelector('.markdown-vditor')?.contains(previewNode)).toBe(true);
    expect(previewNode.style.zIndex).toBe('2200');
  });

  it('moves the editor between the body and field wrapper when fullscreen changes', async () => {
    const { instance, container } = await renderEditor();
    const editorEl = instance.element;
    const fieldWrapper = container.querySelector('.markdown-vditor') as HTMLElement;

    editorEl.className = 'vditor--fullscreen';
    act(() => {
      resizeObserverCallbacks[0](
        [
          {
            target: editorEl,
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
    });

    expect(document.body.lastElementChild).toBe(editorEl);

    editorEl.className = '';
    act(() => {
      resizeObserverCallbacks[0](
        [
          {
            target: editorEl,
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
    });

    expect(fieldWrapper.contains(editorEl)).toBe(true);
  });
});
