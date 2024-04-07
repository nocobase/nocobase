import { CheckOutlined, EnvironmentOutlined, ExpandOutlined } from '@ant-design/icons';
import { RecursionField, useFieldSchema } from '@formily/react';
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
import { AMapComponent, AMapForwardedRefProps } from './Map';

export const AMapBlock = (props) => {
  // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
  const { collectionField, fieldNames, dataSource, fixedBlock, zoom, setSelectedRecordKeys, lineSort } =
    useProps(props);
  const { name, getPrimaryKey } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const primaryKey = getPrimaryKey();
  const [isMapInitialization, setIsMapInitialization] = useState(false);
  const mapRef = useRef<AMapForwardedRefProps>();
  const geometryUtils: AMap.IGeometryUtil = mapRef.current?.aMap?.GeometryUtil;
  const [record, setRecord] = useState();
  const [selectingMode, setSelecting] = useState('');
  const { t } = useMapTranslation();
  const compile = useCompile();
  const { isConnected, doFilter } = useFilterAPI();
  const [, setPrevSelected] = useState<any>(null);
  const selectingModeRef = useRef(selectingMode);
  selectingModeRef.current = selectingMode;

  const setOverlayOptions = (overlay: AMap.Polygon | AMap.Marker, state?: boolean) => {
    const extData = overlay.getExtData();
    const selected = typeof state === 'undefined' ? extData.selected : !state;
    extData.selected = !selected;
    if ('setIcon' in overlay) {
      overlay.setIcon(
        new mapRef.current!.aMap.Icon({
          imageSize: [19, 32],
          image: selected ? defaultImage : selectedImage,
        } as AMap.IconOpts),
      );
    }
    (overlay as AMap.Polygon).setOptions({
      extData,
      ...(selected
        ? { strokeColor: '#4e9bff', fillColor: '#4e9bff' }
        : { strokeColor: '#F18b62', fillColor: '#F18b62' }),
    });
  };

  const removeSelection = () => {
    if (!mapRef.current) return;
    mapRef.current?.mouseTool().close(true);
    mapRef.current?.editor().setTarget(null);
    mapRef.current?.editor().close();
  };

  // selection
  useEffect(() => {
    if (selectingMode !== 'selection') {
      return;
    }
    if (!mapRef.current?.editor()) {
      mapRef.current?.createEditor('polygon');
      mapRef.current?.createMouseTool('polygon');
    } else {
      mapRef.current?.executeMouseTool('polygon');
    }
    return () => {
      removeSelection();
    };
  }, [selectingMode]);

  useEffect(() => {
    if (selectingMode) {
      return () => {
        if (!selectingModeRef.current) {
          mapRef.current?.map.getAllOverlays().forEach((o) => {
            setOverlayOptions(o, false);
          });
        }
      };
    }
  }, [selectingMode]);

  const onSelectingComplete = useMemoizedFn(() => {
    const selectingOverlay = mapRef.current?.editor().getTarget();
    const overlays = mapRef.current?.map.getAllOverlays();
    const selectedOverlays = overlays?.filter((o) => {
      if (o === selectingOverlay || o.getExtData().id === undefined) return;
      if ('getPosition' in o) {
        return geometryUtils.isPointInRing(o.getPosition(), selectingOverlay?.getPath() as any);
      }
      return geometryUtils.doesRingRingIntersect(o.getPath(), selectingOverlay?.getPath() as any);
    });
    const ids = selectedOverlays?.map((o) => {
      setOverlayOptions(o, true);
      return o.getExtData().id;
    });
    setSelectedRecordKeys((lastIds) => ids?.concat(lastIds));
    selectingOverlay?.remove();
    mapRef.current?.editor().close();
  });

  useEffect(() => {
    if (!collectionField || !mapRef.current || !dataSource) return;
    const fieldPaths =
      Array.isArray(fieldNames?.field) && fieldNames?.field.length > 1
        ? fieldNames?.field.slice(0, -1)
        : fieldNames?.field;
    const cf = getCollectionJoinField([name, ...fieldPaths].flat().join('.'));
    const overlays = dataSource
      .map((item) => {
        const data = getSource(item, fieldNames?.field, cf?.interface)?.filter(Boolean);
        if (!data?.length) return [];
        return data.map((mapItem) => {
          const overlay = mapRef.current?.setOverlay(collectionField.type, mapItem, {
            strokeColor: '#4e9bff',
            fillColor: '#4e9bff',
            cursor: 'pointer',
            label: {
              direction: 'bottom',
              offset: [0, 5],
              content: fieldNames?.marker ? compile(item[fieldNames.marker]) : undefined,
            },
            extData: {
              id: item[primaryKey],
            },
          });
          return overlay;
        });
      })
      .flat()
      .filter(Boolean);

    mapRef.current?.map?.setFitView(overlays);

    const events = overlays.map((o: AMap.Marker) => {
      const onClick = (e) => {
        const overlay: AMap.Polygon | AMap.Marker = e.target;
        const extData = overlay.getExtData();
        if (!extData) return;
        if (selectingModeRef.current) {
          if (selectingModeRef.current === 'click') {
            setSelectedRecordKeys((keys) =>
              extData.selected ? keys.filter((key) => key !== extData.id) : [...keys, extData.id],
            );
            setOverlayOptions(overlay);
          }
          return;
        }
        const data = dataSource.find((item) => {
          return extData.id === item[primaryKey];
        });

        // 筛选区块模式
        if (isConnected) {
          setPrevSelected((prev) => {
            prev && clearSelected(prev);
            if (prev === o) {
              clearSelected(o);

              // 删除过滤参数
              doFilter(null);
              return null;
            } else {
              selectMarker(o);
              doFilter(data[primaryKey], (target) => target.field || primaryKey, '$eq');
            }
            return o;
          });

          return;
        }

        if (data) {
          setRecord(data);
        }
      };
      o.on('click', onClick);
      return () => o.off('click', onClick);
    });

    if (collectionField.type === 'point' && lineSort?.length && overlays?.length > 1) {
      const positions = overlays.map((o: AMap.Marker) => o.getPosition());

      (overlays[0] as AMap.Marker).setzIndex(13);
      (overlays[overlays.length - 1] as AMap.Marker).setzIndex(13);

      const createText = (start = true) => {
        if (!mapRef.current?.map) return;
        return new AMap.Text({
          label: {
            direction: 'top',
            offset: [0, 0],
            content: start ? t('Start point') : t('End point'),
          },
          position: positions[start ? 0 : positions.length - 1],
          map: mapRef.current?.map,
        });
      };

      overlays.push(
        ...[
          mapRef.current?.setOverlay('lineString', positions, {
            strokeColor: '#4e9bff',
            fillColor: '#4e9bff',
            strokeWeight: 2,
            cursor: 'pointer',
          }),
          createText(),
          createText(false),
        ].filter(Boolean),
      );
    }

    return () => {
      overlays.forEach((ov) => {
        ov.remove();
      });
      events.forEach((e) => e());
    };
  }, [dataSource, isMapInitialization, fieldNames, name, primaryKey, collectionField.type, isConnected, lineSort]);

  useEffect(() => {
    setTimeout(() => {
      setSelectedRecordKeys([]);
    });
  }, [dataSource]);

  const mapRefCallback = (instance: AMapForwardedRefProps) => {
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
      <div
        className={css`
          position: absolute;
          left: 10px;
          top: 10px;
          z-index: 999;
        `}
      >
        {isMapInitialization && !mapRef.current?.errMessage ? (
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
        ) : null}
      </div>
      <MapBlockDrawer record={record} setVisible={setRecord} />
      <AMapComponent
        {...collectionField?.uiSchema?.['x-component-props']}
        ref={mapRefCallback}
        style={{ height: fixedBlock ? '100%' : null }}
        zoom={zoom}
        disabled
        block
        overlayCommonOptions={{
          strokeColor: '#F18b62',
          fillColor: '#F18b62',
        }}
      ></AMapComponent>
    </div>
  );
};

