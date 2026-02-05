/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { App, Checkbox } from 'antd';

import { useAPIClient, useCompile, usePlugin } from '@nocobase/client';

import WorkflowPlugin from '.';
import { useFlowContext } from './FlowContext';
import { useWorkflowExecuted } from './hooks';
import { lang } from './locale';
import useStyles from './style';
import { collectUpstreams, extractDependencyKeys, stripVariableReferences } from './nodeVariableUtils';

const NodeDragContext = createContext<any>(null);

export function useNodeDragContext() {
  return useContext(NodeDragContext);
}

function collectDownstreams(start, branchChildrenMap: Map<number, any[]>, visited = new Set<number>()): Set<number> {
  const result = new Set<number>();
  const stack = start ? [start] : [];
  while (stack.length) {
    const head = stack.pop();
    for (let node = head; node; node = node.downstream) {
      if (!node || visited.has(node.id)) {
        break;
      }
      visited.add(node.id);
      result.add(node.id);
      const branches = branchChildrenMap.get(node.id) ?? [];
      branches.forEach((branch) => stack.push(branch));
    }
  }
  return result;
}

function collectBranchSubtree(root, branchChildrenMap: Map<number, any[]>): Set<number> {
  const result = new Set<number>();
  if (!root) {
    return result;
  }
  result.add(root.id);
  const branchHeads = branchChildrenMap.get(root.id) ?? [];
  branchHeads.forEach((branch) => {
    collectDownstreams(branch, branchChildrenMap, result);
  });
  return result;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  return Boolean(
    target.closest(
      [
        'input',
        'textarea',
        'button',
        'a',
        '.workflow-node-actions',
        '.workflow-node-remove-button',
        '.workflow-node-action-button',
        '.workflow-node-config-button',
        '.ant-select',
        '.ant-dropdown',
        '.ant-picker',
        '.ant-switch',
      ].join(','),
    ),
  );
}

