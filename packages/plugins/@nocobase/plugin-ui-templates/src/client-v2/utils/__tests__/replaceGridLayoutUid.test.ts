/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { replaceGridLayoutUid } from '../replaceGridLayoutUid';

describe('replaceGridLayoutUid', () => {
  class MockGridModel extends FlowModel {}

  const createParent = (options: any) => {
    const engine = new FlowEngine();
    engine.registerModels({ MockGridModel });
    return engine.createModel<MockGridModel>({
      uid: 'grid',
      use: 'MockGridModel',
      ...options,
    });
  };

  it('replaces uid from raw step layout before normalized props can drop old uid', () => {
    const parent = createParent({
      stepParams: {
        gridSettings: {
          grid: {
            layout: {
              version: 2,
              rows: [
                {
                  id: 'row1',
                  cells: [
                    { id: 'cell1', items: ['old'] },
                    { id: 'cell2', items: ['sibling'] },
                  ],
                  sizes: [8, 16],
                },
              ],
            },
          },
        },
      },
      props: {
        layout: {
          version: 2,
          rows: [
            {
              id: 'fallback',
              cells: [{ id: 'fallback-cell', items: ['new'] }],
            },
          ],
        },
      },
    });
    (parent as any).setGridStepLayout = vi.fn();
    (parent as any).syncLayoutProps = vi.fn();

    expect(replaceGridLayoutUid(parent, 'old', 'new')).toBe(true);

    const expectedLayout = {
      version: 2,
      rows: [
        {
          id: 'row1',
          cells: [
            { id: 'cell1', items: ['new'] },
            { id: 'cell2', items: ['sibling'] },
          ],
          sizes: [8, 16],
        },
      ],
    };
    expect((parent as any).setGridStepLayout).toHaveBeenCalledWith(expectedLayout);
    expect((parent as any).syncLayoutProps).toHaveBeenCalledWith(expectedLayout);
  });

  it('falls back to props layout when step layout is missing', () => {
    const parent = createParent({
      props: {
        layout: {
          version: 2,
          rows: [{ id: 'row1', cells: [{ id: 'cell1', items: ['old'] }] }],
        },
      },
    });
    (parent as any).setGridStepLayout = vi.fn();
    (parent as any).syncLayoutProps = vi.fn();

    expect(replaceGridLayoutUid(parent, 'old', 'new')).toBe(true);
    expect((parent as any).setGridStepLayout).toHaveBeenCalledWith({
      version: 2,
      rows: [{ id: 'row1', cells: [{ id: 'cell1', items: ['new'] }] }],
    });
  });

  it('returns false when v2 layout is unavailable', () => {
    const parent = createParent({
      stepParams: {
        gridSettings: {
          grid: {
            rows: { row1: [['old']] },
          },
        },
      },
    });
    (parent as any).setGridStepLayout = vi.fn();
    (parent as any).syncLayoutProps = vi.fn();

    expect(replaceGridLayoutUid(parent, 'old', 'new')).toBe(false);
    expect((parent as any).setGridStepLayout).not.toHaveBeenCalled();
  });
});
