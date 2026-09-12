/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AMapBlock } from '../Block';

const setOverlay = vi.hoisted(() => vi.fn());
const pointOverlay = vi.hoisted(() => ({
  getExtData: vi.fn(() => ({ id: 1 })),
  off: vi.fn(),
  on: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('../../../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../Map', async () => {
  const ReactModule = await import('react');
  return {
    AMapCom: ReactModule.forwardRef((_props, ref) => {
      ReactModule.useImperativeHandle(ref, () => ({
        aMap: { GeometryUtil: {} },
        map: {
          getAllOverlays: vi.fn(() => [pointOverlay]),
          setFitView: vi.fn(),
          setZoom: vi.fn(),
        },
        setOverlay,
      }));
      return <div data-testid="amap" />;
    }),
  };
});

describe('AMapBlock', () => {
  beforeEach(() => {
    setOverlay.mockReset();
    setOverlay.mockReturnValue(pointOverlay);
    pointOverlay.getExtData.mockClear();
    pointOverlay.off.mockClear();
    pointOverlay.on.mockClear();
    pointOverlay.remove.mockClear();
  });

  it('lets point overlay events bubble so double-click can finish polygon drawing', async () => {
    render(
      <AMapBlock
        collectionField={{ interface: 'point' }}
        dataSource={[{ id: 1, location: [120, 30] }]}
        fields={[]}
        mapField={['location']}
        marker="id"
        onOpenView={vi.fn()}
        primaryKey="id"
        setSelectedRecordKeys={vi.fn()}
      />,
    );

    await waitFor(() => expect(setOverlay).toHaveBeenCalled());
    expect(setOverlay.mock.calls[0][2]).toEqual(expect.objectContaining({ bubble: true }));
  });
});
