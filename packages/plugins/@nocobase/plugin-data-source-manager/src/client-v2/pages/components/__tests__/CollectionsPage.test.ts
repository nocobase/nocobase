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
