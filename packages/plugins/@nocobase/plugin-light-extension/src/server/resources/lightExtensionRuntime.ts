/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType, ResourcerContext, ResourceOptions } from '@nocobase/resourcer';

import type { LightExtensionRuntimeResolveInput } from '../../shared/types';
import type { LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { RuntimeResolveService } from '../services/RuntimeResolveService';
import { createTypedResourceAction, getServiceContext, type ResourceActionInput } from './resourceAction';

export const lightExtensionRuntimeActionNames = ['resolve', 'getArtifact'] as const;

type LightExtensionRuntimeActionName = (typeof lightExtensionRuntimeActionNames)[number];
type ResourceActionRunner = (
  service: RuntimeResolveService,
  input: ResourceActionInput,
  currentUser: LightExtensionServiceContext,
) => Promise<unknown>;

const resourceActionRunners: Record<LightExtensionRuntimeActionName, ResourceActionRunner> = {
  resolve: (service, input, currentUser) =>
    service.resolve(input as unknown as LightExtensionRuntimeResolveInput, currentUser),
  getArtifact: (service, input, currentUser) => service.getArtifact(requireArtifactHash(input), currentUser),
};

export function createLightExtensionRuntimeResource(service: RuntimeResolveService): ResourceOptions {
  return {
    name: 'lightExtensionRuntime',
    only: [...lightExtensionRuntimeActionNames],
    actions: Object.fromEntries(
      lightExtensionRuntimeActionNames.map((actionName) => [
        actionName,
        actionName === 'getArtifact'
          ? createLightExtensionArtifactAction(service, resourceActionRunners[actionName])
          : createLightExtensionRuntimeAction(service, resourceActionRunners[actionName]),
      ]),
    ) as Record<LightExtensionRuntimeActionName, HandlerType>,
  };
}

function createLightExtensionRuntimeAction(service: RuntimeResolveService, run: ResourceActionRunner): HandlerType {
  const action = createTypedResourceAction({
    services: service,
    run,
    getServiceContext,
  });
  return async (ctx, next) => {
    await action(ctx, async () => undefined);
    setHeaders(ctx, { 'Cache-Control': 'no-store' });
    await next();
  };
}

function createLightExtensionArtifactAction(service: RuntimeResolveService, run: ResourceActionRunner): HandlerType {
  const action = createTypedResourceAction({
    services: service,
    run,
    getServiceContext,
  });
  return async (ctx, next) => {
    await action(ctx, async () => undefined);
    const body: unknown = ctx.body;
    const status = typeof ctx.status === 'number' ? ctx.status : 200;
    if (status < 400 && isArtifactBody(body)) {
      ctx.withoutDataWrapping = true;
      setHeaders(ctx, {
        ETag: `"${body.artifactHash}"`,
        'Cache-Control': 'private, max-age=31536000, immutable',
      });
    }
    await next();
  };
}

function requireArtifactHash(input: ResourceActionInput): string {
  const value = input.artifactHash || input.filterByTk;
  return typeof value === 'string' ? value : '';
}

function isArtifactBody(value: unknown): value is { artifactHash: string } {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { artifactHash?: unknown }).artifactHash === 'string'
  );
}

function setHeaders(ctx: ResourcerContext, headers: Record<string, string>): void {
  const set = (ctx as ResourcerContext & { set?: (headers: Record<string, string>) => void }).set;
  set?.call(ctx, headers);
}
