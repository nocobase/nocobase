/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType, ResourcerContext, ResourceOptions } from '@nocobase/resourcer';

import type { JsTemplateRuntimeResolveInput } from '../../shared/types';
import type { JsTemplateServiceContext } from '../services/JsTemplateProjectService';
import { JsTemplateRuntimeService } from '../services/JsTemplateRuntimeService';
import { createTypedResourceAction, getServiceContext, type ResourceActionInput } from './resourceAction';

export const jsTemplateRuntimeActionNames = ['resolve', 'getArtifact'] as const;

type JsTemplateRuntimeActionName = (typeof jsTemplateRuntimeActionNames)[number];
type ResourceActionRunner = (
  service: JsTemplateRuntimeService,
  input: ResourceActionInput,
  currentUser: JsTemplateServiceContext,
) => Promise<unknown>;

const resourceActionRunners: Record<JsTemplateRuntimeActionName, ResourceActionRunner> = {
  resolve: (service, input, currentUser) =>
    service.resolve(input as unknown as JsTemplateRuntimeResolveInput, currentUser),
  getArtifact: (service, input, currentUser) => service.getArtifact(requireArtifactHash(input), currentUser),
};

export function createJsTemplateRuntimeResource(service: JsTemplateRuntimeService): ResourceOptions {
  return {
    name: 'jsTemplateRuntime',
    only: [...jsTemplateRuntimeActionNames],
    actions: Object.fromEntries(
      jsTemplateRuntimeActionNames.map((actionName) => [
        actionName,
        actionName === 'getArtifact'
          ? createJsTemplateArtifactAction(service, resourceActionRunners[actionName])
          : createJsTemplateRuntimeAction(service, resourceActionRunners[actionName]),
      ]),
    ) as Record<JsTemplateRuntimeActionName, HandlerType>,
  };
}

function createJsTemplateRuntimeAction(service: JsTemplateRuntimeService, run: ResourceActionRunner): HandlerType {
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

function createJsTemplateArtifactAction(service: JsTemplateRuntimeService, run: ResourceActionRunner): HandlerType {
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
      const etag = `"${body.artifactHash}"`;
      ctx.withoutDataWrapping = true;
      setHeaders(ctx, {
        ETag: etag,
        'Cache-Control': 'private, max-age=31536000, immutable',
      });
      if (matchesIfNoneMatch(readRequestHeader(ctx, 'if-none-match'), etag)) {
        ctx.status = 304;
        ctx.body = null;
      }
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

function readRequestHeader(ctx: ResourcerContext, name: string): string | undefined {
  const request = ctx as ResourcerContext & {
    get?: (name: string) => string;
    request?: { headers?: Record<string, string | string[] | undefined> };
  };
  const value = request.get?.(name) || request.request?.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value.join(',') : value;
}

function matchesIfNoneMatch(value: string | undefined, etag: string): boolean {
  if (!value) {
    return false;
  }
  const normalizedEtag = etag.replace(/^W\//u, '');
  return value.split(',').some((candidate) => {
    const normalizedCandidate = candidate.trim();
    return normalizedCandidate === '*' || normalizedCandidate.replace(/^W\//u, '') === normalizedEtag;
  });
}
