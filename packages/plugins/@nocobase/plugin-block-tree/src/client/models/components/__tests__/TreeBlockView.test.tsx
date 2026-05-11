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
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getTreeNodeTitleContent, getTreeTitleFieldDeletedMessage } from '../TreeBlockView';

describe('TreeBlockView', () => {
  it('uses deleted-field hint when title field is missing', () => {
    const model: any = {
      collection: {
        dataSource: { displayName: 'Main' },
        title: 'Posts',
        name: 'posts',
      },
      getTitleFieldName: () => 'title',
    };

    const result = getTreeTitleFieldDeletedMessage(model, (key, options) => {
      if (!options) return key;
      return `标题字段“${options.name}”可能已被删除，请选择其他字段。`;
    });

    expect(result).toContain('请选择其他字段');
  });

  it('returns deleted placeholder content when collection field is missing', () => {
    const model: any = {
      collection: {
        dataSource: { displayName: 'Main' },
        title: 'Posts',
        name: 'posts',
      },
      getTitleFieldName: () => 'title',
    };

    const result = getTreeNodeTitleContent({
      model,
      collectionField: undefined,
      titleFieldModel: {},
      value: 'Deleted title',
      node: { id: 1 },
      fallbackTitle: 'fallback',
    }) as any;

    expect(result.props.title.type.name).toBe('TreeTitleFieldDeletedPlaceholder');
  });
});
