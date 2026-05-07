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
import { FLOW_SURFACE_REACTION_DUPLICATE_SLOT } from '../reaction/errors';
import { buildDefinedPayload, normalizeFlowSurfaceComposeKey } from '../service-utils';
import type {
  FlowSurfaceApplyBlueprintAssets,
  FlowSurfaceApplyBlueprintDefaultCollection,
  FlowSurfaceApplyBlueprintDefaultFieldGroupSpec,
  FlowSurfaceApplyBlueprintDefaultPopupActionMap,
  FlowSurfaceApplyBlueprintDefaultPopupName,
  FlowSurfaceApplyBlueprintDefaultPopups,
  FlowSurfaceApplyBlueprintDefaults,
  FlowSurfaceApplyBlueprintDocument,
  FlowSurfaceApplyBlueprintReaction,
} from './public-types';
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

const APPLY_BLUEPRINT_REACTION_ITEM_ALLOWED_KEYS = ['type', 'target', 'rules', 'expectedFingerprint'] as const;
const APPLY_BLUEPRINT_REACTION_TYPES = [
  'setFieldValueRules',
  'setBlockLinkageRules',
  'setFieldLinkageRules',
  'setActionLinkageRules',
] as const;
const APPLY_BLUEPRINT_REACTION_TYPE_SET = new Set<string>(APPLY_BLUEPRINT_REACTION_TYPES);
const APPLY_BLUEPRINT_DEFAULT_COLLECTION_ALLOWED_KEYS = ['fieldGroups', 'popups'];
const APPLY_BLUEPRINT_DEFAULT_FIELD_GROUP_ALLOWED_KEYS = ['key', 'title', 'fields'];
const APPLY_BLUEPRINT_DEFAULT_POPUPS_ALLOWED_KEYS = ['view', 'addNew', 'edit', 'associations'];
const APPLY_BLUEPRINT_DEFAULT_POPUP_ACTION_ALLOWED_KEYS = ['name', 'description'];
const APPLY_BLUEPRINT_DEFAULT_POPUP_ASSOCIATION_ALLOWED_KEYS = ['view', 'addNew', 'edit'];
const APPLY_BLUEPRINT_DEFAULT_POPUP_ACTIONS = ['view', 'addNew', 'edit'] as const;

function assertSupportedApplyBlueprintTopLevelKeys(input: Record<string, any>) {
  const allowedKeys = ['version', 'mode', 'target', 'navigation', 'page', 'defaults', 'assets', 'tabs', 'reaction'];
  const unsupportedKeys = Object.keys(input).filter((key) => !allowedKeys.includes(key));
  if (!unsupportedKeys.length) {
    return;
  }
  throwBadRequest(
    `flowSurfaces applyBlueprint only accepts top-level keys ${allowedKeys.join(
      ', ',
    )}; unsupported keys: ${unsupportedKeys.join(', ')}`,
  );
}

function assertSupportedApplyBlueprintTarget(input: Record<string, any>) {
  if (_.isUndefined(input.target)) {
    return;
  }
  assertPlainObject(input.target, 'flowSurfaces applyBlueprint target');
  if (_.isPlainObject(input.target) && typeof (input.target as any).mode !== 'undefined') {
    throwBadRequest(`flowSurfaces applyBlueprint target only accepts pageSchemaUid; use top-level mode instead`);
  }
  assertOnlyAllowedKeys(input.target as Record<string, any>, 'flowSurfaces applyBlueprint target', ['pageSchemaUid']);
}

