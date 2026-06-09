/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SyncOutlined } from '@ant-design/icons';
import { Loader } from '@googlemaps/js-api-loader';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Alert, App, Button, Spin } from 'antd';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { defaultImage } from '../../../../shared/constants';
import { mapActiveColor } from '../../../../shared/theme';
import { useMapConfig } from '../../../hooks';
import { useT } from '../../../locale';
import { MapEditorType } from '../../../../shared/types';
import { Search } from './Search';
import { getCurrentPosition, getIcon } from './utils';

export type OverlayOptions = google.maps.PolygonOptions & google.maps.MarkerOptions & google.maps.PolylineOptions;

export const getDrawingMode = (type: MapEditorType) => {
  if (type === 'point') {
    return 'marker';
  } else if (type === 'lineString') {
    return 'polyline';
  }
  return type;
};

const methodMapping = {
  point: {
    propertyKey: 'position',
    overlay: 'Marker',
  },
  polygon: {
    propertyKey: 'paths',
    overlay: 'Polygon',
  },
  lineString: {
    propertyKey: 'path',
    overlay: 'Polyline',
  },
  circle: {
    transformOptions(value) {
      return {
        center: new google.maps.LatLng(value[1], value[0]),
        radius: value[2],
      } as google.maps.CircleOptions;
    },
    overlay: 'Circle',
  },
};

export interface GoogleMapsCompProps {
  value?: any;
  onChange?: (value: number[]) => void;
  disabled?: boolean;
  mapType: string;
  /**
   * only ReadPretty
   */
  readonly: string;
  zoom: number;
  type: MapEditorType;
  style?: React.CSSProperties;
  overlayCommonOptions?: OverlayOptions;
  block?: boolean;
  height?: number;
}

export interface GoogleMapForwardedRefProps {
  setOverlay: (t: MapEditorType, v: any, o?: OverlayOptions) => google.maps.MVCObject;
  getOverlay: (t: MapEditorType, v: any, o?: OverlayOptions) => google.maps.MVCObject;
  setFitView: (overlays: google.maps.MVCObject[]) => void;
  createDraw: (onlyCreate?: boolean, additionalOptions?: OverlayOptions) => any;
  map: google.maps.Map;
  overlay: google.maps.MVCObject;
  drawingManager: google.maps.drawing.DrawingManager;
  errMessage?: string;
}

