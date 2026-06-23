/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileLegacyTemplate } from '../../../utils/compileLegacyTemplate';
import { getPresetFieldRows } from '../CollectionsPage';
import { collectionNeedsRecordUniqueKey, getCollectionRecordUniqueKey } from '../RecordUniqueKey';

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
