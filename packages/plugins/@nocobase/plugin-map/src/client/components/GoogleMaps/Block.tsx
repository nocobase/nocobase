/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, EnvironmentOutlined, ExpandOutlined } from '@ant-design/icons';
import {
  RecordProvider,
  css,
  getLabelFormatValue,
  useCollection,
  useCollectionManager_deprecated,
  useCollectionParentRecordData,
  useCollection_deprecated,
  useCompile,
  useFilterAPI,
  usePopupUtils,
  useProps,
} from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import { Button, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { defaultImage, selectedImage } from '../../constants';
import { useMapTranslation } from '../../locale';
import { getSource } from '../../utils';
import { MapBlockDrawer } from '../MapBlockDrawer';
import { GoogleMapForwardedRefProps, GoogleMapsComponent } from './Map';
import { getIcon } from './utils';

const OVERLAY_KEY = 'google-maps-overlay-id';
const OVERLAY_SELECtED = 'google-maps-overlay-selected';

const labelClass = css`
  margin-top: 6px;
  padding: 2px 4px;
  background: #fff;
  border: 1px solid #0000f5;
`;

const pointClass = css`
  margin-top: -64px;
  padding: 2px 4px;
  background: #fff;
  border: 1px solid #0000f5;
`;

const isPositionInPolygon = (position: google.maps.LatLng, polygonPath: google.maps.LatLng[]) => {
  const x = position.lng();
  const y = position.lat();
  let inside = false;

  for (let i = 0, j = polygonPath.length - 1; i < polygonPath.length; j = i++) {
    const xi = polygonPath[i].lng();
    const yi = polygonPath[i].lat();
    const xj = polygonPath[j].lng();
    const yj = polygonPath[j].lat();
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const getMarkerLabel = (text: unknown): google.maps.MarkerLabel | undefined => {
  if (typeof text !== 'string' || !text) {
    return;
  }

  return {
    className: labelClass,
    fontFamily: 'inherit',
    fontSize: '13px',
    color: '#333',
    text,
  } as google.maps.MarkerLabel;
};

export const GoogleMapsBlock = (props) => {
  // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
  const { collectionField, fieldNames, dataSource, fixedBlock, zoom, setSelectedRecordKeys, lineSort, service } =
    useProps(props);
  const { getPrimaryKey } = useCollection_deprecated();
  const primaryKey = getPrimaryKey();
  const { marker: markerName = 'id' } = fieldNames;
  const [isMapInitialization, setIsMapInitialization] = useState(false);
  const mapRef = useRef<GoogleMapForwardedRefProps>();
  const [record, setRecord] = useState();
  const [selectingMode, setSelecting] = useState('');
  const { t } = useMapTranslation();
  const compile = useCompile();
  const { isConnected, doFilter } = useFilterAPI();
  const [, setPrevSelected] = useState<any>(null);
  const selectingModeRef = useRef(selectingMode);
  const selectionOverlayRef = useRef<google.maps.Polygon | null>(null);
  const overlaysRef = useRef<google.maps.MVCObject[]>([]);
  const selectedRecordKeysRef = useRef<Set<string | number>>(new Set());
  const lastSelectionCompleteAtRef = useRef(0);
  const listLoadingRef = useRef(Boolean(service?.loading));
  selectingModeRef.current = selectingMode;
  const { fields } = useCollection();
  const parentRecordData = useCollectionParentRecordData();
  const labelUiSchema = fields.find((v) => v.name === fieldNames?.marker)?.uiSchema;
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const { openPopup } = usePopupUtils();

  const setOverlayOptions = (overlay: google.maps.MVCObject, state?: boolean) => {
    const selected = typeof state !== 'undefined' ? state : !overlay.get(OVERLAY_SELECtED);
    overlay.set(OVERLAY_SELECtED, selected);
    if (overlay instanceof google.maps.Marker) {
      overlay.setIcon(getIcon(selected ? selectedImage : defaultImage));
      overlay.setZIndex(selected ? 138 : null);
      return;
    }

    (overlay as google.maps.Polygon).setOptions(
      selected
        ? {
            strokeColor: '#F18b62',
            fillColor: '#F18b62',
          }
        : {
            strokeColor: '#4e9bff',
            fillColor: '#4e9bff',
          },
    );
  };

  const clearSelectionState = useMemoizedFn(() => {
    selectedRecordKeysRef.current.clear();
    overlaysRef.current.forEach((overlay) => {
      setOverlayOptions(overlay, false);
    });
    setSelectedRecordKeys([]);
  });

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
    mapRef.current?.drawingManager?.setDrawingMode('polygon');
    mapRef.current?.drawingManager?.addListener('overlaycomplete', (event) => {
      const polygon = event.overlay as google.maps.Polygon;
      mapRef.current?.drawingManager?.setDrawingMode(null);
      selectionOverlayRef.current = polygon;
    });
    return () => {
      if (!mapRef.current) return;
      selectionOverlayRef.current?.unbindAll();
      selectionOverlayRef.current?.setMap(null);
      selectionOverlayRef.current = null;
      mapRef.current?.drawingManager?.setDrawingMode(null);
      mapRef.current?.drawingManager?.unbindAll();
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
    mapRef.current?.drawingManager?.completeDrawing();
    const overlay = selectionOverlayRef.current;
    if (!overlay) {
      return;
    }
    const overlays = overlaysRef.current;
    const selectionPath = overlay.getPath().getArray();
    if (selectionPath.length < 3) {
      return;
    }
    const selectedOverlays = overlays.filter((o) => {
      if (o === overlay || o.get(OVERLAY_KEY) === undefined) return;
      if (o instanceof google.maps.Marker) {
        const position = o.getPosition();
        return position ? isPositionInPolygon(position, selectionPath) : false;
      } else if (o instanceof google.maps.Circle) {
        const center = o.getCenter();
        return center ? isPositionInPolygon(center, selectionPath) : false;
      } else {
        return (o as google.maps.Polygon)
          .getPath()
          .getArray()
          .some((position) => {
            return isPositionInPolygon(position, selectionPath);
          });
      }
    });
    const ids = selectedOverlays.map((o) => {
      setOverlayOptions(o, true);
      return o.get(OVERLAY_KEY);
    });
    ids.forEach((id) => {
      selectedRecordKeysRef.current.add(id);
    });
    lastSelectionCompleteAtRef.current = Date.now();
    setSelectedRecordKeys((lastIds) => ids.concat(lastIds));
    overlay.unbindAll();
    overlay.setMap(null);
    selectionOverlayRef.current = null;
    mapRef.current?.drawingManager?.setDrawingMode('polygon');
  });

  useEffect(() => {
    if (!collectionField || !dataSource?.length || !mapRef.current?.map) return;
    const fieldPaths =
      Array.isArray(fieldNames?.field) && fieldNames?.field.length > 1
        ? fieldNames?.field.slice(0, -1)
        : fieldNames?.field;
    const cf = getCollectionJoinField([name, ...fieldPaths].flat().join('.'));

    const overlays: google.maps.MVCObject[] = dataSource
      .map((item) => {
        const data = getSource(item, fieldNames?.field, cf?.interface);
        const title = getLabelFormatValue(labelUiSchema, item[fieldNames.marker]);
        const markerLabel = getMarkerLabel(fieldNames?.marker ? compile(title) : undefined);
        if (!data?.length) return [];
        return data?.filter(Boolean).map((mapItem) => {
          if (!data) return;
          const overlay = mapRef.current?.setOverlay(collectionField.type, mapItem, {
            strokeColor: '#4e9bff',
            fillColor: '#4e9bff',
            cursor: 'pointer',
            label: markerLabel,
          });
          overlay?.set(OVERLAY_KEY, item[primaryKey]);
          if (overlay) {
            setOverlayOptions(overlay, selectedRecordKeysRef.current.has(item[primaryKey]));
          }
          return overlay;
        });
      })
      .flat()
      .filter(Boolean);

    overlaysRef.current = overlays;

    const events = overlays.map((o: google.maps.MVCObject) => {
      const onClick = (event) => {
        if (selectingModeRef.current === 'selection') {
          const markerPosition = o instanceof google.maps.Marker ? o.getPosition() : undefined;
          mapRef.current?.drawingManager?.handleOverlayClick(event, markerPosition);
          return;
        }

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
          setRecord(data);
          openPopup({
            recordData: data,
          });
        }
      };
      const onDoubleClick = () => {
        if (selectingModeRef.current === 'selection') {
          mapRef.current?.drawingManager?.handleDoubleClick();
        }
      };
      o.addListener('click', onClick);
      o.addListener('dblclick', onDoubleClick);
      return () => o.unbindAll();
    });

    if (collectionField.type === 'point' && lineSort?.length && overlays?.length > 1) {
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
              strokeColor: '#4e9bff',
              fillColor: '#4e9bff',
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
  }, [dataSource, isMapInitialization, markerName, collectionField.type, isConnected, openPopup]);

  useEffect(() => {
    setTimeout(() => {
      if (Date.now() - lastSelectionCompleteAtRef.current < 100) {
        return;
      }
      clearSelectionState();
    });
  }, [clearSelectionState, dataSource]);

  useEffect(() => {
    const wasLoading = listLoadingRef.current;
    const isLoading = Boolean(service?.loading);
    listLoadingRef.current = isLoading;

    if (wasLoading && !isLoading) {
      clearSelectionState();
    }
  }, [clearSelectionState, service?.loading]);

  const mapRefCallback = (instance: GoogleMapForwardedRefProps) => {
    mapRef.current = instance;
    setIsMapInitialization(!!instance?.map && !instance.errMessage);
  };

  return (
    <div
      className={css`
        position: relative;
        height: 100%;
      `}
    >
      {isMapInitialization && (
        <>
          <div
            className={css`
              position: absolute;
              left: 10px;
              top: 10px;
              z-index: 999;
            `}
          >
            <Space direction="vertical">
              <Button
                style={{
                  color: !selectingMode ? '#F18b62' : undefined,
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
                  color: selectingMode === 'selection' ? '#F18b62' : undefined,
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
          <RecordProvider record={record} parent={parentRecordData}>
            <MapBlockDrawer />
          </RecordProvider>
        </>
      )}
      <GoogleMapsComponent
        {...props}
        ref={mapRefCallback}
        style={{ height: fixedBlock ? '100%' : null }}
        zoom={zoom}
        disabled
        block
        overlayCommonOptions={{
          strokeColor: '#F18b62',
          fillColor: '#F18b62',
        }}
      ></GoogleMapsComponent>
    </div>
  );
};

function clearSelected(target: google.maps.Polygon) {
  if (target instanceof google.maps.Marker) {
    return target.setIcon(getIcon(defaultImage));
  }
  target.setOptions({
    strokeColor: '#4e9bff',
    fillColor: '#4e9bff',
  });
}

function selectMarker(target: google.maps.Polygon) {
  if (target instanceof google.maps.Marker) {
    return target.setIcon(getIcon(selectedImage));
  }
  target.setOptions({
    strokeColor: '#F18b62',
    fillColor: '#F18b62',
  });
}
