/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from '../errors';
import { buildDefinedPayload } from '../service-utils';
import type { FlowSurfaceExecuteDslAssets, FlowSurfaceExecuteDslDocument } from './public-types';
import {
  assertNonEmptyString,
  assertOnlyAllowedKeys,
  assertPlainObject,
  cloneOptionalPlainObject,
  normalizeAssetRegistry,
  normalizeTabLocalKey,
  readBoolean,
  readOptionalString,
  readString,
} from './private-utils';

function assertSupportedExecuteDslTopLevelKeys(input: Record<string, any>) {
  const allowedKeys = ['version', 'mode', 'target', 'navigation', 'page', 'assets', 'tabs'];
  const unsupportedKeys = Object.keys(input).filter((key) => !allowedKeys.includes(key));
  if (!unsupportedKeys.length) {
    return;
  }
  throwBadRequest(
    `flowSurfaces executeDsl only accepts top-level keys ${allowedKeys.join(
      ', ',
    )}; unsupported keys: ${unsupportedKeys.join(', ')}`,
  );
}

function assertSupportedExecuteDslTarget(input: Record<string, any>) {
  if (_.isUndefined(input.target)) {
    return;
  }
  assertPlainObject(input.target, 'flowSurfaces executeDsl target');
  if (_.isPlainObject(input.target) && typeof (input.target as any).mode !== 'undefined') {
    throwBadRequest(`flowSurfaces executeDsl target only accepts pageSchemaUid; use top-level mode instead`);
  }
  assertOnlyAllowedKeys(input.target as Record<string, any>, 'flowSurfaces executeDsl target', ['pageSchemaUid']);
}

