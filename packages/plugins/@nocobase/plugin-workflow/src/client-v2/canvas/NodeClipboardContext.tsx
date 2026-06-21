/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Canvas copy/paste, shared by BOTH canvases (ADR-0003). Copy a node to the
 * clipboard; an add-slot becomes a paste zone; pasting into a position where the
 * node's variable references are no longer in scope prompts to strip them (or
 * keep, with a warning). Pastes via `flow_nodes.duplicate`.
 *
 * The provider's runtime-neutral dependencies (`api`, `t`, antd `modal`/`message`)
 * resolve identically in either runtime (flow-engine `ctx.api`, `useT`,
 * `App.useApp`). The two genuinely runtime-specific bits — the canvas flow data
 * (`{ workflow, nodes, refresh }`) and the `executed` flag — are read through an
 * injected `useCanvasRuntime` hook so each canvas supplies its own source: the
 * modern canvas reads its `FlowContext` + `workflow.executed`, the legacy canvas
 * its own `FlowContext` + `versionStats.executed`. v1 imports this provider from
 * here (the allowed `v1 → v2` direction) and passes its own runtime hook, so a
 * single implementation serves both.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { App, Checkbox } from 'antd';
import { cloneDeep } from 'lodash';
import { useFlowContext as useFlowEngineContext } from '@nocobase/flow-engine';
import { useFlowContext, useWorkflowCanvasExecuted } from './contexts';
import { useT } from '../locale';
import { collectUpstreams, extractDependencyKeys, stripVariableReferences } from './nodeVariableUtils';

type ClipboardNode = {
  sourceId?: number;
  sourceKey?: string;
  type: string;
  title?: string;
  config?: Record<string, any>;
};

type PasteImpactItem = { key: string; title: string };
type PasteImpact = {
  status: 'safe' | 'warning' | 'disabled';
  impactedSelf: PasteImpactItem[];
  impactedDependents: PasteImpactItem[];
};

type NodeClipboardContextValue = {
  clipboard: ClipboardNode | null;
  copyNode: (node: any) => void;
  clearClipboard: () => void;
  getPasteImpact: (target: any) => PasteImpact;
  pasteNode: (target: any) => Promise<void>;
};

/** The per-canvas runtime data the provider needs but that differs by runtime —
 *  injected via `NodeClipboardContextProvider`'s `useCanvasRuntime` prop. */
export type CanvasClipboardRuntime = {
  workflow: any;
  nodes: any[] | undefined;
  refresh?: () => void;
  executed: boolean;
};

/** Default (modern-canvas) runtime source: the v2 `FlowContext` + `executed`. */
function useModernCanvasRuntime(): CanvasClipboardRuntime {
  const { workflow, nodes, refresh } = useFlowContext() ?? {};
  const executed = useWorkflowCanvasExecuted();
  return { workflow, nodes, refresh, executed: Boolean(executed) };
}

const NodeClipboardContext = createContext<NodeClipboardContextValue | null>(null);

export function useNodeClipboardContext() {
  return useContext(NodeClipboardContext);
}

