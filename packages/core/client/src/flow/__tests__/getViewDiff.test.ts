/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, observable } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { ViewItem } from '../resolveViewParamsToViewList';
import { getViewDiffAndUpdateHidden } from '../getViewDiffAndUpdateHidden';

// Mock FlowModel for testing
const createMockModel = (uid: string): FlowModel => {
  return {
    uid,
    dispatchEvent: vi.fn(),
  } as any;
};

describe('getViewDiff', () => {
  it('should return empty arrays when both lists are empty', () => {
    const result = getViewDiffAndUpdateHidden([], []);
    expect(result.viewsToClose).toEqual([]);
    expect(result.viewsToOpen).toEqual([]);
  });

  it('should return all views as viewsToOpen when prevViewList is empty', () => {
    const currentViewList: ViewItem[] = [
      {
        params: { viewUid: 'view1' },
        model: createMockModel('view1'),
        hidden: observable.ref(false),
      },
      {
        params: { viewUid: 'view2' },
        model: createMockModel('view2'),
        hidden: observable.ref(false),
      },
    ];

    const result = getViewDiffAndUpdateHidden([], currentViewList);
    expect(result.viewsToClose).toEqual([]);
    expect(result.viewsToOpen).toEqual(currentViewList);
  });

  it('should return all views as viewsToClose when currentViewList is empty', () => {
    const prevViewList: ViewItem[] = [
      {
        params: { viewUid: 'view1' },
        model: createMockModel('view1'),
        hidden: observable.ref(false),
      },
      {
        params: { viewUid: 'view2' },
        model: createMockModel('view2'),
        hidden: observable.ref(false),
      },
    ];

    const result = getViewDiffAndUpdateHidden(prevViewList, []);
    expect(result.viewsToClose).toEqual(prevViewList);
    expect(result.viewsToOpen).toEqual([]);
  });

  it('should return empty arrays when both lists have same views', () => {
    const view1: ViewItem = {
      params: { viewUid: 'view1' },
      model: createMockModel('view1'),
      hidden: observable.ref(false),
    };
    const view2: ViewItem = {
      params: { viewUid: 'view2' },
      model: createMockModel('view2'),
      hidden: observable.ref(false),
    };

    const prevViewList = [view1, view2];
    const currentViewList = [
      {
        params: { viewUid: 'view1' },
        model: createMockModel('view1'),
        hidden: observable.ref(false),
      },
      {
        params: { viewUid: 'view2' },
        model: createMockModel('view2'),
        hidden: observable.ref(false),
      },
    ];

    const result = getViewDiffAndUpdateHidden(prevViewList, currentViewList);
    expect(result.viewsToClose).toEqual([]);
    expect(result.viewsToOpen).toEqual([]);
  });

  it('should correctly identify views to close and open', () => {
    const view1: ViewItem = {
      params: { viewUid: 'view1' },
      model: createMockModel('view1'),
      hidden: observable.ref(false),
    };
    const view2: ViewItem = {
      params: { viewUid: 'view2' },
      model: createMockModel('view2'),
      hidden: observable.ref(false),
    };
    const view3: ViewItem = {
      params: { viewUid: 'view3' },
      model: createMockModel('view3'),
      hidden: observable.ref(false),
    };
    const view4: ViewItem = {
      params: { viewUid: 'view4' },
      model: createMockModel('view4'),
      hidden: observable.ref(false),
    };

    const prevViewList = [view1, view2]; // view1, view2 were open
    const currentViewList = [view2, view3, view4]; // view2, view3, view4 should be open

    const result = getViewDiffAndUpdateHidden(prevViewList, currentViewList);

    // view1 should be closed (was in prev but not in current)
    expect(result.viewsToClose).toHaveLength(1);
    expect(result.viewsToClose[0].params.viewUid).toBe('view1');

    // view3 and view4 should be opened (are in current but not in prev)
    expect(result.viewsToOpen).toHaveLength(2);
    expect(result.viewsToOpen.map((v) => v.params.viewUid)).toContain('view3');
    expect(result.viewsToOpen.map((v) => v.params.viewUid)).toContain('view4');
  });

  it('should handle complex view parameters correctly', () => {
    const view1: ViewItem = {
      params: {
        viewUid: 'view1',
        tabUid: 'tab1',
        filterByTk: 'filter1',
        sourceId: 'source1',
      },
      model: createMockModel('view1'),
      hidden: observable.ref(false),
    };
    const view2: ViewItem = {
      params: {
        viewUid: 'view1', // same viewUid but different params
        tabUid: 'tab2',
        filterByTk: 'filter2',
      },
      model: createMockModel('view1'),
      hidden: observable.ref(false),
    };

    const prevViewList = [view1];
    const currentViewList = [view2];

    const result = getViewDiffAndUpdateHidden(prevViewList, currentViewList);

    // Since viewUid is the same, no views should be closed or opened
    expect(result.viewsToClose).toEqual([]);
    expect(result.viewsToOpen).toEqual([]);
  });
});
