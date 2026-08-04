/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsTemplateKind } from '../../../constants';
import type { JsTemplateDiagnostic } from '../../../shared/types';

export interface JsTemplateSourceFileInput {
  path: string;
  content?: string;
  blobHash?: string;
  size?: number;
  language?: string;
  operation?: 'upsert' | 'delete';
}

export interface NormalizedSourceFile {
  path: string;
  content: string;
  size: number;
  language?: string;
}

export interface TemplateBucket {
  kind: JsTemplateKind;
  templateName: string;
  rootPath: string;
  files: NormalizedSourceFile[];
}

export interface ParsedTemplateDescriptor {
  key: string;
  title: string | null;
  description: string | null;
  category: string | null;
  icon: string | null;
  tags: string[] | null;
  sort: number | null;
  settingsSchema: Record<string, unknown> | null;
}

export type DiagnosticTarget = Pick<JsTemplateDiagnostic, 'path' | 'kind' | 'templateName'>;
