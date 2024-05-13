/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from '../../../data-source/collection/Collection';
import { getCollectionTitle } from '../BlockSchemaToolbar';

describe('getCollectionTitle', () => {
  it('should return collectionTitle if associationField is falsy', () => {
    const arg = {
      collectionTitle: 'Collection Title',
      collectionName: 'Collection Name',
      associationField: null,
      compile: vi.fn((value) => value),
    };

    const result = getCollectionTitle(arg);

    expect(result).toBe('Collection Title');
    expect(arg.compile).toHaveBeenCalledWith('Collection Title');
  });

  it('should return compiled collectionTitle and associationField title if associationField is truthy', () => {
    const arg = {
      collectionTitle: 'Collection Title',
      collectionName: 'Collection Name',
      associationField: {
        uiSchema: {
          title: 'Association Field Title',
        },
        name: 'Association Field Name',
      },
      associationCollection: {
        title: 'Association Collection Title',
        name: 'Association Collection Name',
      } as Collection,
      compile: vi.fn((value) => `Compiled: ${value}`),
    };

    const result = getCollectionTitle(arg);

    expect(result).toBe(
      'Compiled: Collection Title > Compiled: Association Field Title (Compiled: Association Collection Title)',
    );
    expect(arg.compile).toHaveBeenCalledTimes(3);
    expect(arg.compile).toHaveBeenCalledWith('Collection Title');
    expect(arg.compile).toHaveBeenCalledWith('Association Field Title');
    expect(arg.compile).toHaveBeenCalledWith('Association Collection Title');
  });
});
