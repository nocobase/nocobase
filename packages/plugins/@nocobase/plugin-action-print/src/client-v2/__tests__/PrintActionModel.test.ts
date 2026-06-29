/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { renderPrintableDom } from '../PrintActionModel';

describe('PrintActionModel', () => {
  it('uses the grid root when the details grid is rendered', () => {
    const container = document.createElement('div');
    const gridRoot = document.createElement('div');
    gridRoot.setAttribute('data-grid-root', '');
    container.appendChild(gridRoot);

    const printable = renderPrintableDom({
      subModels: {
        grid: {
          gridContainerRef: { current: container },
        },
      },
    });

    expect(printable).toBe(gridRoot);
  });

  it('falls back to the block card when an empty details grid has no container ref', () => {
    const blockCard = document.createElement('div');

    const printable = renderPrintableDom({
      context: {
        ref: { current: blockCard },
      },
      subModels: {
        grid: {
          gridContainerRef: { current: null },
        },
      },
    });

    expect(printable).toBe(blockCard);
  });

  it('returns null instead of falling back to full-page printing when no block DOM is mounted', () => {
    const printable = renderPrintableDom({
      context: {
        ref: { current: null },
      },
    });

    expect(printable).toBeNull();
  });
});