export function NodeClipboardContextProvider(props: {
  children: React.ReactNode;
  /** Injected per-canvas runtime source. Defaults to the modern canvas's. The
   *  legacy canvas passes its own (v1 `FlowContext` + `versionStats.executed`). */
  useCanvasRuntime?: () => CanvasClipboardRuntime;
}) {
  const { useCanvasRuntime = useModernCanvasRuntime } = props;
  const ctx = useFlowEngineContext();
  const t = useT();
  const { workflow, nodes, refresh, executed } = useCanvasRuntime();
  const { modal, message } = App.useApp();
  const [clipboard, setClipboard] = useState<ClipboardNode | null>(null);

  const nodesByKey = useMemo(() => {
    const map = new Map<string, any>();
    (nodes ?? []).forEach((node: any) => {
      if (node?.key != null) {
        map.set(String(node.key), node);
      }
    });
    return map;
  }, [nodes]);

  const copyNode = useCallback(
    (node: any) => {
      if (!node || executed) {
        return;
      }
      setClipboard({
        sourceId: node.id,
        sourceKey: node.key ? String(node.key) : undefined,
        type: node.type,
        title: node.title,
        config: cloneDeep(node.config ?? {}),
      });
    },
    [executed],
  );

  const clearClipboard = useCallback(() => setClipboard(null), []);

  const getPasteImpact = useCallback(
    (target: any): PasteImpact => {
      if (!clipboard || !target) {
        return { status: 'disabled', impactedSelf: [], impactedDependents: [] };
      }
      const upstream = target.upstream ?? null;
      const upstreamSet = upstream ? collectUpstreams(upstream) : new Set<number>();
      const deps = extractDependencyKeys(clipboard.config ?? {});
      const impactedSelf: PasteImpactItem[] = [];

      deps.forEach((depKey) => {
        const depNode = nodesByKey.get(String(depKey));
        if (!depNode) {
          impactedSelf.push({ key: String(depKey), title: String(depKey) });
          return;
        }
        if (!upstreamSet.has(depNode.id)) {
          impactedSelf.push({ key: String(depKey), title: depNode.title });
        }
      });

      const status = impactedSelf.length ? 'warning' : 'safe';
      return { status, impactedSelf, impactedDependents: [] };
    },
    [clipboard, nodesByKey],
  );

  const duplicateNode = useCallback(
    async (values: Record<string, any>) => {
      if (!workflow?.id || !clipboard?.sourceId) {
        return false;
      }
      try {
        await ctx.api.resource('flow_nodes').duplicate({ filterByTk: clipboard.sourceId, values });
        setClipboard(null);
        refresh?.();
        return true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        message.error(t('Failed to paste node'));
        return false;
      }
    },
    [ctx, clipboard?.sourceId, message, refresh, workflow?.id, t],
  );

  const pasteNode = useCallback(
    async (target: any) => {
      if (!clipboard || executed) {
        return;
      }
      const impact = getPasteImpact(target);
      if (impact.status === 'disabled') {
        return;
      }
      const upstream = target?.upstream ?? null;
      const branchIndex = upstream ? target?.branchIndex ?? null : null;
      const baseConfig = cloneDeep(clipboard.config ?? {});
      const baseValues = { upstreamId: upstream?.id ?? null, branchIndex };

      if (impact.status === 'warning') {
        const impactedSelfTitles = impact.impactedSelf.map((item) => item.title).join(', ');
        const keepVariablesRef = { current: false };
        const keysToRemove = new Set(impact.impactedSelf.map((item) => item.key).filter(Boolean));
        modal.confirm({
          title: t('Confirm paste'),
          content: (
            <div>
              <div>
                {t('This action will remove invalid variable references, otherwise the workflow cannot run correctly.')}
              </div>
              {impactedSelfTitles ? (
                <div>{t('Impacted current node variables') + ': ' + impactedSelfTitles}</div>
              ) : null}
              <div style={{ marginTop: '0.75em' }}>
                <Checkbox onChange={(ev) => (keepVariablesRef.current = ev.target.checked)}>
                  {t('Keep variable references')}
                </Checkbox>
              </div>
            </div>
          ),
          onOk: async () => {
            if (keepVariablesRef.current) {
              const created = await duplicateNode(baseValues);
              if (created) {
                message.warning(
                  t('Keeping variable references requires manual adjustment, otherwise workflow may fail.'),
                );
              }
              return;
            }
            const cleaned = stripVariableReferences(baseConfig, keysToRemove);
            await duplicateNode({ ...baseValues, config: cleaned.value });
          },
        });
        return;
      }

      await duplicateNode(baseValues);
    },
    [clipboard, duplicateNode, executed, getPasteImpact, message, modal, t],
  );

  const value = useMemo<NodeClipboardContextValue>(
    () => ({ clipboard, copyNode, clearClipboard, getPasteImpact, pasteNode }),
    [clipboard, copyNode, clearClipboard, getPasteImpact, pasteNode],
  );

  return <NodeClipboardContext.Provider value={value}>{props.children}</NodeClipboardContext.Provider>;
}
