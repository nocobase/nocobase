/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSValue } from '@nocobase/flow-engine';
import type React from 'react';

import type { RunJSSourceLocator, RunJSSourceOpenWorkspaceResult, RunJSWorkspaceFile } from './types';

export interface RunJSStudioToolbarContext {
  locator: RunJSSourceLocator;
  workspace: RunJSSourceOpenWorkspaceResult;
  files: RunJSWorkspaceFile[];
  entryPath: string;
  version: string;
  readOnly: boolean;
  onExternalBindingPersisted: (value: Pick<RunJSValue, 'sourceMode' | 'sourceBinding'>) => Promise<void>;
}

export interface RunJSStudioToolbarContributionProps {
  context: RunJSStudioToolbarContext;
}

export interface RunJSStudioToolbarContribution {
  key: string;
  order?: number;
  isVisible?: (context: RunJSStudioToolbarContext) => boolean;
  component: React.ComponentType<RunJSStudioToolbarContributionProps>;
}

export class RunJSStudioToolbarRegistry {
  private readonly contributions = new Map<string, RunJSStudioToolbarContribution>();

  register(contribution: RunJSStudioToolbarContribution): () => void {
    this.contributions.set(contribution.key, contribution);
    return () => {
      if (this.contributions.get(contribution.key) === contribution) {
        this.contributions.delete(contribution.key);
      }
    };
  }

  list(context: RunJSStudioToolbarContext): RunJSStudioToolbarContribution[] {
    return Array.from(this.contributions.values())
      .filter((contribution) => contribution.isVisible?.(context) ?? true)
      .sort((left, right) => (left.order || 0) - (right.order || 0) || left.key.localeCompare(right.key));
  }
}

const globalRegistryState = globalThis as typeof globalThis & {
  __nocobaseRunJSStudioToolbarRegistry?: RunJSStudioToolbarRegistry;
};

export const runJSStudioToolbarRegistry =
  globalRegistryState.__nocobaseRunJSStudioToolbarRegistry ||
  (globalRegistryState.__nocobaseRunJSStudioToolbarRegistry = new RunJSStudioToolbarRegistry());
