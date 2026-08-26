/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { setDiagnostics, Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';

export const WRAPPER_PRELUDE_LINES = 2; // (async () => {\n  try {\n  // user code starts at line 3

export function clearDiagnostics(view: EditorView | null | undefined) {
  try {
    if (view) view.dispatch(setDiagnostics(view.state, []));
  } catch (err) {
    // Debug: failed to clear diagnostics
    try {
      console.debug?.('[errorHelpers] clearDiagnostics failed', err);
    } catch (_) {
      void 0;
    }
  }
}

export function parseErrorLineColumn(err: any): { line: number; column: number } | null {
  const stack = String(err?.stack || err?.message || err || '');
  const lines = stack.split('\n');
  // Prefer RunJS user code frames (typically "<anonymous>:line:column") over external libs.
  // Many third-party library stacks contain URL frames first (e.g. https://cdn...:175:30),
  // which are not meaningful for mapping back to the editor.
  for (const ln of lines) {
    const m = ln.match(/<anonymous>:(\d+):(\d+)/);
    if (m) return { line: parseInt(m[1], 10), column: parseInt(m[2], 10) };
  }
  for (const ln of lines) {
    const m = ln.match(/:(\d+):(\d+)/); // fallback: pick first line:column found
    if (m) {
      const l = parseInt(m[1], 10);
      const c = parseInt(m[2], 10);
      if (!Number.isNaN(l) && !Number.isNaN(c)) return { line: l, column: c };
    }
  }
  const m2 = stack.match(/line\s*(\d+)\D+column\s*(\d+)/i);
  if (m2) return { line: parseInt(m2[1], 10), column: parseInt(m2[2], 10) };
  return null;
}

export function markErrorAt(
  view: EditorView,
  line: number,
  column: number,
  message: string,
  wrapperPreludeLines = WRAPPER_PRELUDE_LINES,
) {
  try {
    if (!view) return;
    const userLine = Math.max(1, line - wrapperPreludeLines);
    const lineInfo = view.state.doc.line(Math.min(userLine, view.state.doc.lines));
    const from = Math.min(lineInfo.from + Math.max(0, column - 1), lineInfo.to);
    const to = from;
    const diags: Diagnostic[] = [{ from, to, severity: 'error', message }];
    view.dispatch(setDiagnostics(view.state, diags));
    view.dispatch({ selection: { anchor: from }, scrollIntoView: true });
  } catch (err) {
    // Debug: failed to mark diagnostics
    try {
      console.debug?.('[errorHelpers] markErrorAt failed', err);
    } catch (_) {
      void 0;
    }
  }
}

export function jumpTo(view: EditorView, line: number, column: number, wrapperPreludeLines = WRAPPER_PRELUDE_LINES) {
  try {
    if (!view) return;
    const userLine = Math.max(1, line - wrapperPreludeLines);
    const lineInfo = view.state.doc.line(Math.min(userLine, view.state.doc.lines));
    const from = Math.min(lineInfo.from + Math.max(0, column - 1), lineInfo.to);
    view.dispatch({ selection: { anchor: from }, scrollIntoView: true });
  } catch (err) {
    // Debug: failed to jump to error position
    try {
      console.debug?.('[errorHelpers] jumpTo failed', err);
    } catch (_) {
      void 0;
    }
  }
}
