/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Team.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getEditableDomainsForUse, getNodeContract, getSettingsSchemaForUse } from '../flow-surfaces/catalog';
import { expandFieldCatalogCandidate } from '../flow-surfaces/catalog-smart';
import { getConfigureOptionsForCatalogItem, getConfigureOptionsForUse } from '../flow-surfaces/configure-options';

const SOURCE_PATHS = ['runJs.sourceMode', 'runJs.sourceBinding', 'runJs.settings.*'];

function expectSourceOptions(use: string, kind: string) {
  const options = getConfigureOptionsForUse(use);
  expect(options).toEqual(
    expect.objectContaining({
      code: expect.objectContaining({ type: 'string' }),
      version: expect.objectContaining({ type: 'string' }),
      sourceMode: expect.objectContaining({
        type: 'string',
        enum: ['inline', 'light-extension'],
      }),
      sourceBinding: expect.objectContaining({
        type: 'object',
        example: expect.objectContaining({
          type: 'light-extension-entry',
          kind,
        }),
      }),
      settings: expect.objectContaining({ type: 'object' }),
    }),
  );

  const itemOptions = getConfigureOptionsForCatalogItem({ kind: 'field', use });
  expect(itemOptions).toMatchObject({
    sourceMode: options.sourceMode,
    sourceBinding: options.sourceBinding,
    settings: options.settings,
  });
}

function expectSourceContract(use: string, groupKey: 'jsSettings' | 'clickSettings', kind: string) {
  const group = getNodeContract(use).domains.stepParams?.groups?.[groupKey];
  expect(group?.allowedPaths).toEqual(expect.arrayContaining(SOURCE_PATHS));
  expect(group?.allowedPaths).not.toEqual(expect.arrayContaining(['sourceMode', 'sourceBinding', 'settings.*']));
  expect(group?.pathSchemas?.['runJs.sourceBinding']).toMatchObject({
    type: 'object',
    required: ['type', 'repoId', 'entryId', 'kind'],
    properties: {
      type: {
        enum: ['light-extension-entry'],
      },
      kind: {
        enum: [kind],
      },
    },
    additionalProperties: false,
  });
}

describe('flowSurfaces public JS source contracts', () => {
  it('exposes ordinary JS actions as js-action sources', () => {
    for (const use of [
      'JSCollectionActionModel',
      'JSRecordActionModel',
      'JSFormActionModel',
      'FilterFormJSActionModel',
      'JSActionModel',
    ]) {
      expectSourceOptions(use, 'js-action');
      expectSourceContract(use, 'clickSettings', 'js-action');
    }
  });

  it('exposes bound JS fields and their public wrappers as js-field sources', () => {
    for (const use of ['JSFieldModel', 'JSEditableFieldModel']) {
      expectSourceOptions(use, 'js-field');
      expectSourceContract(use, 'jsSettings', 'js-field');
    }

    for (const wrapperUse of ['TableColumnModel', 'DetailsItemModel', 'FormItemModel', 'PatternFormItemModel']) {
      expectSourceOptions(wrapperUse, 'js-field');
    }
    expectSourceContract('PatternFormFieldModel', 'jsSettings', 'js-field');
  });

  it('combines bound JS field catalog item contracts with their wrapper contracts', () => {
    for (const item of [
      { use: 'TableColumnModel', fieldUse: 'JSFieldModel', wrapperGroup: 'tableColumnSettings' },
      { use: 'DetailsItemModel', fieldUse: 'JSFieldModel', wrapperGroup: 'detailItemSettings' },
      { use: 'FormItemModel', fieldUse: 'JSEditableFieldModel', wrapperGroup: 'editItemSettings' },
    ]) {
      const projected = expandFieldCatalogCandidate(
        {
          key: `js:${item.use}`,
          label: `JS ${item.use}`,
          use: item.use,
          fieldUse: item.fieldUse,
          renderer: 'js',
        },
        {
          includeItemConfigureOptions: true,
          includeItemContracts: true,
          includeItemAllowedContainerUses: false,
          includeNodeContracts: false,
        },
        {
          getEditableDomains: getEditableDomainsForUse,
          getConfigureOptions: getConfigureOptionsForCatalogItem,
          getSettingsSchema: getSettingsSchemaForUse,
          getNodeContract,
        },
      );

      const groups = projected.settingsContract?.stepParams?.groups;
      expect(groups?.[item.wrapperGroup]).toBeTruthy();
      expect(groups?.jsSettings?.allowedPaths).toEqual(expect.arrayContaining(SOURCE_PATHS));
      expect(groups?.jsSettings?.pathSchemas?.['runJs.sourceBinding']?.properties?.kind?.enum).toEqual(['js-field']);
      expect(projected.settingsSchema?.stepParams?.['x-groups']).toEqual(
        expect.objectContaining({
          [item.wrapperGroup]: expect.any(Object),
          jsSettings: expect.objectContaining({
            allowedPaths: expect.arrayContaining(SOURCE_PATHS),
          }),
        }),
      );
      expect(projected.configureOptions).toEqual(
        expect.objectContaining({
          sourceMode: expect.objectContaining({ enum: ['inline', 'light-extension'] }),
          sourceBinding: expect.objectContaining({
            example: expect.objectContaining({ kind: 'js-field' }),
          }),
          settings: expect.objectContaining({ type: 'object' }),
        }),
      );
    }
  });

  it('limits JS columns to the shared js-field source kind', () => {
    expectSourceOptions('JSColumnModel', 'js-field');
    expectSourceContract('JSColumnModel', 'jsSettings', 'js-field');
  });

  it('keeps JS item surfaces on the js-item source kind', () => {
    for (const use of ['JSItemModel', 'FormJSFieldItemModel', 'JSItemActionModel']) {
      expectSourceOptions(use, 'js-item');
      expectSourceContract(use, 'jsSettings', 'js-item');
    }
  });
});
