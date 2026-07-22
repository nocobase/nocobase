/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FrontendToolManifest, FrontendToolPermission } from '../../common/frontend-tools';
import { cloneDeep } from 'lodash';

const TOOL_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export type FrontendToolRegistration = {
  name: string;
  title?: string;
  description: string;
  permission?: FrontendToolPermission;
  inputSchema?: Record<string, unknown>;
  execute: (args: unknown) => unknown | Promise<unknown>;
};

type FrontendToolEntry = {
  manifest: FrontendToolManifest;
  execute: FrontendToolRegistration['execute'];
};

const cloneManifest = (manifest: FrontendToolManifest): FrontendToolManifest => ({
  ...manifest,
  inputSchema: cloneDeep(manifest.inputSchema),
});

export class FrontendToolRegistry {
  private readonly tools = new Map<string, FrontendToolEntry>();

  register(blockUid: string, registration: FrontendToolRegistration): FrontendToolManifest {
    if (!blockUid) {
      throw new Error('Frontend tool block uid is required');
    }
    if (!TOOL_NAME_PATTERN.test(registration.name)) {
      throw new Error(
        'Frontend tool name must start with a letter and contain only letters, numbers, underscores, or hyphens',
      );
    }
    if (!registration.description) {
      throw new Error('Frontend tool description is required');
    }
    if (typeof registration.execute !== 'function') {
      throw new Error('Frontend tool execute function is required');
    }
    if (registration.inputSchema !== undefined && !isRecord(registration.inputSchema)) {
      throw new Error('Frontend tool input schema must be an object');
    }
    if (
      registration.permission !== undefined &&
      registration.permission !== 'ASK' &&
      registration.permission !== 'ALLOW'
    ) {
      throw new Error('Frontend tool permission must be ASK or ALLOW');
    }

    const id = `${blockUid}:${registration.name}`;
    const manifest: FrontendToolManifest = {
      id,
      blockUid,
      name: registration.name,
      title: registration.title,
      description: registration.description,
      permission: registration.permission ?? 'ASK',
      inputSchema: cloneDeep(registration.inputSchema ?? { type: 'object', properties: {} }),
    };
    this.tools.set(id, {
      manifest,
      execute: registration.execute,
    });
    return cloneManifest(manifest);
  }

  clear(blockUid: string): void {
    for (const [toolId, tool] of this.tools) {
      if (tool.manifest.blockUid === blockUid) {
        this.tools.delete(toolId);
      }
    }
  }

  list(blockUid: string): FrontendToolManifest[] {
    return Array.from(this.tools.values())
      .filter((tool) => tool.manifest.blockUid === blockUid)
      .map((tool) => cloneManifest(tool.manifest));
  }

  getManifest(toolId: string): FrontendToolManifest {
    const manifest = this.tools.get(toolId)?.manifest;
    if (!manifest) {
      throw new Error(`Frontend tool "${toolId}" is unavailable`);
    }
    return cloneManifest(manifest);
  }

  async execute(toolId: string, args: unknown): Promise<unknown> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Frontend tool "${toolId}" is unavailable`);
    }
    return tool.execute(args);
  }
}

export const getFrontendToolRegistry = (app?: {
  pm?: { get?: (name: string) => unknown };
}): FrontendToolRegistry | undefined => {
  const plugin = app?.pm?.get?.('ai') as { aiManager?: { frontendTools?: FrontendToolRegistry } } | undefined;
  return plugin?.aiManager?.frontendTools;
};
