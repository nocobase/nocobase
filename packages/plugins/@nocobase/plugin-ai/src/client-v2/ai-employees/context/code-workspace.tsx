/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CodeOutlined } from '@ant-design/icons';
import type { Application } from '@nocobase/client-v2';
import { Space } from 'antd';
import React from 'react';

import { useT } from '../../locale';
import { getFrontendToolRegistry } from '../../manager/frontend-tool-registry';
import type { ContextItem, WorkContextOptions } from '../types';
import { registerWorkspaceAuthoringTools } from '../tools/workspace-authoring';

type CodeWorkspaceContent = {
  surfaceId?: unknown;
};

function getSurfaceId(item: ContextItem): string | undefined {
  const content = item.content as CodeWorkspaceContent | undefined;
  const contentSurfaceId = typeof content?.surfaceId === 'string' ? content.surfaceId : undefined;
  if (contentSurfaceId && contentSurfaceId !== item.uid) {
    return undefined;
  }
  return contentSurfaceId || item.uid || undefined;
}

function CodeWorkspaceTag({ item }: { item: ContextItem }) {
  const t = useT();
  return (
    <Space>
      <CodeOutlined />
      <span>{item.title || t('Code workspace')}</span>
    </Space>
  );
}

export const CodeWorkspaceContext: WorkContextOptions = {
  name: 'code-workspace',
  tag: {
    Component: CodeWorkspaceTag,
  },
  getContent: async (app, item) => {
    const surfaceId = getSurfaceId(item);
    if (!surfaceId) {
      return workspaceContextError('', 'WORKSPACE_CONTEXT_MISMATCH', 'Workspace context identity is invalid.');
    }
    const surface = app.aiManager.authoringSurfaces.get(surfaceId);
    if (!surface) {
      return workspaceContextError(surfaceId, 'WORKSPACE_SURFACE_UNAVAILABLE', 'The bound workspace is unavailable.');
    }
    try {
      const snapshot = await surface.describe();
      if (app.aiManager.authoringSurfaces.get(surfaceId) !== surface) {
        return workspaceContextError(surfaceId, 'WORKSPACE_SURFACE_UNAVAILABLE', 'The bound workspace is unavailable.');
      }
      if (snapshot.surfaceId !== surfaceId) {
        return workspaceContextError(surfaceId, 'WORKSPACE_SURFACE_MISMATCH', 'The bound workspace identity changed.');
      }
      return snapshot;
    } catch (error) {
      if (app.aiManager.authoringSurfaces.get(surfaceId) !== surface) {
        return workspaceContextError(surfaceId, 'WORKSPACE_SURFACE_UNAVAILABLE', 'The bound workspace is unavailable.');
      }
      return workspaceContextError(
        surfaceId,
        getErrorCode(error),
        error instanceof Error ? error.message : 'Failed to describe the bound workspace.',
      );
    }
  },
  getFrontendTools: async (app, item) => {
    const surfaceId = getSurfaceId(item);
    const registry = getFrontendToolRegistry(app);
    if (!surfaceId || !registry) {
      return [];
    }
    return registerWorkspaceAuthoringTools(app as Application, registry, surfaceId);
  },
};

function workspaceContextError(surfaceId: string, code: string, message: string) {
  return {
    status: 'error',
    surfaceId,
    error: { code, message },
  };
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return 'WORKSPACE_CONTEXT_ERROR';
}
