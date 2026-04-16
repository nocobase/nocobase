/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanGroupingSelector } from '../models/components/KanbanGroupingSelector';

vi.mock('@formily/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@formily/react')>();
  return {
    ...actual,
    observer: (component: any) => component,
  };
});

vi.mock('@nocobase/client', () => ({
  useCollectionManager_deprecated: () => ({
    getCollection: vi.fn(),
  }),
}));

describe('KanbanGroupingSelector', () => {
  it('does not keep emitting the same empty grouping value', async () => {
    const ownerField = {
      name: 'owner',
      interface: 'm2o',
    };
    const collection = {
      getFields: () => [ownerField],
      getField: (name: string) => (name === 'owner' ? ownerField : undefined),
    };
    const onChange = vi.fn();

    const Wrapper = () => {
      const [value, setValue] = React.useState<any>();
      return (
        <KanbanGroupingSelector
          collection={collection}
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue);
            setValue(nextValue);
          }}
        />
      );
    };

    render(<Wrapper />);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    expect(onChange).toHaveBeenLastCalledWith({
      groupField: 'owner',
      groupOptions: [],
    });
  });
});
