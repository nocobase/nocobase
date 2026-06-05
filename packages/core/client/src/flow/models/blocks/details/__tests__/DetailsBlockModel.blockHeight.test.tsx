/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useDetailsGridHeight } from '../utils';

const createRect = (height: number) => ({
  x: 0,
  y: 0,
  width: 100,
  height,
  top: 0,
  left: 0,
  right: 100,
  bottom: height,
  toJSON: () => {},
});

const setRect = (node: HTMLElement | null, height: number) => {
  if (!node) return;
  node.getBoundingClientRect = () => createRect(height);
};

const HeightProbe = ({
  heightMode,
  containerHeight,
  actionsHeight,
  paginationHeight,
  depsKey,
}: {
  heightMode?: string;
  containerHeight: number;
  actionsHeight: number;
  paginationHeight: number;
  depsKey: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const gridHeight = useDetailsGridHeight({
    heightMode,
    containerRef,
    actionsRef,
    paginationRef,
    deps: [depsKey],
  });

  return (
    <div>
      <div
        ref={(node) => {
          containerRef.current = node;
          setRect(node, containerHeight);
        }}
      >
        <div
          ref={(node) => {
            actionsRef.current = node;
            setRect(node, actionsHeight);
          }}
        />
        <div data-testid="grid" />
        <div
          ref={(node) => {
            paginationRef.current = node;
            setRect(node, paginationHeight);
          }}
        />
      </div>
      <span data-testid="grid-height">{gridHeight === undefined ? 'undefined' : String(gridHeight)}</span>
    </div>
  );
};

describe('DetailsBlockModel block height', () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeAll(() => {
    if (typeof globalThis.ResizeObserver === 'undefined') {
      globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any;
    }
  });

  afterAll(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('calculates grid height when heightMode is fixed', async () => {
    render(
      <HeightProbe
        heightMode="specifyValue"
        containerHeight={400}
        actionsHeight={40}
        paginationHeight={20}
        depsKey={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('grid-height').textContent).toBe('340');
    });
  });

  it('clears grid height when heightMode is not fixed', async () => {
    const { rerender } = render(
      <HeightProbe
        heightMode="specifyValue"
        containerHeight={400}
        actionsHeight={40}
        paginationHeight={20}
        depsKey={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('grid-height').textContent).toBe('340');
    });

    rerender(
      <HeightProbe heightMode="default" containerHeight={400} actionsHeight={40} paginationHeight={20} depsKey={2} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('grid-height').textContent).toBe('undefined');
    });
  });
});
