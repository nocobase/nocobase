/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock engine api provider
vi.mock('@nocobase/flow-engine', () => {
  const baseDocProperties = {
    foo: 'foo prop',
    api: {
      description: 'api client',
      completion: { insertText: 'ctx.api' },
      properties: {
        request: {
          description: 'send request',
          completion: { insertText: "await ctx.api.request({ url: '', method: 'get' })" },
        },
      },
    },
    viewer: {
      description: 'viewer helpers',
      properties: {
        popover: {
          type: 'function',
          description: 'open popover',
          completion: {
            insertText: 'await ctx.viewer.popover({ target: ctx.element?.__el, content: <div /> })',
            requires: ['element'],
          },
        },
        embed: {
          type: 'function',
          description: 'open embed',
          completion: {
            insertText: 'await ctx.viewer.embed({ target: ctx.element?.__el, content: <div /> })',
            requires: ['element'],
          },
        },
      },
    },
    popup: {
      description: 'popup context (async)',
      detail: 'Promise<any>',
      hidden: async (ctx: any) => !(await ctx?.popup)?.uid,
      properties: {
        uid: 'popup uid',
        record: 'popup record',
        parent: {
          properties: {
            record: 'parent record',
          },
        },
      },
    },
  };
  const methods = {
    bar: {
      description: 'bar method',
      completion: { insertText: "ctx.bar('value')" },
    },
    render: {
      description: 'render react content',
      completion: { insertText: 'ctx.render(<div />)', requires: ['element'] },
    },
  };
  const baseDoc = {
    properties: baseDocProperties,
    methods,
  };
  const domDoc = {
    properties: {
      ...baseDocProperties,
      element: {
        description: 'DOM container',
        detail: 'ElementProxy',
        properties: {
          innerHTML: 'inner html',
          setAttribute: {
            type: 'function',
            detail: '(name: string, value: string) => void',
            completion: { insertText: "ctx.element.setAttribute('data-key', 'value')" },
          },
        },
      },
    },
    methods,
  };
  const domModels = new Set([
    'JSBlockModel',
    'JSFieldModel',
    'JSEditableFieldModel',
    'JSItemModel',
    'JSColumnModel',
    'FormJSFieldItemModel',
  ]);
  return {
    getRunJSDocFor: (ctx: any) => (domModels.has(ctx?.model?.constructor?.name) ? domDoc : baseDoc),
    FlowRunJSContext: { getDoc: () => baseDoc },
    // New cohesive APIs
    listSnippetsForContext: async () => [
      {
        name: 'Class Snippet',
        prefix: 'sn-class',
        description: 'cls',
        body: 'alert(1)',
        ref: 'scene/block/x',
        group: 'scene/block',
        groups: ['scene/block'],
        scenes: ['block'],
      },
    ],
    setupRunJSContexts: () => void 0,
  };
});

import { buildRunJSCompletions } from '../runjsCompletions';

