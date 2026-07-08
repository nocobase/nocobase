/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const EXTERNAL_IMPORT_SOURCE_TYPE = 'external-import';

export const EXTERNAL_IMPORT_CAPABILITIES = {
  structuredEvents: true,
  terminalOutput: false,
  resumeSession: false,
  liveSemanticMessage: false,
  stdinMessage: false,
  interrupt: false,
  terminate: false,
  artifacts: true,
  detectSessionId: false,
  resumeWithMessage: false,
} as const;

export const EXTERNAL_LOG_FORMATS = ['codex-jsonl', 'opencode-jsonl', 'claude-code-jsonl', 'text'] as const;

export type ExternalLogFormat = (typeof EXTERNAL_LOG_FORMATS)[number];
