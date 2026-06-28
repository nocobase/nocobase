/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { VscError } from '../../shared/errors';
import type { RunJSSourceAdapter, RunJSSourceKind } from '../../shared/runjs-source-types';

export class RunJSSourceAdapterRegistry {
  private readonly adapters = new Map<RunJSSourceKind, RunJSSourceAdapter>();

  register(adapter: RunJSSourceAdapter): () => void {
    this.adapters.set(adapter.kind, adapter);

    return () => {
      if (this.adapters.get(adapter.kind) === adapter) {
        this.adapters.delete(adapter.kind);
      }
    };
  }

  get(kind: RunJSSourceKind): RunJSSourceAdapter | null {
    return this.adapters.get(kind) || null;
  }

  require(kind: RunJSSourceKind): RunJSSourceAdapter {
    const adapter = this.get(kind);

    if (!adapter) {
      throw new VscError('RUNJS_SOURCE_KIND_UNSUPPORTED', `RunJS source kind "${kind}" is not supported`, {
        details: {
          kind,
        },
      });
    }

    return adapter;
  }

  getKinds(): RunJSSourceKind[] {
    return Array.from(this.adapters.keys());
  }
}
