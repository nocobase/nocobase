/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { shouldUseWorkflowTasksMobilePresentation } from '../workflowTasksResponsive';

describe('workflow tasks responsive presentation', () => {
  it.each([
    [{ mobilePage: true, isMobileLayout: false, md: true, viewportWidth: 1280 }, true],
    [{ mobilePage: false, isMobileLayout: true, md: true, viewportWidth: 1280 }, true],
    [{ mobilePage: false, isMobileLayout: false, md: false, viewportWidth: 1280 }, true],
    [{ mobilePage: false, isMobileLayout: false, md: true, viewportWidth: 640 }, false],
    [{ mobilePage: false, isMobileLayout: false, md: undefined, viewportWidth: 767 }, true],
    [{ mobilePage: false, isMobileLayout: false, md: undefined, viewportWidth: 768 }, false],
  ])('returns %s for %o', (input, expected) => {
    expect(shouldUseWorkflowTasksMobilePresentation(input)).toBe(expected);
  });
});
