/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, EnvironmentOutlined, ExpandOutlined } from '@ant-design/icons';
import { useMemoizedFn } from 'ahooks';
import { Button, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { defaultImage, selectedImage } from '../../../../shared/constants';
import { mapActiveColor, mapSelectedColor } from '../../../../shared/theme';
import { compileTemplate, getLabelFormatValue, getSource } from '../../../../shared/utils';
import { useT } from '../../../locale';
import { GoogleMapForwardedRefProps, GoogleMapsCom, OverlayOptions } from './Map';
import { getIcon } from './utils';

const OVERLAY_KEY = 'google-maps-overlay-id';
const OVERLAY_SELECtED = 'google-maps-overlay-selected';

const labelClass = 'nb-map-google-label';
const pointClass = 'nb-map-google-point-label';

export const GoogleMapsBlock = (props) => {
  const {
    collectionField,
    marker,
    dataSource,
    fixedBlock,
    zoom,
    setSelectedRecordKeys,
    lineSort,
    fields,
    name,
    primaryKey,
    mapField,
    associationCollectionField,
    onOpenView,
  } = props;
  const [isMapInitialization, setIsMapInitialization] = useState(false);
  const mapRef = useRef<GoogleMapForwardedRefProps>();
  const [selectingMode, setSelecting] = useState('');
  const t = useT();
  const compile = (value: any) => compileTemplate(value, t);
  const isConnected = false;
  const doFilter = (..._args: any[]) => {};
  const [, setPrevSelected] = useState<any>(null);
  const selectingModeRef = useRef(selectingMode);
  const selectionOverlayRef = useRef<google.maps.Polygon | null>(null);
  const overlaysRef = useRef<google.maps.MVCObject[]>([]);
  selectingModeRef.current = selectingMode;
  const labelUiSchema = fields.find((v) => v.name === marker)?.uiSchema;
  const geometryType = collectionField.interface || collectionField.type;
  const setOverlayOptions = (overlay: google.maps.MVCObject, state?: boolean) => {
    const selected = typeof state !== 'undefined' ? !state : overlay.get(OVERLAY_SELECtED);
    overlay.set(OVERLAY_SELECtED, !selected);
    (overlay as google.maps.Marker).setOptions({
      ...(selected
        ? {
            icon: getIcon(defaultImage),
            strokeColor: mapActiveColor,
            fillColor: mapActiveColor,
          }
        : {
            icon: getIcon(selectedImage),
            strokeColor: mapSelectedColor,
            fillColor: mapSelectedColor,
          }),
    } as OverlayOptions);
  };

  // selection
  useEffect(() => {
    if (selectingMode !== 'selection') {
      return;
    }
    if (mapRef.current && !mapRef.current?.drawingManager) {
      mapRef.current.drawingManager = mapRef.current?.createDraw(true, {
        editable: true,
        draggable: true,
      });
    }
    const listenerSet = new Set<() => void>();
    mapRef.current?.drawingManager.setDrawingMode('polygon');
    mapRef.current?.drawingManager.addListener('overlaycomplete', (event) => {
      const polygon = event.overlay as google.maps.Polygon;
      mapRef.current?.drawingManager.setDrawingMode(null);
      selectionOverlayRef.current = polygon;
      const path = polygon.getPath();
      ['insert_at', 'remove_at', 'set_at'].forEach((key) => {
        listenerSet.add(path.addListener(key, () => {}).remove);
      });
    });
    return () => {
      listenerSet.forEach((i) => {
        i();
      });
      if (!mapRef.current) return;
      selectionOverlayRef.current?.unbindAll();
      selectionOverlayRef.current?.setMap(null);
      selectionOverlayRef.current = null;
      mapRef.current?.drawingManager.setDrawingMode(null);
      mapRef.current?.drawingManager.unbindAll();
    };
  }, [selectingMode]);

  useEffect(() => {
    if (selectingMode) {
      return () => {
        if (!selectingModeRef.current) {
          overlaysRef.current.forEach((o) => {
            setOverlayOptions(o, false);
          });
        }
      };
    }
  }, [selectingMode]);

  const onSelectingComplete = useMemoizedFn(() => {
    const overlay = selectionOverlayRef.current;
    const overlays = overlaysRef.current;
    const poly = google.maps.geometry.poly;
    const selectedOverlays = overlays.filter((o) => {
      if (o === overlay || o.get(OVERLAY_KEY) === undefined) return;
      if (o instanceof google.maps.Marker) {
        return poly.containsLocation(o.getPosition()!, overlay!);
      } else if (o instanceof google.maps.Circle) {
        return poly.containsLocation(o.getCenter()!, overlay!);
      } else {
        return (o as google.maps.Polygon)
          .getPath()
          .getArray()
          .some((position) => {
            return poly.containsLocation(position, overlay!);
          });
      }
    });
    const ids = selectedOverlays.map((o) => {
      setOverlayOptions(o, true);
      return o.get(OVERLAY_KEY);
    });
    setSelectedRecordKeys((lastIds) => ids.concat(lastIds));
    overlay?.unbindAll();
    overlay?.setMap(null);
    mapRef.current?.drawingManager.setDrawingMode('polygon');
  });

  useEffect(() => {
    if (!collectionField || !dataSource?.length || !mapRef.current?.map) return;
    const overlays: google.maps.MVCObject[] = dataSource
      .map((item) => {
        const data = getSource(item, mapField, associationCollectionField?.interface)?.filter(Boolean);
        const title = getLabelFormatValue(labelUiSchema, item[marker]);
        if (!data?.length) return [];
        return data?.filter(Boolean).map((mapItem) => {
          if (!data) return;
          const overlay = mapRef.current?.setOverlay(geometryType, mapItem, {
            strokeColor: mapActiveColor,
            fillColor: mapActiveColor,
            cursor: 'pointer',
            label: {
              className: labelClass,
              fontFamily: 'inherit',
              fontSize: '13px',
              color: '#333',
              text: marker ? compile(title) : undefined,
            } as google.maps.MarkerLabel,
          });
          overlay?.set(OVERLAY_KEY, item[primaryKey]);
          return overlay;
        });
      })
      .flat()
      .filter(Boolean);

    overlaysRef.current = overlays;

    const events = overlays.map((o: google.maps.MVCObject) => {
      const onClick = (event) => {
        const overlay = o as google.maps.Polygon;
        const id = overlay.get(OVERLAY_KEY);
        if (!id) return;

        const data = dataSource?.find((item) => {
          return id === item[primaryKey];
        });

        // 筛选区块模式
        if (isConnected) {
          setPrevSelected((prev) => {
            prev && clearSelected(overlay);
            if (prev === o) {
              clearSelected(overlay);

              // 删除过滤参数
              doFilter(null);
              return null;
            } else {
              selectMarker(overlay);
              doFilter(data[primaryKey], (target) => target.field || primaryKey, '$eq');
            }
            return overlay;
          });

          return;
        }

        if (data) {
          onOpenView(data);
        }
      };
      o.addListener('click', onClick);
      return () => o.unbindAll();
    });

    if (geometryType === 'point' && lineSort?.length && overlays?.length > 1) {
      const positions = overlays.map((o: google.maps.Marker) => o.getPosition());

      (overlays[0] as google.maps.Marker).setZIndex(138);
      (overlays[overlays.length - 1] as google.maps.Marker).setZIndex(138);

      const createText = (start = true) => {
        if (!mapRef.current?.map) return;
        return new google.maps.Marker({
          label: {
            // direction: 'top',
            // offset: [0, 0],
            className: pointClass,
            fontFamily: 'inherit',
            fontSize: '13px',
            color: '#333',
            text: start ? t('Start point') : t('End point'),
          },
          icon: getIcon(defaultImage),
          position: start ? positions[0] : positions[positions.length - 1],
          map: mapRef.current.map,
        });
      };

      overlays.push(
        ...[
          mapRef.current.setOverlay(
            'lineString',
            positions.map((p) => [p.lng(), p.lat()]),
            {
              strokeColor: mapActiveColor,
              fillColor: mapActiveColor,
              strokeWeight: 2,
              cursor: 'pointer',
            },
          ),
          createText(),
          createText(false),
        ].filter(Boolean),
      );
    }

    mapRef.current?.setFitView(overlays);

    return () => {
      overlays.forEach((ov) => {
        (ov as google.maps.Polygon).setMap(null);
        ov.unbindAll();
      });
      events.forEach((e) => e());
    };
  }, [dataSource, isMapInitialization, marker, geometryType, isConnected]);

  useEffect(() => {
    setTimeout(() => {
      setSelectedRecordKeys([]);
    });
  }, [dataSource]);

  const mapRefCallback = (instance: GoogleMapForwardedRefProps) => {
    mapRef.current = instance;
    setIsMapInitialization(!!instance?.map && !instance.errMessage);
  };

  const mapStyle = fixedBlock ? { height: '100%' } : undefined;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {isMapInitialization && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
              zIndex: 999,
            }}
          >
            <Space direction="vertical">
              <Button
                style={{
                  color: !selectingMode ? mapSelectedColor : undefined,
                  borderColor: 'currentcolor',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelecting('');
                }}
                icon={<EnvironmentOutlined />}
              ></Button>
              <Button
                style={{
                  color: selectingMode === 'selection' ? mapSelectedColor : undefined,
                  borderColor: 'currentcolor',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelecting('selection');
                }}
                icon={<ExpandOutlined />}
              ></Button>
              {selectingMode === 'selection' ? (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  title={t('Confirm selection')}
                  onClick={onSelectingComplete}
                ></Button>
              ) : null}
            </Space>
          </div>
          {/* <RecordProvider record={record} parent={parentRecordData}>
            <MapBlockDrawer />
          </RecordProvider> */}
        </>
      )}
      <GoogleMapsCom
        {...props}
        ref={mapRefCallback}
        style={mapStyle}
        zoom={zoom}
        type={geometryType}
        disabled
        block
        overlayCommonOptions={{
          strokeColor: mapSelectedColor,
          fillColor: mapSelectedColor,
        }}
      ></GoogleMapsCom>
    </div>
  );
};

function clearSelected(target: google.maps.Polygon) {
  if (target instanceof google.maps.Marker) {
    return target.setIcon(getIcon(defaultImage));
  }
  target.setOptions({
    strokeColor: mapActiveColor,
    fillColor: mapActiveColor,
  });
}

function selectMarker(target: google.maps.Polygon) {
  if (target instanceof google.maps.Marker) {
    return target.setIcon(getIcon(selectedImage));
  }
  target.setOptions({
    strokeColor: mapSelectedColor,
    fillColor: mapSelectedColor,
  });
}