function normalizePage(input: any) {
  if (_.isUndefined(input)) {
    return undefined;
  }
  assertPlainObject(input, 'flowSurfaces executeDsl page');
  assertOnlyAllowedKeys(input, 'flowSurfaces executeDsl page', [
    'title',
    'icon',
    'documentTitle',
    'enableHeader',
    'enableTabs',
    'displayTitle',
  ]);
  const normalized = buildDefinedPayload({
    title: readOptionalString(input.title),
    icon: readOptionalString(input.icon),
    documentTitle: readOptionalString(input.documentTitle),
    enableHeader: readBoolean(input.enableHeader, 'flowSurfaces executeDsl page.enableHeader'),
    enableTabs: readBoolean(input.enableTabs, 'flowSurfaces executeDsl page.enableTabs'),
    displayTitle: readBoolean(input.displayTitle, 'flowSurfaces executeDsl page.displayTitle'),
  });
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeNavigation(input: any) {
  if (_.isUndefined(input)) {
    return undefined;
  }
  assertPlainObject(input, 'flowSurfaces executeDsl navigation');
  assertOnlyAllowedKeys(input, 'flowSurfaces executeDsl navigation', ['group', 'item']);
  const normalized = buildDefinedPayload({
    group: _.isUndefined(input.group)
      ? undefined
      : (() => {
          assertPlainObject(input.group, 'flowSurfaces executeDsl navigation.group');
          assertOnlyAllowedKeys(input.group, 'flowSurfaces executeDsl navigation.group', [
            'routeId',
            'title',
            'icon',
            'tooltip',
            'hideInMenu',
          ]);
          const routeId = input.group.routeId;
          if (!_.isUndefined(routeId) && !_.isString(routeId) && !_.isNumber(routeId)) {
            throwBadRequest(`flowSurfaces executeDsl navigation.group.routeId must be a string or integer`);
          }
          if (!_.isUndefined(routeId) && readString(input.group.title)) {
            throwBadRequest(`flowSurfaces executeDsl navigation.group cannot mix routeId with title`);
          }
          const normalized = buildDefinedPayload({
            routeId: _.isUndefined(routeId) ? undefined : routeId,
            title: readOptionalString(input.group.title),
            icon: readOptionalString(input.group.icon),
            tooltip: readOptionalString(input.group.tooltip),
            hideInMenu: readBoolean(input.group.hideInMenu, 'flowSurfaces executeDsl navigation.group.hideInMenu'),
          });
          if (_.isUndefined(normalized.routeId) && !normalized.title) {
            throwBadRequest(`flowSurfaces executeDsl navigation.group requires routeId or title`);
          }
          return normalized;
        })(),
    item: _.isUndefined(input.item)
      ? undefined
      : (() => {
          assertPlainObject(input.item, 'flowSurfaces executeDsl navigation.item');
          assertOnlyAllowedKeys(input.item, 'flowSurfaces executeDsl navigation.item', [
            'title',
            'icon',
            'tooltip',
            'hideInMenu',
          ]);
          return buildDefinedPayload({
            title: readOptionalString(input.item.title),
            icon: readOptionalString(input.item.icon),
            tooltip: readOptionalString(input.item.tooltip),
            hideInMenu: readBoolean(input.item.hideInMenu, 'flowSurfaces executeDsl navigation.item.hideInMenu'),
          });
        })(),
  });
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeTabs(input: any[]): FlowSurfaceExecuteDslDocument['tabs'] {
  const seenTabKeys = new Set<string>();
  return input.map((tab: any, index: number) => {
    assertPlainObject(tab, `flowSurfaces executeDsl tabs[${index}]`);
    assertOnlyAllowedKeys(tab, `flowSurfaces executeDsl tabs[${index}]`, [
      'key',
      'title',
      'icon',
      'documentTitle',
      'blocks',
      'layout',
    ]);
    if (!Array.isArray(tab.blocks) || !tab.blocks.length) {
      throwBadRequest(`flowSurfaces executeDsl tabs[${index}].blocks must be a non-empty array`);
    }
    const explicitKey = readString(tab.key);
    return {
      key: normalizeTabLocalKey(tab.key, readString(tab.title) || `tab_${index + 1}`, index, seenTabKeys, {
        explicit: !!explicitKey,
      }),
      title: readOptionalString(tab.title),
      icon: readOptionalString(tab.icon),
      documentTitle: readOptionalString(tab.documentTitle),
      blocks: _.cloneDeep(tab.blocks),
      layout: cloneOptionalPlainObject(tab.layout, `flowSurfaces executeDsl tabs[${index}].layout`),
    };
  });
}

export function prepareFlowSurfaceExecuteDslDocument(input: Record<string, any>): FlowSurfaceExecuteDslDocument {
  assertPlainObject(input, 'flowSurfaces executeDsl payload');
  assertSupportedExecuteDslTopLevelKeys(input);
  assertSupportedExecuteDslTarget(input);

  const version = assertNonEmptyString(input.version, 'flowSurfaces executeDsl version');
  if (version !== '1') {
    throwBadRequest(`flowSurfaces executeDsl version '${version}' is not supported`);
  }

  const mode = assertNonEmptyString(input.mode, 'flowSurfaces executeDsl mode');
  if (mode !== 'create' && mode !== 'replace') {
    throwBadRequest(`flowSurfaces executeDsl mode must be 'create' or 'replace'`);
  }

  if (!Array.isArray(input.tabs) || !input.tabs.length) {
    throwBadRequest(`flowSurfaces executeDsl tabs must be a non-empty array`);
  }

  const page = normalizePage(input.page);
  const navigation = normalizeNavigation(input.navigation);

  if (mode === 'create' && !_.isUndefined(input.target)) {
    throwBadRequest(`flowSurfaces executeDsl create mode does not accept target`);
  }
  if (mode === 'replace' && !_.isPlainObject(input.target)) {
    throwBadRequest(`flowSurfaces executeDsl replace mode requires target.pageSchemaUid`);
  }
  if (mode === 'replace' && navigation) {
    throwBadRequest(`flowSurfaces executeDsl replace mode does not accept navigation`);
  }

  const target =
    mode === 'replace'
      ? {
          pageSchemaUid: assertNonEmptyString(
            input.target.pageSchemaUid,
            'flowSurfaces executeDsl target.pageSchemaUid',
          ),
        }
      : undefined;

  if (!_.isUndefined(input.assets)) {
    assertPlainObject(input.assets, 'flowSurfaces executeDsl assets');
    assertOnlyAllowedKeys(input.assets, 'flowSurfaces executeDsl assets', ['scripts', 'charts']);
  }

  const assets: FlowSurfaceExecuteDslAssets = {
    scripts: normalizeAssetRegistry(input.assets?.scripts, 'flowSurfaces executeDsl assets.scripts'),
    charts: normalizeAssetRegistry(input.assets?.charts, 'flowSurfaces executeDsl assets.charts'),
  };
  const tabs = normalizeTabs(input.tabs);

  if (tabs.length > 1 && page?.enableTabs === false) {
    throwBadRequest(`flowSurfaces executeDsl page.enableTabs cannot be false when tabs.length > 1`);
  }

  return {
    version: '1',
    mode,
    ...(target ? { target } : {}),
    ...(navigation ? { navigation } : {}),
    ...(page ? { page } : {}),
    tabs,
    assets,
  };
}