export const GoogleMapsCom = React.forwardRef<GoogleMapForwardedRefProps, GoogleMapsCompProps>((props, ref) => {
  const {
    value,
    onChange,
    block = false,
    readonly,
    disabled = block,
    zoom = 13,
    overlayCommonOptions,
    height,
    type,
  } = props;
  const { accessKey } = useMapConfig(props.mapType) || {};
  const t = useT();
  const ctx = useFlowContext();
  const getLoadFailedMessage = useMemoizedFn(() =>
    t('Load google maps failed, Please check the Api key and refresh the page'),
  );
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager>();
  const map = useRef<google.maps.Map>();
  const overlayRef = useRef<google.maps.Marker | google.maps.Polygon | google.maps.Polyline | google.maps.Circle>();
  const [needUpdateFlag, forceUpdate] = useState([]);
  const [errMessage, setErrMessage] = useState('');
  const { modal } = App.useApp();
  useEffect(() => {
    if (map.current && !block) {
      map.current?.setZoom(zoom);
    }
  }, [zoom, block]);

  const drawingMode = useRef(getDrawingMode(type) as google.maps.drawing.OverlayType);

  const [commonOptions] = useState<OverlayOptions>({
    strokeWeight: 5,
    strokeColor: mapActiveColor,
    fillColor: mapActiveColor,
    strokeOpacity: 1,
    editable: !disabled,
    draggable: !disabled,
    ...overlayCommonOptions,
  });

  const { navigate } = ctx.router;
  const mapContainerRef = useRef<HTMLDivElement>();
  const cleanupOverlayListenersRef = useRef<Set<() => void>>(new Set());

  const onAndOffListenOverlay = useMemoizedFn((target: typeof overlayRef.current) => {
    cleanupOverlayListenersRef.current.forEach((cb) => {
      cleanupOverlayListenersRef.current.delete(cb);
    });

    if ('getPath' in target) {
      const mvcArray = target.getPath();
      ['insert_at', 'remove_at', 'set_at'].forEach((event) => {
        cleanupOverlayListenersRef.current.add(
          mvcArray.addListener(event, () => {
            onMapChange(target, true);
          }).remove,
        );
      });
    } else if (target instanceof google.maps.Circle) {
      ['center_changed', 'radius_changed'].forEach((event) => {
        cleanupOverlayListenersRef.current.add(
          target.addListener(event, () => {
            onMapChange(target, true);
          }).remove,
        );
      });
    }
  });

  const toRemoveOverlay = useMemoizedFn(() => {
    if (overlayRef.current) {
      overlayRef.current.unbindAll();
      overlayRef.current.setMap(null);
    }
    if (type !== 'point') {
      drawingManagerRef.current?.setDrawingMode(null);
    }
  });

  const toCenter = useMemoizedFn((position) => {
    if (map.current && position) {
      map.current?.setCenter(position);
      map.current?.setZoom(zoom);
    }
  });

  const setupOverlay = useMemoizedFn((nextOverlay: typeof overlayRef.current) => {
    toRemoveOverlay();
    onAndOffListenOverlay(nextOverlay);
    overlayRef.current = nextOverlay;
  });

  const setFitView = useMemoizedFn((overlays: google.maps.MVCObject[]) => {
    if (!overlays?.length) {
      return;
    }
    if (overlays.length === 1 && overlays[0] instanceof google.maps.Marker) {
      map.current?.setCenter?.((overlays[0] as google.maps.Marker).getPosition());
      map.current?.setZoom?.(zoom || 13);
      return;
    }
    const bounds = new google.maps.LatLngBounds();

    overlays.forEach((overlay) => {
      if (overlay instanceof google.maps.Marker) {
        bounds.extend(overlay.getPosition());
      } else if (overlay instanceof google.maps.Polyline || overlay instanceof google.maps.Polygon) {
        const path = overlay.getPath();
        for (let i = 0; i < path.getLength(); i++) {
          bounds.extend(path.getAt(i));
        }
      } else if (overlay instanceof google.maps.Circle) {
        bounds.union(overlay.getBounds());
      }
    });

    map.current?.fitBounds?.(bounds);
  });

  const onFocusOverlay = () => {
    if (overlayRef.current) {
      setFitView([overlayRef.current]);
    }
  };

  const onMapChange = useMemoizedFn((target: typeof overlayRef.current, onlyChange = false) => {
    let nextValue = null;

    if (type === 'point') {
      const { lat, lng } = (target as google.maps.Marker).getPosition();
      nextValue = [lng(), lat()];
    } else if (type === 'polygon' || type === 'lineString') {
      nextValue = (target as google.maps.Polyline)
        .getPath()
        .getArray()
        .map((item) => [item.lng(), item.lat()]);
      if (nextValue.length < 2) {
        return;
      }
    } else if (type === 'circle') {
      const center = (target as google.maps.Circle).getCenter();
      const radius = (target as google.maps.Circle).getRadius();
      nextValue = [center.lng(), center.lat(), radius];
    }

    if (!onlyChange) {
      setupOverlay(target);
    }
    onChange?.(nextValue);
  });

  const createDraw = useMemoizedFn((onlyCreate = false, additionalOptions?: OverlayOptions) => {
    const currentOptions = {
      ...commonOptions,
      ...additionalOptions,
      map: map.current,
    };
    drawingManagerRef.current = new google.maps.drawing.DrawingManager({
      drawingMode: drawingMode.current,
      drawingControl: false,
      markerOptions: { ...currentOptions, icon: getIcon(defaultImage) },
      polygonOptions: currentOptions,
      polylineOptions: currentOptions,
      circleOptions: currentOptions,
      map: map.current,
    });

    if (!onlyCreate) {
      drawingManagerRef.current.addListener('overlaycomplete', (event: { type: string; overlay: unknown }) => {
        const overlay = event.overlay as google.maps.Marker;
        onMapChange(overlay);
      });
    }
    return drawingManagerRef.current;
  });

  const getOverlay = useMemoizedFn((t = type, v = value, o?: OverlayOptions) => {
    const mapping = methodMapping[t];
    if (!mapping) {
      return;
    }
    const options = { ...commonOptions, icon: getIcon(defaultImage), ...o };

    if ('transformOptions' in mapping) {
      Object.assign(options, mapping.transformOptions(v));
    } else if ('propertyKey' in mapping) {
      options[mapping.propertyKey] = Array.isArray(v[0])
        ? v.map((item) => {
            return new google.maps.LatLng(item[1], item[0]);
          })
        : new google.maps.LatLng(v[1], v[0]);
    }

    const overlay = new google.maps[mapping.overlay](options);
    return overlay;
  });

  const setOverlay = useMemoizedFn((t = type, v = value, o?: OverlayOptions) => {
    if (!map.current) return;
    const nextOverlay = getOverlay(t, v, {
      ...o,
      map: map.current,
    }) as google.maps.Polyline;
    return nextOverlay;
  });

  // edit mode
  useEffect(() => {
    if (!value && map.current) {
      toRemoveOverlay();
      drawingManagerRef?.current?.setDrawingMode?.(drawingMode.current);
      onChange?.(null);
    }
    if (!map.current) return;
    if (!value || (!readonly && overlayRef.current)) {
      return;
    }
    const nextOverlay = setOverlay();
    setupOverlay(nextOverlay);
    // Focus on the overlay
    setFitView([nextOverlay]);
  }, [
    value,
    needUpdateFlag,
    type,
    disabled,
    readonly,
    setOverlay,
    setFitView,
    setupOverlay,
    onChange,
    toRemoveOverlay,
  ]);

  useEffect(() => {
    if (!accessKey || map.current || !mapContainerRef.current) return;
    let loader: Loader;
    let disposed = false;
    try {
      loader = new Loader({
        apiKey: accessKey,
        version: 'quarterly',
        language: ctx.api.auth.getLocale(),
      });
    } catch (err) {
      setErrMessage(getLoadFailedMessage());
      return;
    }

    // google maps api error
    const error = console.error;
    console.error = (err, ...args) => {
      if (err?.includes?.('InvalidKeyMapError')) {
        setErrMessage(getLoadFailedMessage());
      }
      error(err, ...args);
    };

    Promise.all([loader.importLibrary('drawing'), loader.importLibrary('core'), loader.importLibrary('geometry')])
      .then(async (res) => {
        const center = await getCurrentPosition();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const mapContainer = mapContainerRef.current;
        if (disposed || !(mapContainer instanceof HTMLElement)) {
          return;
        }
        map.current = new google.maps.Map(mapContainer, {
          zoom,
          center,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          zoomControl: false,
          streetViewControl: false,
          panControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        google.maps.event.trigger(map.current, 'resize');
        setErrMessage('');
        forceUpdate([]);
      })
      .catch((err) => {
        if (err instanceof Error) {
          setErrMessage(err.message);
          return;
        }
      });

    return () => {
      disposed = true;
      map.current?.unbindAll();
      map.current = null;
      drawingManagerRef.current?.unbindAll();
    };
  }, [accessKey, ctx.api.auth, getLoadFailedMessage, zoom]);

  useEffect(() => {
    if (!map.current || !type || disabled || drawingManagerRef.current) return;
    createDraw();
  }, [createDraw, disabled, needUpdateFlag, type]);

  useImperativeHandle(ref, () => ({
    setOverlay,
    getOverlay,
    setFitView,
    createDraw,
    map: map.current,
    overlay: overlayRef.current,
    drawingManager: drawingManagerRef.current,
    errMessage,
  }));

  const onReset = useMemoizedFn(() => {
    const ok = () => {
      toRemoveOverlay();
      drawingManagerRef.current.setDrawingMode(drawingMode.current);
      onChange?.(null);
    };
    modal.confirm({
      title: t('Clear the canvas'),
      content: t('Are you sure to clear the canvas?'),
      okText: t('Confirm'),
      cancelText: t('Cancel'),
      getContainer: () => mapContainerRef.current,
      onOk() {
        ok();
      },
    });
  });
  if (!accessKey || errMessage) {
    return (
      <Alert
        action={
          <Button
            type="primary"
            onClick={() => {
              ctx.view?.close?.();
              navigate('/admin/settings/map' + '?tab=google');
            }}
          >
            {t('Go to the configuration page')}
          </Button>
        }
        message={errMessage || t('Please configure the Api key first')}
        type="error"
      />
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        height: height || 500,
      }}
    >
      {!map.current && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin />
        </div>
      )}
      {!disabled ? (
        <>
          {map.current && <Search toCenter={toCenter} mapRef={map} />}
          <div
            style={{
              position: 'absolute',
              bottom: 80,
              right: 20,
              zIndex: 10,
            }}
          >
            <Button
              onClick={onFocusOverlay}
              disabled={!overlayRef.current}
              type="primary"
              shape="round"
              size="large"
              icon={<SyncOutlined />}
            ></Button>
          </div>
          {type === 'lineString' || type === 'polygon' ? (
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: 10,
                zIndex: 2,
                pointerEvents: 'none',
              }}
            >
              <Alert
                message={t('Click to select the starting point and double-click to end the drawing')}
                type="info"
              />
            </div>
          ) : null}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              zIndex: 2,
            }}
          >
            <Button
              disabled={!value}
              style={{
                height: '40px',
              }}
              onClick={onReset}
              type="primary"
              danger
            >
              {t('Clear')}
            </Button>
          </div>
        </>
      ) : null}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          ...props?.style,
        }}
      ></div>
    </div>
  );
});
GoogleMapsCom.displayName = 'GoogleMapsCom';