const MapBlockDrawer = (props) => {
  const { setVisible, record } = props;
  const parentRecordData = useCollectionParentRecordData();
  const fieldSchema = useFieldSchema();
  const schema = useMemo(
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

function clearSelected(marker: AMap.Marker | AMap.Polygon | AMap.Polyline | AMap.Circle) {
  if ((marker as AMap.Marker).dom) {
    (marker as AMap.Marker).dom.style.filter = 'none';

    // AMap.Polygon | AMap.Polyline | AMap.Circle 都有 setOptions 方法
  } else if ((marker as AMap.Polygon).setOptions) {
    (marker as AMap.Polygon).setOptions({
      strokeColor: '#4e9bff',
      fillColor: '#4e9bff',
    });
  }
}

function selectMarker(marker: AMap.Marker | AMap.Polygon | AMap.Polyline | AMap.Circle) {
  if ((marker as AMap.Marker).dom) {
    (marker as AMap.Marker).dom.style.filter = 'brightness(1.2) contrast(1.2) hue-rotate(180deg)';

    // AMap.Polygon | AMap.Polyline | AMap.Circle 都有 setOptions 方法
  } else if ((marker as AMap.Polygon).setOptions) {
    (marker as AMap.Polygon).setOptions({
      strokeColor: '#F18b62',
      fillColor: '#F18b62',
    });
  }
}
