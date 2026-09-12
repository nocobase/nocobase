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
import { useBlockHeight } from '../utils';

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
  areaHeight,
  headerHeight,
  paginationHeight,
  depsKey,
}: {
  heightMode?: string;
  areaHeight: number;
  headerHeight: number;
  paginationHeight: number;
  depsKey: number;
}) => {
  const tableAreaRef = useRef<HTMLDivElement>(null);
  const scrollY = useBlockHeight({
    heightMode,
    tableAreaRef,
    deps: [depsKey],
  });

  return (
    <div>
      <div
        ref={(node) => {
          tableAreaRef.current = node;
          setRect(node, areaHeight);
        }}
      >
        <div
          className="ant-table-header"
          ref={(node) => {
            setRect(node, headerHeight);
          }}
        />
        <div
          className="ant-table-pagination"
          ref={(node) => {
            setRect(node, paginationHeight);
          }}
        />
      </div>
      <span data-testid="scroll">{scrollY === undefined ? 'undefined' : String(scrollY)}</span>
    </div>
  );
};

describe('TableBlockModel block height', () => {
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

  it('calculates scrollY when heightMode is fixed', async () => {
    render(
      <HeightProbe heightMode="specifyValue" areaHeight={300} headerHeight={40} paginationHeight={30} depsKey={1} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('scroll').textContent).toBe('230');
    });
  });

  it('clears scrollY when heightMode is not fixed', async () => {
    const { rerender } = render(
      <HeightProbe heightMode="specifyValue" areaHeight={300} headerHeight={40} paginationHeight={30} depsKey={1} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('scroll').textContent).toBe('230');
    });

    rerender(<HeightProbe heightMode="default" areaHeight={300} headerHeight={40} paginationHeight={30} depsKey={2} />);

    await waitFor(() => {
      expect(screen.getByTestId('scroll').textContent).toBe('undefined');
    });
  });
});
