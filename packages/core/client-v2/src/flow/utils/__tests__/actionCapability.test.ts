/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  areCapabilitiesSupported,
  getActionCapabilityNamesFromModelClass,
  getBlockCapabilityNamesFromModelClass,
  isCapabilitySupported,
  normalizeCapabilityActionName,
} from '../actionCapability';

describe('actionCapability utils', () => {
  it('normalizes view to get', () => {
    expect(normalizeCapabilityActionName('view')).toBe('get');
    expect(normalizeCapabilityActionName('update')).toBe('update');
    expect(normalizeCapabilityActionName(null)).toBeNull();
  });

  it('checks support with availableActions and unavailableActions', () => {
    expect(isCapabilitySupported({ options: { availableActions: ['create', 'get'] } }, 'create')).toBe(true);
    expect(isCapabilitySupported({ options: { availableActions: ['create', 'get'] } }, 'destroy')).toBe(false);
    expect(isCapabilitySupported({ options: { unavailableActions: ['destroy'] } }, 'destroy')).toBe(false);
    expect(isCapabilitySupported({ options: { unavailableActions: ['destroy'] } }, 'update')).toBe(true);
  });

  it('checks multiple capability names together', () => {
    expect(
      areCapabilitiesSupported({ options: { availableActions: ['create', 'update'] } }, ['create', 'update']),
    ).toBe(true);
    expect(areCapabilitiesSupported({ options: { availableActions: ['create'] } }, ['create', 'update'])).toBe(false);
  });

  it('uses explicit capabilityActionNames when provided', () => {
    class MultiCapabilityActionModel {
      static capabilityActionNames = ['view', 'update'];
    }

    expect(getActionCapabilityNamesFromModelClass(MultiCapabilityActionModel as any)).toEqual(['get', 'update']);
  });

  it('falls back to getAclActionName when explicit capability metadata is absent', () => {
    class ViewActionModel {
      getAclActionName() {
        return 'view';
      }
    }

    expect(getActionCapabilityNamesFromModelClass(ViewActionModel as any)).toEqual(['get']);
  });

  it('honors inherited block capability metadata on subclasses', () => {
    class BaseCreateBlockModel {
      static blockCapabilityActionName = 'create';
    }

    class ChildCreateBlockModel extends BaseCreateBlockModel {}

    expect(getBlockCapabilityNamesFromModelClass(ChildCreateBlockModel as any)).toEqual(['create']);
  });

  it('allows explicit null to opt out of capability filtering', () => {
    class AddChildActionModel {
      static capabilityActionName = null;

      getAclActionName() {
        return 'create';
      }
    }

    expect(getActionCapabilityNamesFromModelClass(AddChildActionModel as any)).toBeNull();
  });
});
