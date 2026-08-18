/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleMapsDrawingManager } from '../Map';

class Polygon {
  setMap = vi.fn();
  setPath = vi.fn();
}

class Polyline {
  setMap = vi.fn();
  setPath = vi.fn();
}

class Circle {
  setMap = vi.fn();
}

const createPosition = (lat: number, lng: number) =>
  ({
    lat: () => lat,
    lng: () => lng,
  }) as google.maps.LatLng;

describe('GoogleMapsDrawingManager', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'google', {
      configurable: true,
      value: {
        maps: {
          Circle,
          Polygon,
          Polyline,
        },
      },
    });
  });

  it('completes a polygon when the final double-click occurs on a point overlay', () => {
    const mapListeners = new Map<string, (event: { latLng?: google.maps.LatLng }) => void>();
    const setOptions = vi.fn();
    const manager = new GoogleMapsDrawingManager({
      drawingMode: 'polygon',
      map: {
        addListener: vi.fn((eventName, listener) => {
          mapListeners.set(eventName, listener);
          return { remove: vi.fn() };
        }),
        setOptions,
      } as unknown as google.maps.Map,
    });
    const onComplete = vi.fn();
    manager.addListener('overlaycomplete', onComplete);

    mapListeners.get('click')?.({ latLng: createPosition(1, 1) });
    mapListeners.get('click')?.({ latLng: createPosition(2, 2) });
    manager.handleOverlayClick({ latLng: null } as google.maps.MapMouseEvent, createPosition(3, 3));
    manager.handleOverlayClick({ latLng: null } as google.maps.MapMouseEvent, createPosition(3, 3));
    manager.handleDoubleClick();

    expect(onComplete).toHaveBeenCalledWith({
      type: 'polygon',
      overlay: expect.any(Polygon),
    });
    expect(setOptions).toHaveBeenCalledWith({
      draggableCursor: 'crosshair',
      disableDoubleClickZoom: true,
    });
  });

  it('does not complete a polygon with only two unique positions', () => {
    const mapListeners = new Map<string, (event: { latLng?: google.maps.LatLng }) => void>();
    const manager = new GoogleMapsDrawingManager({
      drawingMode: 'polygon',
      map: {
        addListener: vi.fn((eventName, listener) => {
          mapListeners.set(eventName, listener);
          return { remove: vi.fn() };
        }),
        setOptions: vi.fn(),
      } as unknown as google.maps.Map,
    });
    const onComplete = vi.fn();
    manager.addListener('overlaycomplete', onComplete);

    mapListeners.get('click')?.({ latLng: createPosition(1, 1) });
    manager.handleOverlayClick({ latLng: null } as google.maps.MapMouseEvent, createPosition(2, 2));
    manager.handleOverlayClick({ latLng: null } as google.maps.MapMouseEvent, createPosition(2, 2));
    manager.handleDoubleClick();

    expect(onComplete).not.toHaveBeenCalled();
  });
});