describe('buildRunJSCompletions', () => {
  const labelsOf = (completions: any[]) => new Set(completions.map((c: any) => c.label));

  const appliedTextsOf = (completions: any[]) =>
    completions.flatMap((completion: any) => {
      const mockView = { dispatch: vi.fn() } as any;
      if (typeof completion.apply === 'function') {
        completion.apply(mockView, completion, 0, 0);
      }
      return mockView.dispatch.mock.calls.map((call: any[]) => String(call[0]?.changes?.insert || ''));
    });

  it('builds ctx property/method completions and snippets', async () => {
    const hostCtx = { popup: Promise.resolve({ uid: 'p1' }) }; // not used since engine doc is mocked
    const { completions, entries } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    expect(Array.isArray(completions)).toBe(true);
    // property
    expect(completions.some((c: any) => c.label === 'ctx.foo')).toBe(true);
    const apiProp = completions.find((c: any) => c.label === 'ctx.api');
    expect(apiProp).toBeTruthy();
    const apiReq = completions.find((c: any) => c.label === 'ctx.api.request()');
    expect(apiReq).toBeTruthy();
    const mockView = { dispatch: vi.fn() } as any;
    (apiReq as any).apply?.(mockView, apiReq, 0, 0);
    expect(mockView.dispatch).toHaveBeenCalled();
    const inserted = mockView.dispatch.mock.calls[0][0]?.changes?.insert;
    expect(inserted).toContain('ctx.api.request');

    // popup derived from doc (insert via ctx.getVar for async-safe access)
    const popupRecord = completions.find((c: any) => c.label === 'ctx.popup.record');
    expect(popupRecord).toBeTruthy();
    expect(typeof (popupRecord as any).apply).toBe('function');
    const mockViewPopup = { dispatch: vi.fn() } as any;
    (popupRecord as any).apply?.(mockViewPopup, popupRecord, 0, 0);
    expect(mockViewPopup.dispatch).toHaveBeenCalled();
    const popupInserted = mockViewPopup.dispatch.mock.calls[0][0]?.changes?.insert;
    expect(popupInserted).toContain("await ctx.getVar('ctx.popup.record')");
    // method (with parentheses)
    const method = completions.find((c: any) => c.label === 'ctx.bar()');
    expect(method).toBeTruthy();
    // method completion should provide an apply function to insert parentheses
    expect(typeof (method as any).apply).toBe('function');
    const mockViewMethod = { dispatch: vi.fn() } as any;
    (method as any).apply?.(mockViewMethod, method, 0, 0);
    expect(mockViewMethod.dispatch).toHaveBeenCalled();
    const methodInserted = mockViewMethod.dispatch.mock.calls[0][0]?.changes?.insert;
    expect(methodInserted).toContain('ctx.bar');
    // snippet from class loader
    expect(completions.some((c: any) => c.label === 'Class Snippet')).toBe(true);
    // entries produced for drawer
    expect(entries.some((e) => e.name === 'Class Snippet')).toBe(true);
  });

  it('filters snippets by scene when provided', async () => {
    const hostCtx = {};
    const { completions, entries } = await buildRunJSCompletions(hostCtx, 'v1', 'form');
    expect(entries.length).toBe(0);
    expect(completions.some((c: any) => c.label === 'Class Snippet')).toBe(false);
  });

  it('supports building completions for detail/table scenes', async () => {
    for (const scene of ['detail', 'table']) {
      const { completions } = await buildRunJSCompletions({}, 'v1', scene);
      expect(completions.some((c: any) => c.label === 'ctx.foo')).toBe(true);
    }
  });

  it('keeps ctx.popup.* completions when popup is available', async () => {
    const hostCtx: any = {
      popup: Promise.resolve({ uid: 'p1' }),
    };
    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    expect(completions.some((c: any) => String(c.label || '').startsWith('ctx.popup'))).toBe(true);
  });

  it('hides ctx.popup.* completions when popup is unavailable', async () => {
    const hostCtx: any = {
      popup: Promise.resolve(undefined),
      getPropertyMetaTree: (value: string) => {
        if (value === '{{ ctx.popup }}') {
          return [{ name: 'uid', title: 'Popup uid', type: 'string', paths: ['popup', 'uid'] }];
        }
        return [];
      },
    };

    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    expect(completions.some((c: any) => String(c.label || '').startsWith('ctx.popup'))).toBe(false);
  });

  it('does not hide ctx.popup.* when hidden() throws (fail-open)', async () => {
    const doc: any = (await import('@nocobase/flow-engine')).getRunJSDocFor({} as any);
    const prev = doc?.properties?.popup?.hidden;
    doc.properties.popup.hidden = async () => {
      throw new Error('boom');
    };

    const hostCtx: any = {
      popup: Promise.resolve(undefined),
    };
    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    expect(completions.some((c: any) => String(c.label || '').startsWith('ctx.popup'))).toBe(true);

    // restore
    doc.properties.popup.hidden = prev;
  });

  it('hides specific ctx subpaths via hidden() returning string[]', async () => {
    const doc: any = (await import('@nocobase/flow-engine')).getRunJSDocFor({} as any);
    const prev = doc?.properties?.popup?.hidden;
    doc.properties.popup.hidden = async () => ['record', 'parent.record'];

    const hostCtx: any = {
      popup: Promise.resolve({ uid: 'p1' }),
      getPropertyMetaTree: (value: string) => {
        if (value === '{{ ctx.popup }}') {
          return [
            {
              name: 'record',
              title: 'Popup record',
              type: 'object',
              paths: ['popup', 'record'],
              children: [{ name: 'id', title: 'ID', type: 'string', paths: ['popup', 'record', 'id'] }],
            },
            {
              name: 'parent',
              title: 'Parent',
              type: 'object',
              paths: ['popup', 'parent'],
              children: [
                { name: 'record', title: 'Parent record', type: 'object', paths: ['popup', 'parent', 'record'] },
              ],
            },
          ];
        }
        return [];
      },
    };

    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    expect(completions.some((c: any) => c.label === 'ctx.popup')).toBe(true);
    expect(completions.some((c: any) => c.label === 'ctx.popup.uid')).toBe(true);
    expect(completions.some((c: any) => c.label === 'ctx.popup.record')).toBe(false);
    expect(completions.some((c: any) => c.label === 'ctx.popup.record.id')).toBe(false);
    expect(completions.some((c: any) => c.label === 'ctx.popup.parent')).toBe(true);
    expect(completions.some((c: any) => c.label === 'ctx.popup.parent.record')).toBe(false);

    // restore
    doc.properties.popup.hidden = prev;
  });

  it('does not hide anything when hidden() returns invalid data (fail-open)', async () => {
    const doc: any = (await import('@nocobase/flow-engine')).getRunJSDocFor({} as any);
    const prev = doc?.properties?.popup?.hidden;
    doc.properties.popup.hidden = async () => 'record' as any;

    const hostCtx: any = {
      popup: Promise.resolve({ uid: 'p1' }),
    };
    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    expect(completions.some((c: any) => c.label === 'ctx.popup.record')).toBe(true);

    // restore
    doc.properties.popup.hidden = prev;
  });

  it('merges ctx.getApiInfos() when available and still respects RunJS hidden subpaths', async () => {
    const engineDoc: any = (await import('@nocobase/flow-engine')).getRunJSDocFor({} as any);
    const prev = engineDoc?.properties?.popup?.hidden;
    engineDoc.properties.popup.hidden = async () => ['record'];

    const hostCtx: any = {
      popup: Promise.resolve({ uid: 'p1' }),
      getApiInfos: async () => ({ extra: 'extra prop' }),
    };

    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    expect(completions.some((c: any) => c.label === 'ctx.extra')).toBe(true);
    // Doc-derived completions should respect hidden subpaths from RunJS doc
    expect(completions.some((c: any) => c.label === 'ctx.popup.record')).toBe(false);
    expect(completions.some((c: any) => c.label === 'ctx.popup.record.id')).toBe(false);

    // restore
    engineDoc.properties.popup.hidden = prev;
  });

  it('adds browser/runtime global completions', async () => {
    const { completions } = await buildRunJSCompletions({}, 'v1', 'block');
    const labels = new Set(completions.map((c: any) => c.label));

    expect(labels.has('window.location.reload()')).toBe(true);
    expect(labels.has('window.location.href')).toBe(true);
    expect(labels.has('window.location.href =')).toBe(true);
    expect(labels.has('document.createElement()')).toBe(true);
    expect(labels.has('document.body')).toBe(true);
    expect(labels.has('document.getElementById()')).toBe(true);
    expect(labels.has('document.cookie')).toBe(true);
    expect(labels.has('navigator.clipboard.writeText()')).toBe(true);
    expect(labels.has('navigator.userAgent')).toBe(true);
    expect(labels.has('navigator.geolocation')).toBe(true);
    expect(labels.has('console.log()')).toBe(true);
    expect(labels.has('setTimeout()')).toBe(true);
    expect(labels.has('Blob')).toBe(true);
    expect(labels.has('URL')).toBe(true);
  });

  it('adds stable ctx runtime namespace completions', async () => {
    const hostCtx = {
      model: {
        constructor: {
          name: 'JSBlockModel',
        },
      },
    };
    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    const labels = labelsOf(completions);

    expect(labels.has('ctx.runjs()')).toBe(true);
    expect(labels.has('ctx.sql.run()')).toBe(true);
    expect(labels.has('ctx.logger.info()')).toBe(true);
    expect(labels.has('ctx.element.setAttribute()')).toBe(true);
    expect(labels.has('ctx.libs.React.createElement()')).toBe(true);
    expect(labels.has('ctx.libs.lodash.get()')).toBe(true);
  });

  it('does not expose ctx.element for generic base completions', async () => {
    const { completions } = await buildRunJSCompletions({}, 'v1', 'block');
    const labels = labelsOf(completions);
    const appliedTexts = appliedTextsOf(completions);

    expect([...labels].some((label) => String(label).startsWith('ctx.element'))).toBe(false);
    expect(labels.has('ctx.render()')).toBe(false);
    expect(appliedTexts.some((text) => /\bctx\.element\b/.test(text))).toBe(false);
    expect(appliedTexts.some((text) => text === 'ctx.render(<div />)')).toBe(false);
  });

  it('keeps ctx.element completions for DOM container models', async () => {
    const hostCtx = {
      model: {
        constructor: {
          name: 'JSBlockModel',
        },
      },
    };
    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    const labels = labelsOf(completions);

    expect(labels.has('ctx.element.innerHTML')).toBe(true);
    expect(labels.has('ctx.element.setAttribute()')).toBe(true);
    expect(labels.has('ctx.libs.ReactDOM.createRoot()')).toBe(true);
    expect(labels.has('ctx.render()')).toBe(true);

    const renderCompletion = completions.find((c: any) => c.label === 'ctx.render()');
    const mockView = { dispatch: vi.fn() } as any;
    (renderCompletion as any).apply?.(mockView, renderCompletion, 0, 0);
    expect(mockView.dispatch.mock.calls[0][0]?.changes?.insert).toBe('ctx.render(<div />)');
  });

  it('hides ctx.element-dependent completions for eventFlow', async () => {
    const hostCtx = {
      model: {
        constructor: {
          name: 'JSBlockModel',
        },
      },
    };
    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'eventFlow');
    const labels = labelsOf(completions);
    const appliedTexts = appliedTextsOf(completions);

    expect([...labels].some((label) => String(label).startsWith('ctx.element'))).toBe(false);
    expect(labels.has('ctx.libs.ReactDOM.createRoot()')).toBe(false);
    expect(labels.has('ctx.ReactDOM.createRoot()')).toBe(false);
    expect(labels.has('ctx.viewer.popover()')).toBe(false);
    expect(labels.has('ctx.viewer.embed()')).toBe(false);
    expect(labels.has('ctx.render()')).toBe(false);
    expect(appliedTexts.some((text) => /\bctx\.element\b/.test(text))).toBe(false);
    expect(appliedTexts.some((text) => text === 'ctx.render(<div />)')).toBe(false);
  });

  it('hides ctx.element-dependent completions for non-DOM action models', async () => {
    for (const [modelName, scene] of [
      ['JSRecordActionModel', 'table'],
      ['JSFormActionModel', 'form'],
      ['FilterFormJSActionModel', 'form'],
    ]) {
      const hostCtx = {
        model: {
          constructor: {
            name: modelName,
          },
        },
      };
      const { completions } = await buildRunJSCompletions(hostCtx, 'v1', scene);
      const labels = labelsOf(completions);
      const appliedTexts = appliedTextsOf(completions);

      expect([...labels].some((label) => String(label).startsWith('ctx.element'))).toBe(false);
      expect(labels.has('ctx.libs.ReactDOM.createRoot()')).toBe(false);
      expect(labels.has('ctx.ReactDOM.createRoot()')).toBe(false);
      expect(labels.has('ctx.render()')).toBe(false);
      expect(appliedTexts.some((text) => /\bctx\.element\b/.test(text))).toBe(false);
      expect(appliedTexts.some((text) => text === 'ctx.render(<div />)')).toBe(false);
    }
  });

  it('uses friendly insertText for ctx.loadCSS and ctx.previewRunJS', async () => {
    const { completions } = await buildRunJSCompletions({}, 'v1', 'block');

    for (const [label, expected] of [
      ['ctx.loadCSS()', "await ctx.loadCSS('https://example.com/style.css')"],
      ['ctx.previewRunJS()', "await ctx.previewRunJS('console.log(1)', 'v2')"],
      ['ctx.resolveJsonTemplate()', "await ctx.resolveJsonTemplate({ value: '{{ctx.record.id}}' })"],
    ]) {
      const completion = completions.find((c: any) => c.label === label);
      expect(completion).toBeTruthy();
      expect(typeof (completion as any).apply).toBe('function');

      const mockView = { dispatch: vi.fn() } as any;
      (completion as any).apply?.(mockView, completion, 0, 0);
      expect(mockView.dispatch.mock.calls[0][0]?.changes?.insert).toBe(expected);
      expect(mockView.dispatch.mock.calls[0][0]?.changes?.insert).not.toBe(label);
    }
  });

  it('requests completion metadata from ctx.getApiInfos() for editor completions', async () => {
    const getApiInfos = vi.fn(async (options?: any) => ({
      customRuntime: {
        type: 'function',
        description: 'custom runtime helper',
        completion: {
          insertText: options?.includeCompletion ? "await ctx.customRuntime('value')" : undefined,
        },
      },
    }));

    const { completions } = await buildRunJSCompletions({ getApiInfos }, 'v1', 'block');

    expect(getApiInfos).toHaveBeenCalledWith({ version: 'v1', includeCompletion: true });
    const completion = completions.find((c: any) => c.label === 'ctx.customRuntime()');
    expect(completion).toBeTruthy();

    const mockView = { dispatch: vi.fn() } as any;
    (completion as any).apply?.(mockView, completion, 0, 0);
    expect(mockView.dispatch.mock.calls[0][0]?.changes?.insert).toBe("await ctx.customRuntime('value')");
  });

  it('keeps friendly insertText for ctx.resolveJsonTemplate with Chinese docs', async () => {
    const hostCtx = {
      api: {
        auth: {
          locale: 'zh-CN',
        },
      },
    };
    const { completions } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    const completion = completions.find((c: any) => c.label === 'ctx.resolveJsonTemplate()');
    expect(completion).toBeTruthy();

    const mockView = { dispatch: vi.fn() } as any;
    (completion as any).apply?.(mockView, completion, 0, 0);
    expect(mockView.dispatch.mock.calls[0][0]?.changes?.insert).toBe(
      "await ctx.resolveJsonTemplate({ value: '{{ctx.record.id}}' })",
    );
  });
});
