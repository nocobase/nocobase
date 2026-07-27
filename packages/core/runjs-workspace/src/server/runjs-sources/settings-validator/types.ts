/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSWorkspaceDiagnostic } from '../../../shared/runjs-source-contracts';

export interface NormalizedSourceFile {
  path: string;
  content: string;
  size: number;
  language?: string;
}

export interface ParsedEntryDescriptor {
  key: string;
  title: string | null;
  description: string | null;
  category: string | null;
  icon: string | null;
  tags: string[] | null;
  sort: number | null;
  settingsSchema: Record<string, unknown> | null;
}

export type DiagnosticTarget = Pick<RunJSWorkspaceDiagnostic, 'path' | 'kind' | 'entryName'>;

export interface RunJSWorkspaceSettingsCapabilities {
  schemaSubset: {
    allowedTypes: readonly string[];
    allowedKeywords: readonly string[];
  };
  xComponentWhitelist: readonly string[];
  conditions: {
    operators: readonly string[];
    logic: readonly string[];
    limits: {
      maxDepth: number;
      maxNodes: number;
      maxItemsPerGroup: number;
      maxPathSegments: number;
    };
  };
  limits: {
    maxEntryDescriptorBytes: number;
    maxJsonBytes: number;
    maxSettingsSchemaDepth: number;
  };
}
