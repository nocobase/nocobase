/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleMapsBlock } from '../Block';

const drawingManager = vi.hoisted(() => ({
  addListener: vi.fn(() => ({ remove: vi.fn() })),
  completeDrawing: vi.fn(),
  handleDoubleClick: vi.fn(),
  handleOverlayClick: vi.fn(),
  setDrawingMode: vi.fn(),
  unbindAll: vi.fn(),
}));

const overlayListeners = vi.hoisted(() => new Map<string, (event: unknown) => void>());
const dataOverlay = vi.hoisted(() => ({
  addListener: vi.fn((eventName: string, listener: (event: unknown) => void) => {
    overlayListeners.set(eventName, listener);
  }),
  set: vi.fn(),
  setMap: vi.fn(),
  unbindAll: vi.fn(),
}));

vi.mock('../../../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../Map', async () => {
  const ReactModule = await import('react');
  return {
    GoogleMapsCom: ReactModule.forwardRef((_props, ref) => {
      ReactModule.useImperativeHandle(ref, () => ({
        createDraw: vi.fn(() => drawingManager),
        drawingManager,
        map: {},
        setFitView: vi.fn(),
        setOverlay: vi.fn(() => dataOverlay),
      }));
      return <div data-testid="google-map" />;
    }),
  };
});

describe('GoogleMapsBlock', () => {
  beforeEach(() => {
    drawingManager.addListener.mockClear();
    drawingManager.completeDrawing.mockClear();
    drawingManager.handleDoubleClick.mockClear();
    drawingManager.handleOverlayClick.mockClear();
    drawingManager.setDrawingMode.mockClear();
    drawingManager.unbindAll.mockClear();
    overlayListeners.clear();
    dataOverlay.addListener.mockClear();
    dataOverlay.set.mockClear();
    dataOverlay.setMap.mockClear();
    dataOverlay.unbindAll.mockClear();
    Object.defineProperty(globalThis, 'google', {
      configurable: true,
      value: {
        maps: {
          geometry: { poly: { containsLocation: vi.fn() } },
        },
      },
    });
  });

  it('finishes an active polygon when confirming a selection', async () => {
    const { container } = render(
      <GoogleMapsBlock
        collectionField={{ interface: 'point' }}
        dataSource={[]}
        fields={[]}
        marker="id"
        primaryKey="id"
        setSelectedRecordKeys={vi.fn()}
      />,
    );

    const selectionButton = container.querySelector('[data-icon="expand"]')?.closest('button');
    if (!selectionButton) {
      throw new Error('Selection button was not rendered');
    }
    fireEvent.click(selectionButton);
    fireEvent.click(await screen.findByTitle('Confirm selection'));

    expect(drawingManager.completeDrawing).toHaveBeenCalledTimes(1);
  });

  it('finishes a selection when double-clicking a data overlay', async () => {
    const { container } = render(
      <GoogleMapsBlock
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

    const selectionButton = container.querySelector('[data-icon="expand"]')?.closest('button');
    if (!selectionButton) {
      throw new Error('Selection button was not rendered');
    }
    fireEvent.click(selectionButton);
    await waitFor(() => expect(overlayListeners.has('dblclick')).toBe(true));
    overlayListeners.get('dblclick')?.({});

    expect(drawingManager.handleDoubleClick).toHaveBeenCalledTimes(1);
  });
});
