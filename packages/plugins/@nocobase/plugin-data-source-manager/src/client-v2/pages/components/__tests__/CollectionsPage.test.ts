/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileLegacyTemplate } from '../../../utils/compileLegacyTemplate';
import { getInheritedFieldGroups, isFieldDeleteDisabled, isInheritedFieldOverridden } from '../FieldsPage';
import { getPresetFieldRows } from '../CollectionsPage';
import {
  collectionNeedsRecordUniqueKey,
  getCollectionRecordUniqueKey,
  getCollectionUpdateActionUrl,
  getRecordUniqueKeyFieldOptions,
} from '../RecordUniqueKey';

describe('getPresetFieldRows', () => {
  it('uses the preset title template when preset field label is a raw translation key', () => {
    const rows = getPresetFieldRows(
      [
        {
          name: 'space',
          field: 'Space',
          value: {
            name: 'space',
            interface: 'space',
            type: 'belongsTo',
            uiSchema: {
              title: '{{t("Space", {"ns":["@nocobase/plugin-multi-space","client"]})}}',
            },
          },
        },
      ],
      {
        getFieldInterface: (name) =>
          name === 'space'
            ? {
                title: '{{t("Space", {"ns":["@nocobase/plugin-multi-space","client"]})}}',
              }
            : undefined,
      },
    );
    const t = (key: string, options?: Record<string, unknown>) => {
      if (key === 'Space' && Array.isArray(options?.ns) && options.ns.includes('@nocobase/plugin-multi-space')) {
        return '空间';
      }
      return key;
    };

    expect(compileLegacyTemplate(rows[0].field, t)).toBe('空间');
  });
});

describe('collection record unique key helpers', () => {
  it('uses filterTargetKey before field primary keys', () => {
    expect(
      getCollectionRecordUniqueKey(
        {
          filterTargetKey: ['code'],
        },
        [{ name: 'id', primaryKey: true }],
      ),
    ).toEqual(['code']);
  });

  it('treats field primary keys as configured record unique keys', () => {
    expect(getCollectionRecordUniqueKey({}, [{ name: 'id', primaryKey: true }])).toEqual(['id']);
    expect(collectionNeedsRecordUniqueKey({}, [{ name: 'id', primaryKey: true }])).toBe(false);
  });

  it('requires a record unique key when no primary key is available', () => {
    expect(collectionNeedsRecordUniqueKey({}, [{ name: 'name' }])).toBe(true);
  });
});

describe('record unique key quick setup helpers', () => {
  const t = (key: string) => key;

  it('only includes fields whose interface is title usable', () => {
    const options = getRecordUniqueKeyFieldOptions({
      dataSourceType: 'postgres',
      fieldInterfaceManager: {
        getFieldInterface: (name, dataSourceType) => {
          if (name === 'input' && dataSourceType === 'postgres') {
            return { titleUsable: true };
          }
          if (name === 'json') {
            return { titleUsable: false };
          }
          return undefined;
        },
      },
      fields: [
        { name: 'name', interface: 'input', uiSchema: { title: 'Name' } },
        { name: 'config', interface: 'json', uiSchema: { title: 'Config' } },
        { name: 'legacy', interface: 'unknown', uiSchema: { title: 'Legacy' } },
        { name: 'no_interface', uiSchema: { title: 'No interface' } },
      ],
      t,
    });

    expect(options).toEqual([{ value: 'name', label: 'Name', title: 'Name' }]);
  });

  it('uses the external data source collection update endpoint', () => {
    expect(getCollectionUpdateActionUrl('main')).toBe('collections:update');
    expect(getCollectionUpdateActionUrl('analytics')).toBe('dataSources/analytics/collections:update');
  });
});

describe('field delete helpers', () => {
  it('disables deleting fields marked as non-deletable by the collection template', () => {
    const fileTemplate = {
      collection: {
        fields: [
          { name: 'title', deletable: false },
          { name: 'filename', deletable: false },
        ],
      },
    };

    expect(isFieldDeleteDisabled({ name: 'title' }, fileTemplate)).toBe(true);
    expect(isFieldDeleteDisabled({ name: 'customName' }, fileTemplate)).toBe(false);
  });

  it('disables deleting fields whose record metadata is non-deletable', () => {
    expect(isFieldDeleteDisabled({ name: 'title', deletable: false })).toBe(true);
    expect(isFieldDeleteDisabled({ name: 'title', deletable: true })).toBe(false);
  });
});

describe('inherited field helpers', () => {
  function createCollection(name: string, fields: Array<Record<string, unknown>>, inherits: unknown[] = []) {
    return {
      name,
      title: name,
      fields: new Map(fields.map((field) => [field.name, { options: field }])),
      inherits: new Map(inherits.map((collection: { name: string }) => [collection.name, collection])),
    };
  }

  it('returns direct and ancestor inherited field groups using each parent collection own fields', () => {
    const grandparent = createCollection('grandparent', [{ name: 'grandparentField', interface: 'input' }]);
    const parent = createCollection('parent', [{ name: 'parentField', interface: 'input' }], [grandparent]);
    const child = createCollection('child', [{ name: 'childField', interface: 'input' }], [parent]);

    expect(
      getInheritedFieldGroups(child).map((group) => ({
        collectionName: group.collectionName,
        fields: group.fields.map((field) => field.name),
      })),
    ).toEqual([
      { collectionName: 'parent', fields: ['parentField'] },
      { collectionName: 'grandparent', fields: ['grandparentField'] },
    ]);
  });

  it('treats a same-name current collection field as an overridden inherited field', () => {
    const currentFieldsByName = new Map([
      ['title', { name: 'title', collectionName: 'orders-1' }],
      ['status', { name: 'status', collectionName: 'orders' }],
    ]);

    expect(isInheritedFieldOverridden({ name: 'title' }, 'orders-1', currentFieldsByName)).toBe(true);
    expect(isInheritedFieldOverridden({ name: 'status' }, 'orders-1', currentFieldsByName)).toBe(false);
    expect(isInheritedFieldOverridden({ name: 'amount' }, 'orders-1', currentFieldsByName)).toBe(false);
  });
});
