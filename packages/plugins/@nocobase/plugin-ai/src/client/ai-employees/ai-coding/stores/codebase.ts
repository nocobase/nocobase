/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { model } from '@nocobase/flow-engine';
import { EditorRef } from '@nocobase/client';

export type CodeEditorStore = {
  editorRef?: EditorRef;
  focus(editorRef: EditorRef): void;
  write(document: string): void;
  read(): string;
};

export const codeEditorStore = model<CodeEditorStore>({
  editorRef: undefined,

  focus(editorRef) {
    this.editorRef = editorRef;
  },

  write(document) {
    this.editorRef?.write(document);
  },

  read() {
    return this.editorRef?.read() ?? '';
  },
});
