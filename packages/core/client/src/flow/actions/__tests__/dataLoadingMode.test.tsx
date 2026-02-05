/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowContext, MultiRecordResource, SingleRecordResource } from '@nocobase/flow-engine';
import { dataLoadingMode } from '../dataLoadingMode';

describe('dataLoadingMode action (v2)', () => {
  it('hides settings when resource is not list', () => {
    const blockModel = { resource: new SingleRecordResource(new FlowContext()) } as any;
    expect(dataLoadingMode.hideInSettings?.({ blockModel } as any)).toBe(true);
  });

  it('shows settings when resource is list', () => {
    const blockModel = { resource: new MultiRecordResource(new FlowContext()) } as any;
    expect(dataLoadingMode.hideInSettings?.({ blockModel } as any)).toBe(false);
  });

  it('ignores non-list resource in handler', () => {
    const setStepParams = vi.fn();
    const blockModel = {
      resource: new SingleRecordResource(new FlowContext()),
      setStepParams,
      hasActiveFilters: vi.fn().mockReturnValue(false),
    } as any;

    dataLoadingMode.handler?.({ blockModel } as any, { mode: 'manual' });

    expect(setStepParams).not.toHaveBeenCalled();
  });

  it('applies manual mode only for list resources', () => {
    const resource = new MultiRecordResource(new FlowContext());
    const setStepParams = vi.fn();
    const blockModel = {
      resource,
      setStepParams,
      hasActiveFilters: vi.fn().mockReturnValue(false),
    } as any;
    const setDataSpy = vi.spyOn(resource, 'setData');
    const setMetaSpy = vi.spyOn(resource, 'setMeta');
    const setPageSpy = vi.spyOn(resource, 'setPage');
    const refreshSpy = vi.spyOn(resource, 'refresh').mockResolvedValue();

    dataLoadingMode.handler?.({ blockModel } as any, { mode: 'manual' });

    expect(setStepParams).toHaveBeenCalledWith('dataLoadingModeSettings', { mode: 'manual' });
    expect(setDataSpy).toHaveBeenCalledWith([]);
    expect(setMetaSpy).toHaveBeenCalledWith({ count: 0, hasNext: false });
    expect(setPageSpy).toHaveBeenCalledWith(1);
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('refreshes data when switching to auto mode for list resources', () => {
    const resource = new MultiRecordResource(new FlowContext());
    const setStepParams = vi.fn();
    const blockModel = {
      resource,
      setStepParams,
      hasActiveFilters: vi.fn().mockReturnValue(true),
    } as any;
    const refreshSpy = vi.spyOn(resource, 'refresh').mockResolvedValue();

    dataLoadingMode.handler?.({ blockModel } as any, { mode: 'auto' });

    expect(setStepParams).toHaveBeenCalledWith('dataLoadingModeSettings', { mode: 'auto' });
    expect(refreshSpy).toHaveBeenCalled();
  });
});
