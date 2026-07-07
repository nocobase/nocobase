/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrintActionModel, renderPrintableDom } from '../PrintActionModel';
import { PluginActionPrintClient } from '../index';

function createModel(uid = 'print-action') {
  const engine = new FlowEngine();
  engine.registerModels({ PrintActionModel });
  return engine.createModel<PrintActionModel>({
    use: 'PrintActionModel',
    uid,
  });
}

function createDetailsBlock(element: HTMLElement) {
  return {
    constructor: {
      name: 'DetailsBlockModel',
    },
    context: {
      ref: {
        current: element,
      },
    },
  };
}

describe('PrintActionModel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('registers the print action model loader', async () => {
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginActionPrintClient.prototype) as PluginActionPrintClient & {
      app: {
        flowEngine: {
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      flowEngine: {
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(registerModelLoaders).toHaveBeenCalledWith({
      PrintActionModel: {
        extends: 'ActionModel',
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.PrintActionModel.loader()).resolves.toHaveProperty('PrintActionModel', PrintActionModel);
  });

  it('exposes record action metadata and details block visibility', () => {
    const model = createModel('print-action-metadata');
    const hide = PrintActionModel.meta?.hide;

    expect(PrintActionModel.scene).toBe('record');
    expect(model.defaultProps).toMatchObject({
      type: 'link',
      icon: 'PrinterOutlined',
    });
    expect(PrintActionModel.meta).toMatchObject({
      sort: 4000,
    });
    expect(hide?.({ blockModel: { constructor: { name: 'DetailsBlockModel' } } } as never)).toBe(false);
    expect(hide?.({ blockModel: { constructor: { name: 'TableBlockModel' } } } as never)).toBe(true);
    expect(hide?.({} as never)).toBe(true);
  });

  it('uses the grid root when the details grid is rendered', () => {
    const container = document.createElement('div');
    const gridRoot = document.createElement('div');
    gridRoot.setAttribute('data-grid-root', '');
    container.appendChild(gridRoot);

    const printable = renderPrintableDom({
      subModels: {
        grid: {
          gridContainerRef: { current: container },
        },
      },
    });

    expect(printable).toBe(gridRoot);
  });

  it('falls back to the block card when an empty details grid has no container ref', () => {
    const blockCard = document.createElement('div');

    const printable = renderPrintableDom({
      context: {
        ref: { current: blockCard },
      },
      subModels: {
        grid: {
          gridContainerRef: { current: null },
        },
      },
    });

    expect(printable).toBe(blockCard);
  });

  it('returns null instead of falling back to full-page printing when no block DOM is mounted', () => {
    const printable = renderPrintableDom({
      context: {
        ref: { current: null },
      },
    });

    expect(printable).toBeNull();
  });

  it('hides itself outside details blocks before render', () => {
    const model = createModel('print-action-before-render');
    const step = model.getFlow('hideInTableRowActions')?.getStep('apply')?.serialize() as
      | {
          hideInSettings?: () => boolean;
          handler?: (ctx: {
            blockModel?: { constructor?: { name?: string } };
            model: { setHidden: (hidden: boolean) => void };
          }) => void;
        }
      | undefined;
    const setHidden = vi.fn();

    expect(step?.hideInSettings?.()).toBe(true);

    step?.handler?.({
      blockModel: {
        constructor: {
          name: 'DetailsBlockModel',
        },
      },
      model: {
        setHidden,
      },
    });
    expect(setHidden).toHaveBeenLastCalledWith(false);

    step?.handler?.({
      blockModel: {
        constructor: {
          name: 'TableBlockModel',
        },
      },
      model: {
        setHidden,
      },
    });
    expect(setHidden).toHaveBeenLastCalledWith(true);
  });

  it('prints the mounted details block in a hidden iframe', async () => {
    vi.useFakeTimers();
    const style = document.createElement('style');
    style.textContent = '.record-card { color: red; }';
    document.head.appendChild(style);
    const blockElement = document.createElement('section');
    blockElement.className = 'record-card';
    blockElement.textContent = 'Printable record';
    const model = createModel('print-action-click');
    const step = model.getFlow('print')?.getStep('print')?.serialize() as
      | { handler?: (ctx: { blockModel?: ReturnType<typeof createDetailsBlock> }) => Promise<void> }
      | undefined;

    const handlerPromise = step?.handler?.({
      blockModel: createDetailsBlock(blockElement),
    });
    const iframe = document.body.querySelector('iframe') as HTMLIFrameElement;
    const printWindow = iframe.contentWindow;
    expect(printWindow).toBeTruthy();
    if (!printWindow) {
      throw new Error('Expected print iframe to have a contentWindow');
    }
    const print = vi.fn();
    const focus = vi.fn();
    printWindow.print = print;
    printWindow.focus = focus;

    await vi.advanceTimersByTimeAsync(50);
    await handlerPromise;

    expect(iframe.getAttribute('aria-hidden')).toBe('true');
    expect(iframe.contentDocument?.head.textContent).toContain('.record-card');
    expect(iframe.contentDocument?.head.textContent).toContain('@media print');
    expect(iframe.contentDocument?.body.textContent).toContain('Printable record');
    expect(focus).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
    expect(document.body.contains(iframe)).toBe(true);

    await vi.advanceTimersByTimeAsync(200);
    expect(document.body.contains(iframe)).toBe(false);
  });

  it('skips printing when no printable block DOM is mounted', async () => {
    const model = createModel('print-action-no-dom');
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const step = model.getFlow('print')?.getStep('print')?.serialize() as
      | {
          handler?: (ctx: {
            model?: { context?: { blockModel?: { context?: { ref?: { current: null } } } } };
          }) => Promise<void>;
        }
      | undefined;

    await step?.handler?.({
      model: {
        context: {
          blockModel: {
            context: {
              ref: {
                current: null,
              },
            },
          },
        },
      },
    });

    expect(print).not.toHaveBeenCalled();
    expect(document.body.querySelector('iframe')).toBeNull();
  });
});
