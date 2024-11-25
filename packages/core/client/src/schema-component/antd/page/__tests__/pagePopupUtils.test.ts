/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPopupParamsFromPath, getPopupPathFromParams, quickClick, removeLastPopupPath } from '../pagePopupUtils';

describe('getPopupParamsFromPath', () => {
  it('should parse the path and return the popup parameters', () => {
    const path = 'popupUid/filterbytk/filterByTKValue/tab/tabValue';
    const result = getPopupParamsFromPath(path);

    expect(result).toEqual([
      {
        popupuid: 'popupUid',
        filterbytk: 'filterByTKValue',
        tab: 'tabValue',
      },
    ]);
  });

  it('should handle multiple popups in the path', () => {
    const path =
      'popupUid1/filterbytk/filterByTKValue1/sourceid/sourceIdValue/tab/tabValue1/popups/popupUid2/filterbytk/filterByTKValue2/tab/tabValue2';
    const result = getPopupParamsFromPath(path);

    expect(result).toEqual([
      {
        popupuid: 'popupUid1',
        filterbytk: 'filterByTKValue1',
        tab: 'tabValue1',
        sourceid: 'sourceIdValue',
      },
      {
        popupuid: 'popupUid2',
        filterbytk: 'filterByTKValue2',
        tab: 'tabValue2',
      },
    ]);
  });

  it('when exist popups in path', () => {
    const path = `popupUid1/filterbytk/${window.btoa('popups')}/tab/${window.btoa(
      'popups',
    )}/popups/popupUid2/filterbytk/filterByTKValue2/tab/tabValue2`;

    const result = getPopupParamsFromPath(path);

    expect(result).toEqual([
      {
        popupuid: 'popupUid1',
        filterbytk: 'popups',
        tab: 'popups',
      },
      {
        popupuid: 'popupUid2',
        filterbytk: 'filterByTKValue2',
        tab: 'tabValue2',
      },
    ]);
  });
});

describe('getPopupPathFromParams', () => {
  it('should generate the popup path from the parameters', () => {
    const params = {
      popupuid: 'popupUid',
      filterbytk: 'filterByTKValue',
      tab: 'tabValue',
      sourceid: 'sourceIdValue',
    };
    const result = getPopupPathFromParams(params);

    expect(result).toBe('/popups/popupUid/filterbytk/filterByTKValue/sourceid/sourceIdValue/tab/tabValue');
  });

  it('should handle optional parameters', () => {
    const params = {
      popupuid: 'popupUid',
      filterbytk: 'filterByTKValue',
      tab: 'tabValue',
      empty: undefined,
    };
    const result = getPopupPathFromParams(params);

    expect(result).toBe('/popups/popupUid/filterbytk/filterByTKValue/tab/tabValue');
  });

  it('when exist popups in path', () => {
    const params = {
      popupuid: 'popupUid',
      filterbytk: 'popups',
      tab: 'popups',
    };

    const result = getPopupPathFromParams(params);

    expect(result).toBe(`/popups/popupUid/filterbytk/${window.btoa('popups')}/tab/${window.btoa('popups')}`);
  });
});

describe('removeLastPopupPath', () => {
  it('should remove the last popup path from the given path', () => {
    const path1 = '/admin/page/popups/popupUid/popups/popupUid2';
    const result1 = removeLastPopupPath(path1);

    expect(result1).toBe('/admin/page/popups/popupUid');

    const path2 = '/admin/page/popups/popupUid';
    const result2 = removeLastPopupPath(path2);

    expect(result2).toBe('/admin/page');
  });

  it('should handle paths without popups', () => {
    const path = '/admin/page';
    const result = removeLastPopupPath(path);

    expect(result).toBe(path);
  });

  it('should handle empty paths', () => {
    const path = '';
    const result = removeLastPopupPath(path);

    expect(result).toBe('');
  });
});

describe('quickClick', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
  });

  it('should return false on first click', () => {
    expect(quickClick()).toBe(false);
  });

  it('should return true on rapid repeated clicks', () => {
    expect(quickClick()).toBe(false); // first click
    expect(quickClick()).toBe(true); // second click
    expect(quickClick()).toBe(true); // third click
  });

  it('should reset after duration', () => {
    expect(quickClick()).toBe(false); // first click

    // Fast forward time by default duration (500ms)
    vi.advanceTimersByTime(500);

    expect(quickClick()).toBe(false); // should be treated as first click again
  });

  it('should clear previous timer on rapid clicks', () => {
    expect(quickClick()).toBe(false); // first click

    // Advance time partially
    vi.advanceTimersByTime(200);

    expect(quickClick()).toBe(true); // second click should reset timer

    // Advance time by less than full duration from second click
    vi.advanceTimersByTime(400);

    expect(quickClick()).toBe(true); // should still be considered rapid click
  });

  it('should handle multiple sequences of clicks', () => {
    // First sequence
    expect(quickClick()).toBe(false);
    expect(quickClick()).toBe(true);

    // Wait for reset
    vi.advanceTimersByTime(500);

    // Second sequence
    expect(quickClick()).toBe(false);
    expect(quickClick()).toBe(true);

    // Wait for reset
    vi.advanceTimersByTime(500);

    // Third sequence
    expect(quickClick()).toBe(false);
  });
});