export function NodeDragContextProvider(props) {
  const api = useAPIClient();
  const compile = useCompile();
  const workflowPlugin = usePlugin(WorkflowPlugin);
  const { workflow, nodes, refresh } = useFlowContext() ?? {};
  const executed = useWorkflowExecuted();
  const { modal, message } = App.useApp();
  const { styles } = useStyles();

  const [dragging, setDragging] = useState(false);
  const [dragNode, setDragNode] = useState(null);
  const [activeDropKey, setActiveDropKey] = useState<string | null>(null);

  const dragNodeRef = useRef<any>(null);
  const dragSubtreeRef = useRef<Set<number>>(new Set());
  const activeDropRef = useRef<any>(null);
  const activeDropKeyRef = useRef<string | null>(null);
  const pendingRef = useRef<any>(null);
  const draggingRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const suppressClickRef = useRef(false);
  const clearSuppressTimer = useRef<number | null>(null);
  const onMouseMoveRef = useRef<(event: MouseEvent) => void>(() => {});
  const onMouseUpRef = useRef<() => void>(() => {});
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewRafRef = useRef<number | null>(null);
  const previewOffsetRef = useRef({ x: 0, y: 0 });
  const previewSizeRef = useRef({ width: 0, height: 0 });
  const dropZonesRef = useRef<Map<string, { target: any; element: HTMLElement }>>(new Map());
  const updateActiveDropRef = useRef<() => void>(() => {});
  const autoScrollRef = useRef<{
    raf: number | null;
    vx: number;
    vy: number;
    container: HTMLElement | null;
  }>({ raf: null, vx: 0, vy: 0, container: null });

  const branchChildrenMap = useMemo(() => {
    const map = new Map<number, any[]>();
    if (!nodes) {
      return map;
    }
    nodes.forEach((node) => {
      if (node.branchIndex != null && node.upstreamId != null) {
        const list = map.get(node.upstreamId) ?? [];
        list.push(node);
        map.set(node.upstreamId, list);
      }
    });
    return map;
  }, [nodes]);

  const nodesByKey = useMemo(() => {
    const map = new Map<string, any>();
    if (!nodes) {
      return map;
    }
    nodes.forEach((node) => {
      if (node?.key != null) {
        map.set(String(node.key), node);
      }
    });
    return map;
  }, [nodes]);

  const { nodeDepsMap, dependentsMap } = useMemo(() => {
    const deps = new Map<number, Set<string>>();
    const dependents = new Map<string, Set<any>>();
    if (!nodes) {
      return { nodeDepsMap: deps, dependentsMap: dependents };
    }
    nodes.forEach((node) => {
      const nodeDeps = extractDependencyKeys(node.config ?? {});
      deps.set(node.id, nodeDeps);
      nodeDeps.forEach((depKey) => {
        const list = dependents.get(depKey) ?? new Set<any>();
        list.add(node);
        dependents.set(depKey, list);
      });
    });
    return { nodeDepsMap: deps, dependentsMap: dependents };
  }, [nodes]);

  const resetSuppressClick = useCallback(() => {
    suppressClickRef.current = false;
    if (clearSuppressTimer.current) {
      window.clearTimeout(clearSuppressTimer.current);
      clearSuppressTimer.current = null;
    }
  }, []);

  const consumeClick = useCallback(() => {
    if (suppressClickRef.current) {
      resetSuppressClick();
      return true;
    }
    return false;
  }, [resetSuppressClick]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    onMouseMoveRef.current?.(event);
  }, []);

  const handleMouseUp = useCallback(() => {
    onMouseUpRef.current?.();
  }, []);

  const getScrollContainer = useCallback(() => {
    const cached = autoScrollRef.current.container;
    if (cached && document.contains(cached)) {
      return cached;
    }
    const container = document.querySelector('.workflow-canvas') as HTMLElement | null;
    autoScrollRef.current.container = container;
    return container;
  }, []);

  const stopAutoScroll = useCallback(() => {
    autoScrollRef.current.vx = 0;
    autoScrollRef.current.vy = 0;
    if (autoScrollRef.current.raf) {
      window.cancelAnimationFrame(autoScrollRef.current.raf);
      autoScrollRef.current.raf = null;
    }
  }, []);

  const stepAutoScroll = useCallback(() => {
    const { vx, vy } = autoScrollRef.current;
    const container = getScrollContainer();
    if (!container || (!vx && !vy) || !draggingRef.current) {
      autoScrollRef.current.raf = null;
      return;
    }
    container.scrollBy({ left: vx, top: vy });
    updateActiveDropRef.current();
    autoScrollRef.current.raf = window.requestAnimationFrame(stepAutoScroll);
  }, [getScrollContainer]);

  const updateAutoScroll = useCallback(
    (clientX: number, clientY: number) => {
      const container = getScrollContainer();
      if (!container) {
        stopAutoScroll();
        return;
      }
      const rect = container.getBoundingClientRect();
      const edge = 80;
      const maxSpeed = 20;
      const calcSpeed = (distance: number) => {
        if (distance <= 0) {
          return 0;
        }
        const ratio = Math.min(distance / edge, 1);
        return ratio * maxSpeed;
      };

      let vx = 0;
      let vy = 0;
      const topDistance = edge - (clientY - rect.top);
      const bottomDistance = edge - (rect.bottom - clientY);
      const leftDistance = edge - (clientX - rect.left);
      const rightDistance = edge - (rect.right - clientX);

      if (topDistance > 0) {
        vy = -calcSpeed(topDistance);
      } else if (bottomDistance > 0) {
        vy = calcSpeed(bottomDistance);
      }

      if (leftDistance > 0) {
        vx = -calcSpeed(leftDistance);
      } else if (rightDistance > 0) {
        vx = calcSpeed(rightDistance);
      }

      autoScrollRef.current.vx = vx;
      autoScrollRef.current.vy = vy;
      if (vx || vy) {
        if (!autoScrollRef.current.raf) {
          autoScrollRef.current.raf = window.requestAnimationFrame(stepAutoScroll);
        }
      } else {
        stopAutoScroll();
      }
    },
    [getScrollContainer, stepAutoScroll, stopAutoScroll],
  );

  const cleanupDrag = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    pendingRef.current = null;
    draggingRef.current = false;
    activeDropRef.current = null;
    dragNodeRef.current = null;
    dragSubtreeRef.current = new Set();
    setDragging(false);
    setDragNode(null);
    activeDropKeyRef.current = null;
    setActiveDropKey(null);
    stopAutoScroll();
    clearSuppressTimer.current = window.setTimeout(() => {
      resetSuppressClick();
    }, 0);
  }, [handleMouseMove, handleMouseUp, resetSuppressClick, stopAutoScroll]);

  const getDropKey = useCallback((target) => {
    const upstreamId = target?.upstream?.id ?? 'root';
    const branchIndex = target?.upstream ? target?.branchIndex ?? 'null' : 'root';
    return `${upstreamId}:${branchIndex}`;
  }, []);

  const updateActiveDropByPreview = useCallback(() => {
    if (!draggingRef.current || !previewRef.current) {
      return;
    }
    const { width, height } = previewSizeRef.current;
    if (!width || !height) {
      return;
    }
    const centerX = pointerRef.current.x;
    const centerY = pointerRef.current.y;
    const previewRect = {
      left: centerX - width / 2,
      right: centerX + width / 2,
      top: centerY - height / 2,
      bottom: centerY + height / 2,
      width,
      height,
    };
    const isLeaving = Boolean(activeDropKeyRef.current);
    const widthThreshold = width * (isLeaving ? 0.18 : 0.25);
    const heightThreshold = height * (isLeaving ? 0.18 : 0.25);
    let best: { target: any; area: number; key: string } | null = null;

    for (const [key, item] of dropZonesRef.current.entries()) {
      if (!document.contains(item.element)) {
        dropZonesRef.current.delete(key);
        continue;
      }
      const zoneRect = item.element.getBoundingClientRect();
      const overlapWidth = Math.min(previewRect.right, zoneRect.right) - Math.max(previewRect.left, zoneRect.left);
      const overlapHeight = Math.min(previewRect.bottom, zoneRect.bottom) - Math.max(previewRect.top, zoneRect.top);
      if (overlapWidth <= 0 || overlapHeight <= 0) {
        continue;
      }
      if (overlapWidth < widthThreshold && overlapHeight < heightThreshold) {
        continue;
      }
      const area = overlapWidth * overlapHeight;
      if (!best || area > best.area) {
        best = { target: item.target, area, key };
      }
    }

    activeDropRef.current = best ? best.target : null;
    const nextKey = best?.key ?? null;
    if (nextKey !== activeDropKeyRef.current) {
      activeDropKeyRef.current = nextKey;
      setActiveDropKey(nextKey);
    }
  }, []);

  useEffect(() => {
    updateActiveDropRef.current = updateActiveDropByPreview;
  }, [updateActiveDropByPreview]);

  const getTargetDownstream = useCallback(
    (upstream, branchIndex, currentNode) => {
      if (!nodes) {
        return null;
      }
      if (!upstream) {
        return nodes.find((item) => item.upstreamId == null && item.id !== currentNode?.id) ?? null;
      }
      if (branchIndex == null) {
        return upstream.downstream ?? null;
      }
      return nodes.find((item) => item.upstreamId === upstream.id && item.branchIndex === branchIndex) ?? null;
    },
    [nodes],
  );

  const getDropImpact = useCallback(
    (target) => {
      const node = dragNodeRef.current;
      if (!node || !target) {
        return { status: 'disabled', impactedSelf: [], impactedDependents: [] };
      }
      const upstream = target.upstream ?? null;
      const branchIndex = upstream ? target.branchIndex ?? null : null;

      const sameUpstream = (node.upstreamId ?? null) === (upstream?.id ?? null);
      const sameBranchIndex = (node.branchIndex ?? null) === (branchIndex ?? null);
      if (sameUpstream && sameBranchIndex) {
        return { status: 'disabled', impactedSelf: [], impactedDependents: [] };
      }
      if (upstream && upstream.id === node.id) {
        return { status: 'disabled', impactedSelf: [], impactedDependents: [] };
      }
      if (upstream && dragSubtreeRef.current.has(upstream.id)) {
        return { status: 'disabled', impactedSelf: [], impactedDependents: [] };
      }

      const upstreamSet = upstream ? collectUpstreams(upstream) : new Set<number>();
      const targetDownstream = getTargetDownstream(upstream, branchIndex, node);
      const downstreamSet = targetDownstream
        ? collectDownstreams(targetDownstream, branchChildrenMap)
        : new Set<number>();

      const deps = nodeDepsMap.get(node.id) ?? new Set<string>();
      const impactedSelf = [] as any[];
      deps.forEach((depKey) => {
        const depNode = nodesByKey.get(String(depKey));
        if (!depNode) {
          return;
        }
        if (!upstreamSet.has(depNode.id)) {
          impactedSelf.push(depNode);
        }
      });

      const dependents = dependentsMap.get(String(node.key)) ?? new Set<any>();
      const impactedDependents = [] as any[];
      dependents.forEach((depNode) => {
        if (depNode.id === node.id) {
          return;
        }
        if (dragSubtreeRef.current.has(depNode.id)) {
          return;
        }
        if (downstreamSet.has(depNode.id)) {
          return;
        }
        impactedDependents.push(depNode);
      });

      const status = impactedSelf.length || impactedDependents.length ? 'warning' : 'safe';
      return { status, impactedSelf, impactedDependents };
    },
    [branchChildrenMap, dependentsMap, getTargetDownstream, nodeDepsMap, nodesByKey],
  );

  const moveNode = useCallback(
    async (nodeId, target, options?: { refresh?: boolean }) => {
      if (!nodeId) {
        return false;
      }
      const upstream = target?.upstream ?? null;
      const branchIndex = upstream ? target.branchIndex ?? null : null;
      try {
        await api.resource('flow_nodes').move({
          filterByTk: nodeId,
          values: {
            upstreamId: upstream?.id ?? null,
            branchIndex,
          },
        });
        if (options?.refresh !== false) {
          refresh();
        }
        return true;
      } catch (err) {
        console.error(err);
        message.error(lang('Failed to move node'));
        return false;
      }
    },
    [api, message, refresh],
  );

  const updateNodeConfigs = useCallback(
    async (items: { node: any; keys: Set<string> }[]) => {
      let updated = false;
      for (const item of items) {
        const { node, keys } = item;
        if (!node || !keys.size) {
          continue;
        }
        const result = stripVariableReferences(node.config ?? {}, keys);
        if (!result.changed) {
          continue;
        }
        updated = true;
        await api.resource('flow_nodes').update({
          filterByTk: node.id,
          values: {
            config: result.value,
          },
        });
      }
      return updated;
    },
    [api],
  );

  const handleDrop = useCallback(async () => {
    const node = dragNodeRef.current;
    const target = activeDropRef.current;
    if (!node || !target) {
      return;
    }
    const nodeId = node.id;
    const impact = getDropImpact(target);
    if (impact.status === 'disabled') {
      return;
    }
    if (impact.status === 'warning') {
      const impactedSelfTitles = impact.impactedSelf.map((item) => item.title).join(', ');
      const impactedDependentTitles = impact.impactedDependents.map((item) => item.title).join(', ');
      const keepVariablesRef = { current: false };
      const updates: { node: any; keys: Set<string> }[] = [];
      const selfKeys = new Set(impact.impactedSelf.map((item) => String(item.key)).filter(Boolean));
      if (selfKeys.size) {
        updates.push({ node, keys: selfKeys });
      }
      const currentKey = node?.key ? String(node.key) : '';
      if (currentKey) {
        impact.impactedDependents.forEach((dep) => {
          updates.push({ node: dep, keys: new Set([currentKey]) });
        });
      }
      modal.confirm({
        title: lang('Confirm move'),
        content: (
          <div>
            <div>
              {lang(
                'This action will remove invalid variable references, otherwise the workflow cannot run correctly.',
              )}
            </div>
            {impactedSelfTitles ? (
              <div>{lang('Impacted current node variables') + ': ' + impactedSelfTitles}</div>
            ) : null}
            {impactedDependentTitles ? (
              <div>{lang('Impacted dependent node variables') + ': ' + impactedDependentTitles}</div>
            ) : null}
            <div style={{ marginTop: '0.75em' }}>
              <Checkbox onChange={(ev) => (keepVariablesRef.current = ev.target.checked)}>
                {lang('Keep variable references')}
              </Checkbox>
            </div>
          </div>
        ),
        onOk: async () => {
          if (keepVariablesRef.current) {
            const moved = await moveNode(nodeId, target);
            if (moved) {
              message.warning(
                lang('Keeping variable references requires manual adjustment, otherwise workflow may fail.'),
              );
            }
            return;
          }
          const moved = await moveNode(nodeId, target, { refresh: false });
          if (!moved) {
            return;
          }
          try {
            await updateNodeConfigs(updates);
          } catch (err) {
            console.error(err);
            message.error(lang('Failed to update node variables'));
          } finally {
            refresh();
          }
        },
      });
      return;
    }
    await moveNode(nodeId, target);
  }, [getDropImpact, message, modal, moveNode, refresh, updateNodeConfigs]);

  useEffect(() => {
    onMouseMoveRef.current = (event: MouseEvent) => {
      if (!pendingRef.current) {
        return;
      }
      const { startX, startY, node } = pendingRef.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!draggingRef.current) {
        if (Math.abs(dx) + Math.abs(dy) < 3) {
          return;
        }
        draggingRef.current = true;
        suppressClickRef.current = true;
        dragNodeRef.current = node;
        dragSubtreeRef.current = collectBranchSubtree(node, branchChildrenMap);
        setDragging(true);
        setDragNode({
          id: node.id,
          key: node.key,
          title: node.title,
          type: node.type,
          hasBranches: (branchChildrenMap.get(node.id)?.length ?? 0) > 0,
        });
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (draggingRef.current) {
        updateAutoScroll(event.clientX, event.clientY);
        updateActiveDropByPreview();
      }
    };
  }, [branchChildrenMap, updateActiveDropByPreview, updateAutoScroll]);

  useEffect(() => {
    onMouseUpRef.current = () => {
      if (draggingRef.current) {
        handleDrop();
      }
      cleanupDrag();
    };
  }, [cleanupDrag, handleDrop]);

  useEffect(() => {
    if (!dragging || !dragNode) {
      if (previewRafRef.current) {
        window.cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
      }
      if (previewRef.current) {
        previewRef.current.remove();
        previewRef.current = null;
      }
      return;
    }

    const instruction = workflowPlugin.instructions.get(dragNode.type);
    const typeTitle = instruction ? compile(instruction.title) : dragNode.type;

    const preview = document.createElement('div');
    preview.className = styles.dragPreviewClass;
    if (dragNode.hasBranches) {
      preview.classList.add('drag-preview-group');
    }
    preview.style.position = 'fixed';
    preview.style.top = '0';
    preview.style.left = '0';
    preview.style.zIndex = '10000';
    preview.style.pointerEvents = 'none';
    const previewType = document.createElement('div');
    previewType.className = 'workflow-drag-preview-type';
    previewType.textContent = typeTitle;
    const previewTitle = document.createElement('div');
    previewTitle.className = 'workflow-drag-preview-title';
    previewTitle.textContent = dragNode.title ?? '';
    if (dragNode.hasBranches) {
      const stack2 = document.createElement('div');
      stack2.className = 'workflow-drag-preview-stack stack-2';
      const stack1 = document.createElement('div');
      stack1.className = 'workflow-drag-preview-stack stack-1';
      preview.append(stack2, stack1, previewType, previewTitle);
    } else {
      preview.append(previewType, previewTitle);
    }

    document.body.appendChild(preview);
    previewRef.current = preview;
    previewOffsetRef.current = { x: 0, y: 0 };
    previewSizeRef.current = { width: preview.offsetWidth, height: preview.offsetHeight };

    const tick = () => {
      const { x, y } = pointerRef.current || { x: 0, y: 0 };
      if (!previewOffsetRef.current.x && !previewOffsetRef.current.y) {
        const rect = preview.getBoundingClientRect();
        previewOffsetRef.current = { x: rect.width / 2, y: rect.height / 2 };
      }
      const { x: offsetX, y: offsetY } = previewOffsetRef.current;
      preview.style.transform = `translate3d(${x - offsetX}px, ${y - offsetY}px, 0) rotate(-6deg)`;
      previewRafRef.current = window.requestAnimationFrame(tick);
    };
    previewRafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (previewRafRef.current) {
        window.cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
      }
      if (previewRef.current) {
        previewRef.current.remove();
        previewRef.current = null;
      }
    };
  }, [compile, dragNode, dragging, styles.dragPreviewClass, workflowPlugin.instructions]);

  const onNodeMouseDown = useCallback(
    (node, event: React.MouseEvent) => {
      if (!workflow || executed > 0n) {
        return;
      }
      if (event.button !== 0) {
        return;
      }
      if (isInteractiveTarget(event.target)) {
        return;
      }
      pendingRef.current = {
        node,
        startX: event.clientX,
        startY: event.clientY,
      };
      pointerRef.current = { x: event.clientX, y: event.clientY };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [executed, handleMouseMove, handleMouseUp, workflow],
  );

  const setActiveDrop = useCallback(
    (target) => {
      activeDropRef.current = target;
      const nextKey = target ? getDropKey(target) : null;
      if (nextKey !== activeDropKeyRef.current) {
        activeDropKeyRef.current = nextKey;
        setActiveDropKey(nextKey);
      }
    },
    [getDropKey],
  );

  const clearActiveDrop = useCallback((target) => {
    if (activeDropRef.current === target) {
      activeDropRef.current = null;
      if (activeDropKeyRef.current) {
        activeDropKeyRef.current = null;
        setActiveDropKey(null);
      }
    }
  }, []);

  const registerDropZone = useCallback(
    (target, element: HTMLElement) => {
      if (!element || !target) {
        return () => {};
      }
      const key = getDropKey(target);
      dropZonesRef.current.set(key, { target, element });
      return () => {
        dropZonesRef.current.delete(key);
      };
    },
    [getDropKey],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const value = useMemo(
    () => ({
      dragging,
      dragNode,
      onNodeMouseDown,
      getDropImpact,
      setActiveDrop,
      clearActiveDrop,
      registerDropZone,
      getDropKey,
      activeDropKey,
      consumeClick,
    }),
    [
      activeDropKey,
      consumeClick,
      dragging,
      dragNode,
      getDropImpact,
      getDropKey,
      onNodeMouseDown,
      setActiveDrop,
      clearActiveDrop,
      registerDropZone,
    ],
  );

  return <NodeDragContext.Provider value={value}>{props.children}</NodeDragContext.Provider>;
}
