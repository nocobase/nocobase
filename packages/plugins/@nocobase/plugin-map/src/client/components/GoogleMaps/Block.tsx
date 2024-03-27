import { CheckOutlined, EnvironmentOutlined, ExpandOutlined } from '@ant-design/icons';
import { RecursionField, Schema, useFieldSchema } from '@formily/react';
import {
  ActionContextProvider,
  RecordProvider,
  css,
  useCollectionManager_deprecated,
  useCollection_deprecated,
  useCompile,
  useFilterAPI,
  useCollectionParentRecordData,
  useProps,
} from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import { Button, Space } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { defaultImage, selectedImage } from '../../constants';
import { useMapTranslation } from '../../locale';
import { getSource } from '../../utils';
import { GoogleMapForwardedRefProps, GoogleMapsComponent, OverlayOptions } from './Map';
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

export const GoogleMapsBlock = (props) => {
  // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
  const { collectionField, fieldNames, dataSource, fixedBlock, zoom, setSelectedRecordKeys, lineSort } =
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
  selectingModeRef.current = selectingMode;

  const { getCollectionJoinField } = useCollectionManager_deprecated();

  const setOverlayOptions = (overlay: google.maps.MVCObject, state?: boolean) => {
    const selected = typeof state !== 'undefined' ? !state : overlay.get(OVERLAY_SELECtED);
    overlay.set(OVERLAY_SELECtED, !selected);
    (overlay as google.maps.Marker).setOptions({
      ...(selected
        ? {
            icon: getIcon(defaultImage),
            strokeColor: '#4e9bff',
            fillColor: '#4e9bff',
          }
        : {
            icon: getIcon(selectedImage),
            strokeColor: '#F18b62',
            fillColor: '#F18b62',
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
    mapRef.current?.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
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
    mapRef.current?.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
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
        if (!data?.length) return [];
        return data?.filter(Boolean).map((mapItem) => {
          if (!data) return;
          const overlay = mapRef.current?.setOverlay(collectionField.type, mapItem, {
            strokeColor: '#4e9bff',
            fillColor: '#4e9bff',
            cursor: 'pointer',
            label: {
              className: labelClass,
              fontFamily: 'inherit',
              fontSize: '13px',
              color: '#333',
              text: fieldNames?.marker ? compile(item[markerName]) : undefined,
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
          setRecord(data);
        }
      };
      o.addListener('click', onClick);
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
  }, [dataSource, isMapInitialization, markerName, collectionField.type, isConnected]);

  useEffect(() => {
    setTimeout(() => {
      setSelectedRecordKeys([]);
    });
  }, [dataSource]);

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
          <MapBlockDrawer record={record} setVisible={setRecord} />
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

const MapBlockDrawer = (props) => {
  const { setVisible, record } = props;
  const parentRecordData = useCollectionParentRecordData();
  const fieldSchema = useFieldSchema();
  const schema: Schema = useMemo(
    () =>
      fieldSchema.reduceProperties((buf, current) => {
        if (current.name === 'drawer') {
          return current;
        }
        return buf;
      }, null),
    [fieldSchema],
  );

  return (
    schema && (
      <ActionContextProvider value={{ visible: !!record, setVisible }}>
        <RecordProvider record={record} parent={parentRecordData}>
          <RecursionField schema={schema} name={schema.name} />
        </RecordProvider>
      </ActionContextProvider>
    )
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
