/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import type { CodeEditorExtra, CodeEditorExtraRegistry, EditorRef } from '../types';

export type CodeEditorObserverPayload = {
  editorUid: string;
  name?: string;
  scene?: string | string[];
  language?: string;
  editorRef: EditorRef;
  hostCtx: any;
};

export type CodeEditorObserver = {
  name: string;
  onMount?: (payload: CodeEditorObserverPayload) => void;
  onUpdate?: (payload: CodeEditorObserverPayload) => void;
  onUnmount?: (payload: CodeEditorObserverPayload) => void;
};

export class CodeEditorExtension {
  private static rightExtras = new Registry<CodeEditorExtra>();
  private static observers = new Registry<CodeEditorObserver>();

  static registerRightExtra(options: CodeEditorExtraRegistry) {
    CodeEditorExtension.rightExtras.register(options.name, options.extra);
  }

  static getRightExtras(): CodeEditorExtra[] {
    return Array.from(CodeEditorExtension.rightExtras.getValues());
  }

  static registerObserver(observer: CodeEditorObserver) {
    CodeEditorExtension.observers.register(observer.name, observer);
  }

  private static forEachObserver(callback: (observer: CodeEditorObserver) => void) {
    for (const obs of CodeEditorExtension.observers.getValues()) {
      try {
        callback(obs);
      } catch (_) {
        // ignore
      }
    }
  }

  static notifyMount(payload: CodeEditorObserverPayload) {
    CodeEditorExtension.forEachObserver((o) => o.onMount?.(payload));
  }

  static notifyUpdate(payload: CodeEditorObserverPayload) {
    CodeEditorExtension.forEachObserver((o) => o.onUpdate?.(payload));
  }

  static notifyUnmount(payload: CodeEditorObserverPayload) {
    CodeEditorExtension.forEachObserver((o) => o.onUnmount?.(payload));
  }
}
