/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lightExtensionCapabilitiesActionNames } from './resources/lightExtensionCapabilities';
import { lightExtensionCreateJobActionNames } from './resources/lightExtensionCreateJobs';
import { lightExtensionEntryActionNames } from './resources/lightExtensionEntries';
import { lightExtensionFileActionNames } from './resources/lightExtensionFiles';
import { lightExtensionReferenceActionNames } from './resources/lightExtensionReferences';
import { lightExtensionRepoActionNames } from './resources/lightExtensionRepos';
import { lightExtensionRuntimeActionNames } from './resources/lightExtensionRuntime';
import { lightExtensionSyncActionNames } from './resources/lightExtensionSync';
import { lightExtensionActionNames } from './resources/lightExtensions';

export interface JsTemplateServerApiAlias {
  canonicalResource: string;
  legacyPermissionResource: string;
  actions: readonly string[];
}

/**
 * Canonical JS Template HTTP names are transport aliases only. Every request is rewritten to its established
 * Light Extension resource before resource parsing and ACL evaluation, so both names share handlers, grants,
 * transactions, raw-resource protection, owner protection, auditing, and throttling.
 */
export const JS_TEMPLATE_SERVER_API_ALIASES = [
  {
    canonicalResource: 'jsTemplates',
    legacyPermissionResource: 'lightExtensions',
    actions: lightExtensionActionNames,
  },
  {
    canonicalResource: 'jsTemplateRepos',
    legacyPermissionResource: 'lightExtensionRepos',
    actions: lightExtensionRepoActionNames,
  },
  {
    canonicalResource: 'jsTemplateFiles',
    legacyPermissionResource: 'lightExtensionFiles',
    actions: lightExtensionFileActionNames,
  },
  {
    canonicalResource: 'jsTemplateEntries',
    legacyPermissionResource: 'lightExtensionEntries',
    actions: lightExtensionEntryActionNames,
  },
  {
    canonicalResource: 'jsTemplateReferences',
    legacyPermissionResource: 'lightExtensionReferences',
    actions: lightExtensionReferenceActionNames,
  },
  {
    canonicalResource: 'jsTemplateRuntime',
    legacyPermissionResource: 'lightExtensionRuntime',
    actions: lightExtensionRuntimeActionNames,
  },
  {
    canonicalResource: 'jsTemplateCapabilities',
    legacyPermissionResource: 'lightExtensionCapabilities',
    actions: lightExtensionCapabilitiesActionNames,
  },
  {
    canonicalResource: 'jsTemplateSync',
    legacyPermissionResource: 'lightExtensionSync',
    actions: lightExtensionSyncActionNames,
  },
  {
    canonicalResource: 'jsTemplateCreateJobs',
    legacyPermissionResource: 'lightExtensionCreateJobs',
    actions: lightExtensionCreateJobActionNames,
  },
] as const satisfies readonly JsTemplateServerApiAlias[];

export type JsTemplateCanonicalResourceName = (typeof JS_TEMPLATE_SERVER_API_ALIASES)[number]['canonicalResource'];
export type JsTemplateLegacyPermissionResourceName =
  (typeof JS_TEMPLATE_SERVER_API_ALIASES)[number]['legacyPermissionResource'];

export function getJsTemplateLegacyPermissionResource(
  canonicalResource: string,
): JsTemplateLegacyPermissionResourceName | undefined {
  return JS_TEMPLATE_SERVER_API_ALIASES.find((alias) => alias.canonicalResource === canonicalResource)
    ?.legacyPermissionResource;
}

export function resolveJsTemplateApiAliasPath(path: string, resourcePrefix?: string): string | null {
  const basePath = normalizeBasePath(resourcePrefix ?? '');
  const apiPathPrefix = `${basePath}/`;
  if (!path.startsWith(apiPathPrefix)) {
    return null;
  }

  const resourceActionPath = path.slice(apiPathPrefix.length);
  const separatorIndex = resourceActionPath.indexOf(':');
  if (separatorIndex <= 0) {
    return null;
  }

  const canonicalResource = resourceActionPath.slice(0, separatorIndex);
  const actionPath = resourceActionPath.slice(separatorIndex + 1);
  const actionName = actionPath.split('/', 1)[0];
  const alias = JS_TEMPLATE_SERVER_API_ALIASES.find((item) => item.canonicalResource === canonicalResource);
  if (!alias || !alias.actions.some((action) => action === actionName)) {
    return null;
  }

  return `${apiPathPrefix}${alias.legacyPermissionResource}:${actionPath}`;
}

function normalizeBasePath(path: string): string {
  const normalized = `/${path.trim().replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '' : normalized;
}
