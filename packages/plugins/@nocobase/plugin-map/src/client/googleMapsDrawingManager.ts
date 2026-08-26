/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type GoogleMapsDrawingMode = 'marker' | 'polyline' | 'polygon' | 'circle' | null;

export type GoogleMapsOverlay = google.maps.Marker | google.maps.Polyline | google.maps.Polygon | google.maps.Circle;

export interface GoogleMapsOverlayCompleteEvent {
  type: Exclude<GoogleMapsDrawingMode, null>;
  overlay: GoogleMapsOverlay;
}

export interface GoogleMapsDrawingManager {
  setDrawingMode: (mode: GoogleMapsDrawingMode) => void;
  addListener: (
    eventName: 'overlaycomplete',
    listener: (event: GoogleMapsOverlayCompleteEvent) => void,
  ) => google.maps.MapsEventListener;
  handleClick: (event: google.maps.MapMouseEvent) => void;
  handleOverlayClick: (event: google.maps.MapMouseEvent, fallbackPosition?: google.maps.LatLng) => void;
  handleDoubleClick: () => void;
  completeDrawing: () => void;
  unbindAll: () => void;
}

interface GoogleMapsDrawingManagerOptions {
  drawingMode: GoogleMapsDrawingMode;
  markerOptions: google.maps.MarkerOptions;
  polygonOptions: google.maps.PolygonOptions;
  polylineOptions: google.maps.PolylineOptions;
  circleOptions: google.maps.CircleOptions;
  map: google.maps.Map;
}

const createMapsEventListener = (remove: () => void): google.maps.MapsEventListener => {
  return { remove };
};

