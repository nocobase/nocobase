/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { filterCreateFieldInterfacesByCollectionTemplate } from '../collectionTemplateFieldInterfaces';

describe('filterCreateFieldInterfacesByCollectionTemplate', () => {
  it('excludes field interfaces marked as not creatable', () => {
    const fieldInterfaces = [{ name: 'input' }, { name: 'attachment', creatable: false }];

    expect(
      filterCreateFieldInterfacesByCollectionTemplate(fieldInterfaces, undefined).map((item) => item.name),
    ).toEqual(['input']);
  });

  it('does not allow template includes to restore not creatable field interfaces', () => {
    const fieldInterfaces = [{ name: 'input' }, { name: 'attachment', creatable: false }];
    const template = {
      fieldInterfaces: {
        create: {
          include: ['attachment'],
        },
      },
    };

    expect(filterCreateFieldInterfacesByCollectionTemplate(fieldInterfaces, template).map((item) => item.name)).toEqual(
      [],
    );
  });
});
