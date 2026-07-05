/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { VscError } from '../shared/errors';
import type { VscRepositoryRecord } from '../shared/types';

export type VscPermissionAction =
  | 'createRepository'
  | 'getRepository'
  | 'archiveRepository'
  | 'pull'
  | 'getFile'
  | 'push'
  | 'listCommits'
  | 'getCommit'
  | 'diff'
  | 'diffFile'
  | 'restoreFile'
  | 'restoreCommit'
  | 'listRefs'
  | 'updateRef';

export interface VscPermissionRequestMetadata {
  resourceName?: string;
  actionName?: string;
  requestId?: string;
  path?: string;
  method?: string;
  requestSource?: string;
  locale?: string;
  timezone?: string;
  dataSource?: string;
  roleName?: string;
  roles?: string[];
}

export interface VscPermissionHookInput {
  userId: string | null;
  action: VscPermissionAction;
  repoId?: string;
  repository?: VscRepositoryRecord;
  ownerType?: string;
  ownerId?: string;
  request?: VscPermissionRequestMetadata;
  actionMetadata?: Record<string, unknown>;
  targetCommitId?: string;
  sourceCommitId?: string;
  refName?: string;
}

export interface VscPermissionDenyResult {
  allowed: false;
  reason?: string;
  details?: Record<string, unknown>;
}

export type VscPermissionHookResult = boolean | VscPermissionDenyResult | void;

export type VscPermissionHook = (
  input: VscPermissionHookInput,
) => VscPermissionHookResult | Promise<VscPermissionHookResult>;

export class VscPermissionHookRegistry {
  private readonly hooks = new Set<VscPermissionHook>();

  register(hook: VscPermissionHook): () => void {
    this.hooks.add(hook);

    return () => {
      this.unregister(hook);
    };
  }

  unregister(hook: VscPermissionHook) {
    this.hooks.delete(hook);
  }

  clear() {
    this.hooks.clear();
  }

  hasHooks(): boolean {
    return this.hooks.size > 0;
  }

  async assertAllowed(input: VscPermissionHookInput): Promise<void> {
    for (const hook of Array.from(this.hooks)) {
      const result = await hook(input);
      if (result === false) {
        throw new VscError('PERMISSION_DENIED', 'Permission denied');
      }
      if (isDenyResult(result)) {
        throw new VscError('PERMISSION_DENIED', result.reason || 'Permission denied', {
          details: result.details,
        });
      }
    }
  }
}

function isDenyResult(result: VscPermissionHookResult): result is VscPermissionDenyResult {
  return Boolean(result && typeof result === 'object' && result.allowed === false);
}