export const createGoogleMapsDrawingManager = (options: GoogleMapsDrawingManagerOptions): GoogleMapsDrawingManager => {
  const overlayCompleteListeners = new Set<(event: GoogleMapsOverlayCompleteEvent) => void>();
  let mapListeners: google.maps.MapsEventListener[] = [];
  let drawingMode: GoogleMapsDrawingMode = null;
  let activeOverlay: GoogleMapsOverlay = null;
  let activePath: google.maps.MVCArray<google.maps.LatLng> = null;
  let circleCenter: google.maps.LatLng = null;
  let clickHandler: (event: google.maps.MapMouseEvent, fallbackPosition?: google.maps.LatLng) => void = null;
  let doubleClickHandler: () => void = null;
  let lastClickTime = 0;
  let lastClickPosition: google.maps.LatLng = null;

  const clearMapListeners = () => {
    mapListeners.forEach((listener) => {
      listener.remove();
    });
    mapListeners = [];
  };

  const clearActiveOverlay = () => {
    activeOverlay?.setMap(null);
    activeOverlay = null;
    activePath = null;
    circleCenter = null;
    lastClickPosition = null;
    lastClickTime = 0;
  };

  const resetMapDrawingOptions = () => {
    options.map.setOptions({
      draggableCursor: undefined,
      disableDoubleClickZoom: false,
    });
  };

  const stopDrawing = () => {
    clearMapListeners();
    clearActiveOverlay();
    clickHandler = null;
    doubleClickHandler = null;
    resetMapDrawingOptions();
  };

  const emitOverlayComplete = (event: GoogleMapsOverlayCompleteEvent) => {
    overlayCompleteListeners.forEach((listener) => {
      listener(event);
    });
  };

  const completeActiveOverlay = (type: Exclude<GoogleMapsDrawingMode, null>) => {
    if (!activeOverlay) {
      return;
    }

    if ((type === 'polygon' || type === 'polyline') && activePath) {
      const path = activePath.getArray();
      const normalizedPath = path.filter((position, index) => {
        const previous = path[index - 1];
        return !previous || previous.lat() !== position.lat() || previous.lng() !== position.lng();
      });
      activePath.clear();
      normalizedPath.forEach((position) => {
        activePath.push(position);
      });
    }

    let overlay = activeOverlay;
    if (type === 'polygon' && activePath) {
      activeOverlay.setMap(null);
      overlay = new google.maps.Polygon({
        ...options.polygonOptions,
        paths: activePath.getArray(),
        map: options.map,
      });
    }

    activeOverlay = null;
    activePath = null;
    circleCenter = null;
    clearMapListeners();
    resetMapDrawingOptions();
    drawingMode = null;
    emitOverlayComplete({ type, overlay });
  };

  const getEventPosition = (event: google.maps.MapMouseEvent, fallbackPosition?: google.maps.LatLng) => {
    return event.latLng || fallbackPosition || null;
  };

  const shouldSkipDuplicateClick = (position: google.maps.LatLng) => {
    const now = Date.now();
    const isDuplicate =
      lastClickPosition &&
      now - lastClickTime < 50 &&
      lastClickPosition.lat() === position.lat() &&
      lastClickPosition.lng() === position.lng();

    lastClickTime = now;
    lastClickPosition = position;

    return isDuplicate;
  };

  const startMarkerDrawing = () => {
    clickHandler = (event: google.maps.MapMouseEvent, fallbackPosition?: google.maps.LatLng) => {
      const position = getEventPosition(event, fallbackPosition);
      if (!position || shouldSkipDuplicateClick(position)) {
        return;
      }

      const marker = new google.maps.Marker({
        ...options.markerOptions,
        position,
        map: options.map,
      });
      emitOverlayComplete({ type: 'marker', overlay: marker });
    };
    mapListeners.push(options.map.addListener('click', clickHandler));
  };

  const ensurePathOverlay = (type: 'polyline' | 'polygon') => {
    if (!activePath) {
      activePath = new google.maps.MVCArray<google.maps.LatLng>();
    }

    if (!activeOverlay) {
      activeOverlay = new google.maps.Polyline({
        ...(type === 'polyline' ? options.polylineOptions : options.polygonOptions),
        path: activePath,
        map: options.map,
      });
    }

    return activePath;
  };

  const startPathDrawing = (type: 'polyline' | 'polygon') => {
    options.map.setOptions({
      draggableCursor: 'crosshair',
      disableDoubleClickZoom: true,
    });

    clickHandler = (event: google.maps.MapMouseEvent, fallbackPosition?: google.maps.LatLng) => {
      const position = getEventPosition(event, fallbackPosition);
      if (!position || shouldSkipDuplicateClick(position)) {
        return;
      }
      ensurePathOverlay(type).push(position);
    };
    mapListeners.push(options.map.addListener('click', clickHandler));

    doubleClickHandler = () => {
      const minPoints = type === 'polygon' ? 3 : 2;
      if (!activePath || activePath.getLength() < minPoints) {
        return;
      }

      completeActiveOverlay(type);
    };
    mapListeners.push(options.map.addListener('dblclick', doubleClickHandler));
  };

  const updateCircleRadius = (position: google.maps.LatLng) => {
    if (!circleCenter || !(activeOverlay instanceof google.maps.Circle)) {
      return;
    }

    activeOverlay.setRadius(google.maps.geometry.spherical.computeDistanceBetween(circleCenter, position));
  };

  const startCircleDrawing = () => {
    options.map.setOptions({
      draggableCursor: 'crosshair',
    });

    clickHandler = (event: google.maps.MapMouseEvent, fallbackPosition?: google.maps.LatLng) => {
      const position = getEventPosition(event, fallbackPosition);
      if (!position || shouldSkipDuplicateClick(position)) {
        return;
      }

      if (!circleCenter) {
        circleCenter = position;
        activeOverlay = new google.maps.Circle({
          ...options.circleOptions,
          center: circleCenter,
          radius: 0,
          map: options.map,
        });
        return;
      }

      updateCircleRadius(position);
      completeActiveOverlay('circle');
    };
    mapListeners.push(options.map.addListener('click', clickHandler));

    mapListeners.push(
      options.map.addListener('mousemove', (event: google.maps.MapMouseEvent) => {
        const position = getEventPosition(event);
        if (!position) {
          return;
        }

        updateCircleRadius(position);
      }),
    );
  };

  const manager: GoogleMapsDrawingManager = {
    setDrawingMode(mode) {
      stopDrawing();
      drawingMode = mode;

      if (!drawingMode) {
        return;
      }

      if (drawingMode === 'marker') {
        startMarkerDrawing();
      } else if (drawingMode === 'polyline' || drawingMode === 'polygon') {
        startPathDrawing(drawingMode);
      } else if (drawingMode === 'circle') {
        startCircleDrawing();
      }
    },
    addListener(eventName, listener) {
      if (eventName !== 'overlaycomplete') {
        return createMapsEventListener(() => {});
      }

      overlayCompleteListeners.add(listener);
      return createMapsEventListener(() => {
        overlayCompleteListeners.delete(listener);
      });
    },
    handleClick(event) {
      clickHandler?.(event);
    },
    handleOverlayClick(event, fallbackPosition) {
      clickHandler?.(event, fallbackPosition);
    },
    handleDoubleClick() {
      doubleClickHandler?.();
    },
    completeDrawing() {
      const minPoints = drawingMode === 'polygon' ? 3 : 2;
      if ((drawingMode === 'polygon' || drawingMode === 'polyline') && activePath?.getLength() >= minPoints) {
        completeActiveOverlay(drawingMode);
      } else if (drawingMode === 'circle' && activeOverlay) {
        completeActiveOverlay('circle');
      }
    },
    unbindAll() {
      stopDrawing();
      overlayCompleteListeners.clear();
    },
  };

  manager.setDrawingMode(options.drawingMode);

  return manager;
};
