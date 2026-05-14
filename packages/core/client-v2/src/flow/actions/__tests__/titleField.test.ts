/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { titleField } from '../titleField';

describe('titleField action', () => {
  it('builds options from target field interface metadata', () => {
    const titleableField = {
      name: 'nickname',
      title: 'Nickname',
      getInterfaceOptions: vi.fn(() => ({ titleUsable: true })),
    };
    const nonTitleableField = {
      name: 'profile',
      title: 'Profile',
      getInterfaceOptions: vi.fn(() => ({ titleUsable: false })),
    };
    const missingContextManager = {
      collectionFieldInterfaceManager: {
        getFieldInterface: vi.fn(() => undefined),
      },
    };

    const uiMode = (titleField as any).uiMode({
      dataSourceManager: missingContextManager,
      collectionField: {
        targetCollection: {
          getFields: () => [titleableField, nonTitleableField],
        },
      },
    });

    expect(uiMode.props.options).toEqual([{ value: 'nickname', label: 'Nickname' }]);
    expect(titleableField.getInterfaceOptions).toHaveBeenCalled();
    expect(nonTitleableField.getInterfaceOptions).toHaveBeenCalled();
    expect(missingContextManager.collectionFieldInterfaceManager.getFieldInterface).not.toHaveBeenCalled();
  });
});
