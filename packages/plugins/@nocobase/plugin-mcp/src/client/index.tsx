/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CodeEditorExtension, Plugin } from '@nocobase/client';

export class PluginMcpClient extends Plugin {
  async load() {
    const editors = new Map<
      string,
      {
        editorUid: string;
        editorRef: any;
        hostCtx: any;
        meta: {
          name?: string;
          scene?: string | string[];
          language?: string;
        };
        updatedAt: number;
      }
    >();

    CodeEditorExtension.registerObserver({
      name: 'mcp-bridge',
      onMount(payload) {
        editors.set(payload.editorUid, {
          editorUid: payload.editorUid,
          editorRef: payload.editorRef,
          hostCtx: payload.hostCtx,
          meta: {
            name: payload.name,
            scene: payload.scene,
            language: payload.language,
          },
          updatedAt: Date.now(),
        });
      },
      onUpdate(payload) {
        const prev = editors.get(payload.editorUid);
        editors.set(payload.editorUid, {
          editorUid: payload.editorUid,
          editorRef: payload.editorRef,
          hostCtx: payload.hostCtx,
          meta: {
            name: payload.name,
            scene: payload.scene,
            language: payload.language,
          },
          updatedAt: Date.now(),
        });
        // keep latest ref/meta; nothing else required
        void prev;
      },
      onUnmount(payload) {
        editors.delete(payload.editorUid);
      },
    });

    const send = (type: string, payload: any) => {
      this.app.ws.send(
        JSON.stringify({
          type,
          payload,
        }),
      );
    };

    const sendHello = () => {
      try {
        send('mcp:hello', { url: window.location.href, ts: Date.now() });
      } catch (e) {
        // ignore
      }
    };

    this.app.ws.on('open', () => {
      sendHello();
    });
    if (this.app.ws.connected) {
      sendHello();
    }

    const pickEditor = (editorUid?: string) => {
      if (editorUid) {
        const found = editors.get(String(editorUid));
        if (found) return found;
      }
      let best: any = null;
      for (const e of editors.values()) {
        if (!best || e.updatedAt > best.updatedAt) best = e;
      }
      return best;
    };

    const getRootEngine = (engine: any) => {
      let cur = engine;
      let guard = 0;
      while (cur?.previousEngine && guard++ < 50) {
        cur = cur.previousEngine;
      }
      return cur;
    };

    const getTopEngine = (engine: any) => {
      let cur = engine;
      let guard = 0;
      while (cur?.nextEngine && guard++ < 50) {
        cur = cur.nextEngine;
      }
      return cur;
    };

    const isPageRootModel = (model: any) => {
      const use = model?.use;
      return (
        model?.subKey === 'page' &&
        typeof use === 'string' &&
        use.endsWith('PageModel') &&
        !use.endsWith('PageTabModel')
      );
    };

    const findPageModelsInEngine = (engine: any) => {
      const pages: any[] = [];
      if (!engine || typeof engine.forEachModel !== 'function') return pages;
      engine.forEachModel((m: any) => {
        if (isPageRootModel(m)) pages.push(m);
      });
      return pages;
    };

    const findPageModelByUid = (pageUid: string) => {
      const root = getRootEngine(this.app.flowEngine);
      let cur = root;
      let guard = 0;
      while (cur && guard++ < 50) {
        const found = typeof cur.getModel === 'function' ? cur.getModel(pageUid) : undefined;
        if (found && isPageRootModel(found)) return found;
        cur = cur.nextEngine;
      }
      return null;
    };

    const pickActivePageModel = () => {
      const top = getTopEngine(this.app.flowEngine);
      let cur = top;
      let guard = 0;
      while (cur && guard++ < 50) {
        const pages = findPageModelsInEngine(cur);
        if (pages.length) return pages[0];
        cur = cur.previousEngine;
      }
      return null;
    };

    const pickHostCtx = (params: any) => {
      const editorUid = params?.editorUid ? String(params.editorUid).trim() : '';
      if (editorUid) {
        const e = pickEditor(editorUid);
        if (e?.hostCtx) {
          return { hostCtx: e.hostCtx, editor: e, mode: 'editor' as const };
        }
      }

      const pageUid = params?.pageUid ? String(params.pageUid).trim() : '';
      if (pageUid) {
        const pageModel = findPageModelByUid(pageUid);
        if (!pageModel) {
          throw new Error(`pageUid not found: ${pageUid}`);
        }
        return { hostCtx: pageModel.context, pageUid: pageModel.uid, mode: 'page' as const };
      }

      const active = pickActivePageModel();
      if (!active) {
        throw new Error('No PageContext available. Open any page (CodeEditor is not required) and keep it online.');
      }
      return { hostCtx: active.context, pageUid: active.uid, mode: 'page' as const };
    };

    const safeResult = (result: any) => {
      // Ensure JSON-serializable where possible
      try {
        JSON.stringify(result);
        return result;
      } catch (e) {
        return { message: 'Result is not JSON serializable', value: String(result) };
      }
    };

    const normalizeError = (error: any) => {
      if (!error) return { message: 'Unknown error' };
      return {
        message: String(error?.message || error),
        name: typeof error?.name === 'string' ? error.name : undefined,
        stack: typeof error?.stack === 'string' ? error.stack : undefined,
      };
    };

    const handleRequest = async (requestId: string, method: string, params: any) => {
      switch (method) {
        case 'pages.list': {
          const root = getRootEngine(this.app.flowEngine);
          const top = getTopEngine(this.app.flowEngine);
          const pages: any[] = [];
          let cur = root;
          let guard = 0;
          while (cur && guard++ < 50) {
            const models = findPageModelsInEngine(cur);
            for (const m of models) {
              pages.push({
                pageUid: m.uid,
                use: m.use,
                viewUid: m?.context?.view?.inputArgs?.viewUid,
                isTopEngine: cur === top,
              });
            }
            cur = cur.nextEngine;
          }
          const active = pickActivePageModel();
          return { activePageUid: active?.uid, pages };
        }
        case 'editors.list': {
          return Array.from(editors.values())
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((e) => ({
              editorUid: e.editorUid,
              name: e.meta?.name,
              scene: e.meta?.scene,
              language: e.meta?.language,
              updatedAt: e.updatedAt,
              modelUid: e.hostCtx?.model?.uid,
              flowKey: e.hostCtx?.flowKey,
              currentStep: e.hostCtx?.currentStep,
            }));
        }
        case 'editors.read': {
          const editorUid = String(params?.editorUid || '').trim();
          if (!editorUid) throw new Error('editors.read: editorUid is required');
          const e = pickEditor(editorUid);
          if (!e) throw new Error(`editors.read: editor not found: ${editorUid}`);
          return String(e.editorRef?.read?.() ?? '');
        }
        case 'editors.write': {
          const editorUid = String(params?.editorUid || '').trim();
          if (!editorUid) throw new Error('editors.write: editorUid is required');
          const code = typeof params?.code === 'string' ? params.code : String(params?.code ?? '');
          const e = pickEditor(editorUid);
          if (!e) throw new Error(`editors.write: editor not found: ${editorUid}`);
          e.editorRef?.write?.(code);
          return { ok: true };
        }
        case 'flowContext.getApiInfos': {
          const { hostCtx } = pickHostCtx(params);
          return await hostCtx.getApiInfos(params?.options || {});
        }
        case 'flowContext.getEnvInfos': {
          const { hostCtx } = pickHostCtx(params);
          return await hostCtx.getEnvInfos();
        }
        case 'flowContext.getVarInfos': {
          const { hostCtx } = pickHostCtx(params);
          return await hostCtx.getVarInfos(params?.options || {});
        }
        case 'flowContext.getVar': {
          const { hostCtx } = pickHostCtx(params);
          const path = typeof params?.path === 'string' ? params.path : String(params?.path ?? '');
          return await hostCtx.getVar(path);
        }
        case 'flowContext.previewRunJS': {
          const { hostCtx } = pickHostCtx(params);
          const code = typeof params?.code === 'string' ? params.code : String(params?.code ?? '');
          if (typeof hostCtx.previewRunJS === 'function') {
            return await hostCtx.previewRunJS(code);
          }
          const fn = hostCtx?.engine?.context?.previewRunJS;
          if (typeof fn !== 'function') throw new Error('previewRunJS is not available in current context');
          return await fn.call(hostCtx.engine.context, code);
        }
        case 'ui.flowEngine.getModel': {
          const { hostCtx } = pickHostCtx(params);
          if (!hostCtx?.engine) throw new Error('ui.flowEngine.getModel: no engine context');
          const uid = String(params?.uid || '').trim();
          if (!uid) throw new Error('ui.flowEngine.getModel: uid is required');
          const global = params?.global === true;
          const model = hostCtx.engine.getModel(uid, global);
          return model ? model.serialize() : null;
        }
        case 'ui.flowEngine.createSubModel': {
          const { hostCtx } = pickHostCtx(params);
          if (!hostCtx?.engine) throw new Error('ui.flowEngine.createSubModel: no engine context');
          const parentUid = String(params?.parentUid || '').trim();
          const subKey = String(params?.subKey || '').trim();
          const subType = String(params?.subType || '').trim();
          const modelOptions = params?.model || {};
          if (!parentUid || !subKey || !subType) {
            throw new Error('ui.flowEngine.createSubModel: parentUid/subKey/subType are required');
          }
          if (subType !== 'array' && subType !== 'object') {
            throw new Error(`ui.flowEngine.createSubModel: invalid subType: ${subType}`);
          }

          const engine = hostCtx.engine;
          const parent = engine.getModel(parentUid, true);
          if (!parent) throw new Error(`ui.flowEngine.createSubModel: parent not found: ${parentUid}`);

          const shouldPersist = params?.persist !== false;
          let newModel: any;
          if (subType === 'array') {
            newModel = parent.addSubModel(subKey, modelOptions);
          } else {
            newModel = parent.setSubModel(subKey, modelOptions);
          }

          if (shouldPersist) {
            await newModel.save();
          }

          const insertBeforeUid = params?.insertBeforeUid ? String(params.insertBeforeUid).trim() : '';
          const insertAfterUid = params?.insertAfterUid ? String(params.insertAfterUid).trim() : '';
          const targetUid = insertBeforeUid || insertAfterUid;

          if (subType === 'array' && targetUid) {
            const target = engine.getModel(targetUid, true);
            if (!target) throw new Error(`ui.flowEngine.createSubModel: target not found: ${targetUid}`);
            if (target.parent?.uid !== newModel.parent?.uid) {
              throw new Error('ui.flowEngine.createSubModel: target is not under the same parent');
            }
            if (insertAfterUid) {
              await engine.moveModel(newModel.uid, targetUid, { persist: false });
              await engine.moveModel(newModel.uid, targetUid, { persist: shouldPersist });
            } else {
              await engine.moveModel(newModel.uid, targetUid, { persist: shouldPersist });
            }
          }

          return { uid: newModel.uid, model: newModel.serialize() };
        }
        case 'ui.flowEngine.moveModel': {
          const { hostCtx } = pickHostCtx(params);
          if (!hostCtx?.engine) throw new Error('ui.flowEngine.moveModel: no engine context');
          const sourceUid = String(params?.sourceUid || '').trim();
          const targetUid = String(params?.targetUid || '').trim();
          if (!sourceUid || !targetUid) throw new Error('ui.flowEngine.moveModel: sourceUid/targetUid are required');
          const engine = hostCtx.engine;
          const source = engine.getModel(sourceUid, true);
          const target = engine.getModel(targetUid, true);
          if (!source) throw new Error(`ui.flowEngine.moveModel: source not found: ${sourceUid}`);
          if (!target) throw new Error(`ui.flowEngine.moveModel: target not found: ${targetUid}`);
          const shouldPersist = params?.persist !== false;
          await engine.moveModel(sourceUid, targetUid, { persist: shouldPersist });
          return { ok: true };
        }
        case 'ui.flowEngine.destroyModel': {
          const { hostCtx } = pickHostCtx(params);
          if (!hostCtx?.engine) throw new Error('ui.flowEngine.destroyModel: no engine context');
          const uid = String(params?.uid || '').trim();
          if (!uid) throw new Error('ui.flowEngine.destroyModel: uid is required');
          const engine = hostCtx.engine;
          const exists = engine.getModel(uid, true);
          if (!exists) return { ok: true, removed: false };
          const shouldPersist = params?.persist !== false;
          if (shouldPersist) {
            await engine.destroyModel(uid);
          } else {
            engine.removeModel(uid);
          }
          return { ok: true, removed: true };
        }
        case 'ui.reload': {
          // Respond first, then reload to avoid pending timeouts.
          setTimeout(() => window.location.reload(), 50);
          return { ok: true };
        }
        default:
          throw new Error(`Unknown frontend method: ${method}`);
      }
    };

    const onRequest = async (event: any) => {
      const detail = event?.detail || {};
      const requestId = detail?.requestId ? String(detail.requestId) : '';
      const method = detail?.method ? String(detail.method) : '';
      const params = detail?.params || {};
      if (!requestId || !method) return;

      try {
        const result = await handleRequest(requestId, method, params);
        send('mcp:response', { requestId, ok: true, result: safeResult(result) });
      } catch (e) {
        send('mcp:response', { requestId, ok: false, error: normalizeError(e) });
      }
    };

    this.app.eventBus.addEventListener('ws:message:mcp:request', onRequest);
  }
}

export default PluginMcpClient;
