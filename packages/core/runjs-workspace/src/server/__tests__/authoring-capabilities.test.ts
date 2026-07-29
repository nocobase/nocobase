/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';
import type { HandlerType } from '@nocobase/resourcer';
import { describe, expect, it, vi } from 'vitest';

import manifest from '../../shared/runjs-authoring-contract.v1.json';
import {
  RUNJS_EXTERNALIZATION_DESTINATION_TYPES,
  RUNJS_EXTERNALIZATION_ENTRY_KINDS,
  type RunJSExternalizationCapabilityContribution,
} from '../../shared/authoring-contract';
import { VscPermissionHookRegistry } from '../permissions';
import {
  createRunJSSourcesResource,
  RUNJS_WORKSPACE_HOSTS,
  RunJSAuthoringCapabilityRegistry,
  RunJSSourceAdapterRegistry,
  RunJSSourceAuthoringInspectorRegistry,
} from '../runjs-sources';

const externalization: RunJSExternalizationCapabilityContribution = {
  id: 'test-externalization',
  entryKinds: RUNJS_EXTERNALIZATION_ENTRY_KINDS,
  destinationTypes: RUNJS_EXTERNALIZATION_DESTINATION_TYPES,
  supportsIdempotency: true,
  supportsMoveToInline: true,
};

describe('runJSSources:capabilities', () => {
  it('keeps Inline Workspace available while externalization is unavailable', async () => {
    const registry = new RunJSAuthoringCapabilityRegistry();
    const result = await invokeCapabilities(registry);

    expect(result.body).toEqual({
      authoringContractVersion: '1',
      inlineWorkspace: manifest.inlineWorkspace,
      externalization: {
        available: false,
        entryKinds: [],
        destinationTypes: [],
        supportsIdempotency: false,
        supportsMoveToInline: false,
      },
    });
    expect(result.withoutDataWrapping).toBe(true);
  });

  it('returns the exact manifest matrix when externalization is registered', async () => {
    const registry = new RunJSAuthoringCapabilityRegistry();
    registry.registerExternalization(externalization);

    await expect(invokeCapabilities(registry)).resolves.toMatchObject({ body: manifest });
    expect(manifest.inlineWorkspace.modelUses).toEqual(Object.keys(RUNJS_WORKSPACE_HOSTS));
  });

  it('registers idempotently and keeps stale unregister callbacks identity-safe', () => {
    const registry = new RunJSAuthoringCapabilityRegistry();
    const unregisterFirst = registry.registerExternalization(externalization);
    const unregisterSame = registry.registerExternalization(externalization);

    unregisterFirst();
    expect(registry.getExternalization()).toBe(externalization);
    unregisterSame();

    const replacement = { ...externalization };
    const unregisterReplacement = registry.registerExternalization(replacement);
    unregisterFirst();
    unregisterSame();

    expect(registry.getExternalization()).toBe(replacement);
    unregisterReplacement();
    expect(registry.getExternalization()).toBeUndefined();

    const unregisterReregistered = registry.registerExternalization(externalization);
    unregisterReplacement();
    expect(registry.getExternalization()).toBe(externalization);
    unregisterReregistered();
  });

  it('rejects empty and conflicting contribution identities', () => {
    const registry = new RunJSAuthoringCapabilityRegistry();
    registry.registerExternalization(externalization);

    expect(() => registry.registerExternalization({ ...externalization, id: '' })).toThrow('id is required');
    expect(() => registry.registerExternalization({ ...externalization })).toThrow('already registered');
  });
});

async function invokeCapabilities(registry: RunJSAuthoringCapabilityRegistry) {
  const resource = createRunJSSourcesResource(
    {} as Database,
    new RunJSSourceAdapterRegistry(),
    new VscPermissionHookRegistry(),
    new RunJSSourceAuthoringInspectorRegistry(),
    registry,
  );
  const actions = resource.actions as Record<string, HandlerType>;
  const capabilities = actions.capabilities;
  const ctx = {} as Context & { body?: unknown; withoutDataWrapping?: boolean };
  const next = vi.fn(async () => undefined);

  await capabilities(ctx, next);
  expect(next).toHaveBeenCalledOnce();
  return ctx;
}
