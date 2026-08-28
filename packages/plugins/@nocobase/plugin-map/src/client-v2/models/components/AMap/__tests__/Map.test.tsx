/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import AMapLoader from '@amap/amap-jsapi-loader';
import { act, render, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AMapCom, AMapForwardedRefProps } from '../Map';

vi.mock('@amap/amap-jsapi-loader', () => ({
  default: {
    load: vi.fn(),
    reset: vi.fn(),
  },
}));

let drawListener: ((event: { obj: MockPolygon }) => void) | undefined;
let polygonEditor: MockPolygonEditor;
let mapConstructionCount = 0;

class MockMap {
  destroy = vi.fn();
  setFitView = vi.fn();
  setZoom = vi.fn();
  setZoomAndCenter = vi.fn();

  constructor() {
    mapConstructionCount += 1;
  }
}

class MockMouseTool {
  close = vi.fn();
  marker = vi.fn();
  polygon = vi.fn();

  on(eventName: string, listener: (event: { obj: MockPolygon }) => void) {
    if (eventName === 'draw') {
      drawListener = listener;
    }
  }
}

class MockPolygonEditor {
  private target: MockPolygon | null = null;
  close = vi.fn();
  open = vi.fn();
  on = vi.fn();
  setTarget = vi.fn((target?: MockPolygon | null) => {
    this.target = target || null;
  });

  constructor() {
    polygonEditor = this;
  }

  getTarget() {
    return this.target;
  }
}

class MockPolygon {
  getPath() {
    return [
      { lng: 120, lat: 30 },
      { lng: 121, lat: 30 },
      { lng: 121, lat: 31 },
    ];
  }
}

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({ router: { navigate: vi.fn() } }),
}));

vi.mock('../../../../hooks', () => ({
  useMapConfig: () => ({ accessKey: 'test-access-key' }),
}));

vi.mock('../../../../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('AMapCom block drawing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    drawListener = undefined;
    mapConstructionCount = 0;
    Object.defineProperty(globalThis, 'AMap', {
      configurable: true,
      value: {
        Map: MockMap,
        MouseTool: MockMouseTool,
        PolygonEditor: MockPolygonEditor,
      },
    });
  });

  it('initializes the map only once when the translation callback identity changes', async () => {
    Object.defineProperty(globalThis, 'AMap', {
      configurable: true,
      value: undefined,
    });
    vi.mocked(AMapLoader.load).mockResolvedValue({
      Map: MockMap,
      MouseTool: MockMouseTool,
      PolygonEditor: MockPolygonEditor,
    } as never);
    const mapRef = React.createRef<AMapForwardedRefProps>();
    render(
      <App>
        <AMapCom ref={mapRef} block disabled mapType="amap" readonly="" type="point" zoom={13} />
      </App>,
    );

    await waitFor(() => expect(mapRef.current?.map).toBeInstanceOf(MockMap));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(mapConstructionCount).toBe(1);
  });

  it('hands a selection polygon to PolygonEditor when the configured map field is a point', async () => {
    const mapRef = React.createRef<AMapForwardedRefProps>();
    render(
      <App>
        <AMapCom ref={mapRef} block disabled mapType="amap" readonly="" type="point" zoom={13} />
      </App>,
    );

    await waitFor(() => expect(mapRef.current?.map).toBeInstanceOf(MockMap));
    act(() => {
      mapRef.current?.createEditor('polygon');
      mapRef.current?.createMouseTool('polygon');
    });
    const polygon = new MockPolygon();

    expect(() => {
      act(() => drawListener?.({ obj: polygon }));
    }).not.toThrow();
    expect(polygonEditor.setTarget).toHaveBeenCalledWith(polygon);
  });
});
