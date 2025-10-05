/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Completion } from '@codemirror/autocomplete';
import { FlowRunJSContext } from '@nocobase/flow-engine';

const buildLowcodeCompletions = (): Completion[] => {
  try {
    const doc = typeof (FlowRunJSContext as any)?.getDoc === 'function' ? (FlowRunJSContext as any).getDoc() : {};
    const completions: Completion[] = [];
    const toInfo = (value: any) => (typeof value === 'string' ? value : JSON.stringify(value));
    completions.push({
      label: 'ctx',
      type: 'class',
      detail: 'FlowRunJSContext',
      info: doc?.label || 'RunJS context',
      boost: 110,
    } as Completion);
    const collectProperties = (props: Record<string, any> | undefined, parentPath: string[] = []) => {
      if (!props) return;
      for (const [key, value] of Object.entries(props)) {
        const path = [...parentPath, key];
        const ctxLabel = `ctx.${path.join('.')}`;
        const depth = path.length;
        let description: any = value;
        let detail: string | undefined;
        let children: Record<string, any> | undefined;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          description = value.description ?? value.detail ?? value.type ?? value;
          detail = value.detail ?? value.type ?? 'ctx property';
          children = value.properties as Record<string, any> | undefined;
        }
        completions.push({
          label: ctxLabel,
          type: 'property',
          detail: detail || 'ctx property',
          info: toInfo(description),
          boost: Math.max(90 - depth * 5, 10),
        } as Completion);
        if (children) collectProperties(children, path);
      }
    };

    collectProperties(doc?.properties || {});
    const methods = doc?.methods || {};
    for (const key of Object.keys(methods)) {
      completions.push({
        label: `ctx.${key}()` as any,
        type: 'function',
        detail: 'ctx method',
        info: toInfo(methods[key]),
        boost: 95,
        apply: (view: any, _completion: any, from: number, to: number) => {
          view.dispatch({ changes: { from, to, insert: `ctx.${key}()` } });
        },
      } as Completion);
    }
    return completions;
  } catch (_) {
    return [];
  }
};

export default buildLowcodeCompletions();
