/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const LOAD_FRONTEND_TOOL_NAME = 'loadFrontendTool';
export const EXECUTE_FRONTEND_TOOL_NAME = 'executeFrontendTool';

export type FrontendToolPermission = 'ASK' | 'ALLOW';

export type FrontendToolManifest = {
  id: string;
  blockUid: string;
  name: string;
  title?: string;
  description: string;
  permission: FrontendToolPermission;
  inputSchema: Record<string, unknown>;
};

export type FrontendToolInvokeResult = {
  status: 'success' | 'error';
  content: unknown;
};

export const isFrontendToolInvokeResult = (value: unknown): value is FrontendToolInvokeResult => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const result = value as Partial<FrontendToolInvokeResult>;
  return (result.status === 'success' || result.status === 'error') && 'content' in result;
};

export const isFrontendToolManifest = (value: unknown): value is FrontendToolManifest => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const manifest = value as Partial<FrontendToolManifest>;
  return (
    typeof manifest.id === 'string' &&
    !!manifest.id &&
    typeof manifest.blockUid === 'string' &&
    !!manifest.blockUid &&
    typeof manifest.name === 'string' &&
    !!manifest.name &&
    typeof manifest.description === 'string' &&
    !!manifest.description &&
    (manifest.permission === 'ASK' || manifest.permission === 'ALLOW') &&
    !!manifest.inputSchema &&
    typeof manifest.inputSchema === 'object' &&
    !Array.isArray(manifest.inputSchema)
  );
};
