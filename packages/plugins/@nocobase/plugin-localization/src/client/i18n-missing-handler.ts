/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngineContext } from '@nocobase/flow-engine';
import _ from 'lodash';

export class MissingKeyHandler {
  static DEBOUNCE_DELAY = 2000;
  static fallbackNS = 'client';
  private sentMissingKeys = new Set<string>();
  private pendingMissingKeys = new Map<string, { key: string; ns: string }>();
  private submitPendingKeysDebounced: () => void;
  private missingKeyHandler: (lngs: readonly string[], ns: string, key: string) => void;
  private currentLocale?: string;

  constructor(private context: FlowEngineContext) {
    this.submitPendingKeysDebounced = _.debounce(() => {
      this.submitPendingKeys();
    }, MissingKeyHandler.DEBOUNCE_DELAY);
  }

  register() {
    const { i18n } = this.context;
    i18n.options.saveMissing = true;
    // i18n.options.saveMissingTo = 'current';
    this.missingKeyHandler = (lngs: readonly string[], ns: string, key: string) => {
      if (!this.context.flowSettingsEnabled) {
        return;
      }

      // 为了兼容 v1，暂不处理 client 和 ui-schema-storage 的缺失 key
      if (ns === 'client' || ns === 'ui-schema-storage') {
        return;
      }

      // if (ns !== MissingKeyHandler.fallbackNS) {
      //   this.removeClientFallback(key);
      // }
      // if (this.isFallbackClient(ns, key)) {
      //   return;
      // }

      const uniqueKey = `${ns}:${key}`;
      if (!key || this.sentMissingKeys.has(uniqueKey)) {
        return;
      }

      try {
        this.currentLocale = this.context.i18n?.language;
        this.sentMissingKeys.add(uniqueKey);
        this.pendingMissingKeys.set(uniqueKey, { key, ns });
        this.submitPendingKeysDebounced();
      } catch (error) {
        console.error('[i18n] Error in missingKeyHandler:', error);
      }

      return;
    };
    i18n.on('missingKey', this.missingKeyHandler);
  }

  unregister() {
    const { i18n } = this.context;
    i18n.options.saveMissing = false;
    if (this.missingKeyHandler) {
      i18n.off('missingKey', this.missingKeyHandler);
      this.missingKeyHandler = undefined;
    }
  }

  private isFallbackClient(ns: string, key: string): boolean {
    if (ns !== MissingKeyHandler.fallbackNS) {
      return false;
    }

    for (const pending of this.pendingMissingKeys.values()) {
      if (pending.key === key && pending.ns !== MissingKeyHandler.fallbackNS) {
        return true;
      }
    }

    for (const sent of this.sentMissingKeys) {
      const separatorIndex = sent.indexOf(':');
      if (separatorIndex > -1) {
        const sentNs = sent.slice(0, separatorIndex);
        const sentKey = sent.slice(separatorIndex + 1);
        if (sentKey === key && sentNs !== MissingKeyHandler.fallbackNS) {
          return true;
        }
      }
    }

    return false;
  }

  private removeClientFallback(key: string) {
    if (!key) {
      return;
    }
    this.pendingMissingKeys.delete(`${MissingKeyHandler.fallbackNS}:${key}`);
  }

  private async submitPendingKeys() {
    if (this.pendingMissingKeys.size === 0) {
      return;
    }

    try {
      const keysToSubmit = Array.from(this.pendingMissingKeys.values()).map(({ key, ns }) => ({ text: key, ns }));

      await this.context.api.request({
        method: 'POST',
        url: '/localizationTexts:missing',
        data: {
          keys: keysToSubmit,
          locale: this.currentLocale,
        },
      });

      this.pendingMissingKeys.clear();
    } catch (error) {
      console.error('[i18n] Failed to submit missing keys:', error);
    }
  }
}