function normalizePage(input: any) {
  if (_.isUndefined(input)) {
    return undefined;
  }
  assertPlainObject(input, 'flowSurfaces applyBlueprint page');
  assertOnlyAllowedKeys(input, 'flowSurfaces applyBlueprint page', [
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
    enableHeader: readBoolean(input.enableHeader, 'flowSurfaces applyBlueprint page.enableHeader'),
    enableTabs: readBoolean(input.enableTabs, 'flowSurfaces applyBlueprint page.enableTabs'),
    displayTitle: readBoolean(input.displayTitle, 'flowSurfaces applyBlueprint page.displayTitle'),
  });
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeNavigation(input: any) {
  if (_.isUndefined(input)) {
    return undefined;
  }
  assertPlainObject(input, 'flowSurfaces applyBlueprint navigation');
  assertOnlyAllowedKeys(input, 'flowSurfaces applyBlueprint navigation', ['group', 'item']);
  const normalized = buildDefinedPayload({
    group: _.isUndefined(input.group)
      ? undefined
      : (() => {
          assertPlainObject(input.group, 'flowSurfaces applyBlueprint navigation.group');
          assertOnlyAllowedKeys(input.group, 'flowSurfaces applyBlueprint navigation.group', [
            'routeId',
            'title',
            'icon',
            'tooltip',
            'hideInMenu',
          ]);
          const routeId = input.group.routeId;
          if (!_.isUndefined(routeId) && !_.isString(routeId) && !_.isNumber(routeId)) {
            throwBadRequest(`flowSurfaces applyBlueprint navigation.group.routeId must be a string or integer`);
          }
          if (!_.isUndefined(routeId)) {
            return {
              routeId,
            };
          }
          const normalized = buildDefinedPayload({
            title: readOptionalString(input.group.title),
            icon: readOptionalString(input.group.icon),
            tooltip: readOptionalString(input.group.tooltip),
            hideInMenu: readBoolean(input.group.hideInMenu, 'flowSurfaces applyBlueprint navigation.group.hideInMenu'),
          });
          if (!normalized.title) {
            throwBadRequest(`flowSurfaces applyBlueprint navigation.group requires routeId or title`);
          }
          return normalized;
        })(),
    item: _.isUndefined(input.item)
      ? undefined
      : (() => {
          assertPlainObject(input.item, 'flowSurfaces applyBlueprint navigation.item');
          assertOnlyAllowedKeys(input.item, 'flowSurfaces applyBlueprint navigation.item', [
            'title',
            'icon',
            'tooltip',
            'hideInMenu',
          ]);
          return buildDefinedPayload({
            title: readOptionalString(input.item.title),
            icon: readOptionalString(input.item.icon),
            tooltip: readOptionalString(input.item.tooltip),
            hideInMenu: readBoolean(input.item.hideInMenu, 'flowSurfaces applyBlueprint navigation.item.hideInMenu'),
          });
        })(),
  });
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeDefaultFieldGroups(
  input: any,
  context: string,
): FlowSurfaceApplyBlueprintDefaultFieldGroupSpec[] | undefined {
  if (_.isUndefined(input)) {
    return undefined;
  }
  if (!Array.isArray(input) || !input.length) {
    throwBadRequest(`${context} must be a non-empty array`);
  }
  return input.map((group: any, groupIndex: number) => {
    const groupContext = `${context}[${groupIndex}]`;
    assertPlainObject(group, groupContext);
    assertOnlyAllowedKeys(group, groupContext, APPLY_BLUEPRINT_DEFAULT_FIELD_GROUP_ALLOWED_KEYS);
    if (!Array.isArray(group.fields) || !group.fields.length) {
      throwBadRequest(`${groupContext}.fields must be a non-empty array`);
    }
    return buildDefinedPayload({
      key: readOptionalString(group.key),
      title: assertNonEmptyString(group.title, `${groupContext}.title`),
      fields: group.fields.map((field: any, fieldIndex: number) =>
        assertNonEmptyString(field, `${groupContext}.fields[${fieldIndex}]`),
      ),
    }) as FlowSurfaceApplyBlueprintDefaultFieldGroupSpec;
  });
}

function normalizeDefaultPopupName(input: any, context: string): FlowSurfaceApplyBlueprintDefaultPopupName | undefined {
  if (_.isUndefined(input)) {
    return undefined;
  }
  assertPlainObject(input, context);
  assertOnlyAllowedKeys(input, context, APPLY_BLUEPRINT_DEFAULT_POPUP_ACTION_ALLOWED_KEYS);
  return {
    name: assertNonEmptyString(input.name, `${context}.name`),
    description: assertNonEmptyString(input.description, `${context}.description`),
  };
}

function normalizeDefaultPopupActionMap(
  input: any,
  context: string,
  allowedKeys: readonly string[],
): FlowSurfaceApplyBlueprintDefaultPopupActionMap | undefined {
  if (_.isUndefined(input)) {
    return undefined;
  }
  assertPlainObject(input, context);
  assertOnlyAllowedKeys(input, context, [...allowedKeys]);
  const normalized = buildDefinedPayload(
    Object.fromEntries(
      APPLY_BLUEPRINT_DEFAULT_POPUP_ACTIONS.map((action) => [
        action,
        normalizeDefaultPopupName(input[action], `${context}.${action}`),
      ]),
    ),
  ) as FlowSurfaceApplyBlueprintDefaultPopupActionMap;
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeDefaultPopups(input: any, context: string): FlowSurfaceApplyBlueprintDefaultPopups | undefined {
  if (_.isUndefined(input)) {
    return undefined;
  }
  const actionMap = normalizeDefaultPopupActionMap(input, context, APPLY_BLUEPRINT_DEFAULT_POPUPS_ALLOWED_KEYS);
  const associationsInput = input.associations;
  const associations = _.isUndefined(associationsInput)
    ? undefined
    : (() => {
        assertPlainObject(associationsInput, `${context}.associations`);
        return Object.fromEntries(
          Object.entries(associationsInput).flatMap(([field, value]) => {
            const associationField = assertNonEmptyString(field, `${context}.associations key`);
            const normalizedValue = normalizeDefaultPopupActionMap(
              value,
              `${context}.associations.${associationField}`,
              APPLY_BLUEPRINT_DEFAULT_POPUP_ASSOCIATION_ALLOWED_KEYS,
            );
            return normalizedValue ? [[associationField, normalizedValue]] : [];
          }),
        );
      })();
  const normalized = buildDefinedPayload({
    ...actionMap,
    associations: associations && Object.keys(associations).length ? associations : undefined,
  }) as FlowSurfaceApplyBlueprintDefaultPopups;
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeDefaultCollection(input: any, context: string): FlowSurfaceApplyBlueprintDefaultCollection {
  assertPlainObject(input, context);
  assertOnlyAllowedKeys(input, context, APPLY_BLUEPRINT_DEFAULT_COLLECTION_ALLOWED_KEYS);
  return buildDefinedPayload({
    fieldGroups: normalizeDefaultFieldGroups(input.fieldGroups, `${context}.fieldGroups`),
    popups: normalizeDefaultPopups(input.popups, `${context}.popups`),
  }) as FlowSurfaceApplyBlueprintDefaultCollection;
}

function normalizeDefaults(input: any): FlowSurfaceApplyBlueprintDefaults | undefined {
  if (_.isUndefined(input)) {
    return undefined;
  }
  assertPlainObject(input, 'flowSurfaces applyBlueprint defaults');
  assertOnlyAllowedKeys(input, 'flowSurfaces applyBlueprint defaults', ['collections']);
  if (_.isUndefined(input.collections)) {
    return {};
  }
  assertPlainObject(input.collections, 'flowSurfaces applyBlueprint defaults.collections');
  return {
    collections: Object.fromEntries(
      Object.entries(input.collections).map(([collectionName, collectionDefaults]) => {
        const normalizedCollectionName = assertNonEmptyString(
          collectionName,
          'flowSurfaces applyBlueprint defaults.collections key',
        );
        return [
          normalizedCollectionName,
          normalizeDefaultCollection(
            collectionDefaults,
            `flowSurfaces applyBlueprint defaults.collections.${normalizedCollectionName}`,
          ),
        ];
      }),
    ),
  };
}

function normalizeTabs(input: any[]): FlowSurfaceApplyBlueprintDocument['tabs'] {
  const seenTabKeys = new Set<string>();
  return input.map((tab: any, index: number) => {
    assertPlainObject(tab, `flowSurfaces applyBlueprint tabs[${index}]`);
    assertOnlyAllowedKeys(tab, `flowSurfaces applyBlueprint tabs[${index}]`, [
      'key',
      'title',
      'icon',
      'documentTitle',
      'blocks',
      'layout',
    ]);
    if (!Array.isArray(tab.blocks) || !tab.blocks.length) {
      throwBadRequest(`flowSurfaces applyBlueprint tabs[${index}].blocks must be a non-empty array`);
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
      layout: cloneOptionalPlainObject(tab.layout, `flowSurfaces applyBlueprint tabs[${index}].layout`),
    };
  });
}

function normalizeReaction(input: any): FlowSurfaceApplyBlueprintReaction | undefined {
  if (_.isUndefined(input)) {
    return undefined;
  }

  assertPlainObject(input, 'flowSurfaces applyBlueprint reaction');
  assertOnlyAllowedKeys(input, 'flowSurfaces applyBlueprint reaction', ['items']);

  if (!Array.isArray(input.items)) {
    throwBadRequest(`flowSurfaces applyBlueprint reaction.items must be an array`);
  }

  const seenSlots = new Set<string>();
  return {
    items: input.items.map((item: any, index: number) => {
      const context = `flowSurfaces applyBlueprint reaction.items[${index}]`;
      assertPlainObject(item, context);
      assertOnlyAllowedKeys(item, context, [...APPLY_BLUEPRINT_REACTION_ITEM_ALLOWED_KEYS]);

      const type = assertNonEmptyString(item.type, `${context}.type`);
      if (!APPLY_BLUEPRINT_REACTION_TYPE_SET.has(type)) {
        throwBadRequest(
          `${context}.type '${type}' is unsupported; supported types: ${APPLY_BLUEPRINT_REACTION_TYPES.join(', ')}`,
        );
      }

      const target = normalizeFlowSurfaceComposeKey(
        assertNonEmptyString(item.target, `${context}.target`),
        `${context}.target`,
      );
      if (!Array.isArray(item.rules)) {
        throwBadRequest(`${context}.rules must be an array`);
      }

      const slotKey = `${type}::${target}`;
      if (seenSlots.has(slotKey)) {
        throwBadRequest(
          `${context} duplicates reaction slot '${type}' for target '${target}'`,
          FLOW_SURFACE_REACTION_DUPLICATE_SLOT,
        );
      }
      seenSlots.add(slotKey);

      return buildDefinedPayload({
        type,
        target,
        rules: _.cloneDeep(item.rules),
        expectedFingerprint: _.isUndefined(item.expectedFingerprint)
          ? undefined
          : assertNonEmptyString(item.expectedFingerprint, `${context}.expectedFingerprint`),
      }) as FlowSurfaceApplyBlueprintReaction['items'][number];
    }),
  };
}

export function prepareFlowSurfaceApplyBlueprintDocument(
  input: Record<string, any>,
): FlowSurfaceApplyBlueprintDocument {
  assertPlainObject(input, 'flowSurfaces applyBlueprint payload');
  assertSupportedApplyBlueprintTopLevelKeys(input);
  assertSupportedApplyBlueprintTarget(input);

  const version = _.isUndefined(input.version)
    ? '1'
    : assertNonEmptyString(input.version, 'flowSurfaces applyBlueprint version');
  if (version !== '1') {
    throwBadRequest(`flowSurfaces applyBlueprint version '${version}' is not supported`);
  }

  const mode = assertNonEmptyString(input.mode, 'flowSurfaces applyBlueprint mode');
  if (mode !== 'create' && mode !== 'replace') {
    throwBadRequest(`flowSurfaces applyBlueprint mode must be 'create' or 'replace'`);
  }

  if (!Array.isArray(input.tabs) || !input.tabs.length) {
    throwBadRequest(`flowSurfaces applyBlueprint tabs must be a non-empty array`);
  }

  const page = normalizePage(input.page);
  const navigation = normalizeNavigation(input.navigation);
  const defaults = normalizeDefaults(input.defaults);

  if (mode === 'create' && !_.isUndefined(input.target)) {
    throwBadRequest(`flowSurfaces applyBlueprint create mode does not accept target`);
  }
  if (mode === 'replace' && !_.isPlainObject(input.target)) {
    throwBadRequest(`flowSurfaces applyBlueprint replace mode requires target.pageSchemaUid`);
  }
  if (mode === 'replace' && navigation) {
    throwBadRequest(`flowSurfaces applyBlueprint replace mode does not accept navigation`);
  }

  const target =
    mode === 'replace'
      ? {
          pageSchemaUid: assertNonEmptyString(
            input.target.pageSchemaUid,
            'flowSurfaces applyBlueprint target.pageSchemaUid',
          ),
        }
      : undefined;

  if (!_.isUndefined(input.assets)) {
    assertPlainObject(input.assets, 'flowSurfaces applyBlueprint assets');
    assertOnlyAllowedKeys(input.assets, 'flowSurfaces applyBlueprint assets', ['scripts', 'charts']);
  }

  const assets: FlowSurfaceApplyBlueprintAssets = {
    scripts: normalizeAssetRegistry(input.assets?.scripts, 'flowSurfaces applyBlueprint assets.scripts'),
    charts: normalizeAssetRegistry(input.assets?.charts, 'flowSurfaces applyBlueprint assets.charts'),
  };
  const tabs = normalizeTabs(input.tabs);
  const reaction = normalizeReaction(input.reaction);

  if (tabs.length > 1 && page?.enableTabs === false) {
    throwBadRequest(`flowSurfaces applyBlueprint page.enableTabs cannot be false when tabs.length > 1`);
  }

  return {
    version: '1',
    mode,
    ...(target ? { target } : {}),
    ...(navigation ? { navigation } : {}),
    ...(page ? { page } : {}),
    ...(defaults ? { defaults } : {}),
    tabs,
    assets,
    ...(reaction ? { reaction } : {}),
  };
}
