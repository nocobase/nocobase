/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ComponentType } from 'react';
import { SnippetEntry } from './runjsCompletions';
import { RunLog } from './hooks/useCodeRunner';

export interface CodeEditorRevealTarget {
  path: string;
  line: number;
  column: number;
  requestId: string;
}

export interface CodeEditorDiagnostic {
  from: number;
  to: number;
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  code?: number | string;
}

/**
 * Shared types for CodeEditor components
 */
export interface EditorRef {
  write(document: string): void;
  read(): string;
  run?(): Promise<unknown>;
  buttonGroupHeight?: number;
  snippetEntries: SnippetEntry[];
  logs: RunLog[];
}

export type CodeEditorExtra = ComponentType<{
  name?: string;
  language?: string;
  scene?: string | string[];
  editorRef: EditorRef;
  setActive: (key: string, active: boolean) => void;
}>;

export type CodeEditorExtraRegistry = {
  name: string;
  extra: CodeEditorExtra;
};
