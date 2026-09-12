/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { normalizeFieldContainerKind, shouldUseAssociationTitleTextDisplay } from '../flow-surfaces/field-semantics';

describe('flowSurfaces field semantics', () => {
  it('should classify details/list/grid-card/kanban containers as details kind', () => {
    expect(normalizeFieldContainerKind('DetailsBlockModel')).toBe('details');
    expect(normalizeFieldContainerKind('ListBlockModel')).toBe('details');
    expect(normalizeFieldContainerKind('GridCardItemModel')).toBe('details');
    expect(normalizeFieldContainerKind('KanbanBlockModel')).toBe('details');
    expect(normalizeFieldContainerKind('KanbanCardItemModel')).toBe('details');
    expect(normalizeFieldContainerKind('ApplyTaskCardDetailsModel')).toBe('details');
    expect(normalizeFieldContainerKind('ApprovalTaskCardGridModel')).toBe('details');
    expect(normalizeFieldContainerKind('ApprovalDetailsModel')).toBe('details');
    expect(normalizeFieldContainerKind('ApplyTaskCardDetailsItemModel')).toBe('details');
  });

  it('should classify approval forms as form kind', () => {
    expect(normalizeFieldContainerKind('ApplyFormModel')).toBe('form');
    expect(normalizeFieldContainerKind('ProcessFormModel')).toBe('form');
    expect(normalizeFieldContainerKind('PatternFormItemModel')).toBe('form');
  });

  it('should use association title text display for direct to-many association fields under table and details containers', () => {
    expect(
      shouldUseAssociationTitleTextDisplay({
        containerUse: 'TableBlockModel',
        fieldInterface: 'm2m',
      }),
    ).toBe(true);
    expect(
      shouldUseAssociationTitleTextDisplay({
        containerUse: 'DetailsItemModel',
        fieldInterface: 'o2m',
      }),
    ).toBe(true);
    expect(
      shouldUseAssociationTitleTextDisplay({
        containerUse: 'GridCardBlockModel',
        fieldInterface: 'mbm',
      }),
    ).toBe(true);
  });

  it('should not use association title text display for nested association paths or non-display containers', () => {
    expect(
      shouldUseAssociationTitleTextDisplay({
        containerUse: 'DetailsBlockModel',
        associationPathName: 'roles',
        fieldInterface: 'm2m',
      }),
    ).toBe(false);
    expect(
      shouldUseAssociationTitleTextDisplay({
        containerUse: 'EditFormModel',
        fieldInterface: 'm2m',
      }),
    ).toBe(false);
    expect(
      shouldUseAssociationTitleTextDisplay({
        containerUse: 'FilterFormItemModel',
        fieldInterface: 'm2m',
      }),
    ).toBe(false);
  });
});
